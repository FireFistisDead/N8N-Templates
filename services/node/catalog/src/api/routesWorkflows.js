'use strict';

const express = require('express');

/** Build the workflow read routes (search, category search, detail, diagram, download). */
function buildWorkflowRoutes(context) {
  const router = express.Router();

  router.get('/', (req, res) => {
    const page = Math.max(1, Number.parseInt(req.query.page ?? '1', 10) || 1);
    const perPageRaw = Number.parseInt(req.query.per_page ?? '20', 10) || 20;
    const perPage = Math.min(100, Math.max(1, perPageRaw));

    const result = context.search.search({
      query: String(req.query.q ?? ''),
      trigger: String(req.query.trigger ?? 'all'),
      complexity: String(req.query.complexity ?? 'all'),
      category: String(req.query.category ?? 'all'),
      activeOnly: ['1', 'true', 'yes', 'on'].includes(String(req.query.active_only).toLowerCase()),
      page,
      perPage,
    });
    res.json(result);
  });

  // Must precede "/:filename" so "category" is not treated as a filename.
  router.get('/category/:category', (req, res) => {
    const page = Math.max(1, Number.parseInt(req.query.page ?? '1', 10) || 1);
    const perPageRaw = Number.parseInt(req.query.per_page ?? '20', 10) || 20;
    const perPage = Math.min(100, Math.max(1, perPageRaw));
    res.json(context.categories.searchByCategory(req.params.category, page, perPage));
  });

  router.get('/:filename/download', (req, res) => {
    const filePath = context.workflows.absolutePath(req.params.filename);
    if (!filePath) {
      return res.status(404).json({ detail: `Workflow file '${req.params.filename}' not found` });
    }
    res.download(filePath, req.params.filename);
  });

  router.get('/:filename/diagram', (req, res) => {
    let diagram;
    try {
      diagram = context.workflows.diagram(req.params.filename);
    } catch (error) {
      return res.status(400).json({ detail: `Invalid workflow file: ${error.message}` });
    }
    if (diagram === null) {
      return res.status(404).json({ detail: `Workflow file '${req.params.filename}' not found` });
    }
    res.json({ diagram });
  });

  router.get('/:filename', (req, res) => {
    let detail;
    try {
      detail = context.workflows.detail(req.params.filename);
    } catch (error) {
      return res.status(400).json({ detail: `Invalid workflow file: ${error.message}` });
    }
    if (detail === null) {
      return res.status(404).json({ detail: `Workflow '${req.params.filename}' not found` });
    }
    res.json(detail);
  });

  return router;
}

module.exports = { buildWorkflowRoutes };
