"""Generate ``context/search_categories.json`` and ``unique_categories.json``."""

from __future__ import annotations

import json
from collections import Counter
from pathlib import Path
from typing import Any

from .defs import load_definitions, normalize
from .rules import categorize


def _tokens(filename: str) -> list[str]:
    return [token for token in Path(filename).stem.split("_") if token]


def _match_definition(tokens: list[str], definitions: dict[str, str]) -> str | None:
    for token in tokens:
        normalized = normalize(token)
        if normalized in definitions:
            return definitions[normalized]
    for token in tokens:
        normalized = normalize(token)
        for key, category in definitions.items():
            if normalized and (normalized in key or key in normalized):
                return category
    return None


def _categorize_file(filename: str, definitions: dict[str, str]) -> str:
    tokens = _tokens(filename)
    return _match_definition(tokens, definitions) or (categorize(filename) or "") or "Uncategorized"


def run(workflows_dir: Path, context_dir: Path) -> dict[str, Any]:
    """Categorise every workflow and persist the mapping files."""
    definitions = load_definitions(context_dir)
    files = sorted(path for path in workflows_dir.rglob("*.json") if path.is_file())

    entries = [
        {"filename": path.name, "category": _categorize_file(path.name, definitions)}
        for path in files
    ]
    entries.sort(key=lambda item: item["filename"])

    context_dir.mkdir(parents=True, exist_ok=True)
    (context_dir / "search_categories.json").write_text(
        json.dumps(entries, indent=2, ensure_ascii=False), encoding="utf-8"
    )

    counts = Counter(entry["category"] for entry in entries)
    categories = sorted(category for category in counts if category and category != "Uncategorized")
    if "Uncategorized" not in categories:
        categories.append("Uncategorized")
    (context_dir / "unique_categories.json").write_text(
        json.dumps(categories, indent=2, ensure_ascii=False), encoding="utf-8"
    )

    return {
        "files": len(entries),
        "categories": len(categories),
        "uncategorized": counts.get("Uncategorized", 0),
        "distribution": dict(counts.most_common()),
    }
