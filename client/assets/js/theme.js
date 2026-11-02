// Light/dark theme persistence.
N8N.themeMixin = {
  setupTheme() {
    const savedTheme = localStorage.getItem('theme') || 'dark';
    this.setTheme(savedTheme);
  },

  setTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
    this.updateThemeToggle(theme);
  },

  updateThemeToggle(theme) {
    this.elements.themeOptions.forEach((button) => {
      const isActive = button.dataset.themeOption === theme;
      button.classList.toggle('active', isActive);
      button.setAttribute('aria-pressed', String(isActive));
    });
  },
};
