'use strict';

const path = require('node:path');
const { openConnection } = require('./connection');
const { buildMatchQuery } = require('./ftsQuery');

function jsonList(value) {
  if (Array.isArray(value)) return value;
  try {
    const parsed = JSON.parse(value || '[]');
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function cleanTags(value) {
  return jsonList(value).map((tag) => {
    if (tag && typeof tag === 'object') return String(tag.name ?? tag.id ?? 'tag');
    return String(tag);
  });
}

function rowToWorkflow(row) {
  if (!row) return null;
  return {
    ...row,
    integrations: jsonList(row.integrations).map(String),
    tags: cleanTags(row.tags),
    active: Boolean(row.active),
    folder: row.folder || '',
  };
}

class WorkflowRepository {
  constructor(dbPath) {
    this.dbPath = path.resolve(dbPath);
    this.db = openConnection(this.dbPath);
  }

  close() {
    if (this.db) this.db.close();
  }

  // --------------------------------------------------------------- writes
  upsert(workflow) {
    const sql = `
      INSERT INTO workflows (
        filename, name, folder, workflow_id, active, description,
        trigger_type, complexity, category, node_count, integrations, tags,
        created_at, updated_at, file_hash, file_size, analyzed_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
      ON CONFLICT(filename) DO UPDATE SET
        name = excluded.name,
        folder = excluded.folder,
        workflow_id = excluded.workflow_id,
        active = excluded.active,
        description = excluded.description,
        trigger_type = excluded.trigger_type,
        complexity = excluded.complexity,
        category = excluded.category,
        node_count = excluded.node_count,
        integrations = excluded.integrations,
        tags = excluded.tags,
        created_at = excluded.created_at,
        updated_at = excluded.updated_at,
        file_hash = excluded.file_hash,
        file_size = excluded.file_size,
        analyzed_at = CURRENT_TIMESTAMP
    `;
    this.db.prepare(sql).run(
      workflow.filename,
      workflow.name,
      workflow.folder || '',
      workflow.workflow_id || '',
      workflow.active ? 1 : 0,
      workflow.description || '',
      workflow.trigger_type || 'Manual',
      workflow.complexity || 'low',
      workflow.category || 'Uncategorized',
      Number(workflow.node_count || 0),
      JSON.stringify(workflow.integrations || []),
      JSON.stringify(workflow.tags || []),
      workflow.created_at || '',
      workflow.updated_at || '',
      workflow.file_hash || '',
      Number(workflow.file_size || 0)
    );
  }

  deleteMissing(keep) {
    const rows = this.db.prepare('SELECT filename FROM workflows').all();
    const remove = this.db.prepare('DELETE FROM workflows WHERE filename = ?');
    let removed = 0;
    for (const row of rows) {
      if (!keep.has(row.filename)) {
        remove.run(row.filename);
        removed += 1;
      }
    }
    return removed;
  }

  // ---------------------------------------------------------------- reads
  getFileHash(filename) {
    const row = this.db.prepare('SELECT file_hash FROM workflows WHERE filename = ?').get(filename);
    return row ? row.file_hash : undefined;
  }

  getByFilename(filename) {
    return rowToWorkflow(
      this.db.prepare('SELECT * FROM workflows WHERE filename = ?').get(filename)
    );
  }

  count() {
    return Number(this.db.prepare('SELECT COUNT(*) AS total FROM workflows').get().total);
  }

  search(query = '', trigger = 'all', complexity = 'all', category = 'all', activeOnly = false, limit = 50, offset = 0) {
    const match = buildMatchQuery(query);
    const params = [];
    let from;
    let order;

    if (match) {
      from =
        'FROM workflows_fts JOIN workflows w ON w.id = workflows_fts.rowid ' +
        'WHERE workflows_fts MATCH ?';
      params.push(match);
      order = 'ORDER BY bm25(workflows_fts), w.filename';
    } else {
      from = 'FROM workflows w WHERE 1=1';
      order = 'ORDER BY w.name COLLATE NOCASE, w.filename';
    }

    if (activeOnly) from += ' AND w.active = 1';
    if (trigger && trigger !== 'all') {
      from += ' AND w.trigger_type = ?';
      params.push(trigger);
    }
    if (complexity && complexity !== 'all') {
      from += ' AND w.complexity = ?';
      params.push(complexity);
    }
    if (category && category !== 'all') {
      from += ' AND w.category = ?';
      params.push(category);
    }

    const total = Number(
      this.db.prepare(`SELECT COUNT(*) AS total ${from}`).get(...params).total
    );
    const rows = this.db
      .prepare(`SELECT w.* ${from} ${order} LIMIT ? OFFSET ?`)
      .all(...params, Number(limit), Number(offset));

    return { workflows: rows.map(rowToWorkflow), total };
  }

  searchByCategory(category, limit = 50, offset = 0) {
    const total = Number(
      this.db
        .prepare('SELECT COUNT(*) AS total FROM workflows WHERE category = ?')
        .get(category).total
    );
    const rows = this.db
      .prepare(
        'SELECT * FROM workflows WHERE category = ? ' +
          'ORDER BY name COLLATE NOCASE, filename LIMIT ? OFFSET ?'
      )
      .all(category, Number(limit), Number(offset));

    return { workflows: rows.map(rowToWorkflow), total };
  }

  stats() {
    const total = Number(this.db.prepare('SELECT COUNT(*) AS total FROM workflows').get().total);
    const active = Number(
      this.db.prepare('SELECT COUNT(*) AS active FROM workflows WHERE active = 1').get().active
    );
    const triggers = {};
    for (const row of this.db
      .prepare('SELECT trigger_type, COUNT(*) AS count FROM workflows GROUP BY trigger_type')
      .all()) {
      triggers[String(row.trigger_type)] = Number(row.count);
    }
    const complexity = {};
    for (const row of this.db
      .prepare('SELECT complexity, COUNT(*) AS count FROM workflows GROUP BY complexity')
      .all()) {
      complexity[String(row.complexity)] = Number(row.count);
    }
    const totalNodes = Number(
      this.db.prepare('SELECT COALESCE(SUM(node_count), 0) AS total FROM workflows').get().total
    );
    const last = this.db.prepare('SELECT MAX(analyzed_at) AS last FROM workflows').get();

    const unique = new Set();
    for (const row of this.db.prepare('SELECT integrations FROM workflows').all()) {
      for (const item of jsonList(row.integrations)) unique.add(String(item));
    }

    return {
      total,
      active,
      inactive: total - active,
      triggers,
      complexity,
      total_nodes: totalNodes,
      unique_integrations: unique.size,
      last_indexed: last?.last || '',
    };
  }

  uniqueIntegrations() {
    const unique = new Set();
    for (const row of this.db.prepare('SELECT integrations FROM workflows').all()) {
      for (const item of jsonList(row.integrations)) unique.add(String(item));
    }
    return [...unique].sort();
  }
}

module.exports = { WorkflowRepository, rowToWorkflow };
