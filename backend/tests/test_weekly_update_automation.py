from __future__ import annotations

import json
import sqlite3
from datetime import datetime
from pathlib import Path
from zoneinfo import ZoneInfo

from automation.backup_manager import BackupManager
from automation.config import WeeklyUpdateConfig
from automation.lock_manager import WeeklyUpdateLock
from automation.scheduler import next_scheduled_run


def test_next_run_is_sunday_9_africa_tunis() -> None:
    config = WeeklyUpdateConfig(timezone="Africa/Tunis", day="sunday", hour=9, minute=0)
    now = datetime(2026, 8, 1, 12, 0, tzinfo=ZoneInfo("Africa/Tunis"))
    next_run = next_scheduled_run(now, config)
    assert next_run.weekday() == 6
    assert next_run.hour == 9
    assert next_run.minute == 0
    assert next_run.tzinfo == ZoneInfo("Africa/Tunis")


def test_lock_active_is_not_reacquired(tmp_path: Path) -> None:
    lock = WeeklyUpdateLock(tmp_path / "weekly_update.lock", stale_hours=6)
    first = lock.acquire("run-1")
    second = lock.acquire("run-2")
    assert first.acquired
    assert not second.acquired
    assert second.status == "SKIPPED_ALREADY_RUNNING"


def test_lock_abandoned_is_replaced(tmp_path: Path) -> None:
    lock_path = tmp_path / "weekly_update.lock"
    lock_path.write_text(
        json.dumps({"run_id": "old", "started_at": "2026-01-01T00:00:00+00:00", "status": "RUNNING"}),
        encoding="utf-8",
    )
    lock = WeeklyUpdateLock(lock_path, stale_hours=1)
    result = lock.acquire("new")
    assert result.acquired
    assert result.previous is not None
    assert json.loads(lock_path.read_text(encoding="utf-8"))["run_id"] == "new"


def test_backup_success(monkeypatch, tmp_path: Path) -> None:
    db_path = tmp_path / "test.db"
    with sqlite3.connect(db_path) as connection:
        connection.execute("CREATE TABLE dentists (id INTEGER PRIMARY KEY, name TEXT)")
        connection.execute("INSERT INTO dentists (name) VALUES ('Dr Test')")
    monkeypatch.setattr("automation.backup_manager.settings.database_url", f"sqlite:///{db_path}")
    monkeypatch.setattr("automation.backup_manager.ROOT", tmp_path)
    metadata = BackupManager("backups", retention_weeks=12).create_backup("run")
    assert metadata.path.exists()
    assert metadata.size_bytes > 0
    assert metadata.sha256
    assert metadata.row_counts["dentists"] == 1


def test_backup_failure_for_missing_database(monkeypatch, tmp_path: Path) -> None:
    missing = tmp_path / "missing.db"
    monkeypatch.setattr("automation.backup_manager.settings.database_url", f"sqlite:///{missing}")
    monkeypatch.setattr("automation.backup_manager.ROOT", tmp_path)
    try:
        BackupManager("backups").create_backup("run")
    except FileNotFoundError:
        assert True
    else:
        raise AssertionError("missing database backup should fail")
