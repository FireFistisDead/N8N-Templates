// Rendering: stats, result counts, workflow cards and empty/error states.
N8N.renderMixin = {
  updateUI() {
    this.updateResultsCount();
    this.renderWorkflows();
    this.updateLoadMoreButton();

    if (this.state.workflows.length === 0) {
      this.showState('no-results');
    } else {
      this.showState('content');
    }
  },

  updateStatsDisplay(stats) {
    this.elements.totalCount.textContent = Number(stats.total || 0).toLocaleString();
    this.elements.activeCount.textContent = Number(stats.active || 0).toLocaleString();
    this.elements.nodeCount.textContent = Number(stats.total_nodes || 0).toLocaleString();
    this.elements.integrationCount.textContent = Number(
      stats.unique_integrations || 0
    ).toLocaleString();
  },

  updateResultsCount() {
    const count = this.state.totalCount;
    const query = this.state.searchQuery;
    const category = this.state.filters.category;

    let text = `${count.toLocaleString()} workflows`;
    if (query && category !== 'all') {
      text += ` found for "${query}" in "${category}"`;
    } else if (query) {
      text += ` found for "${query}"`;
    } else if (category !== 'all') {
      text += ` in "${category}"`;
    }

    this.elements.resultsCount.textContent = text;
  },

  renderWorkflows() {
    const html = this.state.workflows.map((workflow) => this.createWorkflowCard(workflow)).join('');
    this.elements.workflowGrid.innerHTML = html;

    this.elements.workflowGrid.querySelectorAll('.workflow-card').forEach((card, index) => {
      card.addEventListener('click', () => {
        this.openWorkflowDetail(this.state.workflows[index]);
      });
    });
  },

  createWorkflowCard(workflow) {
    const integrations = Array.isArray(workflow.integrations) ? workflow.integrations : [];
    const statusClass = workflow.active ? 'status-active' : 'status-inactive';
    const complexityClass = `complexity-${workflow.complexity}`;
    const category = this.getWorkflowCategory(workflow);

    const integrationTags = integrations
      .slice(0, 5)
      .map(
        (integration) =>
          `<span class="integration-tag">${this.escapeHtml(integration)}</span>`
      )
      .join('');

    const moreIntegrations =
      integrations.length > 5
        ? `<span class="integration-tag">+${integrations.length - 5}</span>`
        : '';

    return `
      <div class="workflow-card" data-filename="${this.escapeHtml(workflow.filename)}">
        <div class="workflow-header">
          <div class="workflow-meta">
            <div class="status-dot ${statusClass}"></div>
            <div class="complexity-dot ${complexityClass}"></div>
            <span>${workflow.node_count} nodes</span>
            <span class="category-badge">${this.escapeHtml(category)}</span>
          </div>
          <span class="trigger-badge">${this.escapeHtml(workflow.trigger_type)}</span>
        </div>

        <h3 class="workflow-title">${this.escapeHtml(workflow.name)}</h3>
        <p class="workflow-description">${this.escapeHtml(workflow.description)}</p>

        ${
          integrations.length > 0
            ? `
          <div class="workflow-integrations">
            <h4 class="integrations-title">Integrations (${integrations.length})</h4>
            <div class="integrations-list">${integrationTags}${moreIntegrations}</div>
          </div>
        `
            : ''
        }
      </div>
    `;
  },

  updateLoadMoreButton() {
    const hasMore = this.state.currentPage < this.state.totalPages;
    if (hasMore && this.state.workflows.length > 0) {
      this.elements.loadMoreContainer.classList.remove('hidden');
    } else {
      this.elements.loadMoreContainer.classList.add('hidden');
    }
  },

  showState(state) {
    this.elements.loadingState.classList.add('hidden');
    this.elements.errorState.classList.add('hidden');
    this.elements.noResultsState.classList.add('hidden');
    this.elements.workflowGrid.classList.add('hidden');

    switch (state) {
      case 'loading':
        this.elements.loadingState.classList.remove('hidden');
        break;
      case 'error':
        this.elements.errorState.classList.remove('hidden');
        break;
      case 'no-results':
        this.elements.noResultsState.classList.remove('hidden');
        break;
      case 'content':
        this.elements.workflowGrid.classList.remove('hidden');
        break;
      default:
        break;
    }
  },

  showError(message) {
    this.elements.errorMessage.textContent = message;
    this.showState('error');
  },
};
