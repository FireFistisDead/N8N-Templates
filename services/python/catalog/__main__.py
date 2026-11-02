"""``python -m catalog`` starts the catalog HTTP service."""

from __future__ import annotations

import argparse

import uvicorn

from .api.app import create_app
from .config import Settings


def main(argv: list[str] | None = None) -> int:
    settings = Settings.from_env()
    parser = argparse.ArgumentParser(description="n8n workflow catalog service")
    parser.add_argument("--host", default=settings.host)
    parser.add_argument("--port", type=int, default=settings.port)
    parser.add_argument("--reload", action="store_true", help="Auto-reload (development)")
    args = parser.parse_args(argv)

    if args.reload:
        uvicorn.run(
            "catalog.api.app:create_app",
            factory=True,
            host=args.host,
            port=args.port,
            reload=True,
            log_level="info",
        )
    else:
        uvicorn.run(create_app(settings), host=args.host, port=args.port, log_level="info")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
