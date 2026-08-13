from __future__ import annotations

import argparse
import json
from dataclasses import asdict
from pathlib import Path
import sys

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from app.services.source_health import check_sources_health, summarize_source_health, write_source_health_report


def main() -> int:
    parser = argparse.ArgumentParser(description="Verifie l'etat des sources Dalili Dentiste.")
    parser.add_argument("--live", action="store_true", help="Teste les URLs de depart avec HTTP.")
    parser.add_argument("--timeout", type=float, default=12.0)
    parser.add_argument("--write-report", action="store_true", help="Ecrit reports/source_health_latest.json.")
    args = parser.parse_args()

    results = check_sources_health(live=args.live, timeout_seconds=args.timeout)
    payload = {
        "summary": summarize_source_health(results),
        "sources": [asdict(result) for result in results],
    }
    if args.write_report:
        payload["report_path"] = str(write_source_health_report(results))
    print(json.dumps(payload, ensure_ascii=False, indent=2))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
