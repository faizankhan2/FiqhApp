# FiqhApp — Tech Stack & Build

## Architecture

| Layer | Technology | Location |
|-------|-----------|----------|
| Mobile App | React Native (Expo SDK 54) | `mobile/` |
| Backend / DB | Supabase (Postgres) | Hosted (cloud) |
| Data Pipeline | Node.js scripts (CommonJS) | `data_pipeline/scripts/` |
| Extraction | Google Gemini API (via @google/generative-ai) | `data_pipeline/scripts/extract.js` |

## Mobile App (`mobile/`)

- **Framework**: Expo ~54 with New Architecture enabled
- **React**: 19.1, React Native 0.81.5
- **Navigation**: Custom tab bar (no React Navigation — tabs are rendered via state switch in App.js)
- **Animations**: Moti 0.30 + React Native Reanimated ~4.1
- **Gestures**: React Native Gesture Handler ~2.28 + @gorhom/bottom-sheet 5.x
- **Icons**: @expo/vector-icons (Feather icon set)
- **State**: Local useState/useCallback/useMemo (no external state library)
- **Styling**: StyleSheet.create with a centralized theme (`src/theme.js`, imported as `T`)
- **Backend Client**: @supabase/supabase-js 2.x
- **Env vars**: Prefixed with `EXPO_PUBLIC_` for client exposure
- **Safe Area**: react-native-safe-area-context ~5.6

## Data Pipeline (`data_pipeline/scripts/`)

- **Runtime**: Node.js (CommonJS modules, `"type": "commonjs"`)
- **Validation**: Zod 4.3.x (strict schema with enums for phases, classifications, madhhabs)
- **Database Client**: @supabase/supabase-js 2.x
- **Extraction AI**: @google/generative-ai 0.24.x (Gemini API)
- **Env**: dotenv loading from root `.env`
- **Default model**: `gemini-2.5-flash` (configurable via `--model` flag)
- **Pattern**: Extract from PDF → JSON in `inputs/` → normalize → quality check → validate with Zod → upsert to Supabase → archive to `archive/YYYY-MM-DD/`

## Environment Variables

| Variable | Used By | Purpose |
|----------|---------|---------|
| `EXPO_PUBLIC_SUPABASE_URL` | Mobile | Supabase project URL |
| `EXPO_PUBLIC_SUPABASE_ANON_KEY` | Mobile | Public anon key |
| `SUPABASE_URL` | Pipeline | Supabase project URL |
| `SUPABASE_SERVICE_ROLE_KEY` | Pipeline | Service role key (admin) |
| `SUPABASE_ANON_KEY` | Pipeline | Fallback key |
| `GEMINI_API_KEY` | Extraction | Google Gemini API key (required) |
| `GEMINI_API_KEY2` | Extraction | Second API key for rotation (optional) |
| `GEMINI_API_KEY3` | Extraction | Third API key for rotation (optional) |

## Common Commands

```bash
# Mobile development
cd mobile
npx expo start              # Start dev server (Expo Go or dev client)
npx expo start --android    # Android
npx expo start --ios        # iOS
npx expo start --web        # Web

# Data extraction (from books)
cd data_pipeline/scripts
node extract.js --book "ascent-to-felicity" --topic "Ablution (Wudu)"
node extract.js --book all --topic all    # Full extraction run

# Data pipeline (post-extraction)
cd data_pipeline/scripts
node normalize.js           # Auto-fix enum drift and spelling
node quality_check.js       # Coverage report and validation
node ingest.js              # Validate → upsert to Supabase → archive

# Database utilities
node check_db.js            # Inspect database state
node cleanup_samples.js     # Remove sample/test data
node production_reset.js    # Reset production data

# Install dependencies
cd mobile && npm install
cd data_pipeline/scripts && npm install
```

## Key Constraints

- No test framework is currently configured in either package.
- The mobile app has no TypeScript — all source is plain JavaScript (.js).
- The pipeline uses CommonJS (`require`/`module.exports`), not ES modules.
- Secrets must never be committed; `.env` files are gitignored.
- Extraction requires PDF books in `/Fiqhbooks/` and valid Gemini API key(s).
- The Gemini extraction uses temperature=0 for deterministic, grounded output.
