"""Index workflow JSON files into SQLite."""

from __future__ import annotations

import hashlib
import json
from pathlib import Path
from typing import Any

from ..config import Settings
from ..db.workflow_repository import WorkflowRepository
from ..domain.analyzer import analyze_workflow
from ..domain.categories import load_mappings
from .workflow_files import discover_workflow_files


def _md5(path: Path) -> str:
    digest = hashlib.md5()
    with path.open("rb") as handle:
        for chunk in iter(lambda: handle.read(65536), b""):
            digest.update(chunk)
    return digest.hexdigest()


class IndexService:
    """Keeps the database in sync with the workflows directory."""

    def __init__(self, settings: Settings, repository: WorkflowRepository) -> None:
        self.settings = settings
        self.repository = repository

    def index_all(self, force: bool = False, prune: bool = True) -> dict[str, Any]:
        files = discover_workflow_files(self.settings.workflows_dir)
        categories = load_mappings(self.settings.context_dir)
        stats: dict[str, Any] = {
            "processed": 0,
            "skipped": 0,
            "errors": 0,
            "duplicates": 0,
            "removed": 0,
            "total": len(files),
        }
        if not files:
            return stats

        keep: set[str] = set()
        for item in files:
            if item.filename in keep:
                stats["duplicates"] += 1
                continue
            keep.add(item.filename)

            try:
                file_hash = _md5(item.path)
                if not force and self.repository.get_file_hash(item.filename) == file_hash:
                    stats["skipped"] += 1
                    continue

                with item.path.open("r", encoding="utf-8") as handle:
                    data = json.load(handle)
                if not isinstance(data, dict):
                    stats["errors"] += 1
                    continue

                workflow = analyze_workflow(
                    filename=item.filename,
                    data=data,
                    file_size=item.path.stat().st_size,
                    file_hash=file_hash,
                    folder=item.folder,
                    category=categories.get(item.filename, "Uncategorized"),
                )
                self.repository.upsert(workflow)
                stats["processed"] += 1
            except (OSError, json.JSONDecodeError, UnicodeDecodeError):
                stats["errors"] += 1

        if prune:
            stats["removed"] = self.repository.delete_missing(keep)
        return stats
