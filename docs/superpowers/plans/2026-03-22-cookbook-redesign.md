# Herbert Cookbook Redesign - Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rebuild the Herbert Cookbook from a monolithic HTML file into a markdown-driven Eleventy static site with mobile-first design, shareable recipe URLs, and a 90s-kid neon color scheme.

**Architecture:** Eleventy (11ty) reads markdown recipe files from `recipes/`, generates individual HTML pages for each recipe plus a home page with search and tag filtering. Static CSS and JS handle styling and interactivity. Netlify deploys on push.

**Tech Stack:** Eleventy 3.x, Nunjucks templates, vanilla CSS/JS, Netlify

**Spec:** `docs/superpowers/specs/2026-03-22-cookbook-redesign-design.md`

---

## File Map

| File | Responsibility |
|------|---------------|
| `.eleventy.js` | Eleventy config: collections, passthrough copy, markdown setup |
| `package.json` | Dependencies and build scripts |
| `netlify.toml` | Netlify build command and publish directory |
| `.gitignore` | Ignore `_site/`, `node_modules/`, `.superpowers/` |
| `index.njk` | Home page entry point - lists all recipes |
| `_includes/base.njk` | Base HTML template (head, meta, font loading, body wrapper) |
| `_includes/recipe.njk` | Recipe page template (stacked layout, share button) |
| `css/style.css` | All styles (CSS custom properties, mobile-first) |
| `js/main.js` | Search, tag filtering, share-to-clipboard |
| `recipes/*.md` | 46 individual recipe markdown files |
| `images/*.jpg` | Extracted recipe photos |
| `scripts/migrate.js` | One-time migration script: extracts recipes from index.html to markdown + images |

---

### Task 1: Project Scaffolding

**Files:**
- Create: `package.json`
- Create: `.eleventy.js`
- Create: `netlify.toml`
- Create: `.gitignore`

- [ ] **Step 1: Initialize the project with npm**

```bash
cd /Users/jessicaherbert/code/github-repos/personalrepos/herbert-cookbook
npm init -y
npm install @11ty/eleventy --save-dev
```

- [ ] **Step 2: Create `.eleventy.js`**

```js
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
```

- [ ] **Step 3: Add build scripts to `package.json`**

Add to `package.json` (ensure `"type": "commonjs"` is set for Eleventy 3.x compatibility with the `.eleventy.js` config file):
```json
{
  "type": "commonjs",
  "scripts": {
    "build": "eleventy",
    "dev": "eleventy --serve"
  }
}
```

- [ ] **Step 4: Create `netlify.toml`**

```toml
[build]
  command = "npx eleventy"
  publish = "_site"
```

- [ ] **Step 5: Create `.gitignore`**

```
_site/
node_modules/
.superpowers/
```

- [ ] **Step 6: Verify Eleventy runs**

```bash
npx eleventy
```

Expected: Build completes with 0 files written (no content yet).

---

### Task 2: Base Template

**Files:**
- Create: `_includes/base.njk`

- [ ] **Step 1: Create `_includes/` directory**

```bash
mkdir -p _includes
```

- [ ] **Step 2: Create `_includes/base.njk`**

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>{% if title %}{{ title }} - {% endif %}Made with love...and some other shit</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Dancing+Script:wght@700&display=swap" rel="stylesheet">
  <link rel="stylesheet" href="/css/style.css">
  {% block head %}{% endblock %}
</head>
<body>
  {% block content %}{% endblock %}
  <script src="/js/main.js"></script>
</body>
</html>
```

- [ ] **Step 3: Verify build still runs**

```bash
npx eleventy
```

Expected: Build completes (template exists but nothing references it yet).

---

### Task 3: CSS Stylesheet

**Files:**
- Create: `css/style.css`

- [ ] **Step 1: Create `css/` directory**

```bash
mkdir -p css
```

- [ ] **Step 2: Create `css/style.css`**

Full stylesheet implementing the design spec. Key sections:

```css
/* === Reset & Custom Properties === */
*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

