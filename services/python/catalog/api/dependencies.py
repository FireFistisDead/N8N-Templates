"""Dependency wiring: build every service once per process."""

from __future__ import annotations

from dataclasses import dataclass

from fastapi import Request

from ..config import Settings
from ..db.schema import init_schema
from ..db.workflow_repository import WorkflowRepository
from ..services.category_service import CategoryService
from ..services.index_service import IndexService
from ..services.search_service import SearchService
from ..services.stats_service import StatsService
from ..services.workflow_service import WorkflowService


@dataclass
class CatalogContext:
    settings: Settings
    repository: WorkflowRepository
    index: IndexService
    search: SearchService
    stats: StatsService
    workflows: WorkflowService
    categories: CategoryService


def build_context(settings: Settings | None = None) -> CatalogContext:
    settings = settings or Settings.from_env()
    init_schema(settings.db_path)

    repository = WorkflowRepository(settings.db_path)
    search = SearchService(repository)
    workflows = WorkflowService(settings, repository)
    categories = CategoryService(settings, search)
    return CatalogContext(
        settings=settings,
        repository=repository,
        index=IndexService(settings, repository),
        search=search,
        stats=StatsService(repository),
        workflows=workflows,
        categories=categories,
    )


def get_context(request: Request) -> CatalogContext:
    return request.app.state.context
