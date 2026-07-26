// @ts-check
import { defineConfig } from "astro/config";

import tailwindcss from "@tailwindcss/vite";
import pagefind from "astro-pagefind";

// https://astro.build/config
export default defineConfig({
  site: "https://mutherr.github.io",
  base: "/jp-conj-static/",
  integrations: [pagefind()],
  vite: {
    // @ts-ignore
    plugins: [tailwindcss()],
  },
});
