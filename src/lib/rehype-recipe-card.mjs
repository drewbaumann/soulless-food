/**
 * Split a post into <section class="story"> (everything before the "Ingredients" heading)
 * and <section class="recipe-card"> (that heading to the end).
 */
export default function rehypeRecipeCard() {
  return (tree) => {
    const text = (n) => (n.type === "text" ? n.value : (n.children || []).map(text).join(""));
    const i = tree.children.findIndex(
      (n) => n.type === "element" && n.tagName === "h2" && /ingredients/i.test(text(n)),
    );
    if (i < 0) return;
    const recipe = tree.children.splice(i);
    const story = tree.children.splice(0);
    const section = (className, children) => ({
      type: "element",
      tagName: "section",
      properties: { className: [className] },
      children,
    });
    tree.children.push(section("story", story), section("recipe-card", recipe));
  };
}
