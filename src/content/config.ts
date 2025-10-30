import { defineCollection, z } from 'astro:content';
  const blog = defineCollection({
    type: 'content',
    schema: z.object({
      title: z.string(),
      description: z.string().optional(),
      pubDate: z.date()
    })
  });
  const cases = defineCollection({
    type: 'content',
    schema: z.object({
      title: z.string(),
      client: z.string().optional(),
      pubDate: z.date(),
      outcomes: z.array(z.string()).optional()
    })
  });
  export const collections = { blog, cases };