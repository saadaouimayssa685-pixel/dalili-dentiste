from __future__ import annotations

import logging
from dataclasses import dataclass, field
from datetime import datetime, timezone
from pathlib import Path
from typing import Callable

from sqlalchemy.orm import Session

from app.config import settings
from app.database import init_db, rebuild_unique_dentists
from app.exporters import export_csv, export_errors, export_json, export_review
from app.models import DentistRecord
from app.repositories.dentists import DentistRepository, assign_duplicate_groups
from app.scrapers.http_client import RespectfulHttpClient
from app.scrapers.generic_directory import extract_generic_pagination_urls, extract_generic_profile_urls, parse_direct_listing_records, parse_generic_profile
from app.scrapers.med_tn_listings import ListingProfileURL, extract_ajax_listing_params, extract_pagination_urls, extract_profile_urls
from app.scrapers.med_tn_profile import parse_profile
from app.services.record_filter import is_tunisian_dentist_record

log = logging.getLogger(__name__)

ProgressCallback = Callable[[dict], None]


@dataclass
class RunSummary:
    profiles_detected: int = 0
    profiles_scraped: int = 0
    profiles_failed: int = 0
    duplicates_found: int = 0
    started_at: datetime = field(default_factory=lambda: datetime.now(timezone.utc))
    ended_at: datetime | None = None

    def finish(self) -> "RunSummary":
        self.ended_at = datetime.now(timezone.utc)
        return self


