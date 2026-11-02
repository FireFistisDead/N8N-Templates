// HTTP access to the catalog API plus small DOM/clipboard helpers.
N8N.apiMixin = {
  async apiCall(endpoint, options = {}) {
    const response = await fetch(`/api${endpoint}`, {
      headers: {
        'Content-Type': 'application/json',
        ...(options.headers || {}),
      },
      ...options,
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    return response.json();
  },

  escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text == null ? '' : String(text);
    return div.innerHTML;
  },

  async copyToClipboard(text, buttonId) {
    if (!text) return;
    try {
      await navigator.clipboard.writeText(text);
      this.showCopySuccess(buttonId);
    } catch (error) {
      this.fallbackCopyToClipboard(text, buttonId);
    }
  },

  fallbackCopyToClipboard(text, buttonId) {
    const textArea = document.createElement('textarea');
    textArea.value = text;
    textArea.style.position = 'fixed';
    textArea.style.left = '-999999px';
    textArea.style.top = '-999999px';
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();

    try {
      document.execCommand('copy');
      this.showCopySuccess(buttonId);
    } catch (error) {
      console.error('Failed to copy text: ', error);
    } finally {
      document.body.removeChild(textArea);
    }
  },

  showCopySuccess(buttonId) {
    const button = document.getElementById(buttonId);
    if (!button) return;

    const originalText = button.innerHTML;
    button.innerHTML = 'Copied!';
    button.classList.add('copied');

    setTimeout(() => {
      button.innerHTML = originalText;
      button.classList.remove('copied');
    }, 2000);
  },

  resetCopyButton(buttonId) {
    const button = document.getElementById(buttonId);
    if (!button) return;
    button.innerHTML = 'Copy';
    button.classList.remove('copied');
  },
};
