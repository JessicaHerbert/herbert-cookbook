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
