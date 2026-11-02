'use strict';

const express = require('express');

const { buildAdminRoutes } = require('./routesAdmin');
const { buildCategoryRoutes } = require('./routesCategories');
const { buildStatsRoutes } = require('./routesStats');
const { buildWorkflowRoutes } = require('./routesWorkflows');

/**
 * Create the catalog Express app. The app is API-only: the gateway owns the
 * public listener, static assets and any future auth.
 */
function createApp(settings, context) {
  const app = express();
  app.disable('x-powered-by');
  app.use(express.json({ limit: '1mb' }));

  app.get('/health', (req, res) => {
    res.json({
      status: 'healthy',
      service: settings.serviceName,
      version: settings.version,
    });
  });

  app.use('/api', buildStatsRoutes(context));
  app.use('/api', buildCategoryRoutes(context));
  app.use('/api/workflows', buildWorkflowRoutes(context));
  app.use('/api', buildAdminRoutes(context));

  app.use((req, res) => {
    res.status(404).json({ detail: `Not found: ${req.method} ${req.originalUrl}` });
  });

  // eslint-disable-next-line no-unused-vars
  app.use((error, req, res, next) => {
    console.error('Unhandled catalog error on', req.originalUrl, error);
    res.status(500).json({ detail: `Internal server error: ${error.message}` });
  });

  return app;
}

module.exports = { createApp };
