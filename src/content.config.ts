import { defineCollection, z } from "astro:content";
import { glob } from "astro/loaders";

const posts = defineCollection({
  loader: glob({ pattern: "*.md", base: "./src/content/posts" }),
  schema: z.object({
    title: z.string(),
    date: z.coerce.date(),
    description: z.string(),
    image_prompt: z.string().optional(),
    categories: z.string().default("recipe"),
    // Recipe metadata (schema.org Recipe + the card's info strip). Times are whole minutes.
    prep_time: z.number().int().nonnegative().optional(),
    cook_time: z.number().int().nonnegative().optional(),
    servings: z.string().optional(),
    recipe_category: z.string().optional(),
    cuisine: z.string().optional(),
    keywords: z.string().optional(),
  }),
});

export const collections = { posts };
