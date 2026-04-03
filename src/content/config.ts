import { defineCollection, z } from 'astro:content';

const stories = defineCollection({
  type: 'content',
  schema: z.object({
    title: z.string(),
    publishDate: z.coerce.date(),
    author: z.string().default('站長'),
    tags: z.array(z.string()).default([]),
    access: z.enum(['public', 'member', 'paid']).default('public'),
    summary: z.string(),
    cover: z.string().optional(),
    iceberg: z.string().optional(),
    characters: z.string().optional(),
  }),
});

export const collections = { stories };
