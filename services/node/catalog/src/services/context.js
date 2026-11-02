'use strict';

const fs = require('node:fs');
const { initSchema } = require('../db/schema');
const { WorkflowRepository } = require('../db/workflowRepository');
const { IndexService } = require('../services/indexService');
const { SearchService } = require('../services/searchService');
const { StatsService } = require('../services/statsService');
const { WorkflowService } = require('../services/workflowService');
const { CategoryService } = require('../services/categoryService');

function buildContext(settings) {
  initSchema(settings.dbPath);
  const repository = new WorkflowRepository(settings.dbPath);
  const search = new SearchService(repository);
  return {
    settings,
    repository,
    index: new IndexService(settings, repository),
    search,
    stats: new StatsService(repository),
    workflows: new WorkflowService(settings, repository),
    categories: new CategoryService(settings, search),
  };
}

function indexIfEmpty(context) {
  if (!context.settings.autoIndex) return false;
  if (context.repository.count() > 0) return false;
  const stats = context.index.indexAll(false);
  context.workflows.refresh();
  context.stats.invalidate();
  console.log(`Indexed ${stats.processed} workflows (${stats.errors} errors)`);
  return true;
}

module.exports = { buildContext, indexIfEmpty };
