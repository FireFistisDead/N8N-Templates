// Mermaid rendering, zoom and pan.
//
// Fixes over the original:
//  * Mermaid 10 removed `mermaid.init`; use `mermaid.run`.
//  * Diagram source is inserted with textContent, not innerHTML.
//  * Document-level pan listeners are registered once (no leak per open).
N8N.diagramMixin = {
  initMermaid() {
    if (typeof mermaid === 'undefined') return;
    mermaid.initialize({
      startOnLoad: false,
      theme: 'base',
      themeVariables: {
        primaryColor: '#2563eb',
        primaryTextColor: '#1e293b',
        primaryBorderColor: '#1d4ed8',
        lineColor: '#64748b',
        secondaryColor: '#f1f5f9',
        tertiaryColor: '#f8fafc',
      },
    });
  },

  async toggleDiagramView() {
    if (!this.currentWorkflow) return;

    const isVisible = !this.elements.diagramSection.classList.contains('hidden');
    if (isVisible) {
      this.elements.diagramSection.classList.add('hidden');
      this.elements.viewDiagramBtn.textContent = 'View Diagram';
      return;
    }

    try {
      this.elements.diagramViewer.textContent = 'Loading diagram...';
      this.elements.diagramSection.classList.remove('hidden');
      this.elements.viewDiagramBtn.textContent = 'Hide Diagram';

      const data = await this.apiCall(
        `/workflows/${encodeURIComponent(this.currentWorkflow.filename)}/diagram`
      );
      this.currentDiagramData = data.diagram;
      await this.renderDiagram(data.diagram);
    } catch (error) {
      this.elements.diagramViewer.textContent = 'Error loading diagram: ' + error.message;
      this.currentDiagramData = null;
    }
  },

  async renderDiagram(source) {
    const pre = document.createElement('pre');
    pre.className = 'mermaid';
    pre.textContent = source;
    this.elements.diagramViewer.replaceChildren(pre);

    if (typeof mermaid === 'undefined') {
      return;
    }

    if (typeof mermaid.run === 'function') {
      await mermaid.run({ nodes: [pre], suppressErrors: true });
    } else {
      // Very old Mermaid fallback.
      mermaid.init(undefined, pre);
    }

    this.diagramSvg = this.elements.diagramViewer.querySelector('svg');
    if (this.diagramSvg) {
      this.diagramSvg.style.maxWidth = 'none';
    }
    this.resetDiagramZoom();
  },

  zoomDiagram(factor) {
    if (!this.diagramSvg) return;
    this.diagramZoom *= factor;
    this.diagramZoom = Math.max(0.1, Math.min(10, this.diagramZoom));
    this.applyDiagramTransform();
  },

  resetDiagramZoom() {
    this.diagramZoom = 1;
    this.diagramPan = { x: 0, y: 0 };
    this.applyDiagramTransform();
  },

  applyDiagramTransform() {
    if (!this.diagramSvg) return;
    const transform = `scale(${this.diagramZoom}) translate(${this.diagramPan.x}px, ${this.diagramPan.y}px)`;
    this.diagramSvg.style.transform = transform;
    this.diagramSvg.style.transformOrigin = 'center center';
  },

  setupDiagramPanning() {
    const container = this.elements.diagramContainer;
    if (!container || container.dataset.panningBound === 'true') return;
    container.dataset.panningBound = 'true';

    container.addEventListener('mousedown', (event) => {
      if (event.button === 0) {
        this.startDragging(event.clientX, event.clientY);
        event.preventDefault();
      }
    });

    document.addEventListener('mousemove', (event) => {
      if (this.isDragging) {
        this.handleDragging(event.clientX, event.clientY);
        event.preventDefault();
      }
    });

    document.addEventListener('mouseup', () => this.stopDragging());

    container.addEventListener(
      'touchstart',
      (event) => {
        if (event.touches.length === 1) {
          const touch = event.touches[0];
          this.startDragging(touch.clientX, touch.clientY);
          event.preventDefault();
        }
      },
      { passive: false }
    );

    document.addEventListener(
      'touchmove',
      (event) => {
        if (this.isDragging && event.touches.length === 1) {
          const touch = event.touches[0];
          this.handleDragging(touch.clientX, touch.clientY);
          event.preventDefault();
        }
      },
      { passive: false }
    );

    document.addEventListener('touchend', () => this.stopDragging());

    container.addEventListener('contextmenu', (event) => event.preventDefault());

    container.addEventListener(
      'wheel',
      (event) => {
        event.preventDefault();
        this.zoomDiagram(event.deltaY > 0 ? 0.9 : 1.1);
      },
      { passive: false }
    );
  },

  startDragging(x, y) {
    this.isDragging = true;
    this.lastMousePos = { x, y };
    this.elements.diagramContainer.classList.add('dragging');
  },

  handleDragging(x, y) {
    if (!this.isDragging) return;

    const deltaX = x - this.lastMousePos.x;
    const deltaY = y - this.lastMousePos.y;

    this.diagramPan.x += deltaX / this.diagramZoom;
    this.diagramPan.y += deltaY / this.diagramZoom;

    this.lastMousePos = { x, y };
    this.applyDiagramTransform();
  },

  stopDragging() {
    this.isDragging = false;
    this.elements.diagramContainer.classList.remove('dragging');
  },
};
