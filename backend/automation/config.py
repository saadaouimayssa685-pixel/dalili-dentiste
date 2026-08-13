from __future__ import annotations

import os
from dataclasses import dataclass


def _bool_env(name: str, default: bool) -> bool:
    value = os.getenv(name)
    if value is None:
        return default
    return value.strip().lower() in {"1", "true", "yes", "on"}


@dataclass(frozen=True)
class WeeklyUpdateConfig:
    enabled: bool = True
    day: str = "sunday"
    hour: int = 9
    minute: int = 0
    timezone: str = "Africa/Tunis"
    dry_run: bool = False
    backup_retention_weeks: int = 12
    auto_merge_threshold: float = 0.95
    manual_review_threshold: float = 0.80
    lock_stale_hours: int = 6
    job_name: str = "dalili_weekly_update"
    output_root: str = "exports/weekly"
    reports_root: str = "reports"
    backups_root: str = "backups"
    runtime_root: str = "runtime"
    max_sources: int | None = None
    max_profiles_per_source: int | None = None

    @classmethod
    def from_env(cls) -> "WeeklyUpdateConfig":
        max_sources = os.getenv("WEEKLY_UPDATE_MAX_SOURCES")
        max_profiles = os.getenv("WEEKLY_UPDATE_MAX_PROFILES_PER_SOURCE")
        return cls(
            enabled=_bool_env("WEEKLY_UPDATE_ENABLED", True),
            day=os.getenv("WEEKLY_UPDATE_DAY", "sunday"),
            hour=int(os.getenv("WEEKLY_UPDATE_HOUR", "09")),
            minute=int(os.getenv("WEEKLY_UPDATE_MINUTE", "00")),
            timezone=os.getenv("WEEKLY_UPDATE_TIMEZONE", "Africa/Tunis"),
            dry_run=_bool_env("WEEKLY_UPDATE_DRY_RUN", False),
            backup_retention_weeks=int(os.getenv("BACKUP_RETENTION_WEEKS", "12")),
            auto_merge_threshold=float(os.getenv("AUTO_MERGE_THRESHOLD", "0.95")),
            manual_review_threshold=float(os.getenv("MANUAL_REVIEW_THRESHOLD", "0.80")),
            lock_stale_hours=int(os.getenv("WEEKLY_UPDATE_LOCK_STALE_HOURS", "6")),
            max_sources=int(max_sources) if max_sources else None,
            max_profiles_per_source=int(max_profiles) if max_profiles else None,
        )
