'use strict';

const path = require('node:path');
const { analyzeNodes } = require('./integrations');
const { generateDescription } = require('./description');
const { formatWorkflowName } = require('./naming');

function complexityFor(nodeCount) {
  if (nodeCount <= 5) return 'low';
  if (nodeCount <= 15) return 'medium';
  return 'high';
}

function analyzeWorkflow({ filename, data, fileSize, fileHash, folder = '', category = 'Uncategorized' }) {
  const nodes = Array.isArray(data.nodes) ? data.nodes : [];
  let name = formatWorkflowName(filename);

  const jsonName = String(data.name || '').trim();
  if (jsonName && jsonName !== path.basename(filename, '.json') && !jsonName.startsWith('My workflow')) {
    name = jsonName;
  }

  const nodeCount = nodes.length;
  const { triggerType, integrations } = analyzeNodes(nodes);
  const sortedIntegrations = [...integrations].sort();

  const workflow = {
    filename,
    name,
    folder,
    category: category || 'Uncategorized',
    workflow_id: String(data.id || ''),
    active: Boolean(data.active),
    nodes,
    connections: data.connections || {},
    tags: Array.isArray(data.tags) ? data.tags : [],
    created_at: String(data.createdAt || ''),
    updated_at: String(data.updatedAt || ''),
    file_hash: fileHash,
    file_size: fileSize,
    node_count: nodeCount,
    complexity: complexityFor(nodeCount),
    trigger_type: triggerType,
    integrations: sortedIntegrations,
  };
  workflow.description = generateDescription(workflow);
  return workflow;
}

module.exports = { complexityFor, analyzeWorkflow };
