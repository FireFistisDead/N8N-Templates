'use strict';

const fs = require('node:fs');
const path = require('node:path');
const express = require('express');

/** Page routes: the single-page client and a no-op favicon. */
function buildPagesRoutes(settings) {
  const router = express.Router();

  router.get('/', (req, res) => {
    const indexFile = path.join(settings.clientDir, 'index.html');
    if (fs.existsSync(indexFile)) return res.sendFile(indexFile);
    return res
      .status(500)
      .send(
        '<html><body><h1>Setup required</h1>' +
          `<p>Client assets not found at ${settings.clientDir}</p></body></html>`
      );
  });

  router.get('/favicon.ico', (req, res) => res.status(204).end());

  return router;
}

module.exports = { buildPagesRoutes };
