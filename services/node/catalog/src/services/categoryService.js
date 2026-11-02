'use strict';

const { loadMappings, loadUniqueCategories } = require('../domain/categories');

class CategoryService {
  constructor(settings, search) {
    this.settings = settings;
    this.search = search;
  }

  categories() {
    return { categories: loadUniqueCategories(this.settings.contextDir) };
  }

  mappings() {
    return { mappings: loadMappings(this.settings.contextDir) };
  }

  searchByCategory(category, page = 1, perPage = 20) {
    return this.search.searchByCategory(category, page, perPage);
  }
}

module.exports = { CategoryService };
