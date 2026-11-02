"""Turn a raw n8n workflow document into catalogue metadata."""

from __future__ import annotations

from pathlib import Path
from typing import Any

from .description import generate_description
from .integrations import analyze_nodes
from .naming import format_workflow_name


def complexity_for(node_count: int) -> str:
    if node_count <= 5:
        return "low"
    if node_count <= 15:
        return "medium"
    return "high"


def analyze_workflow(
    *,
    filename: str,
    data: dict[str, Any],
    file_size: int,
    file_hash: str,
    folder: str = "",
    category: str = "Uncategorized",
) -> dict[str, Any]:
    """Return the database row for one workflow file."""
    nodes = data.get("nodes") or []
    if not isinstance(nodes, list):
        nodes = []

    name = format_workflow_name(filename)
    json_name = str(data.get("name") or "").strip()
    if json_name and json_name != Path(filename).stem and not json_name.startswith("My workflow"):
        name = json_name

    node_count = len(nodes)
    trigger_type, integrations = analyze_nodes(nodes)
    sorted_integrations = sorted(integrations)

    workflow: dict[str, Any] = {
        "filename": filename,
        "name": name,
        "folder": folder,
        "category": category or "Uncategorized",
        "workflow_id": str(data.get("id") or ""),
        "active": bool(data.get("active", False)),
        "nodes": nodes,
        "connections": data.get("connections") or {},
        "tags": data.get("tags") or [],
        "created_at": str(data.get("createdAt") or ""),
        "updated_at": str(data.get("updatedAt") or ""),
        "file_hash": file_hash,
        "file_size": file_size,
        "node_count": node_count,
        "complexity": complexity_for(node_count),
        "trigger_type": trigger_type,
        "integrations": sorted_integrations,
    }
    workflow["description"] = generate_description(workflow)
    return workflow