:root {
  --bg: #000000;
  --surface: #0A0A0A;
  --border: #222222;
  --text: #FFFFFF;
  --text-body: #E0E0E0;
  --text-muted: #666666;
  --accent-pink: #FF2D95;
  --accent-blue: #00D4FF;
  --accent-purple: #8B5CF6;
  --mono: 'SF Mono', 'Fira Code', 'JetBrains Mono', Menlo, Monaco, 'Courier New', monospace;
}

body {
  font-family: system-ui, -apple-system, sans-serif;
  background: var(--bg);
  color: var(--text);
  min-height: 100vh;
  -webkit-font-smoothing: antialiased;
}

/* === Header === */
.site-header {
  position: sticky;
  top: 0;
  z-index: 100;
  background: rgba(0, 0, 0, 0.9);
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
  border-bottom: 1px solid var(--border);
  padding: 16px 20px;
  text-align: center;
}

.tagline {
  font-family: 'Dancing Script', cursive;
  font-size: 22px;
  font-weight: 700;
  background: linear-gradient(90deg, var(--accent-pink), var(--accent-purple), var(--accent-blue));
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.recipe-count {
  font-size: 11px;
  color: var(--text-muted);
  margin-top: 4px;
}

/* === Search === */
.search-bar {
  max-width: 640px;
  margin: 16px auto;
  padding: 0 20px;
}

.search-bar input {
  width: 100%;
  padding: 10px 16px 10px 40px;
  border: 1px solid var(--border);
  border-radius: 20px;
  background: var(--surface);
  color: var(--text);
  font-size: 14px;
  font-family: inherit;
  outline: none;
  transition: border-color 0.2s;
}

.search-bar input::placeholder { color: var(--text-muted); }
.search-bar input:focus { border-color: var(--accent-purple); }

.search-bar::before {
  content: '🔍';
  position: absolute;
  left: 34px;
  top: 50%;
  transform: translateY(-50%);
  font-size: 14px;
}

.search-bar { position: relative; }

/* === Tag Filter Pills === */
.tag-filters {
  max-width: 640px;
  margin: 0 auto 16px;
  padding: 0 20px;
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.tag-pill {
  padding: 4px 12px;
  border-radius: 12px;
  font-size: 11px;
  font-weight: 600;
  cursor: pointer;
  border: 1px solid transparent;
  transition: all 0.2s;
  background: var(--surface);
  color: var(--text-muted);
  border-color: var(--border);
}

.tag-pill:hover { opacity: 0.8; }

.tag-pill.active { color: #fff; }

.tag-pill[data-color="0"] { --tag-color: var(--accent-pink); }
.tag-pill[data-color="1"] { --tag-color: var(--accent-blue); }
.tag-pill[data-color="2"] { --tag-color: var(--accent-purple); }

.tag-pill:not(.active)[data-color="0"] {
  background: rgba(255, 45, 149, 0.1);
  color: var(--accent-pink);
  border-color: rgba(255, 45, 149, 0.25);
}
.tag-pill:not(.active)[data-color="1"] {
  background: rgba(0, 212, 255, 0.1);
  color: var(--accent-blue);
  border-color: rgba(0, 212, 255, 0.25);
}
.tag-pill:not(.active)[data-color="2"] {
  background: rgba(139, 92, 246, 0.1);
  color: var(--accent-purple);
  border-color: rgba(139, 92, 246, 0.25);
}

.tag-pill.active[data-color="0"] { background: var(--accent-pink); }
.tag-pill.active[data-color="1"] { background: var(--accent-blue); }
.tag-pill.active[data-color="2"] { background: var(--accent-purple); }

/* === Recipe List === */
.recipe-list {
  max-width: 640px;
  margin: 0 auto;
  padding: 0 20px 40px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.recipe-row {
  display: flex;
  align-items: center;
  gap: 12px;
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: 10px;
  padding: 12px 14px;
  text-decoration: none;
  color: var(--text);
  transition: transform 0.15s, box-shadow 0.15s;
  border-left: 3px solid var(--row-accent, var(--accent-pink));
}

.recipe-row:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.4);
}

.recipe-row .emoji { font-size: 24px; flex-shrink: 0; }

.recipe-row .info { flex: 1; min-width: 0; }

.recipe-row .recipe-name {
  font-size: 14px;
  font-weight: 600;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.recipe-row .serves {
  font-size: 10px;
  color: var(--text-muted);
  margin-top: 2px;
}

.recipe-row .tags {
  display: flex;
  gap: 4px;
  flex-shrink: 0;
  flex-wrap: wrap;
  justify-content: flex-end;
}

.recipe-row .tag {
  padding: 2px 8px;
  border-radius: 8px;
  font-size: 9px;
}

.tag[data-color="0"] { background: rgba(255, 45, 149, 0.1); color: var(--accent-pink); }
.tag[data-color="1"] { background: rgba(0, 212, 255, 0.1); color: var(--accent-blue); }
.tag[data-color="2"] { background: rgba(139, 92, 246, 0.1); color: var(--accent-purple); }

/* === Recipe Page === */
.recipe-page {
  max-width: 640px;
  margin: 0 auto;
  padding: 0 20px 40px;
}

.back-link {
  display: inline-block;
  color: var(--accent-pink);
  text-decoration: none;
  font-size: 12px;
  margin: 16px 0;
}

.back-link:hover { text-decoration: underline; }

.recipe-title {
  font-size: 22px;
  font-weight: 700;
  margin-bottom: 8px;
}

.recipe-meta {
  font-size: 11px;
  color: var(--text-muted);
  margin-bottom: 16px;
}

.recipe-meta .share-link {
  color: var(--accent-blue);
  cursor: pointer;
  border: none;
  background: none;
  font: inherit;
  font-size: 11px;
}

.recipe-meta .share-link:hover { text-decoration: underline; }

.share-toast {
  position: fixed;
  bottom: 20px;
  left: 50%;
  transform: translateX(-50%) translateY(100px);
  background: var(--accent-blue);
  color: #000;
  padding: 10px 20px;
  border-radius: 8px;
  font-size: 13px;
  font-weight: 600;
  transition: transform 0.3s ease;
  z-index: 200;
}

.share-toast.visible { transform: translateX(-50%) translateY(0); }

/* === Recipe Sections === */
.recipe-section {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: 10px;
  padding: 16px;
  margin-bottom: 12px;
}

.recipe-section h2 {
  font-size: 14px;
  font-weight: 700;
  margin-bottom: 12px;
}

.recipe-section h2.ingredients-heading { color: var(--accent-purple); }
.recipe-section h2.directions-heading { color: var(--accent-pink); }

.recipe-section h3 {
  font-size: 12px;
  font-weight: 600;
  color: var(--text-muted);
  margin: 12px 0 6px;
}

.recipe-section h3:first-child { margin-top: 0; }

/* Ingredients list */
.ingredients-list {
  list-style: none;
  font-family: var(--mono);
  font-size: 13px;
  color: var(--text-body);
  line-height: 2.2;
}

/* Directions list */
.directions-list {
  list-style: none;
  font-family: var(--mono);
  font-size: 13px;
  color: var(--text-body);
  line-height: 1.8;
  counter-reset: step;
}

.directions-list li {
  display: flex;
  gap: 10px;
  margin-bottom: 10px;
  align-items: flex-start;
}

.directions-list li::before {
  counter-increment: step;
  content: counter(step);
  background: rgba(255, 45, 149, 0.13);
  color: var(--accent-pink);
  font-weight: 700;
  min-width: 24px;
  height: 24px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 11px;
  flex-shrink: 0;
  border: 1px solid rgba(255, 45, 149, 0.25);
  font-family: system-ui, -apple-system, sans-serif;
  margin-top: 2px;
}

/* Notes */
.recipe-notes {
  background: rgba(139, 92, 246, 0.07);
  border: 1px solid rgba(139, 92, 246, 0.2);
  border-radius: 10px;
  padding: 14px;
  font-size: 13px;
  color: #ccc;
  margin-bottom: 12px;
  font-family: var(--mono);
  line-height: 1.6;
}

.recipe-notes .notes-label {
  font-weight: 700;
  color: var(--accent-purple);
}

/* Source link */
.recipe-source {
  font-size: 12px;
  margin-bottom: 12px;
}

.recipe-source a {
  color: var(--accent-blue);
  text-decoration: none;
}

.recipe-source a:hover { text-decoration: underline; }

/* Recipe photo */
.recipe-photo {
  width: 100%;
  border-radius: 10px;
  margin-bottom: 12px;
}

/* No results */
.no-results {
  text-align: center;
  color: var(--text-muted);
  padding: 40px 0;
  font-size: 14px;
}
```

- [ ] **Step 3: Verify build passes with CSS passthrough**

```bash
npx eleventy
```

Expected: Build completes, `_site/css/style.css` exists.

---

### Task 4: Home Page Template and Entry Point

**Files:**
- Create: `index.njk`

- [ ] **Step 1: Create `index.njk`**

```html
---
layout: base.njk
title: Home
---

<header class="site-header">
  <div class="tagline">Made with love...and some other shit</div>
  <div class="recipe-count">{{ collections.recipes.length }} recipes</div>
</header>

<div class="search-bar">
  <input type="text" id="search" placeholder="Search recipes..." autocomplete="off">
</div>

<div class="tag-filters" id="tagFilters">
  <button class="tag-pill active" data-tag="all" data-color="0">all</button>
  {%- for tag in collections.allTags -%}
  <button class="tag-pill" data-tag="{{ tag }}" data-color="{{ tag | tagColorIndex }}">{{ tag }}</button>
  {%- endfor -%}
</div>

<div class="recipe-list" id="recipeList">
  {%- for recipe in collections.recipes -%}
  <a href="{{ recipe.url }}" class="recipe-row" data-name="{{ recipe.data.name | lower }}" data-tags="{{ recipe.data.recipeTags | join(',') | lower }}" style="--row-accent: var(--accent-{{ ['pink','blue','purple'][recipe.data.recipeTags[0] | tagColorIndex] }})">
    <span class="emoji">{{ recipe.templateContent | firstEmoji }}</span>
    <div class="info">
      <div class="recipe-name">{{ recipe.data.name }}</div>
      {% if recipe.data.serves %}<div class="serves">Serves {{ recipe.data.serves }}</div>{% endif %}
    </div>
    <div class="tags">
      {%- for tag in recipe.data.recipeTags -%}
      <span class="tag" data-color="{{ tag | tagColorIndex }}">{{ tag }}</span>
      {%- endfor -%}
    </div>
  </a>
  {%- endfor -%}
</div>

<div class="no-results" id="noResults" style="display:none">No recipes found</div>
```

- [ ] **Step 2: Verify build includes the home page**

```bash
npx eleventy
```

Expected: Build writes `_site/index.html`.

---

### Task 5: Recipe Page Template

**Files:**
- Create: `_includes/recipe.njk`

- [ ] **Step 1: Create `_includes/recipe.njk`**

This template is assigned to recipe markdown files via a directory data file.

```html
---
layout: base.njk
---

<div class="recipe-page">
  <a href="/" class="back-link">&larr; back to cookbook</a>

  <h1 class="recipe-title">{{ content | firstEmoji }} {{ name }}</h1>

  <div class="recipe-tags" style="display:flex;gap:5px;margin-bottom:8px;">
    {%- for tag in recipeTags -%}
    <span class="tag" data-color="{{ tag | tagColorIndex }}">{{ tag }}</span>
    {%- endfor -%}
  </div>

  <div class="recipe-meta">
    {% if serves %}Serves {{ serves }} &bull; {% endif %}
    <button class="share-link" onclick="shareRecipe()">share &#x1F517;</button>
  </div>

  {{ content | safe }}

  {% if notes %}
  <div class="recipe-notes">
    <span class="notes-label">&#x1F4A1; Notes:</span> {{ notes }}
  </div>
  {% endif %}

  {% if source %}
  <div class="recipe-source">
    &#x1F517; <a href="{{ source }}" target="_blank" rel="noopener">Original recipe</a>
  </div>
  {% endif %}

  {% if photo %}
  <img class="recipe-photo" src="/images/{{ photo }}" alt="{{ name }}" loading="lazy">
  {% endif %}
</div>

<div class="share-toast" id="shareToast">Link copied!</div>
```

- [ ] **Step 2: Create `recipes/recipes.json` (directory data file)**

This tells Eleventy that all markdown files in `recipes/` use the recipe layout and live under `/recipes/`:

```json
{
  "layout": "recipe.njk",
  "permalink": "recipes/{{ page.fileSlug }}/"
}
```

- [ ] **Step 3: Create a test recipe to verify the template**

Create `recipes/test-recipe.md`:

```markdown
---
name: Test Recipe
serves: 4
recipeTags:
  - mains
notes: This is a test recipe.
---

## Ingredients

- 🧈 2 tbsp butter
- 🧅 1 onion

## Directions

1. Melt butter.
2. Add onion.
3. Serve.
```

- [ ] **Step 4: Verify recipe page builds**

```bash
npx eleventy
```

Expected: Build writes `_site/recipes/test-recipe/index.html`. Open it in a browser to verify layout.

- [ ] **Step 5: Run the local dev server and visually check both pages**

```bash
npx eleventy --serve
```

Visit `http://localhost:8080` for home page and `http://localhost:8080/recipes/test-recipe/` for recipe page. Verify:
- Home page shows the test recipe in the list
- Recipe page shows stacked layout with ingredients, directions, notes
- Gradient tagline renders
- Colors match spec

- [ ] **Step 6: Delete test recipe**

```bash
rm recipes/test-recipe.md
```

---

### Task 6: JavaScript - Search, Tag Filtering, Share

**Files:**
- Create: `js/main.js`

- [ ] **Step 1: Create `js/` directory**

```bash
mkdir -p js
```

- [ ] **Step 2: Create `js/main.js`**

```js
// === Tag Filtering ===
const tagFilters = document.getElementById('tagFilters');
const recipeList = document.getElementById('recipeList');
const noResults = document.getElementById('noResults');
const searchInput = document.getElementById('search');

if (tagFilters) {
  tagFilters.addEventListener('click', function(e) {
    const pill = e.target.closest('.tag-pill');
    if (!pill) return;

    // Update active state
    tagFilters.querySelectorAll('.tag-pill').forEach(p => p.classList.remove('active'));
    pill.classList.add('active');

    filterRecipes();
  });
}

// === Search ===
if (searchInput) {
  searchInput.addEventListener('input', filterRecipes);
}

function filterRecipes() {
  if (!recipeList) return;

  const activeTag = tagFilters
    ? tagFilters.querySelector('.tag-pill.active')?.dataset.tag || 'all'
    : 'all';
  const searchTerm = searchInput ? searchInput.value.toLowerCase().trim() : '';

  const rows = recipeList.querySelectorAll('.recipe-row');
  let visibleCount = 0;

  rows.forEach(row => {
    const name = row.dataset.name || '';
    const tags = row.dataset.tags || '';

    const matchesTag = activeTag === 'all' || tags.split(',').includes(activeTag);
    const matchesSearch = !searchTerm || name.includes(searchTerm) || tags.includes(searchTerm);

    const visible = matchesTag && matchesSearch;
    row.style.display = visible ? '' : 'none';
    if (visible) visibleCount++;
  });

  if (noResults) {
    noResults.style.display = visibleCount === 0 ? '' : 'none';
  }
}

// === Share ===
function shareRecipe() {
  const url = window.location.href;
  navigator.clipboard.writeText(url).then(() => {
    const toast = document.getElementById('shareToast');
    if (toast) {
      toast.classList.add('visible');
      setTimeout(() => toast.classList.remove('visible'), 2000);
    }
  });
}

// Make shareRecipe available globally
window.shareRecipe = shareRecipe;
```

- [ ] **Step 3: Verify JS is copied to output**

```bash
npx eleventy
ls _site/js/main.js
```

Expected: File exists in output.

---

### Task 7: Migration Script

**Files:**
- Create: `scripts/migrate.js`

This is a one-time Node.js script that reads the existing `index.html`, extracts the 46 recipes from the JavaScript array, and writes each one as a markdown file + extracts base64 photos to image files.

- [ ] **Step 1: Create `scripts/` directory**

```bash
mkdir -p scripts
```

- [ ] **Step 2: Write `scripts/migrate.js`**

The script should:
1. Read `index.html` as a string
2. Extract the `RECIPES` array using regex (find content between `const RECIPES = [` and the matching `];`)
3. Evaluate the array (using `new Function()` or manual parsing)
4. For each recipe object:
   - Generate a URL-safe slug from the name (lowercase, replace spaces/special chars with hyphens)
   - If `photo` exists and starts with `data:image`, decode the base64 and write to `images/<slug>.jpg`
   - Map `category` to `tags: [category]`
   - Write a markdown file to `recipes/<slug>.md` with frontmatter and content
   - Format ingredients with their existing emojis as a markdown unordered list
   - Format directions as a markdown ordered list
   - Handle ingredient groups (recipes with `label` fields in ingredients)
   - Move any URLs found in ingredient items to the `source` field if no source exists

```js
#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const html = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf-8');

// Extract the RECIPES array - find start and end
const startMarker = 'const RECIPES = [';
const startIdx = html.indexOf(startMarker);
if (startIdx === -1) {
  console.error('Could not find RECIPES array');
  process.exit(1);
}

// Find the matching closing bracket by counting brackets
let depth = 0;
let inString = false;
let stringChar = '';
let arrayStart = startIdx + startMarker.length - 1; // the [
let arrayEnd = -1;

for (let i = arrayStart; i < html.length; i++) {
  const ch = html[i];

  if (inString) {
    if (ch === stringChar && html[i - 1] !== '\\') {
      inString = false;
    }
    continue;
  }

  if (ch === '`' || ch === '"' || ch === "'") {
    inString = true;
    stringChar = ch;
    continue;
  }

  if (ch === '[') depth++;
  if (ch === ']') {
    depth--;
    if (depth === 0) {
      arrayEnd = i + 1;
      break;
    }
  }
}

if (arrayEnd === -1) {
  console.error('Could not find end of RECIPES array');
  process.exit(1);
}

const arrayStr = html.substring(arrayStart, arrayEnd);

// Evaluate it (the array uses backtick strings and plain objects)
let recipes;
try {
  recipes = new Function('return ' + arrayStr)();
} catch (e) {
  console.error('Failed to parse RECIPES array:', e.message);
  process.exit(1);
}

console.log(`Found ${recipes.length} recipes`);

// Ensure output directories exist
const recipesDir = path.join(__dirname, '..', 'recipes');
const imagesDir = path.join(__dirname, '..', 'images');
fs.mkdirSync(recipesDir, { recursive: true });
fs.mkdirSync(imagesDir, { recursive: true });

function slugify(name) {
  return name
    .toLowerCase()
    .replace(/[&]/g, 'and')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function escapeYaml(str) {
  if (!str) return '';
  // Wrap in quotes if it contains special YAML characters
  if (/[:#\[\]{}&*!|>'"%@`]/.test(str) || str.includes('\n')) {
    return '"' + str.replace(/"/g, '\\"') + '"';
  }
  return str;
}

for (const recipe of recipes) {
  const slug = slugify(recipe.name);
  console.log(`  Processing: ${recipe.name} -> ${slug}`);

  // Extract photo
  let photoFilename = '';
  if (recipe.photo && recipe.photo.startsWith('data:image')) {
    const matches = recipe.photo.match(/^data:image\/(\w+);base64,(.+)$/);
    if (matches) {
      const ext = matches[1] === 'jpeg' ? 'jpg' : matches[1];
      photoFilename = `${slug}.${ext}`;
      const buffer = Buffer.from(matches[2], 'base64');
      fs.writeFileSync(path.join(imagesDir, photoFilename), buffer);
    }
  }

  // Build frontmatter
  let fm = '---\n';
  fm += `name: ${escapeYaml(recipe.name)}\n`;
  if (recipe.serves) fm += `serves: ${escapeYaml(recipe.serves)}\n`;
  fm += `recipeTags:\n  - ${recipe.category || 'uncategorized'}\n`;
  if (recipe.subtitle) fm += `subtitle: ${escapeYaml(recipe.subtitle)}\n`;
  if (recipe.source) fm += `source: ${escapeYaml(recipe.source)}\n`;
  if (photoFilename) fm += `photo: ${photoFilename}\n`;
  if (recipe.notes) fm += `notes: ${escapeYaml(recipe.notes)}\n`;
  fm += '---\n\n';

  // Build ingredients section
  let content = '## Ingredients\n\n';
  if (recipe.ingredients && recipe.ingredients.length > 0) {
    for (const group of recipe.ingredients) {
      if (group.label && recipe.ingredients.length > 1) {
        content += `### ${group.label}\n\n`;
      }
      for (const item of group.items) {
        content += `- ${item}\n`;
      }
      content += '\n';
    }
  }

  // Build directions section
  content += '## Directions\n\n';
  if (recipe.directions && recipe.directions.length > 0) {
    recipe.directions.forEach((step, i) => {
      content += `${i + 1}. ${step}\n`;
    });
    content += '\n';
  }

  // Write markdown file
  fs.writeFileSync(path.join(recipesDir, `${slug}.md`), fm + content);
}

console.log(`\nDone! Migrated ${recipes.length} recipes.`);
```

- [ ] **Step 3: Run the migration script**

```bash
node scripts/migrate.js
```

Expected: Creates 46 `.md` files in `recipes/` and extracted photos in `images/`.

- [ ] **Step 4: Verify output**

```bash
ls recipes/ | wc -l
ls images/ | wc -l
cat recipes/instapot-roast.md
```

Expected: 46 recipe files, photo files in images/, and the instapot roast recipe looks correct with proper frontmatter and content.

- [ ] **Step 5: Rename old `index.html` before building**

The old `index.html` will conflict with Eleventy's output. Rename it now (keep as `.bak` until the new site is confirmed working):

```bash
mv index.html index.html.bak
```

- [ ] **Step 6: Build and serve the full site**

```bash
npx eleventy --serve
```

Visit `http://localhost:8080` and verify:
- All 46 recipes appear in the list
- Tags are dynamically generated and filterable
- Clicking a recipe goes to its own page
- Recipe page shows ingredients, directions, notes, source, photo
- Search works
- Share button copies URL

---

### Task 8: Visual QA and Polish

**Files:**
- Modify: `css/style.css` (as needed)
- Modify: `_includes/recipe.njk` (as needed)
- Modify: `.eleventy.js` (as needed)

- [ ] **Step 1: Test on mobile viewport**

Using Chrome DevTools, test at 375px width (iPhone SE). Verify:
- Tagline is readable and doesn't overflow
- Search bar is full width
- Tag pills wrap naturally
- Recipe list rows are tappable with enough padding
- Recipe page is readable with good line height on ingredients/directions
- Circled step numbers don't overlap text

- [ ] **Step 2: Test the share feature**

On a recipe page, click "share" and verify the URL is copied to clipboard and the toast notification appears.

- [ ] **Step 3: Fix any issues found**

Address any visual or functional issues discovered during testing.

---

### Task 9: Cleanup and Deploy Prep

**Files:**
- Modify: `.gitignore`
- Delete: `scripts/migrate.js` (optional - keep for reference)

- [ ] **Step 1: Verify `.gitignore` is correct**

Ensure `_site/`, `node_modules/`, and `.superpowers/` are all listed.

- [ ] **Step 2: Verify `netlify.toml` is correct**

```bash
cat netlify.toml
```

Expected:
```toml
[build]
  command = "npx eleventy"
  publish = "_site"
```

- [ ] **Step 3: Do a clean build**

```bash
rm -rf _site && npx eleventy
```

Expected: Builds successfully with all recipe pages, home page, CSS, JS, and images.

- [ ] **Step 4: Verify output structure**

```bash
ls _site/
ls _site/recipes/ | head -10
ls _site/css/
ls _site/js/
ls _site/images/ | head -5
```

Expected: All directories present with expected files.

- [ ] **Step 5: Confirm `index.html.bak` can be deleted**

The old `index.html` was renamed to `index.html.bak` in Task 8. Once the new site is confirmed working on Netlify, delete it:

```bash
rm index.html.bak
```

- [ ] **Step 6: Show file tree and confirm with user before committing**

Show the full directory tree of changed files and get user approval before making any commits or pushes.
