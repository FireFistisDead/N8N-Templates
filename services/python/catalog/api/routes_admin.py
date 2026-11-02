"""Administrative routes (reindexing)."""

from __future__ import annotations

import logging

from fastapi import APIRouter, BackgroundTasks, Depends, Query

from ..contracts import MessageResponse
from .dependencies import CatalogContext, get_context

logger = logging.getLogger(__name__)
router = APIRouter(tags=["admin"])


@router.post("/reindex", response_model=MessageResponse)
def reindex_workflows(
    background_tasks: BackgroundTasks,
    force: bool = Query(False, description="Re-analyze unchanged files too"),
    context: CatalogContext = Depends(get_context),
) -> MessageResponse:
    def run() -> None:
        stats = context.index.index_all(force=force)
        context.workflows.refresh()
        context.stats.invalidate()
        logger.info("Reindex complete: %s", stats)

    background_tasks.add_task(run)
    return MessageResponse(message="Reindexing started in background")
