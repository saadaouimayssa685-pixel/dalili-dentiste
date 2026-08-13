from __future__ import annotations

import argparse
import json
import sys
from dataclasses import asdict
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

from app.database import SessionLocal, init_db, rebuild_unique_dentists
from app.services.relevant_database import build_relevant_database


def main() -> int:
    parser = argparse.ArgumentParser(description="Construit la table pertinente relevant_dentists.")
    parser.add_argument("--min-score", type=int, default=50)
    parser.add_argument("--rebuild-unique", action="store_true")
    args = parser.parse_args()

    init_db()
    with SessionLocal() as session:
        if args.rebuild_unique:
            rebuild_unique_dentists(session)
        summary = build_relevant_database(session, min_score=args.min_score)
    print(json.dumps(asdict(summary), ensure_ascii=False, indent=2))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
