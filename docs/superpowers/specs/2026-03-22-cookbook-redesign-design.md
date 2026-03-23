# Herbert Cookbook Redesign - Design Spec

## Overview

Redesign the Herbert Cookbook from a single monolithic HTML file into a markdown-driven static site built with Eleventy (11ty), deployed to Netlify. The redesign prioritizes mobile readability, shareable recipe URLs, and a simple workflow for adding new recipes.

## Current State

- Single `index.html` file (656 KB) containing all 46 recipes as a JavaScript array
- Recipe photos embedded as base64 blobs
- No build process, no separate recipe files
- Deployed via Netlify (site ID: `35c32b81-6cef-4135-bf71-9282fa2ece81`)
- Adding a recipe requires manually editing the JavaScript array

## Goals

1. Each recipe is a standalone markdown file - easy to add, edit, and manage
2. Each recipe gets its own URL for sharing (e.g., `/recipes/instapot-roast/`)
3. Mobile-first design optimized for reading while cooking
4. Freeform tag system - tags defined in markdown, dynamically filterable on the site
5. Keep the "Made with love...and some other shit" personality

## Architecture

### Tech Stack

- **Static site generator:** Eleventy (11ty) - no framework, outputs plain HTML/CSS/JS
- **Hosting:** Netlify (existing project)
- **Source of truth:** Markdown files with YAML frontmatter
- **Build trigger:** Push to GitHub, Netlify auto-deploys

### Project Structure

```
herbert-cookbook/
  recipes/
    instapot-roast.md
    baked-ziti.md
    ...
  images/
    instapot-roast.jpg
    baked-ziti.jpg
    ...
  _includes/
    base.njk          # Base HTML template
    home.njk          # Home page template
    recipe.njk        # Individual recipe template
  _data/
    (empty for now, available for future site-wide data)
  css/
    style.css          # All styles
  js/
    main.js            # Search, tag filtering, share functionality
  .eleventy.js         # Eleventy config
  index.njk            # Home page entry point
  package.json
  netlify.toml
```

### Eleventy Configuration

- **Input directory:** Project root
- **Output directory:** `_site`
- **Recipe collection:** All `.md` files in `recipes/` registered as a collection
- **Passthrough copy:** `images/`, `css/`, `js/` copied as-is to output
- **Dependencies:** `@11ty/eleventy` (only required package)

### Netlify Configuration

- **Build command:** `npx eleventy`
- **Publish directory:** `_site`
- No redirects needed from old URL structure (the old site was a single page with no defined routes)

## Recipe Markdown Format

Each recipe is a `.md` file in `recipes/`. The filename becomes the URL slug.

**All measurements must use US units** (cups, tablespoons, teaspoons, ounces, pounds, Fahrenheit). When transcribing recipes from sources that use metric, convert to US measurements.

**Standard abbreviations:** `tsp` (teaspoon), `tbsp` (tablespoon), `cup`, `oz` (ounce), `lb` (pound), `qt` (quart), `gal` (gallon). Always use these consistently.

```markdown
---
name: Instapot Roast
serves: 6
recipeTags:
  - mains
  - instant pot
source: https://instagram.com/p/xyz
photo: instapot-roast.jpg
notes: Great with crusty bread for soaking up the gravy.
---

## Ingredients

- 🥩 3 lb chuck roast
- 🧈 2 tbsp butter
- 🥫 32 oz beef broth
- 🍅 1 cup crushed tomatoes
- 🧅 1 packet onion soup mix
- 🫙 1 packet au jus seasoning/gravy mix
- 🌿 1 tsp parsley dried
- 🥔 2 lb red potatoes
- 🥕 2 cups baby carrots
- 🌽 cornstarch for a thickening slurry

## Directions

1. Season all sides of the roast with salt and pepper.
2. Brown all sides of the roast.
3. Remove the browned roast and set aside.
4. Pour the broth into the pot and scrape the bottom until clean.
5. Add the crushed tomatoes, onion mix, au jus mix, Worcestershire sauce and parsley. Add the roast back in.
6. Cook on Manual HIGH for 100 minutes with a 15 minute NPR.
```

### Frontmatter Fields

| Field | Required | Description |
|-------|----------|-------------|
| `name` | Yes | Display name of the recipe |
| `serves` | No | Serving size (e.g., "6", "Makes 24") |
| `recipeTags` | Yes | List of freeform tags (at least one). Named `recipeTags` instead of `tags` because Eleventy reserves the `tags` field for its own collection system. |
| `source` | No | URL to original recipe source |
| `photo` | No | Filename of image in `images/` directory |
| `notes` | No | Tips, variations, or personal notes |

### Ingredient Groups

For recipes with grouped ingredients (e.g., a bowl + sauce), use markdown sub-headings:

```markdown
## Ingredients

### Bowl
- 🍚 2 cups rice
- 🥩 1 lb chicken thigh

### Sauce
- 🫙 2 tbsp soy sauce
- 🍯 1 tbsp honey
```

### Tags

Tags are completely freeform. Whatever tags exist across all recipe files are automatically collected and displayed as filter options on the home page. No hardcoded tag list. Examples: `mains`, `soups`, `pasta`, `baking`, `sides`, `snacks`, `meal prep`, `instant pot`, `weeknight`, `crowd pleaser`.

