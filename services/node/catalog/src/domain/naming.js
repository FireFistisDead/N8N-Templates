'use strict';

const path = require('node:path');

const SPECIAL_TERMS = {
  http: 'HTTP',
  api: 'API',
  webhook: 'Webhook',
  automation: 'Automation',
  automate: 'Automate',
  scheduled: 'Scheduled',
  triggered: 'Triggered',
  manual: 'Manual',
  openai: 'OpenAI',
  github: 'GitHub',
  gitlab: 'GitLab',
  mysql: 'MySQL',
  postgres: 'PostgreSQL',
  postgresql: 'PostgreSQL',
  mongodb: 'MongoDB',
  graphql: 'GraphQL',
  html: 'HTML',
  json: 'JSON',
  xml: 'XML',
  sse: 'SSE',
  n8n: 'n8n',
  url: 'URL',
  pdf: 'PDF',
};

function formatWorkflowName(filename) {
  const stem = path.basename(filename, path.extname(filename));
  let parts = stem.split('_').filter(Boolean);
  if (parts.length > 1 && /^\d+$/.test(parts[0])) parts = parts.slice(1);
  if (!parts.length) return stem;

  return parts
    .map((part) => {
      const lowered = part.toLowerCase();
      if (SPECIAL_TERMS[lowered]) return SPECIAL_TERMS[lowered];
      if (part === part.toUpperCase() && part.length <= 4) return part;
      return part.charAt(0).toUpperCase() + part.slice(1);
    })
    .join(' ');
}

module.exports = { formatWorkflowName };
