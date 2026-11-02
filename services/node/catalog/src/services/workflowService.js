'use strict';

const fs = require('node:fs');
const path = require('node:path');
const { generateMermaid } = require('../domain/diagram');
const { workflowSummary } = require('../contracts');
const { discoverWorkflowFiles, isSafeFilename } = require('./workflowFiles');

class WorkflowService {
  constructor(settings, repository) {
    this.settings = settings;
    this.repository = repository;
    this.fileIndex = null;
  }

  refresh() {
    this.fileIndex = new Map();
    for (const item of discoverWorkflowFiles(this.settings.workflowsDir)) {
      if (!this.fileIndex.has(item.filename)) this.fileIndex.set(item.filename, item.path);
    }
  }

  pathFor(filename) {
    if (!isSafeFilename(filename)) return null;
    if (!this.fileIndex) this.refresh();
    return this.fileIndex.get(filename) || null;
  }

  detail(filename) {
    const metadata = this.repository.getByFilename(filename);
    if (!metadata) return null;
    const filePath = this.pathFor(filename);
    if (!filePath) return null;
    const rawJson = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    return { metadata: workflowSummary(metadata), raw_json: rawJson };
  }

  diagram(filename) {
    const filePath = this.pathFor(filename);
    if (!filePath) return null;
    const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    return generateMermaid(data.nodes || [], data.connections || {});
  }

  absolutePath(filename) {
    const filePath = this.pathFor(filename);
    return filePath ? path.resolve(filePath) : null;
  }
}

module.exports = { WorkflowService };
