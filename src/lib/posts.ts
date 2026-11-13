import { getCollection, type CollectionEntry } from "astro:content";
import type { ImageMetadata } from "astro";

export type Post = CollectionEntry<"posts">;

const images = import.meta.glob<{ default: ImageMetadata }>("/src/assets/posts/*.jpg", {
  eager: true,
});

/** "2020-08-23-fried-squirrel-cakes" -> "fried-squirrel-cakes" */
export const slugOf = (post: Post) => post.id.replace(/^\d{4}-\d{2}-\d{2}-/, "");

/**
 * Same URL Jekyll produced on GitHub Pages (permalink: pretty, built in UTC):
 * /recipe/YYYY/MM/DD/slug/
 */
export function urlParts(post: Post) {
  const d = post.data.date;
  const pad = (n: number) => String(n).padStart(2, "0");
  return {
    year: String(d.getUTCFullYear()),
    month: pad(d.getUTCMonth() + 1),
    day: pad(d.getUTCDate()),
    slug: slugOf(post),
  };
}

export function postUrl(post: Post) {
  const { year, month, day, slug } = urlParts(post);
  return `/recipe/${year}/${month}/${day}/${slug}/`;
}

export const imageOf = (post: Post) => images[`/src/assets/posts/${slugOf(post)}.jpg`]?.default;

export async function allPosts() {
  const posts = await getCollection("posts");
  return posts.sort((a, b) => b.data.date.valueOf() - a.data.date.valueOf());
}
