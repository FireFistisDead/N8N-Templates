"""Proxy every ``/api/*`` request to the catalog service."""

from __future__ import annotations

import asyncio

from fastapi import APIRouter, Request, Response

from ..catalog_client import CatalogClient

_FORWARDED_RESPONSE_HEADERS = ("content-type", "content-disposition", "cache-control", "etag")


def build_proxy_router(client: CatalogClient) -> APIRouter:
    router = APIRouter(tags=["proxy"])

    @router.api_route(
        "/api/{path:path}",
        methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS", "HEAD"],
        include_in_schema=False,
    )
    async def proxy(path: str, request: Request) -> Response:
        body = await request.body()
        # Starlette decodes path parameters (spaces, &, ...). Forward the raw,
        # still-encoded path so the catalog receives a valid request URI.
        raw_path = request.scope.get("raw_path")
        target_path = raw_path.decode("latin-1") if raw_path else f"/api/{path}"
        result = await asyncio.to_thread(
            client.forward,
            request.method,
            target_path,
            request.url.query,
            body,
            dict(request.headers),
        )
        headers = {
            key: value
            for key, value in result.headers.items()
            if key in _FORWARDED_RESPONSE_HEADERS
        }
        return Response(content=result.body, status_code=result.status, headers=headers)

    return router
