'use strict';

const { loadSettings } = require('../config');
const { buildContext } = require('../services/context');

/** CLI: index workflows into the catalog database. */
function parseArgs(argv) {
  const options = { force: false, prune: true, stats: false, db: null };
  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === '--force') options.force = true;
    else if (arg === '--no-prune') options.prune = false;
    else if (arg === '--stats') options.stats = true;
    else if (arg === '--db') {
      options.db = argv[index + 1];
      index += 1;
    }
  }
  return options;
}

function main() {
  const options = parseArgs(process.argv.slice(2));
  const settings = loadSettings();
  if (options.db) settings.dbPath = options.db;

  const context = buildContext(settings);

  if (options.stats) {
    console.log(JSON.stringify(context.repository.stats(), null, 2));
    return;
  }

  const started = Date.now();
  const stats = context.index.indexAll(options.force, options.prune);
  const elapsed = ((Date.now() - started) / 1000).toFixed(1);
  console.log(JSON.stringify(stats, null, 2));
  console.log(`Indexed in ${elapsed}s`);
}

try {
  main();
} catch (error) {
  console.error('Indexing failed:', error);
  process.exitCode = 1;
}
