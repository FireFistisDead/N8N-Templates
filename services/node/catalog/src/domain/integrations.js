'use strict';

const SPECIAL_CHARS = /[^a-z0-9]/g;

function normalize(value) {
  return String(value || '').toLowerCase().replace(SPECIAL_CHARS, '');
}

// Display names keyed by normalised node suffix (all lower-case, so
// camelCase types such as httpRequest match).
const SERVICE_NAMES = {
  telegram: 'Telegram',
  discord: 'Discord',
  slack: 'Slack',
  whatsapp: 'WhatsApp',
  mattermost: 'Mattermost',
  teams: 'Microsoft Teams',
  microsoftteams: 'Microsoft Teams',
  rocketchat: 'Rocket.Chat',
  twilio: 'Twilio',
  gmail: 'Gmail',
  mailjet: 'Mailjet',
  emailreadimap: 'Email (IMAP)',
  emailsendsmtp: 'Email (SMTP)',
  emailsend: 'Email (SMTP)',
  outlook: 'Outlook',
  microsoftoutlook: 'Outlook',
  googledrive: 'Google Drive',
  googledocs: 'Google Docs',
  googlesheets: 'Google Sheets',
  googleslides: 'Google Slides',
  dropbox: 'Dropbox',
  onedrive: 'OneDrive',
  box: 'Box',
  awss3: 'AWS S3',
  s3: 'AWS S3',
  postgres: 'PostgreSQL',
  postgresql: 'PostgreSQL',
  mysql: 'MySQL',
  mongodb: 'MongoDB',
  redis: 'Redis',
  airtable: 'Airtable',
  notion: 'Notion',
  supabase: 'Supabase',
  snowflake: 'Snowflake',
  elasticsearch: 'Elasticsearch',
  googlebigquery: 'Google BigQuery',
  cratedb: 'CrateDB',
  questdb: 'QuestDB',
  timescaledb: 'TimescaleDB',
  jira: 'Jira',
  github: 'GitHub',
  gitlab: 'GitLab',
  trello: 'Trello',
  asana: 'Asana',
  mondaycom: 'Monday.com',
  clickup: 'ClickUp',
  linear: 'Linear',
  openai: 'OpenAI',
  anthropic: 'Anthropic',
  huggingface: 'Hugging Face',
  googlegemini: 'Google Gemini',
  linkedin: 'LinkedIn',
  twitter: 'Twitter/X',
  facebook: 'Facebook',
  instagram: 'Instagram',
  youtube: 'YouTube',
  shopify: 'Shopify',
  stripe: 'Stripe',
  paypal: 'PayPal',
  woocommerce: 'WooCommerce',
  gumroad: 'Gumroad',
  chargebee: 'Chargebee',
  googleanalytics: 'Google Analytics',
  mixpanel: 'Mixpanel',
  segment: 'Segment',
  googlecalendar: 'Google Calendar',
  googletasks: 'Google Tasks',
  cal: 'Cal.com',
  calendly: 'Calendly',
  typeform: 'Typeform',
  googleforms: 'Google Forms',
  form: 'Form Trigger',
  formtrigger: 'Form Trigger',
  webhook: 'Webhook',
  httprequest: 'HTTP Request',
  http: 'HTTP Request',
  graphql: 'GraphQL',
  sse: 'Server-Sent Events',
  mqtt: 'MQTT',
  kafka: 'Kafka',
  rabbitmq: 'RabbitMQ',
  amqp: 'AMQP',
  ftp: 'FTP',
  hubspot: 'HubSpot',
  salesforce: 'Salesforce',
  pipedrive: 'Pipedrive',
  copper: 'Copper',
  zendesk: 'Zendesk',
  intercom: 'Intercom',
  pagerduty: 'PagerDuty',
  freshdesk: 'Freshdesk',
  mailchimp: 'Mailchimp',
  sendgrid: 'SendGrid',
  mailerlite: 'MailerLite',
  convertkit: 'ConvertKit',
  mailgun: 'Mailgun',
  postmark: 'Postmark',
  filemaker: 'FileMaker',
  googlecloudnaturallanguage: 'Google Cloud Natural Language',
  awstextract: 'AWS Textract',
  awsrekognition: 'AWS Rekognition',
  figma: 'Figma',
  canva: 'Canva',
  bannerbear: 'Bannerbear',
  chainllm: 'LangChain',
  agent: 'LangChain',
  langchain: 'LangChain',
  embeddings: 'LangChain',
  vectorstore: 'LangChain',
};

