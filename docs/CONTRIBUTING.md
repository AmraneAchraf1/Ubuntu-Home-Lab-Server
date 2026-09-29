# Contributing to the Ubuntu Home Lab Server guide

This repo is a VitePress documentation site. All content lives in `docs/chapters/`.
This document defines the chapter template and the visual/reference standards so every
chapter stays consistent.

## Local workflow

```bash
npm install
npm run docs:dev      # dev server (http://localhost:5173)
npm run docs:build    # must pass before committing
npm run docs:preview  # preview the build
```

**A change is only done when `npm run docs:build` passes with no errors and no broken-link warnings.**

## Chapter template

Every chapter is `docs/chapters/NN-slug.md` and starts with this frontmatter:

```yaml
---
title: "Chapter Title"
order: 12
description: "One-sentence summary used for SEO/OG tags."
difficulty: Beginner | Intermediate | Advanced
estimatedTime: 30 min
prerequisites:
  - "A concrete thing the reader needs"
  - "Another prerequisite"
---
```

Immediately after the frontmatter, include the header component:

```md
<ChapterMeta />
```

Then follow this **section order** exactly:

1. `## TL;DR` — 4–5 bullets answering "what will I learn / why it matters".
2. `## Prerequisites` — a table: requirement → why.
3. Numbered, testable steps — `## Step 1 — …`, `## Step 2 — …`. Each step states
   **Run X → Expected Y**. Use collapsible `::: details Why this matters …` asides for
   the "why" behind a step.
4. `## Verification` — a table of checks + a runnable `bash` block with expected output.
5. `## Common pitfalls` — a `::: warning` with the top 3 failure modes.
6. `## Troubleshooting` — a symptom → cause → fix table.
7. `## Recap & next` — one paragraph + a link to the next chapter.
8. `## References` — 3–8 links (see below).

### Content rules

- **Preserve all commands, paths, ports, package names, and config values.** Enhancement is
  additive; never change semantics.
- **The username is `ahmed` everywhere.** Do not introduce `labadmin` or other usernames.
- Use fenced code blocks with a **filename label** where useful: ` ```bash [backup.sh] `.
- Prefer tables for comparisons and reference data.

## Visual standards

No chapter ships text-only. Every chapter includes **≥ 2 figures**.

| Visual | Use for | Format |
|--------|---------|--------|
| **Mermaid** | Concepts, flows, sequences, decision trees | fenced ` ```mermaid ` |
| **SVG** | Physical/structural layout, bar charts, terminal mocks | inline `<figure>` |
| **Screenshot** | Real GUI/terminal states (when a redistributable one exists) | WebP in `docs/public/images/<slug>/` |

### Mermaid

- Diagrams are themed by `docs/.vitepress/theme/Mermaid.vue`, which maps the `base`
  theme onto the site's CSS variables for **both light and dark mode**. Do not hardcode
  colors in diagrams.
- Place diagrams **outside** collapsible `::: details` blocks — hidden containers break
  Mermaid measurement.

### SVG (inline)

- Author SVGs **inline** inside a `<figure>` so they can use CSS variables
  (`var(--vp-c-brand-1)`, `var(--vp-c-text-2)`, …) and follow the theme.
- **Never put a blank line inside a `<figure>` block** — a blank line ends the HTML block
  and the SVG breaks the Vue build.

### Screenshots

- Store under `docs/public/images/<chapter-slug>/<name>.webp`.
- Convert to **WebP**, keep each file **≤ 300 KB**, and set explicit `width`/`height`
  with `loading="lazy" decoding="async"`.
- If no redistributable screenshot exists, author an **annotated SVG recreation** and say
  so in the caption.

### Captions & numbering

- Every visual gets a numbered caption: `Figure <chapter>.<n> — description.`
- Figures are numbered in order of appearance (e.g. `Figure 12.1`, `Figure 12.2`).
- SVG/screenshot: use `<figcaption>` with `<strong>Figure X.Y</strong> — …`.
- Mermaid: add a caption paragraph right after the block:
  `<p class="ahl-diagram-caption"><strong>Figure X.Y</strong> — …</p>`.
- Every image needs descriptive **alt text**.

## References

- Add a `## References` section with **3–8 links**, preferring official sources
  (Ubuntu docs, man pages, upstream project docs, RFCs).
- Format: `[Title](URL) — one line on why it's useful.`
- **Verify every URL returns HTTP 200 before committing:**

  ```bash
  curl -s -o /dev/null -w "%{http_code}  %{url_effective}\n" -L --max-time 25 -A "Mozilla/5.0" "<url>"
  ```

## Image credits

Record every downloaded image in [`docs/public/images/CREDITS.md`](public/images/CREDITS.md):
file, type, source URL, license/credit, and a note. Authored diagrams are logged as
"Authored in-repo".

## Redaction gate (blocking)

Before `git add`, inspect any screenshot for credentials, API keys, tokens, IPs, hostnames,
or personal data. **Redact (crop/blur) first.** This is a blocking gate — do not commit a
screenshot you haven't cleared.

## Commit convention

One chapter per commit:

```
docs(chNN): enhance <Title> — visuals, refs, structure
```

Include a short body listing the figures added and any values preserved.

## Design system

Shared tokens and component styles live in `docs/.vitepress/theme/custom.css`; components
(`ChapterMeta.vue`, `Mermaid.vue`) and `enhanceApp` live in `docs/.vitepress/theme/`.
Change shared styling there, not per-chapter.
