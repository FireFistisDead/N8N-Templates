// Detail modal: metadata, integrations and raw JSON view.
N8N.modalMixin = {
  openWorkflowDetail(workflow) {
    this.currentWorkflow = workflow;
    this.elements.modalTitle.textContent = workflow.name;
    this.elements.modalDescription.textContent = workflow.description;

    const category = this.getWorkflowCategory(workflow);
    this.elements.modalStats.innerHTML = `
      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 1rem;">
        <div><strong>Status:</strong> ${workflow.active ? 'Active' : 'Inactive'}</div>
        <div><strong>Trigger:</strong> ${this.escapeHtml(workflow.trigger_type)}</div>
        <div><strong>Complexity:</strong> ${this.escapeHtml(workflow.complexity)}</div>
        <div><strong>Nodes:</strong> ${Number(workflow.node_count || 0)}</div>
        <div><strong>Category:</strong> ${this.escapeHtml(category)}</div>
      </div>
    `;

    const integrations = Array.isArray(workflow.integrations) ? workflow.integrations : [];
    if (integrations.length > 0) {
      this.elements.modalIntegrations.innerHTML = integrations
        .map((integration) => `<span class="integration-tag">${this.escapeHtml(integration)}</span>`)
        .join(' ');
    } else {
      this.elements.modalIntegrations.textContent = 'No integrations found';
    }

    this.elements.downloadBtn.href = `/api/workflows/${encodeURIComponent(
      workflow.filename
    )}/download`;
    this.elements.downloadBtn.download = workflow.filename;

    this.elements.jsonSection.classList.add('hidden');
    this.elements.diagramSection.classList.add('hidden');
    this.elements.workflowModal.classList.remove('hidden');
  },

  closeModal() {
    this.elements.workflowModal.classList.add('hidden');
    this.currentWorkflow = null;
    this.currentJsonData = null;
    this.currentDiagramData = null;
    this.diagramSvg = null;
    this.diagramZoom = 1;
    this.diagramPan = { x: 0, y: 0 };
    this.isDragging = false;

    this.elements.viewJsonBtn.textContent = 'View JSON';
    this.elements.viewDiagramBtn.textContent = 'View Diagram';

    this.resetCopyButton('copyJsonBtn');
    this.resetCopyButton('copyDiagramBtn');
  },

  async toggleJsonView() {
    if (!this.currentWorkflow) return;

    const isVisible = !this.elements.jsonSection.classList.contains('hidden');
    if (isVisible) {
      this.elements.jsonSection.classList.add('hidden');
      this.elements.viewJsonBtn.textContent = 'View JSON';
      return;
    }

    try {
      this.elements.jsonViewer.textContent = 'Loading...';
      this.elements.jsonSection.classList.remove('hidden');
      this.elements.viewJsonBtn.textContent = 'Hide JSON';

      const data = await this.apiCall(
        `/workflows/${encodeURIComponent(this.currentWorkflow.filename)}`
      );
      const jsonString = JSON.stringify(data.raw_json, null, 2);
      this.currentJsonData = jsonString;
      this.elements.jsonViewer.textContent = jsonString;
    } catch (error) {
      this.elements.jsonViewer.textContent = 'Error loading JSON: ' + error.message;
      this.currentJsonData = null;
    }
  },
};
