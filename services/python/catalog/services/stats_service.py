"""Statistics and integration listing."""

from __future__ import annotations

from ..contracts import IntegrationsResponse, StatsResponse
from ..db.workflow_repository import WorkflowRepository


class StatsService:
    def __init__(self, repository: WorkflowRepository) -> None:
        self.repository = repository
        self._integrations_cache: list[str] | None = None

    def stats(self) -> StatsResponse:
        return StatsResponse(**self.repository.stats())

    def integrations(self) -> IntegrationsResponse:
        if self._integrations_cache is None:
            self._integrations_cache = self.repository.unique_integrations()
        return IntegrationsResponse(
            integrations=self._integrations_cache,
            count=len(self._integrations_cache),
        )

    def invalidate(self) -> None:
        self._integrations_cache = None
