'use strict';

const TRIGGER_LEAD = {
  Webhook: 'Webhook-triggered automation that',
  Scheduled: 'Scheduled automation that',
  Complex: 'Complex multi-step automation that',
  Manual: 'Manual workflow that',
};

const PURPOSE_HINTS = [
  ['create', ' to create new records'],
  ['update', ' to update existing data'],
  ['sync', ' to synchronize data'],
  ['notification', ' for notifications and alerts'],
  ['alert', ' for notifications and alerts'],
  ['backup', ' for data backup operations'],
  ['monitor', ' for monitoring and reporting'],
  ['extract', ' to extract and transform data'],
  ['import', ' to import data'],
  ['export', ' to export data'],
];

function generateDescription(workflow) {
  const integrations = [...(workflow.integrations || [])].sort();
  const triggerType = workflow.trigger_type || 'Manual';
  let description = TRIGGER_LEAD[triggerType] || 'Workflow that';

  if (integrations.length) {
    const main = integrations.slice(0, 3);
    if (main.length === 1) description += ` integrates with ${main[0]}`;
    else if (main.length === 2) description += ` connects ${main[0]} and ${main[1]}`;
    else description += ` orchestrates ${main.slice(0, -1).join(', ')}, and ${main[main.length - 1]}`;
  }

  const name = String(workflow.name || '').toLowerCase();
  const hint = PURPOSE_HINTS.find(([needle]) => name.includes(needle));
  description += hint ? hint[1] : ' for data processing';

  description += `. Uses ${workflow.node_count || 0} nodes`;
  if (integrations.length > 3) description += ` and integrates with ${integrations.length} services`;
  return `${description}.`;
}

module.exports = { generateDescription };
