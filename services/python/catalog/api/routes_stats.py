"""Statistics routes."""

from __future__ import annotations

from fastapi import APIRouter, Depends

from ..contracts import IntegrationsResponse, StatsResponse
from .dependencies import CatalogContext, get_context

router = APIRouter(tags=["stats"])


@router.get("/stats", response_model=StatsResponse)
def get_stats(context: CatalogContext = Depends(get_context)) -> StatsResponse:
    return context.stats.stats()


@router.get("/integrations", response_model=IntegrationsResponse)
def get_integrations(context: CatalogContext = Depends(get_context)) -> IntegrationsResponse:
    return context.stats.integrations()
