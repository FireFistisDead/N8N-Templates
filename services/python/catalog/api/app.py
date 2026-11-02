"""FastAPI application factory for the catalog service."""

from __future__ import annotations

import asyncio
import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.gzip import GZipMiddleware
from fastapi.responses import JSONResponse

from ..config import Settings
from . import routes_admin, routes_categories, routes_stats, routes_workflows
from .dependencies import build_context

logger = logging.getLogger(__name__)


def create_app(settings: Settings | None = None) -> FastAPI:
    settings = settings or Settings.from_env()
    context = build_context(settings)

    @asynccontextmanager
    async def lifespan(app: FastAPI):
        if settings.auto_index and context.repository.count() == 0:
            logger.info("Database is empty; indexing %s", settings.workflows_dir)
            await asyncio.to_thread(context.index.index_all, False)
            context.workflows.refresh()
            context.stats.invalidate()
        yield

    app = FastAPI(
        title="n8n Workflow Catalog",
        description="Internal service that owns workflow indexing, storage and search.",
        version=settings.version,
        lifespan=lifespan,
    )
    app.state.context = context

    app.add_middleware(GZipMiddleware, minimum_size=1000)
    app.add_middleware(
        CORSMiddleware,
        allow_origins=["*"],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    @app.get("/health", tags=["health"])
    def health() -> dict[str, str]:
        return {"status": "healthy", "service": settings.service_name, "version": settings.version}

    @app.exception_handler(Exception)
    async def unhandled_exception(request: Request, exc: Exception) -> JSONResponse:
        logger.exception("Unhandled catalog error on %s", request.url.path)
        return JSONResponse(status_code=500, content={"detail": f"Internal server error: {exc}"})

    prefix = "/api"
    app.include_router(routes_stats.router, prefix=prefix)
    app.include_router(routes_categories.router, prefix=prefix)
    app.include_router(routes_workflows.router, prefix=prefix)
    app.include_router(routes_admin.router, prefix=prefix)
    return app
