'use strict';

/** Coerce SQLite integers / strings into a real boolean. */
function asBoolean(value) {
  if (typeof value === 'string') {
    return ['1', 'true', 'yes', 'on'].includes(value.trim().toLowerCase());
  }
  return Boolean(value);
}

function workflowSummary(row) {
  return {
    id: row.id ?? null,
    filename: row.filename,
    name: row.name,
    active: asBoolean(row.active),
    description: row.description || '',
    trigger_type: row.trigger_type || 'Manual',
    complexity: row.complexity || 'low',
    category: row.category || 'Uncategorized',
    node_count: Number(row.node_count || 0),
    integrations: Array.isArray(row.integrations) ? row.integrations : [],
    tags: Array.isArray(row.tags) ? row.tags : [],
    folder: row.folder || '',
    created_at: row.created_at ?? null,
    updated_at: row.updated_at ?? null,
  };
}

function searchResponse(workflows, total, page, perPage, query, filters) {
  return {
    workflows: workflows.map(workflowSummary),
    total,
    page,
    per_page: perPage,
    pages: Math.max(1, Math.ceil(total / perPage)),
    query,
    filters,
  };
}

function statsResponse(stats) {
  return {
    total: stats.total,
    active: stats.active,
    inactive: stats.inactive,
    triggers: stats.triggers,
    complexity: stats.complexity,
    total_nodes: stats.total_nodes,
    unique_integrations: stats.unique_integrations,
    last_indexed: stats.last_indexed,
  };
}

module.exports = { asBoolean, workflowSummary, searchResponse, statsResponse };
