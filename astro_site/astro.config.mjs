// @ts-check
import { defineConfig } from "astro/config";

import tailwindcss from "@tailwindcss/vite";
import pagefind from "astro-pagefind";

// GitHub Pages serves the site under /jp-conj-static/, but that prefix is
// awkward in local dev, so only apply it for build/preview, not `astro dev`.
const isDev = process.argv.includes("dev");

// https://astro.build/config
export default defineConfig({
  site: "https://mutherr.github.io",
  base: isDev ? "/" : "/jp-conj-static/",
  integrations: [pagefind()],
  vite: {
    // @ts-ignore
    plugins: [tailwindcss()],
  },
});
