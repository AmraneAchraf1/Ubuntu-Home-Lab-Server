---
title: "OpenFoodFacts Data Pipeline"
order: 15
description: "Download the OpenFoodFacts dataset, clean CSV to Parquet with pandas chunking, and translate product names to Arabic using a local Ollama model with batching and checkpoints."
difficulty: Advanced
estimatedTime: 60 min
prerequisites:
  - "Ollama + a GPU model pulled (Chapter 12)"
  - "The Python venv ~/aienv (Chapter 12)"
  - "/mnt/storage with free space (Chapter 7)"
---

<ChapterMeta />

## TL;DR

- **OpenFoodFacts is ~3M products (~2 GB gzipped, ~8 GB CSV).** Load it in **chunks**, never all at once.
- **Clean and convert to Parquet** — columnar, compressed, and far faster to query than CSV.
- **Translate `product_name` → `product_name_ar`** with a local Ollama model, in small batches sized for 2 GB VRAM.
- **Checkpoint as you go** — a multi-hour GPU job must survive a crash or SSH drop.
- **The pipeline is resumable:** it skips rows already translated.

## Prerequisites

| Requirement | Why |
|-------------|-----|
| Ollama + `aya` model | The translation step calls it on `localhost:11434`. |
| `~/aienv` venv | Provides pandas, requests, tqdm, pyarrow. |
| Disk space | The raw CSV plus Parquet outputs. |

::: warning Long-running job — use tmux
This pipeline can run for hours. Run it inside `tmux` (Chapter 21) so an SSH drop doesn't kill it.
:::

## Understanding the dataset

OpenFoodFacts is a crowdsourced database of food products. The full export:

- ~3 million products
- CSV file: ~2GB compressed, ~8GB uncompressed
- Columns: code, product_name, brands, categories, ingredients_text, nutriments, countries, labels...

For your use case: clean the data and add Arabic (`product_name_ar`) using a local GPU model.

```mermaid
flowchart LR
  A[Download .csv.gz ~2GB] --> B[gunzip → .csv ~8GB]
  B --> C[01_clean.py: chunked clean]
  C --> D[clean.parquet]
  D --> E[02_translate.py: Ollama batch]
  E --> F[with_arabic.parquet]
```

<p class="ahl-diagram-caption"><strong>Figure 15.1</strong> — The two-stage pipeline: clean/convert, then translate, with a Parquet file as the hand-off.</p>

## Step 1 — Download the dataset

**Run** the block. **Expected:** the decompressed CSV is ~8 GB and `wc -l` reports millions of lines.

```bash [download.sh]
mkdir -p /mnt/storage/datasets/openfoodfacts
cd /mnt/storage/datasets/openfoodfacts

# Download (this takes a while — ~2GB)
wget -c https://static.openfoodfacts.org/data/en.openfoodfacts.org.products.csv.gz
# -c = resume if interrupted

# Decompress
gunzip en.openfoodfacts.org.products.csv.gz

# Check size and row count
ls -lh en.openfoodfacts.org.products.csv
wc -l en.openfoodfacts.org.products.csv

# Preview first 2 rows
head -n 2 en.openfoodfacts.org.products.csv | python3 -c "
import sys, csv
reader = csv.reader(sys.stdin)
for row in reader:
    for i, col in enumerate(row[:20]):
        print(f'{i}: {col[:50]}')
    break
"
```

## Step 2 — Cleaning script

**Run** after saving the script below. **Expected:** a `clean.parquet` file far smaller than the CSV.

```python [01_clean.py]
# /srv/apps/food_pipeline/01_clean.py
"""
Clean the OpenFoodFacts CSV and save as efficient Parquet format.
Parquet vs CSV:
- Parquet: columnar storage, compressed, 10x faster queries, 5x smaller
- CSV: text, slow to parse, large
"""
import pandas as pd
import numpy as np
from pathlib import Path
import logging

logging.basicConfig(level=logging.INFO, format='%(asctime)s %(message)s')
log = logging.getLogger(__name__)

INPUT  = Path('/mnt/storage/datasets/openfoodfacts/en.openfoodfacts.org.products.csv')
OUTPUT = Path('/mnt/storage/datasets/openfoodfacts/clean.parquet')

USEFUL_COLS = [
    'code', 'product_name', 'brands', 'categories',
    'ingredients_text', 'countries', 'labels',
    'energy_100g', 'proteins_100g', 'carbohydrates_100g', 'fat_100g',
    'fiber_100g', 'sugars_100g', 'salt_100g',
    'image_url', 'url'
]

def clean_chunk(df):
    # Drop rows with no product name (useless)
    df = df.dropna(subset=['product_name'])
    # Clean whitespace
    df['product_name'] = df['product_name'].str.strip()
    # Remove empty strings
    df = df[df['product_name'].str.len() > 0]
    # Remove duplicate barcodes within chunk
    df = df.drop_duplicates(subset=['code'])
    # Convert numeric columns
    numeric_cols = [c for c in USEFUL_COLS if c.endswith('_100g')]
    for col in numeric_cols:
        if col in df.columns:
            df[col] = pd.to_numeric(df[col], errors='coerce')
    return df

chunks = []
total_rows = 0
log.info("Loading dataset in chunks...")

for i, chunk in enumerate(pd.read_csv(
    INPUT,
    usecols=[c for c in USEFUL_COLS if c != 'url'],
    chunksize=50_000,
    low_memory=False,
    on_bad_lines='skip',
    encoding='utf-8',
    encoding_errors='replace'
)):
    cleaned = clean_chunk(chunk)
    chunks.append(cleaned)
    total_rows += len(cleaned)
    if i % 10 == 0:
        log.info(f"  Processed {i * 50_000:,} rows, kept {total_rows:,}...")

log.info("Merging chunks...")
df = pd.concat(chunks, ignore_index=True)
df = df.drop_duplicates(subset=['code'])

log.info(f"Final dataset: {len(df):,} products")
log.info(f"Saving to Parquet...")
df.to_parquet(OUTPUT, index=False, compression='snappy')
log.info(f"Done! Saved to {OUTPUT}")
log.info(f"File size: {OUTPUT.stat().st_size / 1024**2:.1f} MB")
```

