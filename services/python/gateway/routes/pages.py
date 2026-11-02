"""Page and asset routes for the web client."""

from __future__ import annotations

from fastapi import APIRouter
from fastapi.responses import FileResponse, HTMLResponse

from ..config import Settings

router = APIRouter(tags=["pages"])


def build_pages_router(settings: Settings) -> APIRouter:
    router = APIRouter(tags=["pages"])

    @router.get("/", include_in_schema=False, response_model=None)
    def index() -> FileResponse | HTMLResponse:
        index_file = settings.client_dir / "index.html"
        if index_file.exists():
            return FileResponse(index_file)
        return HTMLResponse(
            "<html><body><h1>Setup required</h1>"
            f"<p>Client assets not found at {settings.client_dir}</p></body></html>",
            status_code=500,
        )

    @router.get("/favicon.ico", include_in_schema=False)
    def favicon() -> HTMLResponse:
        return HTMLResponse(status_code=204)

    return router
