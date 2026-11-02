'use strict';

const fs = require('node:fs');
const path = require('node:path');

function discoverWorkflowFiles(workflowsDir) {
  const results = [];

  function walk(dir) {
    let entries;
    try {
      entries = fs.readdirSync(dir, { withFileTypes: true });
    } catch {
      return;
    }
    entries.sort((a, b) => a.name.localeCompare(b.name));
    for (const entry of entries) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        walk(full);
      } else if (entry.isFile() && entry.name.endsWith('.json')) {
        const relative = path.relative(workflowsDir, full);
        const parts = relative.split(path.sep);
        results.push({
          path: full,
          filename: entry.name,
          folder: parts.length > 1 ? parts[0] : '',
        });
      }
    }
  }

  walk(workflowsDir);
  return results;
}

function isSafeFilename(filename) {
  return (
    Boolean(filename) &&
    filename !== '.' &&
    filename !== '..' &&
    path.basename(filename) === filename &&
    !filename.includes('/') &&
    !filename.includes('\\')
  );
}

module.exports = { discoverWorkflowFiles, isSafeFilename };