<figure>
  <svg viewBox="0 0 720 220" role="img" aria-label="Data size funnel: roughly 2 GB gzipped, 8 GB raw CSV, shrinking to a smaller clean Parquet file, then a slightly larger file after adding Arabic" width="100%" style="max-width:720px;height:auto;border-radius:10px;border:1px solid var(--vp-c-divider);background:var(--vp-c-bg-soft);padding:1rem;box-sizing:border-box;font-family:Inter,system-ui,sans-serif;">
    <text x="16" y="30" font-size="13" font-weight="700" fill="var(--vp-c-text-1)">Data at each stage (approximate)</text>
    <g font-size="12" fill="var(--vp-c-text-2)">
      <text x="16" y="72">CSV gz</text>
      <rect x="120" y="58" width="60" height="20" rx="4" fill="var(--vp-c-text-3)"></rect>
      <text x="188" y="72" font-size="11" fill="var(--vp-c-text-3)">~2 GB</text>
      <text x="16" y="108">CSV raw</text>
      <rect x="120" y="94" width="240" height="20" rx="4" fill="var(--vp-c-text-3)"></rect>
      <text x="368" y="108" font-size="11" fill="var(--vp-c-text-3)">~8 GB</text>
      <text x="16" y="144">clean.parquet</text>
      <rect x="120" y="130" width="90" height="20" rx="4" fill="var(--vp-c-brand-1)"></rect>
      <text x="218" y="144" font-size="11" fill="var(--vp-c-brand-1)">much smaller (columnar + snappy)</text>
      <text x="16" y="180">with_arabic.parquet</text>
      <rect x="120" y="166" width="110" height="20" rx="4" fill="var(--vp-c-brand-3)"></rect>
      <text x="238" y="180" font-size="11" fill="var(--vp-c-text-3)">+ product_name_ar column</text>
    </g>
    <text x="16" y="208" font-size="11" fill="var(--vp-c-text-3)">Bar widths are illustrative; the point is Parquet's size/query advantage over CSV.</text>
  </svg>
  <figcaption><strong>Figure 15.2</strong> — Why Parquet: the same data shrinks and queries dramatically faster than raw CSV.</figcaption>
</figure>

## Step 3 — Arabic translation script

**Run** after saving the script below. **Expected:** `with_arabic.parquet` with a populated `product_name_ar` column.

