'use strict';

const express = require('express');

/** Build statistics and integration listing routes. */
function buildStatsRoutes(context) {
  const router = express.Router();

  router.get('/stats', (req, res) => {
    res.json(context.stats.stats());
  });

  router.get('/integrations', (req, res) => {
    res.json(context.stats.integrations());
  });

  return router;
}

module.exports = { buildStatsRoutes };
