"""Read-side queries used by the HTTP layer."""

from __future__ import annotations

from typing import Any

from ..contracts import SearchResponse, WorkflowSummary
from ..db.workflow_repository import WorkflowRepository


class SearchService:
    def __init__(self, repository: WorkflowRepository) -> None:
        self.repository = repository

    def search(
        self,
        *,
        query: str = "",
        trigger: str = "all",
        complexity: str = "all",
        category: str = "all",
        active_only: bool = False,
        page: int = 1,
        per_page: int = 20,
    ) -> SearchResponse:
        offset = (page - 1) * per_page
        rows, total = self.repository.search(
            query=query,
            trigger_filter=trigger,
            complexity_filter=complexity,
            category_filter=category,
            active_only=active_only,
            limit=per_page,
            offset=offset,
        )
        return self._response(
            rows,
            total,
            page,
            per_page,
            query,
            {
                "trigger": trigger,
                "complexity": complexity,
                "category": category,
                "active_only": active_only,
            },
        )

    def search_by_category(self, category: str, page: int = 1, per_page: int = 20) -> SearchResponse:
        offset = (page - 1) * per_page
        rows, total = self.repository.search_by_category(category, limit=per_page, offset=offset)
        return self._response(rows, total, page, per_page, f"category:{category}", {"category": category})

    @staticmethod
    def _response(
        rows: list[dict[str, Any]],
        total: int,
        page: int,
        per_page: int,
        query: str,
        filters: dict[str, Any],
    ) -> SearchResponse:
        pages = max(1, (total + per_page - 1) // per_page)
        summaries = [WorkflowSummary(**row) for row in rows]
        return SearchResponse(
            workflows=summaries,
            total=total,
            page=page,
            per_page=per_page,
            pages=pages,
            query=query,
            filters=filters,
        )
