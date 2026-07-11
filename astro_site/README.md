# Japanese Verb Conjugation

Static Astro reference site for browsing and searching Japanese verb conjugations. The production build generates one page per dictionary entry and indexes those pages with Pagefind.

## Development

Requires Node 22.12 or newer.

```sh
npm ci
npm run dev
```

The verb browser uses the generated Pagefind index in production. During `astro dev`, `astro-pagefind` serves the most recent index from `dist/`; run `npm run build` once before starting development when no index exists yet.

## Verification

```sh
npm run lint
npm run astro -- check
npm test
npm run test:e2e
```

`npm run test:e2e` performs the production build before running Playwright. Run `npm run build` directly to generate `dist/` and its Pagefind index without browser tests.

On a new machine, install the Playwright browser and its system dependencies once with `npx playwright install --with-deps chromium`.

## Dictionary Data

From the repository's `data/` directory, regenerate `astro_site/src/data/verbs.json` with:

```sh
python filter-verbs.py
```
