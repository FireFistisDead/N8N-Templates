'use strict';

const os = require('node:os');
const path = require('node:path');

function repositoryRoot() {
  if (process.env.N8N_REPO_ROOT) {
    return path.resolve(process.env.N8N_REPO_ROOT.replace(/^~(?=$|\/)/, os.homedir()));
  }
  // services/node/gateway/src/config.js -> ../../../.. is the repository root.
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

function loadSettings() {
  const root = repositoryRoot();
  return {
    repoRoot: root,
    clientDir: pathFromEnv('N8N_CLIENT_DIR', path.join(root, 'client')),
    catalogUrl: (process.env.CATALOG_URL || 'http://127.0.0.1:8102').replace(/\/+$/, ''),
    host: process.env.GATEWAY_HOST || '127.0.0.1',
    port: intFromEnv('GATEWAY_PORT', 8001),
    timeoutMs: intFromEnv('CATALOG_TIMEOUT_MS', 60000),
    serviceName: 'gateway-node',
    version: '3.0.0',
  };
}

module.exports = { loadSettings, repositoryRoot };
