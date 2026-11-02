"""Human-readable workflow descriptions."""

from __future__ import annotations

from typing import Any

_TRIGGER_LEAD = {
    "Webhook": "Webhook-triggered automation that",
    "Scheduled": "Scheduled automation that",
    "Complex": "Complex multi-step automation that",
    "Manual": "Manual workflow that",
}

_PURPOSE_HINTS = (
    ("create", " to create new records"),
    ("update", " to update existing data"),
    ("sync", " to synchronize data"),
    ("notification", " for notifications and alerts"),
    ("alert", " for notifications and alerts"),
    ("backup", " for data backup operations"),
    ("monitor", " for monitoring and reporting"),
    ("extract", " to extract and transform data"),
    ("import", " to import data"),
    ("export", " to export data"),
)


def generate_description(workflow: dict[str, Any]) -> str:
    integrations = sorted(workflow.get("integrations") or [])
    trigger_type = workflow.get("trigger_type", "Manual")
    description = _TRIGGER_LEAD.get(trigger_type, "Workflow that")

    if integrations:
        main = integrations[:3]
        if len(main) == 1:
            description += f" integrates with {main[0]}"
        elif len(main) == 2:
            description += f" connects {main[0]} and {main[1]}"
        else:
            description += f" orchestrates {', '.join(main[:-1])}, and {main[-1]}"

    name_lower = str(workflow.get("name", "")).lower()
    for needle, suffix in _PURPOSE_HINTS:
        if needle in name_lower:
            description += suffix
            break
    else:
        description += " for data processing"

    description += f". Uses {workflow.get('node_count', 0)} nodes"
    if len(integrations) > 3:
        description += f" and integrates with {len(integrations)} services"
    return description + "."
