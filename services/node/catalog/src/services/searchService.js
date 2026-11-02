'use strict';

const { searchResponse } = require('../contracts');

class SearchService {
  constructor(repository) {
    this.repository = repository;
  }

  search({ query = '', trigger = 'all', complexity = 'all', category = 'all', activeOnly = false, page = 1, perPage = 20 }) {
    const offset = (page - 1) * perPage;
    const { workflows, total } = this.repository.search(
      query,
      trigger,
      complexity,
      category,
      activeOnly,
      perPage,
      offset
    );
    return searchResponse(workflows, total, page, perPage, query, {
      trigger,
      complexity,
      category,
      active_only: activeOnly,
    });
  }

  searchByCategory(category, page = 1, perPage = 20) {
    const offset = (page - 1) * perPage;
    const { workflows, total } = this.repository.searchByCategory(category, perPage, offset);
    return searchResponse(workflows, total, page, perPage, `category:${category}`, {
      category,
    });
  }
}

module.exports = { SearchService };
