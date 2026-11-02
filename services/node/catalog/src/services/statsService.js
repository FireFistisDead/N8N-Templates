'use strict';

const { statsResponse } = require('../contracts');

class StatsService {
  constructor(repository) {
    this.repository = repository;
    this.integrationsCache = null;
  }

  stats() {
    return statsResponse(this.repository.stats());
  }

  integrations() {
    if (!this.integrationsCache) {
      this.integrationsCache = this.repository.uniqueIntegrations();
    }
    return { integrations: this.integrationsCache, count: this.integrationsCache.length };
  }

  invalidate() {
    this.integrationsCache = null;
  }
}

module.exports = { StatsService };
