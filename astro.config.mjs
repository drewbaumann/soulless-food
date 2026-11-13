import { defineConfig } from "astro/config";
import sitemap from "@astrojs/sitemap";
import rehypeRecipeCard from "./src/lib/rehype-recipe-card.mjs";

export default defineConfig({
  site: "https://soullessfood.com",
  trailingSlash: "always",
  build: { format: "directory" },
  integrations: [sitemap()],
  markdown: { rehypePlugins: [rehypeRecipeCard], smartypants: true },
});
