"""Discover workflow files on disk."""

from __future__ import annotations

import os
from dataclasses import dataclass
from pathlib import Path


@dataclass(frozen=True)
class WorkflowFile:
    path: Path
    filename: str
    folder: str


def discover_workflow_files(workflows_dir: Path) -> list[WorkflowFile]:
    """Recursively list ``*.json`` files, deterministically ordered."""
    if not workflows_dir.exists():
        return []

    discovered: list[WorkflowFile] = []
    for path in sorted(workflows_dir.rglob("*.json")):
        if not path.is_file():
            continue
        relative = path.relative_to(workflows_dir)
        folder = relative.parts[0] if len(relative.parts) > 1 else ""
        discovered.append(WorkflowFile(path=path, filename=path.name, folder=folder))
    return discovered


def build_file_index(files: list[WorkflowFile]) -> dict[str, Path]:
    """Map filename -> path. First path wins when names are duplicated."""
    index: dict[str, Path] = {}
    for item in files:
        index.setdefault(item.filename, item.path)
    return index


def is_safe_filename(filename: str) -> bool:
    """Reject path traversal and separators in user-supplied filenames."""
    if not filename or filename in {".", ".."}:
        return False
    return (
        Path(filename).name == filename
        and "/" not in filename
        and "\\" not in filename
        and os.sep not in filename
    )
