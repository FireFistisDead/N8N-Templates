'use strict';

const fs = require('node:fs');
const path = require('node:path');
const express = require('express');

const { CatalogClient } = require('./catalogClient');
const { buildPagesRoutes } = require('./routes/pages');
const { buildProxyRoutes } = require('./routes/proxy');

/** Create the public gateway app: static client plus catalog proxy. */
function createApp(settings) {
  const catalog = new CatalogClient(settings.catalogUrl, settings.timeoutMs);
  const app = express();
  app.disable('x-powered-by');

  app.get('/health', async (req, res) => {
    const result = await catalog.health();
    res.json({
      status: result.status < 400 ? 'healthy' : 'degraded',
      service: settings.serviceName,
      version: settings.version,
      catalog_status: String(result.status),
    });
  });

  const assetsDir = path.join(settings.clientDir, 'assets');
  if (fs.existsSync(assetsDir)) {
    app.use('/assets', express.static(assetsDir, { maxAge: '1h', index: false }));
  }

  app.use(buildPagesRoutes(settings));
  app.use('/api', buildProxyRoutes(catalog));
  return app;
}

module.exports = { createApp };
