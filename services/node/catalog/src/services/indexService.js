'use strict';

const crypto = require('node:crypto');
const fs = require('node:fs');
const { analyzeWorkflow } = require('../domain/analyzer');
const { loadMappings } = require('../domain/categories');
const { discoverWorkflowFiles } = require('./workflowFiles');

function md5(filePath) {
  return crypto.createHash('md5').update(fs.readFileSync(filePath)).digest('hex');
}

class IndexService {
  constructor(settings, repository) {
    this.settings = settings;
    this.repository = repository;
  }

  indexAll(force = false, prune = true) {
    const files = discoverWorkflowFiles(this.settings.workflowsDir);
    const categories = loadMappings(this.settings.contextDir);
    const stats = {
      processed: 0,
      skipped: 0,
      errors: 0,
      duplicates: 0,
      removed: 0,
      total: files.length,
    };
    if (!files.length) return stats;

    const keep = new Set();
    for (const item of files) {
      if (keep.has(item.filename)) {
        stats.duplicates += 1;
        continue;
      }
      keep.add(item.filename);

      try {
        const fileHash = md5(item.path);
        if (!force && this.repository.getFileHash(item.filename) === fileHash) {
          stats.skipped += 1;
          continue;
        }

        const data = JSON.parse(fs.readFileSync(item.path, 'utf8'));
        if (!data || typeof data !== 'object' || Array.isArray(data)) {
          stats.errors += 1;
          continue;
        }

        const workflow = analyzeWorkflow({
          filename: item.filename,
          data,
          fileSize: fs.statSync(item.path).size,
          fileHash,
          folder: item.folder,
          category: categories[item.filename] || 'Uncategorized',
        });
        this.repository.upsert(workflow);
        stats.processed += 1;
      } catch {
        stats.errors += 1;
      }
    }

    if (prune) stats.removed = this.repository.deleteMissing(keep);
    return stats;
  }
}

module.exports = { IndexService };
