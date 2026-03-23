module.exports = function(eleventyConfig) {
  // Passthrough copy static assets
  eleventyConfig.addPassthroughCopy("css");
  eleventyConfig.addPassthroughCopy("js");
  eleventyConfig.addPassthroughCopy("images");

  // Create recipe collection from all markdown files in recipes/
  eleventyConfig.addCollection("recipes", function(collectionApi) {
    return collectionApi.getFilteredByGlob("recipes/*.md").sort((a, b) => {
      return a.data.name.localeCompare(b.data.name);
    });
  });

  // Create featured recipes collection
  eleventyConfig.addCollection("featured", function(collectionApi) {
    return collectionApi.getFilteredByGlob("recipes/*.md")
      .filter(item => item.data.featured === true)
      .sort((a, b) => a.data.name.localeCompare(b.data.name));
  });

  // Create a collection of all unique tags across recipes
  eleventyConfig.addCollection("allTags", function(collectionApi) {
    const tagSet = new Set();
    collectionApi.getFilteredByGlob("recipes/*.md").forEach(item => {
      (item.data.recipeTags || []).forEach(tag => tagSet.add(tag));
    });
    return [...tagSet].sort();
  });

  // Helper: get tag color index (sum char codes mod 3)
  eleventyConfig.addFilter("tagColorIndex", function(tagName) {
    let sum = 0;
    for (let i = 0; i < tagName.length; i++) {
      sum += tagName.charCodeAt(i);
    }
    return sum % 3;
  });

  // Helper: get first emoji from recipe content
  eleventyConfig.addFilter("firstEmoji", function(content) {
    if (!content) return "🍽";
    const emojiRegex = /\p{Emoji_Presentation}/u;
    const match = content.match(emojiRegex);
    return match ? match[0] : "🍽";
  });

  // Transform: wrap recipe content sections with styled divs
  eleventyConfig.addTransform("recipeClasses", function(content, outputPath) {
    if (!outputPath || !outputPath.includes("/recipes/")) return content;

    // Split content on h2 tags and wrap each section
    content = content.replace(
      /<h2>Ingredients<\/h2>([\s\S]*?)(?=<h2>|<div class="recipe-notes"|<div class="recipe-source"|<img class="recipe-photo"|<\/div>\s*<div class="share-toast")/,
      '<div class="recipe-section"><h2 class="ingredients-heading">Ingredients</h2>$1</div>'
    );
    content = content.replace(
      /<h2>Directions<\/h2>([\s\S]*?)(?=<div class="recipe-notes"|<div class="recipe-source"|<img class="recipe-photo"|<\/div>\s*<div class="share-toast")/,
      '<div class="recipe-section"><h2 class="directions-heading">Directions</h2>$1</div>'
    );

    // Add classes to lists inside sections
    content = content.replace(
      /(ingredients-heading[\s\S]*?)<ul>/g,
      '$1<ul class="ingredients-list">'
    );
    content = content.replace(
      /(directions-heading[\s\S]*?)<ol>/g,
      '$1<ol class="directions-list">'
    );

    return content;
  });

  return {
    dir: {
      input: ".",
      output: "_site",
      includes: "_includes"
    },
    markdownTemplateEngine: "njk"
  };
};
