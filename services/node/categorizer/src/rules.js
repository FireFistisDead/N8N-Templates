'use strict';

/**
 * Ordered filename-keyword rules. The first category whose keyword appears in
 * the filename wins, so keep the ordering identical to the Python worker.
 */
const RULES = [
  ['Technical Infrastructure & DevOps', ['totp', 'bitwarden', 'auth', 'security']],
  [
    'Data Processing & Analysis',
    [
      'process', 'writebinaryfile', 'readbinaryfile', 'extractfromfile',
      'converttofile', 'googlefirebasecloudfirestore', 'supabase',
      'surveymonkey', 'renamekeys', 'readpdf', 'wufoo', 'splitinbatches',
      'airtop', 'comparedatasets', 'spreadsheetfile',
    ],
  ],
  [
    'Business Process Automation',
    [
      'noop', 'code', 'schedule', 'filter', 'splitout', 'wait', 'limit',
      'aggregate', 'acuityscheduling', 'eventbrite', 'philipshue',
      'stickynote', 'n8ntrainingcustomerdatastore', 'n8n',
    ],
  ],
  ['Web Scraping & Data Extraction', ['webhook', 'respondtowebhook', 'http', 'rssfeedread']],
  ['Data Processing & Analysis', ['form', 'typeform', 'jotform']],
  ['Cloud Storage & File Management', ['localfile', 'filemaker']],
  ['Data Processing & Analysis', ['postgres', 'mysql', 'mongodb', 'redis', 'elasticsearch', 'snowflake']],
  [
    'AI Agent Development',
    [
      'openai', 'awstextract', 'awsrekognition', 'humanticai', 'openthesaurus',
      'googletranslate', 'summarize',
    ],
  ],
  ['E-commerce & Retail', ['woocommerce', 'gumroad']],
  ['Social Media Management', ['facebook', 'linkedin', 'instagram']],
  ['Communication & Messaging', ['zendesk', 'intercom', 'drift', 'pagerduty']],
  ['Data Processing & Analysis', ['googleanalytics', 'segment', 'mixpanel']],
  [
    'Technical Infrastructure & DevOps',
    ['git', 'github', 'gitlab', 'travisci', 'jenkins', 'uptimerobot', 'gsuiteadmin', 'debughelper', 'bitbucket'],
  ],
  ['CRM & Sales', ['pipedrive', 'hubspot', 'salesforce', 'copper', 'orbit', 'agilecrm']],
  [
    'Marketing & Advertising Automation',
    ['mailchimp', 'convertkit', 'sendgrid', 'mailerlite', 'lemlist', 'sendy', 'postmark', 'mailgun'],
  ],
  [
    'Project Management',
    ['asana', 'mondaycom', 'clickup', 'trello', 'notion', 'toggl', 'microsofttodo', 'calendly', 'jira'],
  ],
  [
    'Communication & Messaging',
    ['slack', 'telegram', 'discord', 'mattermost', 'twilio', 'emailreadimap', 'teams', 'gotowebinar'],
  ],
  ['Cloud Storage & File Management', ['dropbox', 'googledrive', 'onedrive', 'awss3', 'googledocs']],
  ['Creative Design Automation', ['canva', 'figma', 'bannerbear', 'editimage']],
  ['Creative Content & Video Automation', ['youtube', 'vimeo', 'storyblok', 'strapi']],
  ['Financial & Accounting', ['stripe', 'chargebee', 'quickbooks', 'harvest']],
  ['Web Scraping & Data Extraction', ['openweathermap', 'nasa', 'crypto', 'coingecko']],
];

/** Return the category for one filename, or null when no rule matches. */
function categorize(filename) {
  const lowered = String(filename || '').toLowerCase();
  for (const [category, keywords] of RULES) {
    if (keywords.some((keyword) => lowered.includes(keyword))) return category;
  }
  return null;
}

module.exports = { RULES, categorize };
