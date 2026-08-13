from __future__ import annotations

import json
import os
from pathlib import Path
from typing import Any

import yaml
from dotenv import load_dotenv

ROOT = Path(__file__).resolve().parent.parent
CONFIG_DIR = ROOT / "config"


def load_yaml(path: Path) -> dict[str, Any]:
    with path.open("r", encoding="utf-8") as fh:
        return yaml.safe_load(fh) or {}


def load_json(path: Path) -> dict[str, Any]:
    with path.open("r", encoding="utf-8") as fh:
        return json.load(fh)


def normalize_database_url(url: str) -> str:
    if url.startswith("postgres://"):
        return "postgresql+psycopg://" + url.removeprefix("postgres://")
    if url.startswith("postgresql://"):
        return "postgresql+psycopg://" + url.removeprefix("postgresql://")
    return url


class Settings:
    def __init__(self) -> None:
        load_dotenv()
        default_db = f"sqlite:///{(ROOT / 'database' / 'dentists_tunisia.db').as_posix()}"
        self.database_url = normalize_database_url(os.getenv("DATABASE_URL", default_db))
        self.log_level = os.getenv("LOG_LEVEL", "INFO")
        self.request_timeout_seconds = int(os.getenv("REQUEST_TIMEOUT_SECONDS", "30"))
        self.max_concurrent_requests = int(os.getenv("MAX_CONCURRENT_REQUESTS", "2"))
        self.med_sources = load_yaml(CONFIG_DIR / "med_tn_sources.yaml")
        self.sources = load_yaml(CONFIG_DIR / "sources.yaml")
        self.locations = load_json(CONFIG_DIR / "tunisia_locations.json")
        localities_reference_path = CONFIG_DIR / "tunisia_localities_reference.json"
        self.localities_reference = (
            load_json(localities_reference_path) if localities_reference_path.exists() else {"localities": []}
        )
        self.phone_prefixes = load_json(CONFIG_DIR / "tunisia_phone_prefixes.json")

    def governorates(self, enabled_only: bool = True) -> list[str]:
        items = self.med_sources.get("governorates", [])
        return [g["name"] for g in items if not enabled_only or g.get("enabled", True)]

    def listing_urls_for(self, governorate: str) -> list[str]:
        for gov in self.med_sources.get("governorates", []):
            if gov["name"].casefold() == governorate.casefold():
                return list(gov.get("listing_urls", []))
        return []

    def governorate_config(self, governorate: str) -> dict[str, Any] | None:
        for gov in self.med_sources.get("governorates", []):
            if gov["name"].casefold() == governorate.casefold():
                return gov
        return None

    def api_listing_for(self, governorate: str) -> dict[str, Any] | None:
        gov = self.governorate_config(governorate)
        return gov.get("api_listing") if gov else None

    def source_configs(self, enabled_only: bool = True) -> list[dict[str, Any]]:
        sources = self.sources.get("sources", [])
        selected = [s for s in sources if not enabled_only or s.get("enabled", False)]
        return sorted(selected, key=lambda s: int(s.get("priority", 999)))

    def source_config(self, source_id: str) -> dict[str, Any] | None:
        for source in self.sources.get("sources", []):
            if source.get("id") == source_id:
                return source
        return None

    def source_listing_urls(self, source_id: str, governorate: str | None = None) -> list[str]:
        source = self.source_config(source_id)
        if not source:
            return []
        if governorate:
            by_gov = source.get("listing_url_templates", {}).get(governorate)
            if by_gov:
                return list(by_gov)
        return list(source.get("start_urls", []))


settings = Settings()
