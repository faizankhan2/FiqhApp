# FiqhApp: Core Architecture & Operating Manual

## 1. Project Mission
**FiqhApp** is dedicated to delivering precise, authoritative, and culturally accurate Islamic jurisprudence (Fiqh) rulings to a modern mobile interface. Our goal is to bridge the gap between classical legal texts and contemporary user experience, providing practitioners with reliable guidance based on established schools of thought (Madhhahib).

## 2. System Architecture & Stack
The project follows a strict separation of concerns to ensure scalability and maintainability:

*   **Data Pipeline (Node.js)**: A specialized environment for ingesting, transforming, and validating raw data (JSON/PDF) before it reaches the production database.
*   **Backend (Supabase)**: A Postgres-based backend providing secure data storage, authentication, and real-time capabilities.
*   **Mobile Interface (Future)**: An Expo-powered React Native application designed for high-density, high-velocity information consumption on mobile devices.

## 3. Data Schema (Peaceful Scholar UX)
Our data model supports the "Peaceful Scholar" aesthetic with fields designed for comprehensive spiritual and practical guidance:

*   **Core Fields**: `module`, `topic`, `title`, `action`, `short_rule` (Level 1: Quick Answer), `details`.
*   **Scriptural & Spiritual (Level 3: Evidence & Heart)**:
    *   `quran_hadith_evidence`: Scriptural backing for Level 3 depth.
    *   `spiritual_wisdom`: Contextual insights into the "Why" for Level 3 depth.
*   **Practical Guidance (Level 2: The How-To)**:
    *   `actionable_steps`: A `TEXT[]` array providing the step-by-step checklist for Level 2 depth.
*   **Grouping & Filtering (UX Optimization)**:
    *   `ritual_type`: High-level category (Purification, Salah).
    *   `ritual_phase`: Specific stage (Pre-requisite, Action, Remedy).
    *   `gender_applicability`: Array (Male, Female, All) for demographic filtering.
*   **Metadata**: `madhhab_applicability` (Array), `source_book`, `author`, `volume_page`, `ui_icon_concept`.

## 4. Agent Directives (Core Rules of Engagement)
As the AI development partner for FiqhApp, the following rules are non-negotiable:

*   **Structural Planning First**: Always propose structural designs and architectural implementation plans before writing execution code.
*   **Never Assume Schemas**: Always verify existing table structures and column names via research tools before performing insertions or updates.
*   **Prioritize Idempotency**: Every script and operation must be repeatable. Running an ingestion pipeline twice should never result in duplicate data or system instability.
*   **Contextual Integrity**: Maintain the historical context of previous architectural decisions. Do not suggest changes that deviate from the established "Source of Truth" without explicit justification.

## 4. Coding Style & Best Practices
To ensure the codebase remains "elite" and accessible to both humans and agents:

*   **Modularity**: Functions must be small, single-purpose, and reusable.
*   **Documentation**: Every script must include a header explaining its purpose and requirements. In-line comments should explain "why," not just "what."
*   **Error Handling**: All asynchronous operations must be wrapped in `try/catch` blocks with descriptive error logging that facilitates rapid debugging.

## 5. Stability & Data Integrity
Data is the lifeblood of FiqhApp. Integrity is paramount:

*   **Upsert Patterns**: Use Postgres `UPSERT` logic (with `ON CONFLICT` clauses) for all database ingestions to prevent duplicates.
*   **Graceful Failures**: JSON parsing and network requests must fail gracefully. Individual record failures should not crash the entire pipeline; errors should be logged and the process should continue.
*   **Batch Processing**: When handling large datasets, use batch operations to minimize database overhead and prevent connection timeouts.

## 6. Security Protocols
Security is integrated from day one:

*   **Zero-Exposure Key Policy**: Under no circumstances should API keys or secrets (Supabase keys, DB passwords) be hardcoded or committed to version control.
*   **Environment Variables**: All sensitive configuration must be stored in `.env` files, which are explicitly listed in `.gitignore`.
*   **Sanitization**: All inputs must be treated as untrusted. Ensure proper data types and sanitization before pushing to the database.
