// Light/dark theme persistence.
N8N.themeMixin = {
  setupTheme() {
    const savedTheme = localStorage.getItem('theme') || 'light';
    document.documentElement.setAttribute('data-theme', savedTheme);
    this.updateThemeToggle(savedTheme);
  },

  toggleTheme() {
    const currentTheme = document.documentElement.getAttribute('data-theme');
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', newTheme);
    localStorage.setItem('theme', newTheme);
    this.updateThemeToggle(newTheme);
  },

  updateThemeToggle(theme) {
    this.elements.themeToggle.textContent = theme === 'dark' ? 'Light Mode' : 'Dark Mode';
  },
};
