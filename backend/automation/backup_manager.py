from __future__ import annotations

import hashlib
import shutil
import sqlite3
from dataclasses import dataclass
from datetime import datetime, timedelta, timezone
from pathlib import Path

from app.config import ROOT, settings


@dataclass(frozen=True)
class BackupMetadata:
    run_id: str
    path: Path
    created_at: datetime
    size_bytes: int
    sha256: str
    row_counts: dict[str, int]


def sqlite_database_path(database_url: str | None = None) -> Path:
    url = database_url or settings.database_url
    if not url.startswith("sqlite:///"):
        raise ValueError("weekly backup currently supports SQLite DATABASE_URL only")
    raw = url.removeprefix("sqlite:///")
    path = Path(raw)
    return path if path.is_absolute() else ROOT / path


class BackupManager:
    def __init__(self, backup_dir: str | Path = "backups", retention_weeks: int = 12) -> None:
        self.backup_dir = ROOT / backup_dir
        self.retention = timedelta(weeks=retention_weeks)

    def create_backup(self, run_id: str) -> BackupMetadata:
        source = sqlite_database_path()
        if not source.exists():
            raise FileNotFoundError(f"database not found: {source}")
        self.backup_dir.mkdir(parents=True, exist_ok=True)
        stamp = datetime.now(timezone.utc).astimezone().strftime("%Y-%m-%d_%H%M%S")
        target = self.backup_dir / f"dalili_before_update_{stamp}.db"
        shutil.copy2(source, target)
        metadata = BackupMetadata(
            run_id=run_id,
            path=target,
            created_at=datetime.now(timezone.utc),
            size_bytes=target.stat().st_size,
            sha256=_sha256(target),
            row_counts=_row_counts(target),
        )
        if metadata.size_bytes <= 0 or not metadata.sha256:
            raise RuntimeError("backup verification failed")
        self.apply_retention()
        return metadata

    def apply_retention(self) -> None:
        backups = sorted(self.backup_dir.glob("dalili_before_update_*.db"), key=lambda path: path.stat().st_mtime)
        if len(backups) <= 1:
            return
        cutoff = datetime.now(timezone.utc).timestamp() - self.retention.total_seconds()
        for path in backups[:-1]:
            if path.stat().st_mtime < cutoff:
                path.unlink(missing_ok=True)


def _sha256(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as fh:
        for chunk in iter(lambda: fh.read(1024 * 1024), b""):
            digest.update(chunk)
    return digest.hexdigest()


def _row_counts(path: Path) -> dict[str, int]:
    counts: dict[str, int] = {}
    with sqlite3.connect(path) as connection:
        tables = [row[0] for row in connection.execute("SELECT name FROM sqlite_master WHERE type='table'")]
        for table in tables:
            try:
                counts[table] = int(connection.execute(f'SELECT COUNT(*) FROM "{table}"').fetchone()[0])
            except sqlite3.DatabaseError:
                counts[table] = -1
    return counts
