from __future__ import annotations

from datetime import datetime, timedelta
from zoneinfo import ZoneInfo

from automation.config import WeeklyUpdateConfig

DAY_INDEX = {
    "monday": 0,
    "tuesday": 1,
    "wednesday": 2,
    "thursday": 3,
    "friday": 4,
    "saturday": 5,
    "sunday": 6,
}


def next_scheduled_run(now: datetime | None = None, config: WeeklyUpdateConfig | None = None) -> datetime:
    config = config or WeeklyUpdateConfig.from_env()
    tz = ZoneInfo(config.timezone)
    current = now.astimezone(tz) if now else datetime.now(tz)
    target_day = DAY_INDEX[config.day.lower()]
    days_ahead = (target_day - current.weekday()) % 7
    candidate = current.replace(hour=config.hour, minute=config.minute, second=0, microsecond=0) + timedelta(
        days=days_ahead
    )
    if candidate <= current:
        candidate += timedelta(days=7)
    return candidate


def cron_utc_for_github(config: WeeklyUpdateConfig | None = None) -> str:
    config = config or WeeklyUpdateConfig.from_env()
    local = next_scheduled_run(
        datetime(2026, 8, 1, 12, 0, tzinfo=ZoneInfo(config.timezone)),
        config,
    )
    utc = local.astimezone(ZoneInfo("UTC"))
    return f"{utc.minute} {utc.hour} * * 0"
