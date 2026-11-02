"""Load the curated integration -> category definitions."""

from __future__ import annotations

import json
import re
from pathlib import Path

_NON_ALNUM = re.compile(r"[^a-z0-9]")


def normalize(value: str) -> str:
    return _NON_ALNUM.sub("", value.lower())


def load_definitions(context_dir: Path) -> dict[str, str]:
    """Return a normalised ``integration -> category`` map."""
    path = context_dir / "def_categories.json"
    try:
        with path.open("r", encoding="utf-8") as handle:
            raw = json.load(handle)
    except (FileNotFoundError, json.JSONDecodeError, OSError):
        return {}

    if isinstance(raw, dict):
        return {normalize(str(key)): str(value) for key, value in raw.items() if value}

    definitions: dict[str, str] = {}
    for item in raw if isinstance(raw, list) else []:
        if not isinstance(item, dict):
            continue
        integration = item.get("integration")
        category = item.get("category")
        if integration and category:
            definitions[normalize(str(integration))] = str(category)
    return definitions
