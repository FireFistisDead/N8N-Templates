"""Mermaid flowchart generation for an n8n workflow."""

from __future__ import annotations

from typing import Any


def _safe_label(value: str) -> str:
    return (
        value.replace("\\", " ")
        .replace('"', "'")
        .replace("\n", " ")
        .replace("\r", " ")
        .strip()
    )


def _node_type_label(node_type: str) -> str:
    if "." in node_type:
        return node_type.rsplit(".", 1)[-1]
    return node_type or "unknown"


def generate_mermaid(nodes: list[dict[str, Any]], connections: dict[str, Any]) -> str:
    """Return Mermaid source for the workflow graph."""
    if not nodes:
        return 'graph TD\n  EmptyWorkflow["No nodes found in workflow"]'

    # Every node gets a stable synthetic id; duplicate names cannot collide.
    ids: dict[str, str] = {}
    lines = ["graph TD"]

    for index, node in enumerate(nodes):
        name = str(node.get("name") or f"Node {index}")
        node_id = f"node{index}"
        ids.setdefault(name, node_id)
        node_type = _node_type_label(str(node.get("type") or ""))
        label = f"{_safe_label(name)}<br>({_safe_label(node_type)})"
        lines.append(f'  {node_id}["{label}"]')
        lines.append(f"  style {node_id} {_style_for(node_type)}")

    for source_name, outputs in (connections or {}).items():
        source_id = ids.get(source_name)
        if not source_id or not isinstance(outputs, dict):
            continue
        main = outputs.get("main")
        if not isinstance(main, list):
            continue
        multiple_outputs = len(main) > 1
        for output_index, targets in enumerate(main):
            if not isinstance(targets, list):
                continue
            for connection in targets:
                if not isinstance(connection, dict):
                    continue
                target_id = ids.get(connection.get("node"))
                if not target_id:
                    continue
                if multiple_outputs:
                    lines.append(f"  {source_id} -->|{output_index}| {target_id}")
                else:
                    lines.append(f"  {source_id} --> {target_id}")

    return "\n".join(lines)


def _style_for(node_type: str) -> str:
    lowered = node_type.lower()
    if any(token in lowered for token in ("trigger", "webhook", "cron", "schedule")):
        return "fill:#b3e0ff,stroke:#0066cc"
    if any(token in lowered for token in ("if", "switch", "filter")):
        return "fill:#ffffb3,stroke:#e6e600"
    if any(token in lowered for token in ("function", "code", "set")):
        return "fill:#d9b3ff,stroke:#6600cc"
    if "error" in lowered:
        return "fill:#ffb3b3,stroke:#cc0000"
    return "fill:#d9d9d9,stroke:#666666"
