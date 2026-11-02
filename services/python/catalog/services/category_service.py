"""Category listing and category-based search."""

from __future__ import annotations

from ..config import Settings
from ..contracts import CategoriesResponse, MappingsResponse
from ..domain.categories import load_mappings, load_unique_categories
from .search_service import SearchService


class CategoryService:
    def __init__(self, settings: Settings, search: SearchService) -> None:
        self.settings = settings
        self.search = search

    def categories(self) -> CategoriesResponse:
        return CategoriesResponse(categories=load_unique_categories(self.settings.context_dir))

    def mappings(self) -> MappingsResponse:
        return MappingsResponse(mappings=load_mappings(self.settings.context_dir))

    def search_by_category(self, category: str, page: int = 1, per_page: int = 20):
        return self.search.search_by_category(category, page=page, per_page=per_page)
