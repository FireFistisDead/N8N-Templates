"""All SQL statements used by the catalog live here."""

from __future__ import annotations

import json
from pathlib import Path
from typing import Any

from .connection import connect
from .fts_query import build_match_query

_TAG_PLACEHOLDER = "tag"


def _json_list(value: Any) -> list[Any]:
    if isinstance(value, list):
        return value
    try:
        parsed = json.loads(value or "[]")
    except (TypeError, ValueError):
        return []
    return parsed if isinstance(parsed, list) else []


def _clean_tags(value: Any) -> list[str]:
    tags: list[str] = []
    for tag in _json_list(value):
        if isinstance(tag, dict):
            tags.append(str(tag.get("name", tag.get("id", _TAG_PLACEHOLDER))))
        else:
            tags.append(str(tag))
    return tags


def row_to_workflow(row) -> dict[str, Any]:
    """Convert a ``sqlite3.Row`` into a plain, JSON-safe workflow dict."""
    workflow = dict(row)
    workflow["integrations"] = [str(item) for item in _json_list(workflow.get("integrations"))]
    workflow["tags"] = _clean_tags(workflow.get("tags"))
    workflow["active"] = bool(workflow.get("active"))
    workflow["folder"] = workflow.get("folder") or ""
    return workflow


class WorkflowRepository:
    """Persistence gateway for workflow metadata and search."""

    def __init__(self, db_path: Path) -> None:
        self.db_path = Path(db_path)

    # ------------------------------------------------------------------ writes
    def upsert(self, workflow: dict[str, Any]) -> None:
        sql = """
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
        """
        params = (
            workflow["filename"],
            workflow["name"],
            workflow.get("folder", ""),
            workflow.get("workflow_id", ""),
            int(bool(workflow.get("active", False))),
            workflow.get("description", ""),
            workflow.get("trigger_type", "Manual"),
            workflow.get("complexity", "low"),
            workflow.get("category", "Uncategorized"),
            int(workflow.get("node_count", 0)),
            json.dumps(workflow.get("integrations", [])),
            json.dumps(workflow.get("tags", [])),
            workflow.get("created_at", ""),
            workflow.get("updated_at", ""),
            workflow.get("file_hash", ""),
            int(workflow.get("file_size", 0)),
        )
        with connect(self.db_path) as connection:
            connection.execute(sql, params)

    def delete_missing(self, keep: set[str]) -> int:
        with connect(self.db_path) as connection:
            existing = [row["filename"] for row in connection.execute("SELECT filename FROM workflows")]
            removed = 0
            for filename in existing:
                if filename not in keep:
                    connection.execute("DELETE FROM workflows WHERE filename = ?", (filename,))
                    removed += 1
        return removed

    # ------------------------------------------------------------------- reads
    def get_file_hash(self, filename: str) -> str | None:
        with connect(self.db_path) as connection:
            row = connection.execute(
                "SELECT file_hash FROM workflows WHERE filename = ?", (filename,)
            ).fetchone()
        return row["file_hash"] if row else None

    def get_by_filename(self, filename: str) -> dict[str, Any] | None:
        with connect(self.db_path) as connection:
            row = connection.execute(
                "SELECT * FROM workflows WHERE filename = ?", (filename,)
            ).fetchone()
        return row_to_workflow(row) if row else None

    def count(self) -> int:
        with connect(self.db_path) as connection:
            return int(connection.execute("SELECT COUNT(*) AS total FROM workflows").fetchone()["total"])

    def search(
        self,
        query: str = "",
        trigger_filter: str = "all",
        complexity_filter: str = "all",
        category_filter: str = "all",
        active_only: bool = False,
        limit: int = 50,
        offset: int = 0,
    ) -> tuple[list[dict[str, Any]], int]:
        match = build_match_query(query)
        params: list[Any] = []

        if match:
            from_clause = (
                "FROM workflows_fts JOIN workflows w ON w.id = workflows_fts.rowid "
                "WHERE workflows_fts MATCH ?"
            )
            params.append(match)
            order_clause = "ORDER BY bm25(workflows_fts), w.filename"
        else:
            from_clause = "FROM workflows w WHERE 1=1"
            order_clause = "ORDER BY w.name COLLATE NOCASE, w.filename"

        if active_only:
            from_clause += " AND w.active = 1"
        if trigger_filter and trigger_filter != "all":
            from_clause += " AND w.trigger_type = ?"
            params.append(trigger_filter)
        if complexity_filter and complexity_filter != "all":
            from_clause += " AND w.complexity = ?"
            params.append(complexity_filter)
        if category_filter and category_filter != "all":
            from_clause += " AND w.category = ?"
            params.append(category_filter)

        with connect(self.db_path) as connection:
            total = int(
                connection.execute(f"SELECT COUNT(*) AS total {from_clause}", params).fetchone()["total"]
            )
            rows = connection.execute(
                f"SELECT w.* {from_clause} {order_clause} LIMIT ? OFFSET ?",
                [*params, int(limit), int(offset)],
            ).fetchall()

        return [row_to_workflow(row) for row in rows], total

    def search_by_category(
        self, category: str, limit: int = 50, offset: int = 0
    ) -> tuple[list[dict[str, Any]], int]:
        """Return workflows whose categorised name matches ``category``."""
        with connect(self.db_path) as connection:
            total = int(
                connection.execute(
                    "SELECT COUNT(*) AS total FROM workflows WHERE category = ?",
                    (category,),
                ).fetchone()["total"]
            )
            rows = connection.execute(
                "SELECT * FROM workflows WHERE category = ? "
                "ORDER BY name COLLATE NOCASE, filename LIMIT ? OFFSET ?",
                (category, int(limit), int(offset)),
            ).fetchall()

        return [row_to_workflow(row) for row in rows], total

    def stats(self) -> dict[str, Any]:
        with connect(self.db_path) as connection:
            total = int(connection.execute("SELECT COUNT(*) AS total FROM workflows").fetchone()["total"])
            active = int(
                connection.execute("SELECT COUNT(*) AS active FROM workflows WHERE active = 1").fetchone()["active"]
            )
            triggers = {
                str(row["trigger_type"]): int(row["count"])
                for row in connection.execute(
                    "SELECT trigger_type, COUNT(*) AS count FROM workflows GROUP BY trigger_type"
                )
            }
            complexity = {
                str(row["complexity"]): int(row["count"])
                for row in connection.execute(
                    "SELECT complexity, COUNT(*) AS count FROM workflows GROUP BY complexity"
                )
            }
            total_nodes = int(
                connection.execute("SELECT COALESCE(SUM(node_count), 0) AS total FROM workflows").fetchone()["total"]
            )
            last_row = connection.execute("SELECT MAX(analyzed_at) AS last FROM workflows").fetchone()
            unique = set()
            for row in connection.execute("SELECT integrations FROM workflows"):
                unique.update(str(item) for item in _json_list(row["integrations"]))

        return {
            "total": total,
            "active": active,
            "inactive": total - active,
            "triggers": triggers,
            "complexity": complexity,
            "total_nodes": total_nodes,
            "unique_integrations": len(unique),
            "last_indexed": (last_row["last"] if last_row and last_row["last"] else ""),
        }

    def unique_integrations(self) -> list[str]:
        unique: set[str] = set()
        with connect(self.db_path) as connection:
            for row in connection.execute("SELECT integrations FROM workflows"):
                unique.update(str(item) for item in _json_list(row["integrations"]))
        return sorted(unique)
