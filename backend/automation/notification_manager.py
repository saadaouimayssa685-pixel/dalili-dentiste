from __future__ import annotations

import logging
import os

log = logging.getLogger(__name__)


def notify_success(message: str) -> None:
    log.info("weekly_update_success | %s", message)
    if os.getenv("WEEKLY_UPDATE_EMAIL_TO"):
        log.info("email_notification_configured | to_env=WEEKLY_UPDATE_EMAIL_TO")


def notify_failure(message: str) -> None:
    log.error("weekly_update_failed | %s", message)
    if os.getenv("WEEKLY_UPDATE_EMAIL_TO"):
        log.info("email_notification_configured | to_env=WEEKLY_UPDATE_EMAIL_TO")
