'use strict';

const fs = require('node:fs');
const path = require('node:path');

const { loadDefinitions, normalize } = require('./defs');
const { categorize } = require('./rules');

function tokensOf(filename) {
  return path
    .basename(filename, path.extname(filename))
    .split('_')
    .filter(Boolean);
}

function matchDefinition(tokens, definitions) {
  for (const token of tokens) {
    const normalized = normalize(token);
    if (definitions[normalized] !== undefined) return definitions[normalized];
  }
  for (const token of tokens) {
    const normalized = normalize(token);
    if (!normalized) continue;
    for (const [key, category] of Object.entries(definitions)) {
      if (normalized.includes(key) || key.includes(normalized)) return category;
    }
  }
  return null;
}

function categorizeFile(filename, definitions) {
  return matchDefinition(tokensOf(filename), definitions) || categorize(filename) || 'Uncategorized';
}

function discoverJsonFiles(dir) {
  const results = [];
  const walk = (current) => {
    let entries;
    try {
      entries = fs.readdirSync(current, { withFileTypes: true });
    } catch {
      return;
    }
    for (const entry of entries) {
      const full = path.join(current, entry.name);
      if (entry.isDirectory()) walk(full);
      else if (entry.isFile() && entry.name.endsWith('.json')) results.push(full);
    }
  };
  walk(dir);
  return results;
}

/** Categorise every workflow and persist the mapping files. */
function run(workflowsDir, contextDir) {
  const definitions = loadDefinitions(contextDir);
  const files = discoverJsonFiles(workflowsDir);

  const entries = files
    .map((file) => ({
      filename: path.basename(file),
      category: categorizeFile(path.basename(file), definitions),
    }))
    .sort((a, b) => (a.filename < b.filename ? -1 : a.filename > b.filename ? 1 : 0));

  fs.mkdirSync(contextDir, { recursive: true });
  fs.writeFileSync(
    path.join(contextDir, 'search_categories.json'),
    JSON.stringify(entries, null, 2),
    'utf8'
  );

  const counts = new Map();
  for (const entry of entries) {
    counts.set(entry.category, (counts.get(entry.category) || 0) + 1);
  }

  const categories = [...counts.keys()]
    .filter((category) => category && category !== 'Uncategorized')
    .sort();
  if (!categories.includes('Uncategorized')) categories.push('Uncategorized');

  fs.writeFileSync(
    path.join(contextDir, 'unique_categories.json'),
    JSON.stringify(categories, null, 2),
    'utf8'
  );

  const distribution = [...counts.entries()].sort((a, b) => b[1] - a[1]);
  return {
    files: entries.length,
    categories: categories.length,
    uncategorized: counts.get('Uncategorized') || 0,
    distribution: Object.fromEntries(distribution),
  };
}

module.exports = { run, categorizeFile };