Tags cycle through three accent colors (pink, blue, purple) for visual variety. The color assignment is deterministic based on tag name so the same tag always gets the same color. Color index is assigned by summing the character codes of the tag name and taking modulo 3.

## Pages

### Home Page

**URL:** `/`

**Layout:**
- Sticky header with gradient tagline: "Made with love...and some other shit"
- Recipe count subtitle
- Search bar (filters by recipe name and tags)
- Tag filter pills (dynamically generated from all recipes, colored pink/blue/purple)
- Compact recipe list:
  - Each row: colored left border + emoji (first emoji from ingredients) + recipe name + servings + tag pills
  - Tapping a row navigates to the recipe page
  - On mobile, tags may wrap or hide to keep rows compact

**Interactions:**
- Search filters the list in real time
- Clicking a tag pill filters to recipes with that tag
- Clicking "all" clears the filter

### Recipe Page

**URL:** `/recipes/<slug>/` (e.g., `/recipes/instapot-roast/`)

**Layout (stacked, single column):**
1. Back link ("← back to cookbook", pink)
2. Recipe title with first ingredient emoji (e.g., "🍖 Instapot Roast")
3. Tag pills
4. Serving size + share link (blue, copies URL to clipboard)
5. **Ingredients section** - purple heading, monospace body, emoji-prefixed items, generous line height
6. **Directions section** - pink heading, monospace body, pink circled step numbers
7. **Notes section** (if exists) - purple-tinted box with lightbulb icon
8. **Source link** (if exists) - link to original recipe
9. **Photo** (if exists) - displayed at the bottom

**Interactions:**
- Share link copies the recipe URL to clipboard with a brief confirmation
- Back link returns to home page. Active tag filters are preserved via URL query parameters (e.g., `/?tag=instant+pot`) so the back link can restore them. Nice-to-have for initial build.

## Visual Design

### Color Palette

| Token | Value | Usage |
|-------|-------|-------|
| `--bg` | `#000000` | Page background |
| `--surface` | `#0A0A0A` | Card/section backgrounds |
| `--border` | `#222222` | Borders |
| `--text` | `#FFFFFF` | Primary text |
| `--text-body` | `#E0E0E0` | Body text (ingredients, directions) |
| `--text-muted` | `#666666` | Secondary text (servings, subtitles) |
| `--accent-pink` | `#FF2D95` | Primary accent, directions heading, step numbers, back link |
| `--accent-blue` | `#00D4FF` | Secondary accent, share link |
| `--accent-purple` | `#8B5CF6` | Tertiary accent, ingredients heading, notes box |

### Typography

| Element | Font | Size (mobile) |
|---------|------|---------------|
| Tagline | Cursive (e.g., Dancing Script) | 20-24px |
| Recipe title | System sans-serif, bold | 22px |
| Section headings | System sans-serif, bold | 13-14px |
| Ingredients/Directions body | Monospace (system stack) | 13px |
| Tags, UI elements | System sans-serif | 9-11px |
| Navigation | System sans-serif | 11px |

Monospace font stack: `'SF Mono', 'Fira Code', 'JetBrains Mono', Menlo, Monaco, 'Courier New', monospace`

### Key Design Elements

- **Gradient tagline:** Linear gradient across pink, purple, and blue
- **Tag pills:** Tinted background + colored text, cycling through the three accents. Color is deterministic per tag name.
- **Recipe list rows:** Dark surface card with colored left border (3px, matches primary tag color)
- **Circled step numbers:** 24px circles with tinted pink background and pink border
- **Notes box:** Purple-tinted background with purple border
- **Generous line height:** 2.2x on ingredients, 1.8x on directions for easy reading while cooking

### Responsive Behavior

- Mobile-first design, single column throughout
- Max-width constraint on larger screens (centered content, ~640px max for recipe pages)
- Search bar and tag pills wrap naturally
- No layout shifts between breakpoints - stacked layout works at all sizes

## Adding Recipes Workflow

The primary workflow for adding new recipes:

1. User provides a recipe to Claude via: photo of a recipe card (printed or handwritten), Instagram screenshot, website URL, or verbal description
2. Claude transcribes the recipe into a markdown file following the format above, including emoji-prefixed ingredients
3. Claude adds the `.md` file to `recipes/` and any photo to `images/`
4. User reviews and confirms, then the changes are committed and pushed
5. Netlify auto-deploys the updated site

## Migration

All 46 existing recipes will be migrated from the current `index.html` JavaScript array into individual markdown files. Base64-encoded photos will be extracted to actual image files in `images/`.

- Each recipe's existing `category` value becomes its initial tag (e.g., `category: "mains"` becomes `tags: [mains]`)
- Additional tags can be added later as a manual enrichment pass
- URLs embedded in ingredient items will be moved to the `source` frontmatter field
- Measurement abbreviations will be standardized during migration

## Out of Scope

- Grocery list feature (explicitly removed)
- User accounts or authentication
- Comments or ratings
- Meal planning
- Server-side functionality (fully static site)
- Cooking Mama character/mascot
