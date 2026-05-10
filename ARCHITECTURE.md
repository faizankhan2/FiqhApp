# FiqhApp: Core Architecture & Operating Manual

## 1. Project Mission

**FiqhApp** delivers precise, authoritative Islamic jurisprudence (Fiqh) rulings through a mobile interface. It bridges classical legal texts and modern UX, providing practitioners with reliable guidance based on the four Sunni schools of thought (Hanafi, Maliki, Shafi'i, Hanbali).

## 2. System Architecture & Stack

| Layer | Technology | Location |
|-------|-----------|----------|
| Mobile App | React Native (Expo SDK 54, React 19.1) | `mobile/` |
| Backend / DB | Supabase (Postgres) | Hosted (cloud) |
| Data Pipeline | Node.js scripts (CommonJS) | `data_pipeline/scripts/` |
| Extraction | Google Gemini API (@google/generative-ai) | `data_pipeline/scripts/extract.js` |
| Source Material | Classical Fiqh PDFs | `Fiqhbooks/` |

### Data Flow

```
PDF Books (Fiqhbooks/)
    → extract.js (Gemini, phase-by-phase, temperature=0)
    → JSON (data_pipeline/inputs/)
    → normalize.js (auto-fix enums)
    → quality_check.js (coverage report)
    → ingest.js (Zod validation → Supabase upsert)
    → Mobile App (fetches from Supabase, filtered by madhhab)
```

## 3. Data Schema (Peaceful Scholar UX)

Our data model supports the "Peaceful Scholar" aesthetic with fields designed for comprehensive spiritual and practical guidance:

### Core Fields
- `module` — High-level category (Purification, Prayer, Fasting, etc.)
- `topic` — Specific topic (Ablution, Ghusl, etc.)
- `topic_brief` — 2-3 sentence uplifting definition of the ritual
- `title` — Actionable, specific title for this ruling
- `ritual_type` — Sub-category (Minor Purification, Major Purification)
- `ritual_phase` — One of 6 universal phases (Foundations, Requirements, Execution, Boundaries, Concessions, Excellence)
- `action_classification` — One of 11 classifications (Obligatory, Pillar, Recommended, Permissible, Disliked, Forbidden, Condition, Trigger, Impediment, Invalidator, Concession)

### Content Fields (3-Level Depth)
- `short_rule` — Level 1: Quick Answer (extremely brief, punchy statement)
- `details` — Direct explanation in 2-4 sentences
- `actionable_steps` — Level 2: TEXT[] array of step-by-step guidance (primarily for Execution phase)
- `quran_hadith_evidence` — Level 3: Scriptural backing (nullable)
- `spiritual_wisdom` — Level 3: Contextual insight into the "Why" (nullable)

### Filtering & Metadata
- `madhhab_applicability` — Array of applicable schools (Hanafi, Maliki, Shafi'i, Hanbali)
- `gender_applicability` — Array (Male, Female, All)
- `scenario_tags` — Array of situational tags for filtering
- `ui_icon_concept` — 1-2 word icon hint
- `source_book` — Which book this was extracted from
- `author` — Book author
- `volume_page` — Page reference in source PDF

## 4. Agent Directives (Core Rules of Engagement)

As the AI development partner for FiqhApp, the following rules are non-negotiable:

- **Structural Planning First**: Always propose structural designs and architectural implementation plans before writing execution code.
- **Never Assume Schemas**: Always verify existing table structures and column names via research tools before performing insertions or updates.
- **Prioritize Idempotency**: Every script and operation must be repeatable. Running an ingestion pipeline twice should never result in duplicate data or system instability.
- **Contextual Integrity**: Maintain the historical context of previous architectural decisions. Do not suggest changes that deviate from the established "Source of Truth" without explicit justification.
- **Grounded Data Only**: Never fabricate, supplement, or "improve" data from the source books. If a field can't be filled from the source text, it stays null.

## 5. Coding Style & Best Practices

- **Modularity**: Functions must be small, single-purpose, and reusable.
- **Documentation**: Every script must include a header explaining its purpose and requirements. In-line comments should explain "why," not just "what."
- **Error Handling**: All asynchronous operations must be wrapped in `try/catch` blocks with descriptive error logging that facilitates rapid debugging.
- **No TypeScript**: The mobile app and pipeline are plain JavaScript. Keep it that way.
- **CommonJS in Pipeline**: Use `require`/`module.exports`, not ES modules.
- **Theme Centralization**: All visual constants in `src/theme.js`, imported as `T`.

## 6. Stability & Data Integrity

- **Upsert Patterns**: Use `onConflict: 'module,topic,title,source_book'` for all database ingestions to prevent duplicates.
- **Graceful Failures**: JSON parsing and network requests must fail gracefully. Individual record failures should not crash the entire pipeline; errors should be logged and the process should continue.
- **Batch Processing**: When handling large datasets, use batch operations to minimize database overhead and prevent connection timeouts.
- **Phase Isolation**: Each extraction phase gets its own API call to prevent cross-contamination of classifications.
- **Archiving**: All successfully ingested files are archived to `archive/YYYY-MM-DD/` — never deleted.

## 7. Security Protocols

- **Zero-Exposure Key Policy**: Under no circumstances should API keys or secrets (Supabase keys, Gemini keys, DB passwords) be hardcoded or committed to version control.
- **Environment Variables**: All sensitive configuration must be stored in `.env` files, which are explicitly listed in `.gitignore`.
- **Sanitization**: All inputs must be treated as untrusted. Ensure proper data types and sanitization before pushing to the database.
- **Service Role Key**: The pipeline uses `SUPABASE_SERVICE_ROLE_KEY` for admin access; the mobile app uses only the public anon key.
