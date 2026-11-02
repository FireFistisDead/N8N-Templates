'use strict';

const express = require('express');

/** Administrative routes: reindexing. */
function buildAdminRoutes(context) {
  const router = express.Router();

  router.post('/reindex', (req, res) => {
    const force = ['1', 'true', 'yes', 'on'].includes(
      String(req.query.force ?? '').toLowerCase()
    );
    // Respond immediately, then reindex on the next tick so the request
    // does not block on a multi-second full scan.
    setImmediate(() => {
      try {
        const stats = context.index.indexAll(force);
        context.workflows.refresh();
        context.stats.invalidate();
        console.log('Reindex complete:', stats);
      } catch (error) {
        console.error('Reindex failed:', error);
      }
    });
    res.json({ message: 'Reindexing started in background' });
  });

  return router;
}

module.exports = { buildAdminRoutes };
