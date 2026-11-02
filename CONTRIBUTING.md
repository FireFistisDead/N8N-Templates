# Contributing to n8n Workflow Collection

**By AceIntelligence Systems**

First off, thank you for considering contributing to the n8n Workflow Collection! Your contributions help make this a valuable resource for the automation community.

This document provides guidelines for contributing to the project. Following these guidelines helps maintain consistency and quality across the codebase.

---

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [How Can I Contribute?](#how-can-i-contribute)
- [Adding New Workflows](#adding-new-workflows)
- [Updating Categories](#updating-categories)
- [Development Setup](#development-setup)
- [Pull Request Guidelines](#pull-request-guidelines)
- [Style Guidelines](#style-guidelines)
- [Commit Message Guidelines](#commit-message-guidelines)
- [Reporting Issues](#reporting-issues)
- [Contact](#contact)

---

## Code of Conduct

By participating in this project, you agree to abide by the [Code of Conduct](CODE_OF_CONDUCT.md). We expect all contributors to follow these guidelines to ensure a welcoming and inclusive community.

---

## How Can I Contribute?

### Reporting Bugs

If you find a bug, please [open an issue](#reporting-issues) with a clear description of the problem, steps to reproduce, and any relevant information.

### Suggesting Enhancements

Have an idea for a new feature or improvement? Open an issue to discuss it with the maintainers before implementing.

### Adding Workflows

The most common contribution is adding new n8n workflows to the collection. See [Adding New Workflows](#adding-new-workflows) for details.

### Improving Documentation

Documentation improvements are always welcome! This includes:
- Fixing typos
- Adding missing information
- Improving clarity
- Adding examples

### Code Contributions

You can contribute to the codebase by:
- Fixing bugs
- Adding new features
- Improving performance
- Refactoring code
- Adding tests

---

## Adding New Workflows

### Step 1: Prepare Your Workflow

1. **Export from n8n**: In your n8n instance, export the workflow as a JSON file
2. **Validate**: Ensure the JSON is valid and complete
3. **Test**: Verify the workflow works in a fresh n8n instance

### Step 2: Follow Naming Convention

Use the following naming pattern for workflow files:

```
<id>_<Service>_<Goal>_<Trigger>.json
```

**Examples:**
- `0057_Activecampaign_Create_Triggered.json`
- `1234_HTTP_Slack_Create_Webhook.json`
- `0748_Noop_Telegram_Automation_Scheduled.json`

**Naming Rules:**
- Use **4-digit numeric prefix** (e.g., `0001`, `0002`, etc.)
- Use **PascalCase** for service names (e.g., `ActiveCampaign`, `GoogleSheets`)
- Use **PascalCase** for goals (e.g., `Create`, `Update`, `Send`)
- Use **PascalCase** for triggers (e.g., `Triggered`, `Scheduled`, `Webhook`)
- Separate words with **underscores**

### Step 3: Organize by Integration

Place workflows in subdirectories based on the primary integration:

```
workflows/
├── Activecampaign/
│   └── 0057_Activecampaign_Create_Triggered.json
├── Slack/
│   ├── 0001_Slack_Message_Webhook.json
│   └── 0002_Slack_Channel_Triggered.json
├── Google/
│   ├── 0001_Google_Sheets_Update_Scheduled.json
│   └── 0002_Google_Drive_Upload_Webhook.json
└── ...
```

### Step 4: Add to Collection

1. Place your workflow file in the appropriate directory
2. Run the categorizer to update category mappings:
   ```bash
   ./scripts/categorize-python.sh
   # or
   ./scripts/categorize-node.sh
   ```
3. Reindex the catalog:
   ```bash
   ./scripts/index-workflows.sh python --force
   # or
   ./scripts/index-workflows.sh node --force
   ```
4. Verify the workflow appears in the stats:
   ```bash
   curl http://localhost:8000/api/stats
   ```

### Step 5: Update Documentation

If your workflow demonstrates a unique use case or integration, consider:
- Adding a description in the workflow's metadata
- Updating the README with examples
- Creating a tutorial or guide

---

## Updating Categories

### Category System

The project uses a two-tier categorization system:

1. **Definition-based**: Exact matches against `context/def_categories.json`
2. **Rule-based**: Keyword matching fallback in `services/python/categorizer/rules.py`

### Adding New Integration Mappings

To add a new integration-to-category mapping:

1. Edit `context/def_categories.json`
2. Add a new entry:
   ```json
   {
     "integration": "NewIntegrationName",
     "category": "Category Name"
   }
   ```
3. Regenerate category files:
   ```bash
   ./scripts/categorize-python.sh
   ```
4. Reindex:
   ```bash
   ./scripts/index-workflows.sh python --force
   ```

### Available Categories

Use one of these 16 categories:

1. AI Agent Development
2. Business Process Automation
3. Cloud Storage & File Management
4. Communication & Messaging
5. Creative Content & Video Automation
6. Creative Design Automation
7. CRM & Sales
8. Data Processing & Analysis
9. E-commerce & Retail
10. Financial & Accounting
11. Marketing & Advertising Automation
12. Project Management
13. Social Media Management
14. Technical Infrastructure & DevOps
15. Web Scraping & Data Extraction
16. Uncategorized

---

## Development Setup

### Prerequisites

- **Python 3.10+** (for Python stack)
- **Node.js 22.5+** (for Node stack)
- **Docker & Docker Compose** (optional, for containerized development)
- **Git**

### Clone the Repository

```bash
git clone https://github.com/FireFistisDead/n8n-workflows.git
cd n8n-workflows
```

### Python Stack Setup

```bash
# Install dependencies
pip install -r services/python/requirements.txt

# Run development stack
./scripts/dev-python.sh
```

Access at: http://localhost:8000

### Node Stack Setup

```bash
# Run development stack (dependencies auto-install)
./scripts/dev-node.sh
```

Access at: http://localhost:8001

### Docker Setup

```bash
# Build and run
docker-compose up -d --build
```

Access at:
- Python: http://localhost:8000
- Node: http://localhost:8001

---

## Pull Request Guidelines

### Before Submitting

1. **Fork the repository** and create a feature branch
2. **Test your changes** thoroughly
3. **Update documentation** if needed
4. **Follow style guidelines** (see below)
5. **Write good commit messages** (see below)

### Pull Request Template

Use this template for your PR:

```markdown
## Description

[Clear description of what this PR does]

## Related Issue

[Link to related issue, if any]

## Changes Made

- [ ] Added new workflows
- [ ] Updated categories
- [ ] Fixed bugs
- [ ] Improved documentation
- [ ] Other (describe)

## Testing

[Describe how you tested your changes]

## Screenshots (if applicable)

[Add screenshots if UI changes]

## Checklist

- [ ] Code follows style guidelines
- [ ] All tests pass (if applicable)
- [ ] Documentation updated
- [ ] No breaking changes
```

### Review Process

1. A maintainer will review your PR within 3-5 business days
2. You may be asked to make changes or provide additional information
3. Once approved, your PR will be merged
4. You'll be credited as a contributor!

---

## Style Guidelines

### Code Style

#### Python

- Follow [PEP 8](https://pep8.org/) guidelines
- Use type hints (Python 3.6+)
- Use descriptive variable and function names
- Keep functions short and focused
- Add docstrings to all public functions and classes

#### JavaScript/Node.js

- Use camelCase for variables and functions
- Use PascalCase for classes
- Use UPPER_CASE for constants
- Use descriptive names
- Add JSDoc comments where appropriate

### File Naming

- Use **snake_case** for Python files
- Use **camelCase** for JavaScript files
- Use **kebab-case** for directories
- Use meaningful, descriptive names

### Documentation Style

- Use **Markdown** for all documentation
- Use consistent heading hierarchy
- Use code blocks for code examples
- Use tables for structured data
- Keep sentences clear and concise

---

## Commit Message Guidelines

Use [Conventional Commits](https://www.conventionalcommits.org/) format:

```
type(scope): subject

body

footer
```

### Types

- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting, missing semicolons, etc.)
- `refactor`: Code refactoring (no functional changes)
- `perf`: Performance improvements
- `test`: Adding or updating tests
- `chore`: Maintenance tasks (dependency updates, etc.)
- `revert`: Revert a previous commit

### Examples

```bash
# Adding new workflows
feat(workflows): add ActiveCampaign integration workflows

# Fixing a bug
fix(catalog): fix indexing error for empty workflows

# Documentation update
docs(readme): update quick start guide

# Refactoring
refactor(analyzer): improve integration detection logic

# Chore
chore: update Python dependencies
```

### Subject Line

- Use **imperative mood** ("add" not "added")
- Use **lowercase** (except for proper nouns)
- **No period** at the end
- Keep it **short** (50-72 characters)

### Body

- Explain **what** was changed
- Explain **why** it was changed
- Reference related issues or PRs

### Footer

- Reference issue numbers: `Closes #123` or `Fixes #456`
- Add breaking changes: `BREAKING CHANGE: ...`

---

## Reporting Issues

### Before Reporting

1. **Search existing issues** to avoid duplicates
2. **Check the documentation** for solutions
3. **Test with the latest version**

### Issue Template

Use this template when opening an issue:

```markdown
## Description

[Clear and concise description of the issue]

## Steps to Reproduce

1. [First step]
2. [Second step]
3. [Third step]

## Expected Behavior

[What you expected to happen]

## Actual Behavior

[What actually happened]

## Screenshots/Logs

[Add screenshots or error logs if applicable]

## Environment

- OS: [e.g., Ubuntu 22.04, macOS Ventura]
- Python version: [if applicable]
- Node.js version: [if applicable]
- Docker version: [if applicable]
- Browser: [if applicable]

## Additional Context

[Any other relevant information]
```

### Issue Labels

Issues may be labeled with:
- `bug` - Bug reports
- `enhancement` - Feature requests
- `documentation` - Documentation improvements
- `good first issue` - Beginner-friendly
- `help wanted` - Needs community help
- `question` - Questions and discussions

---

## Contact

### Maintainers

| Name | Role | Email | GitHub |
|------|------|-------|--------|
| OM CHOKSI | Founder & CEO | om@aceinteligence.systems | [@omchoksi](https://github.com/omchoksi) |
| Yash Khare | Co-Founder & CTO | yash@aceinteligence.systems | [@yashkhare](https://github.com/yashkhare) |

### Company

- **Website**: [https://aceinteligence.systems](https://aceinteligence.systems)
- **Email**: contact@aceinteligence.systems
- **Support**: support@aceinteligence.systems

### Community

- **Discussions**: [GitHub Discussions](https://github.com/FireFistisDead/n8n-workflows/discussions)
- **Issues**: [GitHub Issues](https://github.com/FireFistisDead/n8n-workflows/issues)
- **Pull Requests**: [GitHub Pull Requests](https://github.com/FireFistisDead/n8n-workflows/pulls)

---

## Recognition

All contributors will be recognized in the [CONTRIBUTORS.md](CONTRIBUTORS.md) file. Significant contributions may also be highlighted in:
- Release notes
- Project documentation
- Social media posts
- AceIntelligence Systems website

---

## License

By contributing to this project, you agree that your contributions will be licensed under the [MIT License](LICENSE).

---

**Thank you for contributing to the n8n Workflow Collection!**

Your contributions help make this a valuable resource for the automation community.

*Built with love by AceIntelligence Systems*
