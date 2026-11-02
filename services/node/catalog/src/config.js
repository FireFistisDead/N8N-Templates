'use strict';

const os = require('node:os');
const path = require('node:path');

function repositoryRoot() {
  if (process.env.N8N_REPO_ROOT) {
    return path.resolve(process.env.N8N_REPO_ROOT.replace(/^~(?=$|\/)/, os.homedir()));
  }
  // services/node/catalog/src/config.js -> ../../../.. is the repository root.
  return path.resolve(__dirname, '..', '..', '..', '..');
}

function pathFromEnv(name, fallback) {
  const value = process.env[name];
  return value ? path.resolve(value.replace(/^~(?=$|\/)/, os.homedir())) : fallback;
}

function intFromEnv(name, fallback) {
  const value = Number.parseInt(process.env[name] ?? '', 10);
  return Number.isFinite(value) ? value : fallback;
}

function boolFromEnv(name, fallback) {
  const value = process.env[name];
  if (value === undefined) return fallback;
  return ['1', 'true', 'yes', 'on'].includes(value.trim().toLowerCase());
}

function loadSettings() {
  const root = repositoryRoot();
  return {
    repoRoot: root,
    workflowsDir: pathFromEnv('N8N_WORKFLOWS_DIR', path.join(root, 'workflows')),
    contextDir: pathFromEnv('N8N_CONTEXT_DIR', path.join(root, 'context')),
    dbPath: pathFromEnv('N8N_DB_PATH', path.join(root, 'data', 'node', 'workflows.db')),
    host: process.env.CATALOG_HOST || '127.0.0.1',
    port: intFromEnv('CATALOG_PORT', 8102),
    autoIndex: boolFromEnv('N8N_AUTO_INDEX', true),
    serviceName: 'catalog-node',
    version: '3.0.0',
  };
}

module.exports = { loadSettings, repositoryRoot };
