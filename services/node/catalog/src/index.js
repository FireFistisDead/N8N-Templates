'use strict';

const { loadSettings } = require('./config');
const { createApp } = require('./api/app');
const { buildContext, indexIfEmpty } = require('./services/context');

/** Start the catalog HTTP service. */
function main() {
  const settings = loadSettings();
  const context = buildContext(settings);

  try {
    indexIfEmpty(context);
  } catch (error) {
    console.error('Auto-index failed:', error);
  }

  const app = createApp(settings, context);
  const server = app.listen(settings.port, settings.host, () => {
    console.log(
      `catalog-node listening on http://${settings.host}:${settings.port} (db: ${settings.dbPath})`
    );
  });

  const shutdown = () => {
    server.close(() => {
      context.repository.close();
      process.exit(0);
    });
  };
  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
}

main();
