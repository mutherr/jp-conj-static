# Repository Notes

## Working Directories

- The npm project is `astro_site/`, not the repository root. Run all npm commands there; `package.json` requires Node >=22.12.0 and the lockfile is for npm.
- `data/filter-verbs.py` is a separate, standard-library-only generator. Run it from `data/` as `python filter-verbs.py`; its relative paths read `data/all/term_*.json` and overwrite the tracked `astro_site/src/data/verbs.json`.

## Verification

- Install reproducibly with `npm ci` in `astro_site/`.
- Typecheck Astro and TypeScript with `npm run astro -- check`.
- Build with `npm run build`. This emits more than 4,000 static verb pages to ignored `dist/` and builds the Pagefind index, so it is the relevant end-to-end check for routing and search changes.
- Lint with `npm run lint`.
- Run utility unit tests with `npm test`. Run the production browser smoke tests with `npm run test:e2e`; this builds the site before starting Playwright and requires `npx playwright install --with-deps chromium` once per machine.
- `npm run format` rewrites the whole app; for focused changes prefer `npx prettier --write <paths>` from `astro_site/`.

## Data And Routing

- `src/data/verbs.json` is the source for the home counts, browser data, and every static detail route. Regeneration can therefore alter URLs and thousands of generated pages; inspect and commit the JSON diff with generator changes.
- `src/pages/verbs/[slug].astro` creates detail URLs as `<reading>-<id>`. Keep links in `src/pages/verbs/index.astro` aligned with that scheme.
- Dictionary-entry furigana is generated in Python and stored in `verbs.json`; conjugated-form furigana is generated separately by `src/utils/ruby.ts` after `src/utils/conjugation.ts` creates term and reading forms.
- Pagefind indexes only detail-page content marked `data-pagefind-body`; searchable fields come from the `data-pagefind-meta` elements in `[slug].astro`. Verify search changes against a production build, not only `astro dev`.
- The verb browser always queries Pagefind and loads only visible result metadata. `astro-pagefind` serves the most recent `dist/pagefind` index during `astro dev`, so run a production build once after data or index-field changes and restart the dev server.
