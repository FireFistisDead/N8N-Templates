'use strict';

const express = require('express');

function readBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    req.on('data', (chunk) => chunks.push(chunk));
    req.on('end', () => resolve(Buffer.concat(chunks)));
    req.on('error', reject);
  });
}

/** Proxy every /api/* request to the catalog service. */
function buildProxyRoutes(client) {
  const router = express.Router();

  router.all('/*', async (req, res) => {
    const body = await readBody(req);
    // req.originalUrl keeps the /api prefix the catalog expects.
    const [rawPath, rawQuery = ''] = req.originalUrl.split('?');

    const result = await client.forward({
      method: req.method,
      path: rawPath,
      query: rawQuery,
      body,
      headers: req.headers,
    });

    for (const [key, value] of Object.entries(result.headers)) {
      res.setHeader(key, value);
    }
    res.status(result.status).send(result.body);
  });

  return router;
}

module.exports = { buildProxyRoutes };
