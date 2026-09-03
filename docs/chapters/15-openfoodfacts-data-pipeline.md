---
title: "OpenFoodFacts Data Pipeline"
order: 15
description: "Download OpenFoodFacts dataset, clean CSV to Parquet with pandas chunking, translate product names to Arabic using local Ollama model with batching and checkpoints."
---
## Understanding the Dataset

OpenFoodFacts is a crowdsourced database of food products. The full export:
- ~3 million products
- CSV file: ~2GB compressed, ~8GB uncompressed
- Columns: code, product_name, brands, categories, ingredients_text, nutriments, countries, labels...

For your use case: clean the data and add Arabic (`product_name_ar`) using a local GPU model.

## Step 1: Download the Dataset

```bash
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

## Step 2: Cleaning Script

```python
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

## Step 3: Arabic Translation Script

```python
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
```bash
source ~/aienv/bin/activate
python3 /srv/apps/food_pipeline/01_clean.py
python3 /srv/apps/food_pipeline/02_translate.py