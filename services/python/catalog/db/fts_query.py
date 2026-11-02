"""Turn free-text user input into a safe FTS5 MATCH expression.

Raw input must never be handed to ``MATCH``: characters such as ``"``, ``-``,
``:`` and bare operators raise ``sqlite3.OperationalError`` and produced 500s.
"""

from __future__ import annotations

import re

_TOKEN = re.compile(r"[A-Za-z0-9_]+")
_QUOTED = re.compile(r'"([^"]*)"')


def build_match_query(raw: str | None) -> str | None:
    """Return an AND-joined FTS5 query with prefix matching, or ``None``."""
    if not raw or not raw.strip():
        return None

    parts: list[str] = []

    for phrase in _QUOTED.findall(raw):
        tokens = _TOKEN.findall(phrase)
        if tokens:
            parts.append('"' + " ".join(tokens) + '"')

    without_phrases = _QUOTED.sub(" ", raw)
    for token in _TOKEN.findall(without_phrases):
        if len(token) >= 2:
            parts.append(f"{token}*")
        else:
            parts.append(token)

    return " AND ".join(parts) if parts else None
