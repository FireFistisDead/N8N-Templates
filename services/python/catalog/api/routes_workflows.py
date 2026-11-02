"""Workflow read routes."""

from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, Query
from fastapi.responses import FileResponse

from ..contracts import DiagramResponse, SearchResponse, WorkflowDetailResponse
from .dependencies import CatalogContext, get_context

router = APIRouter(prefix="/workflows", tags=["workflows"])


@router.get("", response_model=SearchResponse)
def search_workflows(
    q: str = Query("", description="Search query"),
    trigger: str = Query("all", description="Trigger type filter"),
    complexity: str = Query("all", description="Complexity filter"),
    category: str = Query("all", description="Category filter"),
    active_only: bool = Query(False, description="Only active workflows"),
    page: int = Query(1, ge=1),
    per_page: int = Query(20, ge=1, le=100),
    context: CatalogContext = Depends(get_context),
) -> SearchResponse:
    return context.search.search(
        query=q,
        trigger=trigger,
        complexity=complexity,
        category=category,
        active_only=active_only,
        page=page,
        per_page=per_page,
    )


@router.get("/category/{category}", response_model=SearchResponse)
def search_by_category(
    category: str,
    page: int = Query(1, ge=1),
    per_page: int = Query(20, ge=1, le=100),
    context: CatalogContext = Depends(get_context),
) -> SearchResponse:
    return context.categories.search_by_category(category, page=page, per_page=per_page)


@router.get("/{filename}/download")
def download_workflow(filename: str, context: CatalogContext = Depends(get_context)):
    path = context.workflows.path_for(filename)
    if path is None or not path.exists():
        raise HTTPException(status_code=404, detail=f"Workflow file '{filename}' not found")
    return FileResponse(path, media_type="application/json", filename=filename)


@router.get("/{filename}/diagram", response_model=DiagramResponse)
def workflow_diagram(filename: str, context: CatalogContext = Depends(get_context)) -> DiagramResponse:
    try:
        diagram = context.workflows.diagram(filename)
    except (ValueError, OSError) as exc:
        raise HTTPException(status_code=400, detail=f"Invalid workflow file: {exc}") from exc
    if diagram is None:
        raise HTTPException(status_code=404, detail=f"Workflow file '{filename}' not found")
    return DiagramResponse(diagram=diagram)


@router.get("/{filename}", response_model=WorkflowDetailResponse)
def workflow_detail(filename: str, context: CatalogContext = Depends(get_context)) -> WorkflowDetailResponse:
    try:
        detail = context.workflows.detail(filename)
    except (ValueError, OSError) as exc:
        raise HTTPException(status_code=400, detail=f"Invalid workflow file: {exc}") from exc
    if detail is None:
        raise HTTPException(status_code=404, detail=f"Workflow '{filename}' not found")
    return WorkflowDetailResponse(**detail)
