# FiqhApp — Project Structure

```
FiqhApp-1/
├── .env                          # Root env vars (pipeline + extraction use this)
├── .kiro/steering/               # AI steering documents
├── ARCHITECTURE.md               # Canonical architecture & agent directives
│
├── Fiqhbooks/                    # Source PDFs (classical Fiqh textbooks)
│   ├── Ascent to Felicity.pdf              # Hanafi
│   ├── al-murshid_al-muin_arabic_footnotes.pdf  # Maliki
│   ├── umdah-al-fiqh.pdf                  # Hanbali
│   ├── 917587315-Abu-Shuja-Translation.pdf # Shafi'i
│   └── accessible-conspectus_6x9-24-SAMPLE.pdf  # Reference sample
│
├── mobile/                       # Expo React Native app
│   ├── .env                      # Mobile-specific env (EXPO_PUBLIC_*)
│   ├── App.js                    # Root component, tab bar, global data fetch
│   ├── index.js                  # Entry point (registers root component)
│   ├── app.json                  # Expo config
│   ├── babel.config.js           # Babel (expo preset + reanimated plugin)
│   ├── metro.config.js           # Metro bundler config
│   ├── package.json
│   └── src/
│       ├── theme.js              # Colors, shadows, icon mapping, constants (import as T)
│       ├── lib/
│       │   └── supabase.js       # Supabase client singleton
│       ├── components/
│       │   ├── RulingCard.js     # Expandable ruling card (action badge, steps, evidence)
│       │   ├── SituationCard.js  # Tappable situation tile for Home grid
│       │   └── SharedUI.js       # Skeleton loaders, empty states
│       └── screens/
│           ├── HomeTab.js        # Situation finder + filtered ruling list
│           ├── ExploreTab.js     # Module → Topic → Chapter Guide drill-down
│           ├── BookmarksTab.js   # Saved rulings
│           └── SettingsTab.js    # Madhhab selector, app info
│
└── data_pipeline/
    ├── inputs/                   # Drop JSON files here for ingestion (or extract.js outputs here)
    │   └── _debug/              # Debug output from failed extractions
    ├── archive/                  # Processed files archived by date (YYYY-MM-DD/)
    └── scripts/
        ├── package.json
        ├── books.json            # Book metadata (title, author, madhhab, PDF filename)
        ├── topics.json           # Master list of 27 topics to extract
        ├── extract.js            # Gemini-powered PDF extraction (phase-by-phase)
        ├── normalize.js          # Auto-fix enum drift, spelling, structural issues
        ├── quality_check.js      # Coverage report, duplicate detection, validation
        ├── ingest.js             # Main pipeline: validate → upsert → archive
        ├── validator.js          # Zod schema for fiqh_rulings table
        ├── check_db.js           # DB inspection utility
        ├── cleanup_samples.js    # Remove sample/test data
        └── production_reset.js   # Reset production data
```

## Conventions

- **Component files**: PascalCase (e.g., `RulingCard.js`), export named components.
- **Screen files**: PascalCase with `Tab` suffix, export default.
- **Pipeline scripts**: snake_case or camelCase, run standalone via `node <script>.js`.
- **Theme**: All colors, radii, shadows, and icon mappings live in `src/theme.js` — import as `T`.
- **Data flow**: App.js fetches all rulings globally (filtered by selected madhhab), passes them down as props to tabs.
- **No navigation library**: Tabs are switched via `activeTab` state in App.js; sub-navigation within screens uses local state.
- **Database writes**: Always use upsert with `onConflict: 'module,topic,title,source_book'` to prevent duplicates.
- **Validation**: All pipeline data must pass Zod schema before reaching the database.
- **Archiving**: Successfully ingested files move to `archive/YYYY-MM-DD/` automatically.
- **Extraction output naming**: `{madhhab}_{topic_slug}.json` (e.g., `hanafi_ablution__wudu_.json`).
