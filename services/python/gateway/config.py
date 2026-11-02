"""Gateway configuration (independent from the catalog package)."""

from __future__ import annotations

import os
from dataclasses import dataclass
from functools import lru_cache
from pathlib import Path


def repository_root() -> Path:
    override = os.environ.get("N8N_REPO_ROOT")
    if override:
        return Path(override).expanduser().resolve()
    # services/python/gateway/config.py -> parents[3] is the repository root.
    return Path(__file__).resolve().parents[3]


def _int_env(name: str, default: int) -> int:
    try:
        return int(os.environ.get(name, default))
    except (TypeError, ValueError):
        return default


@dataclass(frozen=True)
class Settings:
    repo_root: Path
    client_dir: Path
    catalog_url: str
    host: str
    port: int
    timeout_seconds: float
    service_name: str = "gateway-python"
    version: str = "3.0.0"

    @classmethod
    @lru_cache(maxsize=1)
    def from_env(cls) -> "Settings":
        root = repository_root()
        client_dir = os.environ.get("N8N_CLIENT_DIR")
        return cls(
            repo_root=root,
            client_dir=Path(client_dir).expanduser().resolve() if client_dir else (root / "client"),
            catalog_url=os.environ.get("CATALOG_URL", "http://127.0.0.1:8101").rstrip("/"),
            host=os.environ.get("GATEWAY_HOST", "127.0.0.1"),
            port=_int_env("GATEWAY_PORT", 8000),
            timeout_seconds=float(os.environ.get("CATALOG_TIMEOUT_SECONDS", "60")),
        )
