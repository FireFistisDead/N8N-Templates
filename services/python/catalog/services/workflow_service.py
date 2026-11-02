"""Workflow file lookup, raw JSON loading and diagram generation."""

from __future__ import annotations

import json
from pathlib import Path
from typing import Any

from ..config import Settings
from ..db.workflow_repository import WorkflowRepository
from ..domain.diagram import generate_mermaid
from .workflow_files import build_file_index, discover_workflow_files, is_safe_filename


class WorkflowService:
    def __init__(self, settings: Settings, repository: WorkflowRepository) -> None:
        self.settings = settings
        self.repository = repository
        self._index: dict[str, Path] | None = None

    def refresh(self) -> None:
        """Rebuild the filename -> path index after new files are added."""
        files = discover_workflow_files(self.settings.workflows_dir)
        self._index = build_file_index(files)

    def path_for(self, filename: str) -> Path | None:
        if not is_safe_filename(filename):
            return None
        if self._index is None:
            self.refresh()
        return self._index.get(filename) if self._index else None

    def detail(self, filename: str) -> dict[str, Any] | None:
        metadata = self.repository.get_by_filename(filename)
        if metadata is None:
            return None
        path = self.path_for(filename)
        if path is None:
            return None
        with path.open("r", encoding="utf-8") as handle:
            raw_json = json.load(handle)
        return {"metadata": metadata, "raw_json": raw_json}

    def diagram(self, filename: str) -> str | None:
        path = self.path_for(filename)
        if path is None:
            return None
        with path.open("r", encoding="utf-8") as handle:
            data = json.load(handle)
        nodes = data.get("nodes") or []
        connections = data.get("connections") or {}
        return generate_mermaid(nodes, connections)
