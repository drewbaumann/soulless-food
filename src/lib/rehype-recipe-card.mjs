/** Wrap everything from the "Ingredients" heading to the end of a post in <section class="recipe-card">. */
export default function rehypeRecipeCard() {
  return (tree) => {
    const text = (n) => (n.type === "text" ? n.value : (n.children || []).map(text).join(""));
    const i = tree.children.findIndex(
      (n) => n.type === "element" && n.tagName === "h2" && /ingredients/i.test(text(n)),
    );
    if (i < 0) return;
    const rest = tree.children.splice(i);
    tree.children.push({
      type: "element",
      tagName: "section",
      properties: { className: ["recipe-card"] },
      children: rest,
    });
  };
}
