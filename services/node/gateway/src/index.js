'use strict';

const { createApp } = require('./app');
const { loadSettings } = require('./config');

function main() {
  const settings = loadSettings();
  const app = createApp(settings);
  app.listen(settings.port, settings.host, () => {
    console.log(
      `gateway-node listening on http://${settings.host}:${settings.port} (catalog: ${settings.catalogUrl})`
    );
  });
}

main();
