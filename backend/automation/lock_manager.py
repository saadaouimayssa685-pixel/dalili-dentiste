from __future__ import annotations

import json
import os
import socket
from dataclasses import dataclass
from datetime import datetime, timedelta, timezone
from pathlib import Path


@dataclass(frozen=True)
class LockResult:
    acquired: bool
    status: str
    path: Path
    previous: dict | None = None


class WeeklyUpdateLock:
    def __init__(self, path: str | Path = "runtime/weekly_update.lock", stale_hours: int = 6) -> None:
        self.path = Path(path)
        self.stale_after = timedelta(hours=stale_hours)

    def acquire(self, run_id: str) -> LockResult:
        self.path.parent.mkdir(parents=True, exist_ok=True)
        previous = self._read()
        if previous:
            started = _parse_dt(previous.get("started_at"))
            if started and datetime.now(timezone.utc) - started <= self.stale_after:
                return LockResult(False, "SKIPPED_ALREADY_RUNNING", self.path, previous)
        payload = {
            "run_id": run_id,
            "started_at": datetime.now(timezone.utc).isoformat(),
            "pid": os.getpid(),
            "machine": socket.gethostname(),
            "status": "RUNNING",
        }
        self.path.write_text(json.dumps(payload, ensure_ascii=False, indent=2), encoding="utf-8")
        return LockResult(True, "ACQUIRED", self.path, previous)

    def release(self, run_id: str, status: str = "RELEASED") -> None:
        current = self._read()
        if current and current.get("run_id") == run_id:
            current["status"] = status
            current["finished_at"] = datetime.now(timezone.utc).isoformat()
            archive = self.path.with_suffix(".last.json")
            archive.write_text(json.dumps(current, ensure_ascii=False, indent=2), encoding="utf-8")
            self.path.unlink(missing_ok=True)

    def _read(self) -> dict | None:
        if not self.path.exists():
            return None
        try:
            return json.loads(self.path.read_text(encoding="utf-8"))
        except json.JSONDecodeError:
            return {"status": "CORRUPTED_LOCK"}


def _parse_dt(value: str | None) -> datetime | None:
    if not value:
        return None
    try:
        return datetime.fromisoformat(value)
    except ValueError:
        return None
