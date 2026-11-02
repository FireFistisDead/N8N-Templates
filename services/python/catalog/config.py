"""Environment-driven configuration for the catalog service.

All paths are resolved from the repository root instead of the current working
directory, so the service behaves the same from any launch location or in a
container.
"""

from __future__ import annotations

import os
from dataclasses import dataclass
from functools import lru_cache
from pathlib import Path


def repository_root() -> Path:
    """Return the repository root, honouring ``N8N_REPO_ROOT`` when set."""
    override = os.environ.get("N8N_REPO_ROOT")
    if override:
        return Path(override).expanduser().resolve()
    # services/python/catalog/config.py -> parents[3] is the repository root.
    return Path(__file__).resolve().parents[3]


def _path_env(name: str, default: Path) -> Path:
    configured = os.environ.get(name)
    return Path(configured).expanduser().resolve() if configured else default


def _int_env(name: str, default: int) -> int:
    try:
        return int(os.environ.get(name, default))
    except (TypeError, ValueError):
        return default


def _bool_env(name: str, default: bool) -> bool:
    raw = os.environ.get(name)
    if raw is None:
        return default
    return raw.strip().lower() in {"1", "true", "yes", "on"}


@dataclass(frozen=True)
class Settings:
    """Runtime settings for the catalog service."""

    repo_root: Path
    workflows_dir: Path
    context_dir: Path
    db_path: Path
    host: str
    port: int
    auto_index: bool
    service_name: str = "catalog-python"
    version: str = "3.0.0"

    @classmethod
    @lru_cache(maxsize=1)
    def from_env(cls) -> "Settings":
        root = repository_root()
        return cls(
            repo_root=root,
            workflows_dir=_path_env("N8N_WORKFLOWS_DIR", root / "workflows"),
            context_dir=_path_env("N8N_CONTEXT_DIR", root / "context"),
            db_path=_path_env("N8N_DB_PATH", root / "data" / "python" / "workflows.db"),
            host=os.environ.get("CATALOG_HOST", "127.0.0.1"),
            port=_int_env("CATALOG_PORT", 8101),
            auto_index=_bool_env("N8N_AUTO_INDEX", True),
        )


@dataclass(frozen=True)
class GatewaySettings:
    """Runtime settings for the public gateway service."""

    repo_root: Path
    client_dir: Path
    catalog_url: str
    host: str
    port: int
    service_name: str = "gateway-python"
    version: str = "3.0.0"

    @classmethod
    @lru_cache(maxsize=1)
    def from_env(cls) -> "GatewaySettings":
        root = repository_root()
        return cls(
            repo_root=root,
            client_dir=_path_env("N8N_CLIENT_DIR", root / "client"),
            catalog_url=os.environ.get("CATALOG_URL", "http://127.0.0.1:8101").rstrip("/"),
            host=os.environ.get("GATEWAY_HOST", "127.0.0.1"),
            port=_int_env("GATEWAY_PORT", 8000),
        )
