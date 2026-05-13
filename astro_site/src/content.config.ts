import { defineCollection } from 'astro:content';
import { z } from 'astro/zod';
import { file } from 'astro/loaders';

// imports required for pagefind
import { defineConfig } from 'astro/config';
import pagefind from 'astro-pagefind';

const verbCollection = defineCollection({
  loader: file('src/content/verbs.json'),
  schema: z.object({
    id: z.number(),
    term: z.string(),
    reading: z.string(),
    type: z.string(),
    tags: z.array(z.string()),
  }),
});

export const collections = {
  verbs: verbCollection,
};

export default defineConfig({
  build: {
    format: 'file',
  },
  integrations: [pagefind()],
});