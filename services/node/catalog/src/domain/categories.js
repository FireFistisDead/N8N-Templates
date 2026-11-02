'use strict';

const fs = require('node:fs');
const path = require('node:path');

function readJson(file) {
  try {
    return JSON.parse(fs.readFileSync(file, 'utf8'));
  } catch {
    return null;
  }
}

/** Return ``filename -> category`` from the categoriser output. */
function loadMappings(contextDir) {
  const data = readJson(path.join(contextDir, 'search_categories.json'));
  const mappings = {};
  if (!Array.isArray(data)) return mappings;
  for (const item of data) {
    if (item && item.filename) mappings[String(item.filename)] = String(item.category || 'Uncategorized');
  }
  return mappings;
}

/** Load the categoriser output, falling back to the raw mappings. */
function loadUniqueCategories(contextDir) {
  const data = readJson(path.join(contextDir, 'unique_categories.json'));
  if (Array.isArray(data) && data.length) {
    return [...new Set(data.filter(Boolean).map(String))].sort();
  }
  const categories = new Set(Object.values(loadMappings(contextDir)).filter(Boolean));
  categories.add('Uncategorized');
  return [...categories].sort();
}

module.exports = { loadMappings, loadUniqueCategories };
