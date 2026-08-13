from __future__ import annotations

import argparse
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

from app.database import SessionLocal, list_unique_dentists
from scripts.export_powerbi_model import crm_prospection, write_csv


def main() -> None:
    parser = argparse.ArgumentParser(description="Exporte un fichier CRM de prospection depuis la base unique.")
    parser.add_argument("--output", default="outputs/crm_prospection.csv")
    args = parser.parse_args()

    with SessionLocal() as session:
        records = list_unique_dentists(session)

    path = Path(args.output)
    write_csv(path, crm_prospection(records))
    print(path)


if __name__ == "__main__":
    main()
