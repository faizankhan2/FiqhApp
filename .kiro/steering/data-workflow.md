# FiqhApp — Data Workflow

## Source of Truth

All rulings in FiqhApp originate from **classical Fiqh textbooks** — no internet sources, no AI-generated content, no cross-referencing from random websites. The books are the sole authority.

## Source Books

| Book | Madhhab | Author | Key | PDF File |
|------|---------|--------|-----|----------|
| Ascent to Felicity | Hanafi | Abu 'l-Ikhlas al-Shurunbulali | `ascent-to-felicity` | `Ascent to Felicity.pdf` |
| al-Murshid al-Muin | Maliki | Ibn 'Ashir | `al-murshid-al-muin` | `al-murshid_al-muin_arabic_footnotes.pdf` |
| Umdah al-Fiqh | Hanbali | Ibn Qudamah al-Maqdisi | `umdah-al-fiqh` | `umdah-al-fiqh.pdf` |
| Matn Abu Shuja' | Shafi'i | Abu Shuja' al-Asfahani | `abu-shuja` | `917587315-Abu-Shuja-Translation.pdf` |

Books are stored in `/Fiqhbooks/`.

## Extraction Pipeline (Automated, Phase-by-Phase)

The extraction uses a **phase-by-phase** strategy — each of the 6 ritual phases gets its own focused Gemini API call per book/topic combination. This prevents misclassification across phases and produces higher accuracy.

```
Classical Fiqh Books (PDF in /Fiqhbooks/)
        ↓
node extract.js (Gemini API, temperature=0, phase-by-phase, grounded in PDF only)
  → 6 API calls per book/topic (one per ritual phase)
  → Results merged into a single output file
        ↓
JSON files in data_pipeline/inputs/
        ↓
node normalize.js (auto-fix enum drift, spelling, structural issues)
        ↓
node quality_check.js (coverage report, duplicate detection, validation)
        ↓
node ingest.js (validate with Zod → upsert to Supabase → archive)
        ↓
Mobile App (fetches from Supabase)
```

### The 6 Ritual Phases

Every topic is extracted into these universal buckets:

| Phase | Description | Expected Records |
|-------|-------------|-----------------|
| Foundations | Definition, purpose, when required | 2–5 |
| Requirements | Conditions/prerequisites before starting | 2–6 |
| Execution | Step-by-step method in book order | 8–20 |
| Boundaries | What invalidates/nullifies the act | 3–10 |
| Concessions | Dispensations for difficulty | 0–5 |
| Excellence | Recommended extras, etiquettes, disliked acts | 3–10 |

### The 11 Action Classifications

Each ruling gets one of these classifications:

`Obligatory` · `Pillar` · `Recommended` · `Permissible` · `Disliked` · `Forbidden` · `Condition` · `Trigger` · `Impediment` · `Invalidator` · `Concession`

### Commands

```bash
cd data_pipeline/scripts

# Extract one topic from one book (6 phase calls)
node extract.js --book "ascent-to-felicity" --topic "Ablution (Wudu)"

# Extract one topic from all 4 books
node extract.js --book all --topic "Ablution (Wudu)"

# Extract all topics from all books (full run — many API calls)
node extract.js --book all --topic all

# Use a different model (default: gemini-2.5-flash)
node extract.js --book all --topic "Ablution (Wudu)" --model gemini-2.0-flash-lite

# Post-extraction pipeline
node normalize.js              # Auto-fix enum drift, spelling
node quality_check.js          # Coverage report, duplicate detection
node ingest.js                 # Validate with Zod → upsert to Supabase → archive
```

### API Key Rotation

The extractor supports multiple Gemini API keys for rate-limit resilience:
- `GEMINI_API_KEY` (required)
- `GEMINI_API_KEY2` (optional)
- `GEMINI_API_KEY3` (optional)

Keys rotate automatically on 429 errors with a 45s cooldown.

## Extraction Principles

- **Grounded extraction only**: Gemini API is configured with temperature=0 and explicit instructions to extract ONLY from the provided PDF. No internet, no creativity, no hallucination.
- **One book per API call**: Each extraction targets a single book for a single topic, ensuring clean `source_book` and `madhhab_applicability` attribution.
- **Phase isolation**: Each phase gets its own API call with phase-specific instructions and valid classification constraints. This prevents cross-contamination (e.g., disliked acts leaking into Boundaries).
- **Book fidelity**: Every field must reflect what the source text actually says.
- **Traceability**: Each record carries `source_book`, `author`, and `volume_page`.
- **Topic completeness**: Each topic should cover all 6 ritual phases the book addresses.
- **Empathetic Mentor persona**: Extraction uses second-person ("you"), warm modern English, no archaic language.

## Configuration Files

- `books.json` — Book metadata (title, author, madhhab, PDF filename)
- `topics.json` — Master list of 27 topics to extract (Purification through Sacrifice)
- Prompt template is embedded in `extract.js` (the `buildPhasePrompt` function)

## Quality Gates

Before data reaches the database, it must pass:

1. **normalize.js** — Auto-fixes:
   - Enum drift (e.g., "Fard" → "Obligatory", "pre-requisite" → "Requirements")
   - Madhhab spelling (e.g., "shafii" → "Shafi'i")
   - Gender normalization
   - Legacy field names (`action` → `action_classification`)
   - Empty strings → null for nullable fields
   - Double quotes → single quotes in evidence strings

2. **quality_check.js** — Reports:
   - Phase coverage (X/6 phases present)
   - Classification distribution
   - Duplicate detection (same title + short_rule)
   - Missing `volume_page` references
   - Zod validation pass/fail

3. **validator.js** (via ingest.js) — Strict Zod schema validation against the `fiqh_rulings` table schema

## Ingestion Behavior

- **Upsert strategy**: `onConflict: 'module,topic,title,source_book'` — same ruling from same book updates in place, never duplicates.
- **Archiving**: Successfully ingested files move to `archive/YYYY-MM-DD/` automatically.
- **Failure isolation**: Individual file failures don't crash the pipeline; errors are logged and processing continues.

## What NOT to Do

- Do not use web searches to supplement or "improve" rulings.
- Do not generate spiritual wisdom or evidence that isn't in the source text.
- Do not infer `actionable_steps` beyond what the book describes.
- If the book doesn't provide a field's content, leave it null rather than fabricating it.
- Do not mix books in a single extraction call.
- Do not put disliked acts (makruh) in Boundaries — they belong in Excellence.
- Do not reorder steps from the book's presentation order in Execution phase.
