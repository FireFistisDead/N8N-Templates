// Data loading: stats, categories and paginated workflow search.
//
// Category filtering happens server-side via the `category` query parameter.
// The previous implementation downloaded every workflow (7+ requests) and
// filtered in the browser; that is gone.
N8N.workflowsMixin = {
  async loadInitialData() {
    this.showState('loading');
    try {
      await this.loadCategories();
      this.populateCategoryFilter();

      const [stats] = await Promise.all([this.apiCall('/stats'), this.loadWorkflows(true)]);
      this.updateStatsDisplay(stats);
    } catch (error) {
      console.error('Error during initial data loading:', error);
      this.showError('Failed to load data: ' + error.message);
    }
  },

  async loadCategories() {
    try {
      const [categoriesResponse, mappingsResponse] = await Promise.all([
        this.apiCall('/categories'),
        this.apiCall('/category-mappings'),
      ]);

      this.state.categories = categoriesResponse.categories || ['Uncategorized'];

      const categoryMap = new Map();
      Object.entries(mappingsResponse.mappings || {}).forEach(([filename, category]) => {
        categoryMap.set(filename, category || 'Uncategorized');
      });
      this.state.categoryMap = categoryMap;

      return { categories: this.state.categories, mappings: mappingsResponse.mappings || {} };
    } catch (error) {
      console.error('Failed to load categories from API:', error);
      this.state.categories = ['Uncategorized'];
      this.state.categoryMap = new Map();
      return { categories: this.state.categories, mappings: {} };
    }
  },

  populateCategoryFilter() {
    const select = this.elements.categoryFilter;
    if (!select) return;

    while (select.children.length > 1) {
      select.removeChild(select.lastChild);
    }

    this.state.categories.forEach((category) => {
      const option = document.createElement('option');
      option.value = category;
      option.textContent = category;
      select.appendChild(option);
    });
  },

  async loadWorkflows(reset = false) {
    if (reset) {
      this.state.currentPage = 1;
      this.state.workflows = [];
    }

    this.state.isLoading = true;
    try {
      const params = new URLSearchParams({
        q: this.state.searchQuery,
        trigger: this.state.filters.trigger,
        complexity: this.state.filters.complexity,
        category: this.state.filters.category,
        active_only: this.state.filters.activeOnly,
        page: this.state.currentPage,
        per_page: this.state.perPage,
      });

      const response = await this.apiCall(`/workflows?${params}`);
      const batch = response.workflows || [];

      if (reset) {
        this.state.workflows = batch;
      } else {
        this.state.workflows.push(...batch);
      }

      this.state.totalCount = response.total;
      this.state.totalPages = response.pages;
      this.updateUI();
    } catch (error) {
      this.showError('Failed to load workflows: ' + error.message);
    } finally {
      this.state.isLoading = false;
    }
  },

  async loadMoreWorkflows() {
    if (this.state.currentPage >= this.state.totalPages) return;
    this.state.currentPage += 1;
    await this.loadWorkflows(false);
  },

  resetAndSearch() {
    this.loadWorkflows(true);
  },

  /** Workflows carry their category; the map is a fallback for old payloads. */
  getWorkflowCategory(workflow) {
    if (workflow && typeof workflow === 'object' && workflow.category) {
      return workflow.category;
    }
    const filename = typeof workflow === 'string' ? workflow : workflow && workflow.filename;
    const category = filename ? this.state.categoryMap.get(filename) : '';
    return category && category.trim() ? category : 'Uncategorized';
  },
};
