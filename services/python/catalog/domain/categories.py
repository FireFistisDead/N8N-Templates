"""Context-file loading for workflow categories."""

from __future__ import annotations

import json
from pathlib import Path
from typing import Any


def _read_json(path: Path) -> Any:
    try:
        with path.open("r", encoding="utf-8") as handle:
            return json.load(handle)
    except (FileNotFoundError, json.JSONDecodeError, OSError):
        return None


def load_unique_categories(context_dir: Path) -> list[str]:
    """Load the categoriser output, falling back to the raw mappings."""
    data = _read_json(context_dir / "unique_categories.json")
    if isinstance(data, list) and data:
        return sorted({str(item) for item in data if item})

    mappings = load_mappings(context_dir)
    categories = {value for value in mappings.values() if value}
    categories.add("Uncategorized")
    return sorted(categories)


def load_mappings(context_dir: Path) -> dict[str, str]:
    """Return ``filename -> category`` from the categoriser output."""
    data = _read_json(context_dir / "search_categories.json")
    if not isinstance(data, list):
        return {}
    mappings: dict[str, str] = {}
    for item in data:
        if not isinstance(item, dict):
            continue
        filename = item.get("filename")
        if filename:
            mappings[str(filename)] = str(item.get("category") or "Uncategorized")
    return mappings
