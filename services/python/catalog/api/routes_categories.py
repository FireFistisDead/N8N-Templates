"""Category routes."""

from __future__ import annotations

from fastapi import APIRouter, Depends

from ..contracts import CategoriesResponse, MappingsResponse
from .dependencies import CatalogContext, get_context

router = APIRouter(tags=["categories"])


@router.get("/categories", response_model=CategoriesResponse)
def get_categories(context: CatalogContext = Depends(get_context)) -> CategoriesResponse:
    return context.categories.categories()


@router.get("/category-mappings", response_model=MappingsResponse)
def get_category_mappings(context: CatalogContext = Depends(get_context)) -> MappingsResponse:
    return context.categories.mappings()
