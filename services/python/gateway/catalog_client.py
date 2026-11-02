"""Thin HTTP client for the catalog service (stdlib only)."""

from __future__ import annotations

import json
from dataclasses import dataclass
from urllib.error import HTTPError, URLError
from urllib.request import Request, urlopen


@dataclass
class CatalogResponse:
    status: int
    headers: dict[str, str]
    body: bytes


class CatalogClient:
    def __init__(self, base_url: str, timeout: float = 60.0) -> None:
        self.base_url = base_url.rstrip("/")
        self.timeout = timeout

    def forward(
        self,
        method: str,
        path: str,
        query: str = "",
        body: bytes | None = None,
        headers: dict[str, str] | None = None,
    ) -> CatalogResponse:
        url = f"{self.base_url}{path}"
        if query:
            url = f"{url}?{query}"

        request = Request(url, data=body or None, method=method.upper())
        request.add_header("Accept", "application/json")
        forwarded_headers = headers or {}
        if forwarded_headers.get("content-type"):
            request.add_header("Content-Type", forwarded_headers["content-type"])

        try:
            with urlopen(request, timeout=self.timeout) as response:
                return CatalogResponse(
                    status=response.status,
                    headers={key.lower(): value for key, value in response.headers.items()},
                    body=response.read(),
                )
        except HTTPError as error:
            return CatalogResponse(
                status=error.code,
                headers={key.lower(): value for key, value in error.headers.items()},
                body=error.read(),
            )
        except URLError as error:
            payload = json.dumps({"detail": f"Catalog unavailable: {error.reason}"}).encode()
            return CatalogResponse(
                status=502,
                headers={"content-type": "application/json"},
                body=payload,
            )

    def health(self) -> CatalogResponse:
        return self.forward("GET", "/health")
