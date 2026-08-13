from __future__ import annotations

import logging
import random
import time

import httpx
from tenacity import retry, retry_if_exception_type, stop_after_attempt, wait_exponential

from app.config import settings

log = logging.getLogger(__name__)


class RespectfulHttpClient:
    def __init__(self) -> None:
        req = settings.med_sources.get("request", {})
        self.delay_min = float(req.get("delay_min_seconds", 1.5))
        self.delay_max = float(req.get("delay_max_seconds", 3.5))
        self.client = httpx.Client(
            headers={"User-Agent": req.get("user_agent", "DentistsTunisiaResearchBot/1.0")},
            timeout=float(req.get("timeout_seconds", settings.request_timeout_seconds)),
            follow_redirects=True,
        )

    def sleep(self) -> None:
        time.sleep(random.uniform(self.delay_min, self.delay_max))

    @retry(
        retry=retry_if_exception_type((httpx.TimeoutException, httpx.TransportError)),
        wait=wait_exponential(multiplier=1, min=2, max=30),
        stop=stop_after_attempt(3),
        reraise=True,
    )
    def get(self, url: str) -> httpx.Response:
        self.sleep()
        response = self.client.get(url)
        if response.status_code == 429:
            retry_after = response.headers.get("Retry-After")
            pause = int(retry_after) if retry_after and retry_after.isdigit() else 60
            log.warning("rate_limited | url=%s | pause_seconds=%s", url, pause)
            time.sleep(pause)
        response.raise_for_status()
        return response

    @retry(
        retry=retry_if_exception_type((httpx.TimeoutException, httpx.TransportError)),
        wait=wait_exponential(multiplier=1, min=2, max=30),
        stop=stop_after_attempt(3),
        reraise=True,
    )
    def post(self, url: str, data: dict[str, str | int]) -> httpx.Response:
        self.sleep()
        response = self.client.post(url, data=data)
        if response.status_code == 429:
            retry_after = response.headers.get("Retry-After")
            pause = int(retry_after) if retry_after and retry_after.isdigit() else 60
            log.warning("rate_limited | url=%s | pause_seconds=%s", url, pause)
            time.sleep(pause)
        response.raise_for_status()
        return response
