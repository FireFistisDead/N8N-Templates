"""``python -m categorizer`` regenerates the context category files."""

from __future__ import annotations

import argparse
import json
import os
from pathlib import Path

from .runner import run


def repository_root() -> Path:
    override = os.environ.get("N8N_REPO_ROOT")
    if override:
        return Path(override).expanduser().resolve()
    return Path(__file__).resolve().parents[3]


def main(argv: list[str] | None = None) -> int:
    root = repository_root()
    parser = argparse.ArgumentParser(description="Categorise n8n workflows by filename")
    parser.add_argument("--workflows", default=str(root / "workflows"))
    parser.add_argument("--context", default=str(root / "context"))
    args = parser.parse_args(argv)

    summary = run(Path(args.workflows), Path(args.context))
    print(json.dumps(summary, indent=2))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