```python [02_translate.py]
# /srv/apps/food_pipeline/02_translate.py
"""
Translate product names to Arabic using local Ollama model.
Designed for 2GB VRAM — processes in small batches.
"""
import pandas as pd
import requests
import json
import time
import logging
from pathlib import Path
from tqdm import tqdm

logging.basicConfig(level=logging.INFO, format='%(asctime)s %(message)s')
log = logging.getLogger(__name__)

INPUT  = Path('/mnt/storage/datasets/openfoodfacts/clean.parquet')
OUTPUT = Path('/mnt/storage/datasets/openfoodfacts/with_arabic.parquet')

OLLAMA_URL = 'http://localhost:11434/api/generate'
MODEL = 'aya'
BATCH_SIZE = 5      # small batches for 2GB VRAM
CHECKPOINT_EVERY = 100  # save progress every 100 batches

def translate_batch(names: list[str]) -> list[str]:
    """Translate a batch of product names to Arabic."""
    prompt = """Translate these food product names to Arabic.
Return ONLY a JSON array of strings, no other text.
Keep brand names as-is (don't translate proper nouns).
Example input: ["Coca Cola", "Whole Milk", "Dark Chocolate"]
Example output: ["كوكا كولا", "حليب كامل الدسم", "شوكولاتة داكنة"]

Now translate:
""" + json.dumps(names)

    try:
        response = requests.post(
            OLLAMA_URL,
            json={'model': MODEL, 'prompt': prompt, 'stream': False},
            timeout=60
        )
        result = response.json()['response'].strip()
        # Clean up response — model sometimes adds backticks
        result = result.replace('```json', '').replace('```', '').strip()
        translations = json.loads(result)
        if len(translations) == len(names):
            return translations
        else:
            log.warning(f"Got {len(translations)} translations for {len(names)} inputs")
            return names  # return originals on mismatch
    except Exception as e:
        log.error(f"Translation error: {e}")
        return names  # return originals on error

# Load data
log.info("Loading cleaned dataset...")
df = pd.read_parquet(INPUT)
log.info(f"Total products: {len(df):,}")

# Check for existing progress
if OUTPUT.exists():
    existing = pd.read_parquet(OUTPUT)
    processed_count = existing['product_name_ar'].notna().sum()
    log.info(f"Resuming from {processed_count:,} already translated")
    df = df.copy()
    df['product_name_ar'] = existing.get('product_name_ar', pd.NA)
else:
    df['product_name_ar'] = pd.NA

# Only translate what's missing
to_translate = df[df['product_name_ar'].isna()].index.tolist()
log.info(f"Need to translate: {len(to_translate):,} products")

# Process in batches
for i in tqdm(range(0, len(to_translate), BATCH_SIZE), desc="Translating"):
    batch_indices = to_translate[i:i + BATCH_SIZE]
    batch_names = df.loc[batch_indices, 'product_name'].tolist()

    translations = translate_batch(batch_names)
    df.loc[batch_indices, 'product_name_ar'] = translations

    # Save checkpoint
    if (i // BATCH_SIZE) % CHECKPOINT_EVERY == 0:
        df.to_parquet(OUTPUT, index=False, compression='snappy')
        log.info(f"Checkpoint saved at {i:,}/{len(to_translate):,}")

    time.sleep(0.1)  # small delay to avoid overwhelming GPU

# Final save
df.to_parquet(OUTPUT, index=False, compression='snappy')
log.info(f"Complete! {len(df):,} products with Arabic names saved to {OUTPUT}")
```

Run the pipeline:

```bash [run-pipeline.sh]
source ~/aienv/bin/activate
python3 /srv/apps/food_pipeline/01_clean.py
python3 /srv/apps/food_pipeline/02_translate.py
```

## Verification

| Check | Command | Expected |
|-------|---------|----------|
| Clean output exists | `ls -lh /mnt/storage/datasets/openfoodfacts/clean.parquet` | a Parquet file, smaller than the CSV |
| Row count sane | python: `len(pd.read_parquet(...))` | millions of rows |
| Translation column present | python: check `product_name_ar` | non-null values |
| GPU was used | `nvidia-smi` during run | memory in use |
| Resumable | re-run `02_translate.py` | "Resuming from N already translated" |

```bash [verify.sh]
source ~/aienv/bin/activate
python3 - <<'PY'
import pandas as pd
p = '/mnt/storage/datasets/openfoodfacts/'
df = pd.read_parquet(p + 'clean.parquet')
print('clean rows:', len(df))
import os
out = p + 'with_arabic.parquet'
if os.path.exists(out):
    d = pd.read_parquet(out)
    print('translated:', d['product_name_ar'].notna().sum())
PY
```

## Common pitfalls

::: warning Top 3 failure modes
1. **Reading the whole 8 GB CSV into memory.** It will OOM. The script reads in 50k-row chunks — keep it that way.
2. **No checkpoints.** A GPU job that dies at hour 6 with no saved progress restarts from zero. Checkpoint regularly.
3. **Batches too large for 2 GB VRAM.** Ollama returns errors or falls back to CPU. Keep `BATCH_SIZE` small.
:::

## Troubleshooting

| Symptom | Likely cause | Fix |
|---------|--------------|-----|
| `MemoryError` during clean | Loaded full CSV | Ensure `chunksize=50_000` is used |
| `Connection refused` to 11434 | Ollama not running | `sudo systemctl start ollama` |
| `json.loads` fails | Model added prose/backticks | The script strips code fences; reduce batch size |
| Translation very slow | Model running on CPU | Verify `nvidia-smi` shows GPU use (Chapter 12) |
| Output unchanged after re-run | No missing rows | It already completed; check `notna().sum()` |

## Recap & next

You've run a real, resumable GPU pipeline end to end: download → chunked clean → Parquet → batched Arabic translation with checkpoints. This is the workload the whole home lab was built for.

Next: **[Chapter 16 — Process Management with PM2](/chapters/16-process-management-with-pm2)** — keep long-running services alive.

## References

- [OpenFoodFacts data](https://world.openfoodfacts.org/data) — the dataset and its export formats.
- [pandas documentation](https://pandas.pydata.org/docs/) — chunked reading and DataFrame ops.
- [Apache Parquet](https://parquet.apache.org/docs/) — the columnar format.
- [Apache Arrow](https://arrow.apache.org/docs/) — the engine behind Parquet I/O.
- [Ollama API](https://github.com/ollama/ollama/blob/main/docs/api.md) — the `/api/generate` endpoint used here.
- [tqdm](https://tqdm.github.io/) — progress bars.
- [requests](https://requests.readthedocs.io/) — HTTP calls to Ollama.
