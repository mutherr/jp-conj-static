import js from "@eslint/js";
import tsParser from "@typescript-eslint/parser";
import astroPlugin from "eslint-plugin-astro";
import astroParser from "astro-eslint-parser";
import eslintConfigPrettier from "eslint-config-prettier";

export default [
  js.configs.recommended,
  ...astroPlugin.configs.recommended,
  ...astroPlugin.configs["jsx-a11y-recommended"],

  {
    languageOptions: {
      globals: {
        node: true,
        browser: true,
      },
      parserOptions: {
        ecmaVersion: "latest",
        sourceType: "module",
      },
    },
  },

  {
    files: ["**/*.ts", "**/*.tsx"],
    languageOptions: {
      parser: tsParser,
    },
  },

  {
    files: ["**/*.astro"],
    languageOptions: {
      parser: astroParser,
      parserOptions: {
        parser: tsParser,
        extraFileExtensions: [".astro"],
      },
    },
  },

  eslintConfigPrettier,
];