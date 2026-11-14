/**
 * Split a post into <section class="story"> (everything before the "Ingredients" heading)
 * and <section class="recipe-card"> (that heading to the end). If the front matter has
 * recipe metadata, put an info strip (prep, cook, total, serves) at the top of the card.
 */
export function formatMinutes(min) {
  if (min == null) return null;
  if (min === 0) return "none";
  const h = Math.floor(min / 60), m = min % 60;
  return [h && `${h} hr`, m && `${m} min`].filter(Boolean).join(" ");
}

const el = (tagName, className, children) => ({
  type: "element",
  tagName,
  properties: className ? { className: [className] } : {},
  children,
});
const txt = (value) => ({ type: "text", value });

function metaStrip(fm) {
  const { prep_time: prep, cook_time: cook, servings } = fm || {};
  const items = [];
  if (prep != null) items.push(["Prep", formatMinutes(prep)]);
  if (cook != null) items.push(["Cook", formatMinutes(cook)]);
  if (prep != null && cook != null) items.push(["Total", formatMinutes(prep + cook)]);
  if (servings) items.push(["Makes", servings]);
  if (!items.length) return null;
  return el("dl", "recipe-meta", items.map(([k, v]) =>
    el("div", null, [el("dt", null, [txt(k)]), el("dd", null, [txt(v)])])));
}

export default function rehypeRecipeCard() {
  return (tree, file) => {
    const text = (n) => (n.type === "text" ? n.value : (n.children || []).map(text).join(""));
    const i = tree.children.findIndex(
      (n) => n.type === "element" && n.tagName === "h2" && /ingredients/i.test(text(n)),
    );
    if (i < 0) return;
    const recipe = tree.children.splice(i);
    const story = tree.children.splice(0);
    const strip = metaStrip(file?.data?.astro?.frontmatter);
    if (strip) recipe.unshift(strip);
    tree.children.push(el("section", "story", story), el("section", "recipe-card", recipe));
  };
}
