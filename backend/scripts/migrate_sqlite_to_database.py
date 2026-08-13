from __future__ import annotations

import argparse
import sqlite3
from pathlib import Path

from sqlalchemy import create_engine, text

from app.database import Base, DentistORM


TABLES = ["dentists", "unique_dentists"]


def normalize_database_url(url: str) -> str:
    if url.startswith("postgres://"):
        return "postgresql+psycopg://" + url.removeprefix("postgres://")
    if url.startswith("postgresql://"):
        return "postgresql+psycopg://" + url.removeprefix("postgresql://")
    return url


def sqlite_columns(sqlite_path: Path, table: str) -> list[str]:
    with sqlite3.connect(sqlite_path) as connection:
        rows = connection.execute(f"PRAGMA table_info({table})").fetchall()
    return [row[1] for row in rows]


def sqlite_rows(sqlite_path: Path, table: str) -> list[dict]:
    with sqlite3.connect(sqlite_path) as connection:
        connection.row_factory = sqlite3.Row
        return [dict(row) for row in connection.execute(f"SELECT * FROM {table}")]


def create_unique_table(target_engine) -> None:
    columns = [column.name for column in DentistORM.__table__.columns]
    column_defs = []
    for column in DentistORM.__table__.columns:
        column_type = column.type.compile(target_engine.dialect)
        suffix = " PRIMARY KEY" if column.primary_key else ""
        column_defs.append(f"{column.name} {column_type}{suffix}")
    with target_engine.begin() as connection:
        connection.execute(text(f"CREATE TABLE IF NOT EXISTS unique_dentists ({', '.join(column_defs)})"))


def copy_table(sqlite_path: Path, target_engine, table: str, replace: bool) -> int:
    columns = sqlite_columns(sqlite_path, table)
    rows = sqlite_rows(sqlite_path, table)
    if not rows:
        return 0
    placeholders = ", ".join(f":{column}" for column in columns)
    column_list = ", ".join(columns)
    statement = text(f"INSERT INTO {table} ({column_list}) VALUES ({placeholders})")
    with target_engine.begin() as connection:
        if replace:
            connection.execute(text(f"DELETE FROM {table}"))
        connection.execute(statement, rows)
    return len(rows)


def main() -> None:
    default_sqlite = Path(__file__).resolve().parents[1] / "database" / "dentists_tunisia.db"
    parser = argparse.ArgumentParser(description="Copie dentists_tunisia.db vers une base SQLAlchemy.")
    parser.add_argument("--sqlite-path", default=str(default_sqlite))
    parser.add_argument("--target-url", required=True, help="Ex: postgresql+psycopg://user:password@localhost:5432/dentists_tunisia")
    parser.add_argument("--append", action="store_true", help="Ajoute aux tables existantes au lieu de les vider.")
    args = parser.parse_args()

    sqlite_path = Path(args.sqlite_path)
    if not sqlite_path.exists():
        raise SystemExit(f"Base SQLite introuvable: {sqlite_path}")

    target_engine = create_engine(normalize_database_url(args.target_url), future=True)
    Base.metadata.create_all(target_engine)
    create_unique_table(target_engine)

    for table in TABLES:
        copied = copy_table(sqlite_path, target_engine, table, replace=not args.append)
        print(f"{table}: {copied} ligne(s) copiée(s)")


if __name__ == "__main__":
    main()
