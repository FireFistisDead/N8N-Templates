// Application composition: state, event wiring and boot.
class WorkflowApp {
  constructor() {
    this.state = N8N.createInitialState();
    this.elements = N8N.collectElements();

    this.searchDebounceTimer = null;
    this.currentWorkflow = null;
    this.currentJsonData = null;
    this.currentDiagramData = null;
    this.diagramZoom = 1;
    this.diagramSvg = null;
    this.diagramPan = { x: 0, y: 0 };
    this.isDragging = false;
    this.lastMousePos = { x: 0, y: 0 };

    this.init();
  }

  async init() {
    this.setupEventListeners();
    this.setupTheme();
    this.initMermaid();
    this.setupDiagramPanning();
    await this.loadInitialData();
  }

  setupEventListeners() {
    this.elements.searchInput.addEventListener('input', (event) => {
      this.state.searchQuery = event.target.value;
      this.debounceSearch();
    });

    this.elements.triggerFilter.addEventListener('change', (event) => {
      this.state.filters.trigger = event.target.value;
      this.state.currentPage = 1;
      this.resetAndSearch();
    });

    this.elements.complexityFilter.addEventListener('change', (event) => {
      this.state.filters.complexity = event.target.value;
      this.state.currentPage = 1;
      this.resetAndSearch();
    });

    this.elements.categoryFilter.addEventListener('change', (event) => {
      this.state.filters.category = event.target.value;
      this.state.currentPage = 1;
      this.resetAndSearch();
    });

    this.elements.activeOnlyFilter.addEventListener('change', (event) => {
      this.state.filters.activeOnly = event.target.checked;
      this.state.currentPage = 1;
      this.resetAndSearch();
    });

    this.elements.loadMoreBtn.addEventListener('click', () => this.loadMoreWorkflows());
    this.elements.retryBtn.addEventListener('click', () => this.loadInitialData());
    this.elements.themeToggle.addEventListener('click', () => this.toggleTheme());

    this.elements.modalClose.addEventListener('click', () => this.closeModal());
    this.elements.workflowModal.addEventListener('click', (event) => {
      if (event.target === this.elements.workflowModal) this.closeModal();
    });

    this.elements.viewJsonBtn.addEventListener('click', () => this.toggleJsonView());
    this.elements.viewDiagramBtn.addEventListener('click', () => this.toggleDiagramView());

    this.elements.copyJsonBtn.addEventListener('click', () =>
      this.copyToClipboard(this.currentJsonData, 'copyJsonBtn')
    );
    this.elements.copyDiagramBtn.addEventListener('click', () =>
      this.copyToClipboard(this.currentDiagramData, 'copyDiagramBtn')
    );

    this.elements.zoomInBtn.addEventListener('click', () => this.zoomDiagram(1.2));
    this.elements.zoomOutBtn.addEventListener('click', () => this.zoomDiagram(0.8));
    this.elements.zoomResetBtn.addEventListener('click', () => this.resetDiagramZoom());

    document.addEventListener('keydown', (event) => {
      if (event.key === 'Escape') this.closeModal();

      if (this.elements.diagramSection.classList.contains('hidden')) return;
      if (event.key === '+' || event.key === '=') {
        event.preventDefault();
        this.zoomDiagram(1.2);
      } else if (event.key === '-') {
        event.preventDefault();
        this.zoomDiagram(0.8);
      } else if (event.key === '0' && event.ctrlKey) {
        event.preventDefault();
        this.resetDiagramZoom();
      }
    });
  }

  debounceSearch() {
    clearTimeout(this.searchDebounceTimer);
    this.searchDebounceTimer = setTimeout(() => {
      this.state.currentPage = 1;
      this.resetAndSearch();
    }, 300);
  }
}

Object.assign(
  WorkflowApp.prototype,
  N8N.apiMixin,
  N8N.themeMixin,
  N8N.workflowsMixin,
  N8N.renderMixin,
  N8N.modalMixin,
  N8N.diagramMixin
);

document.addEventListener('DOMContentLoaded', () => {
  window.workflowApp = new WorkflowApp();
});
