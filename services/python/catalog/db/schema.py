"""Schema creation and migration for the workflow catalogue.

Version 2 fixes the FTS index by making it an external-content table keyed on
``workflows.id`` (the previous schema let SQLite assign unrelated row ids).
"""

from __future__ import annotations

from pathlib import Path

from .connection import open_connection

SCHEMA_VERSION = 3

_TABLE_SQL = """
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
"""

_FTS_SQL = """
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
"""

_INDEX_SQL = """
CREATE INDEX IF NOT EXISTS idx_trigger_type ON workflows(trigger_type);
CREATE INDEX IF NOT EXISTS idx_complexity ON workflows(complexity);
CREATE INDEX IF NOT EXISTS idx_active ON workflows(active);
CREATE INDEX IF NOT EXISTS idx_category ON workflows(category);
CREATE INDEX IF NOT EXISTS idx_node_count ON workflows(node_count);
CREATE INDEX IF NOT EXISTS idx_filename ON workflows(filename);
"""

_TRIGGER_SQL = """
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
"""


def _columns(connection, table: str) -> set[str]:
    return {row[1] for row in connection.execute(f"PRAGMA table_info({table})")}


def _rebuild_fts(connection) -> None:
    connection.executescript(
        """
        DROP TRIGGER IF EXISTS workflows_ai;
        DROP TRIGGER IF EXISTS workflows_ad;
        DROP TRIGGER IF EXISTS workflows_au;
        DROP TABLE IF EXISTS workflows_fts;
        """
    )
    connection.executescript(_FTS_SQL)
    connection.executescript(_TRIGGER_SQL)
    connection.execute("INSERT INTO workflows_fts(workflows_fts) VALUES ('rebuild')")


def init_schema(db_path: Path) -> None:
    """Create the schema and migrate older databases in place."""
    connection = open_connection(db_path)
    try:
        connection.executescript(_TABLE_SQL)
        added_category = "category" not in _columns(connection, "workflows")
        if "folder" not in _columns(connection, "workflows"):
            connection.execute("ALTER TABLE workflows ADD COLUMN folder TEXT DEFAULT ''")
        if added_category:
            connection.execute(
                "ALTER TABLE workflows ADD COLUMN category TEXT DEFAULT 'Uncategorized'"
            )
        connection.executescript(_INDEX_SQL)

        version = connection.execute("PRAGMA user_version").fetchone()[0]
        if version < SCHEMA_VERSION:
            _rebuild_fts(connection)
            if added_category:
                # Force the next index run to re-analyze rows so they pick up
                # their category instead of staying "Uncategorized".
                connection.execute("UPDATE workflows SET file_hash = ''")
            connection.execute(f"PRAGMA user_version = {SCHEMA_VERSION}")
        else:
            connection.executescript(_FTS_SQL)
            connection.executescript(_TRIGGER_SQL)
        connection.commit()
    finally:
        connection.close()
