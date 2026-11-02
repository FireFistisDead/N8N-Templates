'use strict';

const os = require('node:os');
const path = require('node:path');

const { run } = require('./runner');

function repositoryRoot() {
  if (process.env.N8N_REPO_ROOT) {
    return path.resolve(process.env.N8N_REPO_ROOT.replace(/^~(?=$|\/)/, os.homedir()));
  }
  // services/node/categorizer/src/index.js -> ../../../.. is the repository root.
  return path.resolve(__dirname, '..', '..', '..', '..');
}

function argValue(name, fallback) {
  const index = process.argv.indexOf(name);
  return index >= 0 && process.argv[index + 1] ? process.argv[index + 1] : fallback;
}

const root = repositoryRoot();
const workflowsDir = path.resolve(argValue('--workflows', path.join(root, 'workflows')));
const contextDir = path.resolve(argValue('--context', path.join(root, 'context')));

const summary = run(workflowsDir, contextDir);
console.log(JSON.stringify(summary, null, 2));