const UTILITY_NODES = new Set(
  [
    'set', 'function', 'functionitem', 'code', 'if', 'switch', 'merge',
    'split', 'splitout', 'splitinbatches', 'stickynote', 'wait', 'schedule',
    'cron', 'manual', 'stopanderror', 'noop', 'error', 'limit', 'aggregate',
    'summarize', 'filter', 'sort', 'removeduplicates', 'datetime',
    'extractfromfile', 'converttofile', 'readbinaryfile', 'readbinaryfiles',
    'writebinaryfile', 'executiondata', 'executeworkflow', 'executecommand',
    'respondtowebhook', 'comparedatasets', 'htmlextract', 'markdown', 'xml',
    'compression', 'itemlists', 'start', 'n8n', 'n8ntrainingcustomermessenger',
    'n8ntrainingcustomerdatastore', 'debughelper', 'spreadsheetfile',
    'localfile', 'movebinarydata', 'editimage', 'readpdf', 'awssqs',
  ].map(normalize)
);

function candidateSuffixes(nodeType) {
  const type = String(nodeType || '').trim();
  if (!type) return [];
  if (type.startsWith('n8n-nodes-base.')) return [type.slice('n8n-nodes-base.'.length)];
  if (type.startsWith('@n8n/')) return [type.slice(type.lastIndexOf('.') + 1)];
  if (type.includes('.')) return [type.slice(type.lastIndexOf('.') + 1)];
  return [type];
}

function lookup(normalized) {
  if (!normalized) return null;
  if (UTILITY_NODES.has(normalized)) return null;
  if (SERVICE_NAMES[normalized]) return SERVICE_NAMES[normalized];

  for (const suffix of ['trigger', 'tool', 'node']) {
    if (normalized.endsWith(suffix) && normalized.length > suffix.length) {
      const stripped = normalized.slice(0, -suffix.length);
      if (SERVICE_NAMES[stripped]) return SERVICE_NAMES[stripped];
      if (UTILITY_NODES.has(stripped)) return null;
    }
  }
  return null;
}

function extractIntegrations(nodes) {
  const integrations = new Set();
  for (const node of nodes || []) {
    const nodeType = String(node.type || '');
    const nodeName = String(node.name || '');
    const normalizedType = normalize(nodeType);
    let found = null;

    for (const suffix of candidateSuffixes(nodeType)) {
      found = lookup(normalize(suffix));
      if (found) break;
    }

    if (!found) {
      for (const [key, display] of Object.entries(SERVICE_NAMES)) {
        if (key.length >= 4 && (normalizedType.includes(key) || normalize(nodeName).includes(key))) {
          found = display;
          break;
        }
      }
    }

    if (found) integrations.add(found);
  }
  return integrations;
}

function detectTriggerType(nodes) {
  const list = nodes || [];
  let triggerType = 'Manual';

  for (const node of list) {
    const nodeType = String(node.type || '').toLowerCase();
    const nodeName = String(node.name || '').toLowerCase();

    if (nodeType.includes('webhook') || nodeName.includes('webhook')) {
      triggerType = 'Webhook';
    } else if (nodeType.includes('cron') || nodeType.includes('schedule') || nodeType.includes('interval')) {
      triggerType = 'Scheduled';
    } else if (nodeType.includes('trigger') && !nodeType.includes('manual') && triggerType === 'Manual') {
      triggerType = 'Webhook';
    }
  }

  if (list.length > 10 && triggerType === 'Manual') triggerType = 'Complex';
  return triggerType;
}

function analyzeNodes(nodes) {
  const list = nodes || [];
  const integrations = extractIntegrations(list);
  let triggerType = detectTriggerType(list);
  if (list.length > 10 && integrations.size > 3) triggerType = 'Complex';
  return { triggerType, integrations };
}

module.exports = { normalize, SERVICE_NAMES, extractIntegrations, detectTriggerType, analyzeNodes };
