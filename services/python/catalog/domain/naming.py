"""Workflow display-name formatting."""

from __future__ import annotations

from pathlib import Path

_SPECIAL_TERMS = {
    "http": "HTTP",
    "api": "API",
    "webhook": "Webhook",
    "automation": "Automation",
    "automate": "Automate",
    "scheduled": "Scheduled",
    "triggered": "Triggered",
    "manual": "Manual",
    "openai": "OpenAI",
    "github": "GitHub",
    "gitlab": "GitLab",
    "mysql": "MySQL",
    "postgres": "PostgreSQL",
    "postgresql": "PostgreSQL",
    "mongodb": "MongoDB",
    "graphql": "GraphQL",
    "html": "HTML",
    "json": "JSON",
    "xml": "XML",
    "sse": "SSE",
    "n8n": "n8n",
    "url": "URL",
    "pdf": "PDF",
}


def format_workflow_name(filename: str) -> str:
    """Turn ``1234_HTTP_Slack_Create_Webhook.json`` into ``HTTP Slack Create Webhook``."""
    stem = Path(filename).stem
    parts = [part for part in stem.split("_") if part]
    if len(parts) > 1 and parts[0].isdigit():
        parts = parts[1:]
    if not parts:
        return stem

    readable = []
    for part in parts:
        lowered = part.lower()
        if lowered in _SPECIAL_TERMS:
            readable.append(_SPECIAL_TERMS[lowered])
        elif part.isupper() and len(part) <= 4:
            readable.append(part)
        else:
            readable.append(part[:1].upper() + part[1:])
    return " ".join(readable)
