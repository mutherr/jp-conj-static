---
name: run-jp-conj-static
description: Build, run, and screenshot the jp-conj-static Astro site (Japanese verb conjugation reference). Use when asked to start, preview, build, test, or screenshot this app, or to visually verify a CSS/UI change (e.g. light/dark theme, mobile layout).
---

Static Astro site, no server-side runtime — "running" it means building,
serving the static output, and driving a headless Chromium against it via
`driver.mjs` in this directory (a thin `@playwright/test` script, since
`chromium-cli` isn't installed in this environment).

All paths below are relative to `astro_site/` (the actual npm project root
— the repo root above it has no `package.json`, just a Python data
pipeline in `../data/`).

## Prerequisites

Node >=22.12 and the project's npm deps. Playwright's Chromium browser is
already present in this container's cache
(`~/.cache/ms-playwright/chromium-*`) — no `npx playwright install` or
`install-deps` needed (the latter requires sudo and isn't available
non-interactively anyway; it wasn't needed here).

## Setup

```bash
npm install
```

## Build

```bash
npm run build
```

Builds to `dist/` (includes the Pagefind search index — takes ~8s for
the ~4,400 verb pages).

## Run (agent path)

Start the static preview server in the background, wait for it to serve,
then drive it with `driver.mjs`:

```bash
npm run preview -- --host 127.0.0.1 --port 4321 > /tmp/preview.log 2>&1 &
echo $! > /tmp/preview.pid
timeout 20 bash -c 'until curl -sf http://127.0.0.1:4321/ -o /dev/null; do sleep 0.5; done'
```

```bash
node .claude/skills/run-jp-conj-static/driver.mjs / --out=/tmp/home-light.png
node .claude/skills/run-jp-conj-static/driver.mjs / --color-scheme=dark --out=/tmp/home-dark.png
node .claude/skills/run-jp-conj-static/driver.mjs /verbs/たべる-245/ --theme=dark --out=/tmp/verb-dark.png
```

Stop with `kill $(cat /tmp/preview.pid)` (or `pkill -f 'astro preview'`)
before relaunching, or the next run hits `EADDRINUSE`. Check for a
pre-existing `astro dev`/`astro preview` process first (`pgrep -fa astro`)
— don't kill one you didn't start.

`driver.mjs <path> [options]`:

| option | what it does |
|---|---|
| `--out=<file>` | output PNG path (default `/tmp/shot.png`) |
| `--color-scheme=light\|dark` | emulated OS preference — exercises the CSS `@media (prefers-color-scheme)` fallback path (no `data-theme` set) |
| `--theme=light\|dark` | forces the site's own light/dark toggle via `localStorage`, overriding OS preference — exercises the explicit `data-theme` path |
| `--full-page` | capture the full scrollable page instead of just the viewport |
| `--base=<url>` | base URL (default `http://127.0.0.1:4321`) |

The two theme paths are independent CSS code paths (see
`src/styles/global.css`'s `color-scheme`/`light-dark()` tokens) — verify
both when touching theme-related CSS, not just one.

Any real verb slug works for the detail-page route; `たべる-245` (食べる)
is a convenient known-good one. Slugs are `${reading}-${id}` — look one
up with:

```bash
node -e "console.log(require('./src/data/verbs.json').find(v => v.term === '食べる'))"
```

## Run (human path)

```bash
npm run dev   # http://localhost:4321, live-reloads, Ctrl-C to stop
```

## Test

```bash
npm test          # vitest — conjugation.ts / ruby.ts unit tests
npm run test:e2e  # builds, then Playwright e2e against the preview server (search, furigana toggle, /search redirect)
```

## Gotchas

- **Running `driver.mjs` from outside `astro_site/`** fails with
  `ERR_MODULE_NOT_FOUND: @playwright/test` — Node's ESM resolver walks up
  from the *script's own* directory looking for `node_modules`, not from
  `cwd`. Always invoke it as `node .claude/skills/.../driver.mjs` from
  inside `astro_site/`, not via an absolute path from elsewhere.
- **`npx playwright install-deps` fails non-interactively** (tries to
  `sudo`, no TTY for the password prompt). Not actually needed here —
  the browser launches fine without it; only skip straight to
  `chromium.launch()` and see if it works before chasing this.
- **`npm run preview` serves `dist/`, not live source** — if you edited
  CSS/components after the last `npm run build`, screenshots will show
  stale output. Rebuild first.
