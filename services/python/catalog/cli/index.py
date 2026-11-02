"""CLI: index workflows and inspect the catalogue."""

from __future__ import annotations

import argparse
import json

from ..config import Settings
from ..db.schema import init_schema
from ..db.workflow_repository import WorkflowRepository
from ..services.index_service import IndexService


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description="Index n8n workflows into the catalog database")
    parser.add_argument("--force", action="store_true", help="Re-analyze unchanged files")
    parser.add_argument("--no-prune", action="store_true", help="Keep rows whose files disappeared")
    parser.add_argument("--stats", action="store_true", help="Print database statistics only")
    parser.add_argument("--db", help="Override the database path")
    args = parser.parse_args(argv)

    settings = Settings.from_env()
    db_path = settings.db_path
    if args.db:
        from pathlib import Path

        db_path = Path(args.db).expanduser().resolve()

    init_schema(db_path)
    repository = WorkflowRepository(db_path)

    if args.stats:
        print(json.dumps(repository.stats(), indent=2))
        return 0

    service = IndexService(settings, repository)
    stats = service.index_all(force=args.force, prune=not args.no_prune)
    print(json.dumps(stats, indent=2))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
