"""Pydantic response contracts shared by every catalog route.

Keeping the shapes here guarantees the Python and Node implementations return
the exact same JSON to the gateway and the web client.
"""

from __future__ import annotations

from typing import Any

from pydantic import BaseModel, ConfigDict, Field, field_validator


class WorkflowSummary(BaseModel):
    model_config = ConfigDict(extra="ignore")

    id: int | None = None
    filename: str
    name: str
    active: bool = False
    description: str = ""
    trigger_type: str = "Manual"
    complexity: str = "low"
    category: str = "Uncategorized"
    node_count: int = 0
    integrations: list[str] = Field(default_factory=list)
    tags: list[str] = Field(default_factory=list)
    folder: str = ""
    created_at: str | None = None
    updated_at: str | None = None

    @field_validator("active", mode="before")
    @classmethod
    def _coerce_active(cls, value: Any) -> bool:
        if isinstance(value, str):
            return value.strip().lower() in {"1", "true", "yes", "on"}
        return bool(value)


class SearchResponse(BaseModel):
    workflows: list[WorkflowSummary] = Field(default_factory=list)
    total: int = 0
    page: int = 1
    per_page: int = 20
    pages: int = 1
    query: str = ""
    filters: dict[str, Any] = Field(default_factory=dict)


class StatsResponse(BaseModel):
    total: int = 0
    active: int = 0
    inactive: int = 0
    triggers: dict[str, int] = Field(default_factory=dict)
    complexity: dict[str, int] = Field(default_factory=dict)
    total_nodes: int = 0
    unique_integrations: int = 0
    last_indexed: str = ""


class WorkflowDetailResponse(BaseModel):
    metadata: WorkflowSummary
    raw_json: dict[str, Any]


class DiagramResponse(BaseModel):
    diagram: str


class IntegrationsResponse(BaseModel):
    integrations: list[str] = Field(default_factory=list)
    count: int = 0


class CategoriesResponse(BaseModel):
    categories: list[str] = Field(default_factory=list)


class MappingsResponse(BaseModel):
    mappings: dict[str, str] = Field(default_factory=dict)


class MessageResponse(BaseModel):
    message: str
