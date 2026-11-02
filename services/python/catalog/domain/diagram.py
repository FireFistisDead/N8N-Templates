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
    """Return Mermaid source for the workflow graph, styled like the n8n canvas."""
    if not nodes:
        return 'graph LR\n  EmptyWorkflow("No nodes found in workflow")'

    # Every node gets a stable synthetic id; duplicate names cannot collide.
    ids: dict[str, str] = {}
    lines = ["graph LR"]

    for index, node in enumerate(nodes):
        name = str(node.get("name") or f"Node {index}")
        node_id = f"node{index}"
        ids.setdefault(name, node_id)
        node_type = _node_type_label(str(node.get("type") or ""))
        label = f"{_safe_label(name)}<br>({_safe_label(node_type)})"
        lines.append(f'  {node_id}("{label}")')
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
    """n8n-canvas-like palette: colored by node category, white/dark text for contrast."""
    lowered = node_type.lower()
    if any(token in lowered for token in ("trigger", "webhook", "cron", "schedule")):
        return "fill:#2BD17E,stroke:#17A860,stroke-width:2px,color:#05211A"
    if any(token in lowered for token in ("if", "switch", "filter")):
        return "fill:#FFB454,stroke:#C97E1F,stroke-width:2px,color:#2B1C00"
    if any(token in lowered for token in ("function", "code", "set", "langchain", "agent")):
        return "fill:#B98EFF,stroke:#7C4FDB,stroke-width:2px,color:#1A0B33"
    if any(token in lowered for token in ("http", "request")):
        return "fill:#FF9F5C,stroke:#CC6B22,stroke-width:2px,color:#2B1500"
    if "error" in lowered:
        return "fill:#FF5C5C,stroke:#CC2E2E,stroke-width:2px,color:#2B0000"
    return "fill:#1B232D,stroke:#3B4A5A,stroke-width:2px,color:#E6EDF3"
