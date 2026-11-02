"""FastAPI application factory for the public gateway."""

from __future__ import annotations

import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.gzip import GZipMiddleware
from fastapi.staticfiles import StaticFiles

from .catalog_client import CatalogClient
from .config import Settings
from .routes.pages import build_pages_router
from .routes.proxy import build_proxy_router

logger = logging.getLogger(__name__)


def create_app(settings: Settings | None = None) -> FastAPI:
    settings = settings or Settings.from_env()
    catalog = CatalogClient(settings.catalog_url, settings.timeout_seconds)

    @asynccontextmanager
    async def lifespan(app: FastAPI):
        result = catalog.health()
        if result.status >= 400:
            logger.warning("Catalog at %s is not healthy (status %s)", settings.catalog_url, result.status)
        else:
            logger.info("Catalog reachable at %s", settings.catalog_url)
        yield

    app = FastAPI(
        title="n8n Workflow Documentation Gateway",
        description="Serves the web client and proxies API traffic to the catalog service.",
        version=settings.version,
        lifespan=lifespan,
    )
    app.add_middleware(GZipMiddleware, minimum_size=1000)

    @app.get("/health", tags=["health"])
    def health() -> dict[str, str]:
        catalog_health = catalog.health()
        return {
            "status": "healthy" if catalog_health.status < 400 else "degraded",
            "service": settings.service_name,
            "version": settings.version,
            "catalog_status": str(catalog_health.status),
        }

    assets_dir = settings.client_dir / "assets"
    if assets_dir.exists():
        app.mount("/assets", StaticFiles(directory=assets_dir), name="assets")

    app.include_router(build_pages_router(settings))
    app.include_router(build_proxy_router(catalog))
    return app
