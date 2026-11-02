'use strict';

const { openConnection } = require('./connection');

const SCHEMA_VERSION = 3;

const TABLE_SQL = `
CREATE TABLE IF NOT EXISTS workflows (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    filename TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    folder TEXT DEFAULT '',
    workflow_id TEXT,
    active BOOLEAN DEFAULT 0,
    description TEXT,
    trigger_type TEXT,
    complexity TEXT,
    category TEXT DEFAULT 'Uncategorized',
    node_count INTEGER DEFAULT 0,
    integrations TEXT,
    tags TEXT,
    created_at TEXT,
    updated_at TEXT,
    file_hash TEXT,
    file_size INTEGER,
    analyzed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
`;

const FTS_SQL = `
CREATE VIRTUAL TABLE IF NOT EXISTS workflows_fts USING fts5(
    filename,
    name,
    description,
    integrations,
    tags,
    content='workflows',
    content_rowid='id',
    tokenize='unicode61'
);
`;

const INDEX_SQL = `
CREATE INDEX IF NOT EXISTS idx_trigger_type ON workflows(trigger_type);
CREATE INDEX IF NOT EXISTS idx_complexity ON workflows(complexity);
CREATE INDEX IF NOT EXISTS idx_active ON workflows(active);
CREATE INDEX IF NOT EXISTS idx_category ON workflows(category);
CREATE INDEX IF NOT EXISTS idx_node_count ON workflows(node_count);
CREATE INDEX IF NOT EXISTS idx_filename ON workflows(filename);
`;

const TRIGGER_SQL = `
CREATE TRIGGER IF NOT EXISTS workflows_ai AFTER INSERT ON workflows BEGIN
    INSERT INTO workflows_fts(rowid, filename, name, description, integrations, tags)
    VALUES (new.id, new.filename, new.name, new.description, new.integrations, new.tags);
END;

CREATE TRIGGER IF NOT EXISTS workflows_ad AFTER DELETE ON workflows BEGIN
    INSERT INTO workflows_fts(workflows_fts, rowid, filename, name, description, integrations, tags)
    VALUES ('delete', old.id, old.filename, old.name, old.description, old.integrations, old.tags);
END;

CREATE TRIGGER IF NOT EXISTS workflows_au AFTER UPDATE ON workflows BEGIN
    INSERT INTO workflows_fts(workflows_fts, rowid, filename, name, description, integrations, tags)
    VALUES ('delete', old.id, old.filename, old.name, old.description, old.integrations, old.tags);
    INSERT INTO workflows_fts(rowid, filename, name, description, integrations, tags)
    VALUES (new.id, new.filename, new.name, new.description, new.integrations, new.tags);
END;
`;

function columns(db, table) {
  return new Set(db.prepare(`PRAGMA table_info(${table})`).all().map((row) => row.name));
}

function rebuildFts(db) {
  db.exec(`
    DROP TRIGGER IF EXISTS workflows_ai;
    DROP TRIGGER IF EXISTS workflows_ad;
    DROP TRIGGER IF EXISTS workflows_au;
    DROP TABLE IF EXISTS workflows_fts;
  `);
  db.exec(FTS_SQL);
  db.exec(TRIGGER_SQL);
  db.exec("INSERT INTO workflows_fts(workflows_fts) VALUES ('rebuild')");
}

function initSchema(dbPath) {
  const db = openConnection(dbPath);
  try {
    db.exec(TABLE_SQL);
    const existingColumns = columns(db, 'workflows');
    const addedCategory = !existingColumns.has('category');
    if (!existingColumns.has('folder')) {
      db.exec("ALTER TABLE workflows ADD COLUMN folder TEXT DEFAULT ''");
    }
    if (addedCategory) {
      db.exec("ALTER TABLE workflows ADD COLUMN category TEXT DEFAULT 'Uncategorized'");
    }
    db.exec(INDEX_SQL);

    const version = db.prepare('PRAGMA user_version').get().user_version;
    if (version < SCHEMA_VERSION) {
      rebuildFts(db);
      if (addedCategory) {
        // Force the next index run to re-analyze rows so they pick up their
        // category instead of staying "Uncategorized".
        db.exec("UPDATE workflows SET file_hash = ''");
      }
      db.exec(`PRAGMA user_version = ${SCHEMA_VERSION}`);
    } else {
      db.exec(FTS_SQL);
      db.exec(TRIGGER_SQL);
    }
  } finally {
    db.close();
  }
}

module.exports = { initSchema, SCHEMA_VERSION };
