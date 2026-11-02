'use strict';

const fs = require('node:fs');
const path = require('node:path');

function normalize(value) {
  return String(value || '').toLowerCase().replace(/[^a-z0-9]/g, '');
}

/** Load the curated integration -> category definitions. */
function loadDefinitions(contextDir) {
  let raw;
  try {
    raw = JSON.parse(fs.readFileSync(path.join(contextDir, 'def_categories.json'), 'utf8'));
  } catch {
    return {};
  }

  const definitions = {};
  if (raw && typeof raw === 'object' && !Array.isArray(raw)) {
    for (const [key, value] of Object.entries(raw)) {
      if (value) definitions[normalize(key)] = String(value);
    }
    return definitions;
  }

  for (const item of Array.isArray(raw) ? raw : []) {
    if (!item || typeof item !== 'object') continue;
    if (item.integration && item.category) {
      definitions[normalize(item.integration)] = String(item.category);
    }
  }
  return definitions;
}

module.exports = { normalize, loadDefinitions };