class ScrapingPipeline:
    def __init__(self, session: Session, output_dir: str | Path = "outputs") -> None:
        init_db()
        self.repo = DentistRepository(session)
        self.http = RespectfulHttpClient()
        self.output_dir = Path(output_dir)
        self.errors: list[dict] = []

    def scrape_listings(self, governorate: str, limit: int | None = None) -> list[ListingProfileURL]:
        return self.scrape_source_listings("med.tn", governorate, limit)

    def scrape_source_listings(self, source_id: str, governorate: str | None = None, limit: int | None = None) -> list[ListingProfileURL]:
        if source_id == "med.tn":
            if not governorate:
                raise ValueError("governorate is required for med.tn")
            return self._scrape_med_listings(governorate, limit)
        source_config = settings.source_config(source_id)
        if not source_config:
            raise ValueError(f"Unknown source: {source_id}")
        if not source_config.get("enabled", False):
            log.warning("source_disabled | source=%s", source_id)
            return []
        if source_config.get("parser") == "direct_listing":
            return self._scrape_direct_listing_records(source_id, source_config, governorate, limit)
        if source_config.get("parser") != "generic_profile":
            self._error(source_id, "UNSUPPORTED_SOURCE_PARSER", f"Parser {source_config.get('parser')!r} is not supported by HTML collection.")
            return []
        queue = settings.source_listing_urls(source_id, governorate)
        seen_pages: set[str] = set()
        profiles: dict[str, ListingProfileURL] = {}
        while queue and (limit is None or len(profiles) < limit):
            url = queue.pop(0)
            if url in seen_pages:
                continue
            seen_pages.add(url)
            try:
                html = self.http.get(url).text
                found = extract_generic_profile_urls(html, url, source_config)
                for item in found:
                    profiles.setdefault(item.profile_url, item)
                    if limit and len(profiles) >= limit:
                        break
                if not limit or len(profiles) < limit:
                    for page in extract_generic_pagination_urls(html, url):
                        if page not in seen_pages and page not in queue:
                            queue.append(page)
                log.info("source=%s | listing_page=%s | profiles_found=%s", source_id, len(seen_pages), len(found))
                max_pages = int(source_config.get("max_pages", 25))
                if len(seen_pages) > max_pages:
                    log.warning("pagination_guard_stop | source=%s", source_id)
                    break
            except Exception as exc:  # noqa: BLE001
                self._error(url, "LISTING_FAILED", f"{source_id}: {exc}")
        return list(profiles.values())

    def _scrape_direct_listing_records(self, source_id: str, source_config: dict, governorate: str | None, limit: int | None) -> list[ListingProfileURL]:
        queue = settings.source_listing_urls(source_id, governorate)
        items: list[ListingProfileURL] = []
        for url in queue:
            try:
                html = self.http.get(url).text
                records = parse_direct_listing_records(html, url, source_id, limit)
                for record in records:
                    items.append(ListingProfileURL(record.source_profile_url or url, url, source_id, record))
                    if limit and len(items) >= limit:
                        return items
                log.info("source=%s | direct_listing_records=%s", source_id, len(records))
            except Exception as exc:  # noqa: BLE001
                self._error(url, "DIRECT_LISTING_FAILED", f"{source_id}: {exc}")
        return items

    def _scrape_med_listings(self, governorate: str, limit: int | None = None) -> list[ListingProfileURL]:
        queue = list(settings.listing_urls_for(governorate))
        seen_pages: set[str] = set()
        profiles: dict[str, ListingProfileURL] = {}
        api_items = self._scrape_configured_api_listing(governorate, limit)
        for item in api_items:
            profiles.setdefault(item.profile_url, item)
            if limit and len(profiles) >= limit:
                return list(profiles.values())
        while queue and (limit is None or len(profiles) < limit):
            url = queue.pop(0)
            if url in seen_pages:
                continue
            seen_pages.add(url)
            try:
                html = self.http.get(url).text
                detected_api = self._scrape_ajax_listing(html, url, limit, len(profiles))
                for item in detected_api:
                    profiles.setdefault(item.profile_url, item)
                    if limit and len(profiles) >= limit:
                        break
                found = []
                if not limit or len(profiles) < limit:
                    found = extract_profile_urls(html, url)
                    for item in found:
                        profiles.setdefault(item.profile_url, item)
                        if limit and len(profiles) >= limit:
                            break
                log.info(
                    "governorate=%s | listing_page=%s | api_profiles=%s | html_profiles=%s",
                    governorate,
                    len(seen_pages),
                    len(detected_api),
                    len(found),
                )
                if not limit or len(profiles) < limit:
                    for page in extract_pagination_urls(html, url):
                        if page not in seen_pages and page not in queue:
                            queue.append(page)
                if len(seen_pages) > 50:
                    log.warning("pagination_guard_stop | governorate=%s", governorate)
                    break
            except Exception as exc:  # noqa: BLE001
                self._error(url, "LISTING_FAILED", str(exc))
        return list(profiles.values())

    def _scrape_configured_api_listing(self, governorate: str, limit: int | None) -> list[ListingProfileURL]:
        api = settings.api_listing_for(governorate)
        listing_urls = settings.listing_urls_for(governorate)
        listing_url = listing_urls[0] if listing_urls else api.get("url", "") if api else ""
        if not api:
            return []
        url = api["url"]
        params = {str(k): str(v) for k, v in api.get("data", {}).items()}
        page_size = int(api.get("page_size", 30))
        total = int(api.get("total_hint", page_size))
        found: dict[str, ListingProfileURL] = {}
        start = 0
        while start < total and (limit is None or len(found) < limit):
            params["start"] = str(start)
            fragment = self.http.post(url, params).text
            if not fragment.strip():
                break
            before = len(found)
            for item in extract_profile_urls(fragment, listing_url):
                found.setdefault(item.profile_url, item)
                if limit and len(found) >= limit:
                    break
            if len(found) == before:
                break
            start += page_size
        log.info("governorate=%s | api_listing_profiles=%s", governorate, len(found))
        return list(found.values())

    def _scrape_ajax_listing(self, html: str, listing_url: str, limit: int | None, already_found: int) -> list[ListingProfileURL]:
        extracted = extract_ajax_listing_params(html)
        if not extracted:
            return []
        endpoint, params, page_size, total = extracted
        ajax_url = endpoint if endpoint.startswith("http") else f"https://www.med.tn/{endpoint}"
        found: dict[str, ListingProfileURL] = {}
        start = 0
        while start < total and (limit is None or already_found + len(found) < limit):
            params["start"] = str(start)
            fragment = self.http.post(ajax_url, params).text
            if not fragment.strip():
                break
            for item in extract_profile_urls(fragment, listing_url):
                found.setdefault(item.profile_url, item)
                if limit and already_found + len(found) >= limit:
                    break
            start += page_size
        return list(found.values())

    def scrape_profiles(
        self,
        items: list[ListingProfileURL],
        resume: bool = True,
        force_refresh: bool = False,
        progress_callback: ProgressCallback | None = None,
    ) -> list[DentistRecord]:
        existing = self.repo.existing_profile_urls() if resume and not force_refresh else set()
        records: list[DentistRecord] = []
        total = len(items)
        for index, item in enumerate(items, start=1):
            status = "skipped_existing"
            name = None
            try:
                if item.profile_url in existing:
                    continue
                if item.record is not None:
                    if not is_tunisian_dentist_record(item.record):
                        status = "skipped_not_dentist"
                        continue
                    saved = self.repo.save(item.record)
                    records.append(saved)
                    status = "saved"
                    name = item.record.full_name_source
                    log.info('profile_scraped | source="%s" | name="%s"', item.source, item.record.full_name_source)
                    continue
                if item.profile_url.startswith(item.listing_url.rstrip("/") + "#record-"):
                    status = "skipped_anchor"
                    continue
                html = self.http.get(item.profile_url).text
                if item.source == "med.tn":
                    record = parse_profile(html, item.profile_url, item.listing_url)
                else:
                    record = parse_generic_profile(html, item.profile_url, item.source, item.listing_url)
                if not is_tunisian_dentist_record(record):
                    status = "skipped_not_dentist"
                    continue
                saved = self.repo.save(record)
                records.append(saved)
                status = "saved"
                name = record.full_name_source
                log.info('profile_scraped | name="%s" | locality="%s"', record.full_name_source, record.locality)
            except Exception as exc:  # noqa: BLE001
                status = "failed"
                self._error(item.profile_url, "PROFILE_FAILED", str(exc))
            finally:
                if progress_callback:
                    progress_callback(
                        {
                            "phase": "profiles",
                            "current": index,
                            "total": total,
                            "source": item.source,
                            "url": item.profile_url,
                            "status": status,
                            "name": name,
                        }
                    )
        return records

    def export(self, records: list[DentistRecord]) -> dict[str, Path]:
        records = assign_duplicate_groups(records)
        return {
            "csv": export_csv(records, self.output_dir),
            "json": export_json(records, self.output_dir),
            "review": export_review(records, self.output_dir),
            "errors": export_errors(self.errors, self.output_dir),
        }

    def run_all(
        self,
        governorate: str,
        limit: int | None = 5,
        resume: bool = True,
        force_refresh: bool = False,
        without_google: bool = True,
        progress_callback: ProgressCallback | None = None,
    ) -> tuple[RunSummary, dict[str, Path]]:
        summary = RunSummary()
        items = self.scrape_listings(governorate, limit)
        summary.profiles_detected = len(items)
        records = self.scrape_profiles(items, resume=resume, force_refresh=force_refresh, progress_callback=progress_callback)
        summary.profiles_scraped = len(records)
        summary.profiles_failed = len(self.errors)
        records = assign_duplicate_groups(records)
        summary.duplicates_found = len([r for r in records if r.duplicate_group_id])
        rebuild_unique_dentists(self.repo.session)
        paths = self.export(records)
        return summary.finish(), paths

    def run_sources(
        self,
        source_ids: list[str],
        governorate: str | None = None,
        limit: int | None = 5,
        resume: bool = True,
        force_refresh: bool = False,
        without_google: bool = True,
    ) -> tuple[RunSummary, dict[str, Path]]:
        summary = RunSummary()
        items: list[ListingProfileURL] = []
        for source_id in source_ids:
            items.extend(self.scrape_source_listings(source_id, governorate, limit))
        summary.profiles_detected = len(items)
        records = self.scrape_profiles(items, resume=resume, force_refresh=force_refresh)
        summary.profiles_scraped = len(records)
        summary.profiles_failed = len(self.errors)
        records = assign_duplicate_groups(records)
        summary.duplicates_found = len([r for r in records if r.duplicate_group_id])
        rebuild_unique_dentists(self.repo.session)
        return summary.finish(), self.export(records)

    def _error(self, url: str, kind: str, message: str) -> None:
        log.error('%s | url="%s" | message="%s"', kind.lower(), url, message)
        self.errors.append(
            {
                "URL": url,
                "TYPE_ERREUR": kind,
                "MESSAGE": message,
                "NOMBRE_TENTATIVES": 1,
                "DATE": datetime.now(timezone.utc).isoformat(),
            }
        )
