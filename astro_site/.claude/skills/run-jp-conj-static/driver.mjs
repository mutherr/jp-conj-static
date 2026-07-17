#!/usr/bin/env node
// Screenshot driver for the jp-conj-static Astro site.
// Usage: node driver.mjs <path> [options]
//   --out=<file>            output PNG path (default: /tmp/shot.png)
//   --color-scheme=<light|dark>   emulated OS color-scheme preference (default: light)
//   --theme=<light|dark>     force the site's explicit ThemeToggle choice via
//                            localStorage, overriding --color-scheme
//   --full-page             capture the full scrollable page, not just the viewport
//   --viewport=<WxH>         viewport size, e.g. 375x800 for mobile (default: 1280x800)
//   --base=<url>             base URL (default: http://127.0.0.1:4321)
//
// Examples:
//   node driver.mjs /                                    light mode, OS-preference path
//   node driver.mjs / --color-scheme=dark                dark mode via OS-preference fallback
//   node driver.mjs /verbs/たべる-245/ --theme=dark        dark mode via explicit toggle (localStorage)
//   node driver.mjs /verbs --full-page --out=/tmp/verbs.png
//   node driver.mjs /verbs/たべる-245/ --viewport=375x800 --full-page   mobile-width layout

import { chromium } from "@playwright/test";

const [, , rawPath, ...rest] = process.argv;
if (!rawPath) {
  console.error(
    "usage: node driver.mjs <path> [--out=file.png] [--color-scheme=light|dark] [--theme=light|dark] [--full-page] [--base=url]",
  );
  process.exit(1);
}

const opts = Object.fromEntries(
  rest
    .filter((a) => a.startsWith("--"))
    .map((a) => {
      const [key, value] = a.slice(2).split("=");
      return [key, value ?? true];
    }),
);

const base = opts.base ?? "http://127.0.0.1:4321";
const out = opts.out ?? "/tmp/shot.png";
const colorScheme = opts["color-scheme"] ?? "light";

let viewport = { width: 1280, height: 800 };
if (typeof opts.viewport === "string") {
  const [width, height] = opts.viewport.split("x").map(Number);
  viewport = { width, height };
}

const browser = await chromium.launch();
const context = await browser.newContext({ colorScheme, viewport });
const page = await context.newPage();

if (opts.theme === "light" || opts.theme === "dark") {
  await page.addInitScript((theme) => {
    localStorage.setItem("theme", theme);
  }, opts.theme);
}

await page.goto(base + rawPath, { waitUntil: "networkidle" });
await page.screenshot({ path: out, fullPage: Boolean(opts["full-page"]) });

console.log("wrote", out);

await browser.close();
