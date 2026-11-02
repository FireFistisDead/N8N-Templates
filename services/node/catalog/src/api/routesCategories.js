'use strict';

const express = require('express');

/** Build category listing and mapping routes. */
function buildCategoryRoutes(context) {
  const router = express.Router();

  router.get('/categories', (req, res) => {
    res.json(context.categories.categories());
  });

  router.get('/category-mappings', (req, res) => {
    res.json(context.categories.mappings());
  });

  return router;
}

module.exports = { buildCategoryRoutes };
