import rss from "@astrojs/rss";
import type { APIContext } from "astro";
import { allPosts, postUrl } from "../lib/posts";

export async function GET(context: APIContext) {
  const posts = await allPosts();
  return rss({
    title: "Soulless Food",
    description: "Awesome recipes written with AI",
    site: context.site!,
    items: posts.slice(0, 50).map((post) => ({
      title: post.data.title,
      description: post.data.description,
      pubDate: post.data.date,
      link: postUrl(post),
    })),
  });
}
