from __future__ import annotations

import json
from dataclasses import asdict, dataclass
from datetime import datetime, timezone
from pathlib import Path

import httpx

from app.config import ROOT, settings
from app.scrapers.generic_directory import extract_generic_profile_urls


HTML_PIPELINE_PARSERS = {"med_tn", "generic_profile", "direct_listing"}
DEDICATED_CONNECTOR_PARSERS = {"osm_pbf"}
HEALTH_HEADERS = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/126 Safari/537.36 DaliliDentisteHealthCheck/1.0",
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
    "Accept-Language": "fr-FR,fr;q=0.9,en;q=0.7,ar;q=0.6",
    "Accept-Encoding": "identity",
}


@dataclass
class SourceHealthResult:
    source_id: str
    name: str
    enabled: bool
    parser: str | None
    script_present: bool
    pipeline_supported: bool
    start_urls: list[str]
    status: str
    message: str
    http_status: int | None = None
    profiles_detected: int | None = None
    checked_at: str = ""


def check_sources_health(live: bool = False, timeout_seconds: float = 12.0) -> list[SourceHealthResult]:
    scripts_dir = ROOT / "scripts" / "sources"
    results: list[SourceHealthResult] = []
    for source in settings.source_configs(enabled_only=False):
        results.append(check_source_health(source, scripts_dir, live=live, timeout_seconds=timeout_seconds))
    return results


def check_source_health(
    source: dict,
    scripts_dir: Path,
    live: bool = False,
    timeout_seconds: float = 12.0,
) -> SourceHealthResult:
    source_id = str(source.get("id"))
    parser = source.get("parser")
    script_present = (scripts_dir / f"scrape_{source_id.replace('.', '_').replace('-', '_')}.py").exists()
    start_urls = list(source.get("start_urls", []))
    pipeline_supported = source_id == "med.tn" or parser in HTML_PIPELINE_PARSERS
    checked_at = datetime.now(timezone.utc).isoformat()

    if not source.get("enabled", False):
        return SourceHealthResult(
            source_id=source_id,
            name=str(source.get("name", source_id)),
            enabled=False,
            parser=parser,
            script_present=script_present,
            pipeline_supported=pipeline_supported,
            start_urls=start_urls,
            status="DISABLED",
            message="Source inactive dans config/sources.yaml.",
            checked_at=checked_at,
        )

    if parser in DEDICATED_CONNECTOR_PARSERS:
        return SourceHealthResult(
            source_id=source_id,
            name=str(source.get("name", source_id)),
            enabled=True,
            parser=parser,
            script_present=script_present,
            pipeline_supported=False,
            start_urls=start_urls,
            status="CONNECTOR_REQUIRED",
            message=f"Source active, mais parser {parser!r} necessite un connecteur dedie avant collecte globale.",
            checked_at=checked_at,
        )

    if not pipeline_supported:
        return SourceHealthResult(
            source_id=source_id,
            name=str(source.get("name", source_id)),
            enabled=True,
            parser=parser,
            script_present=script_present,
            pipeline_supported=False,
            start_urls=start_urls,
            status="UNSUPPORTED_PARSER",
            message=f"Parser non supporte par le pipeline: {parser!r}.",
            checked_at=checked_at,
        )

    if not live:
        return SourceHealthResult(
            source_id=source_id,
            name=str(source.get("name", source_id)),
            enabled=True,
            parser=parser,
            script_present=script_present,
            pipeline_supported=True,
            start_urls=start_urls,
            status="READY_FOR_LIVE_TEST",
            message="Configuration active et parser supporte. Lancez avec --live pour tester le site.",
            checked_at=checked_at,
        )

    if not start_urls and source_id != "med.tn":
        return SourceHealthResult(
            source_id=source_id,
            name=str(source.get("name", source_id)),
            enabled=True,
            parser=parser,
            script_present=script_present,
            pipeline_supported=True,
            start_urls=start_urls,
            status="NO_START_URL",
            message="Aucune URL de depart configuree.",
            checked_at=checked_at,
        )

    urls_to_try = start_urls or [_first_med_tn_url()]
    last_error = ""
    response: httpx.Response | None = None
    url = urls_to_try[0]
    try:
        with httpx.Client(timeout=timeout_seconds, follow_redirects=True, headers=HEALTH_HEADERS) as client:
            for candidate_url in urls_to_try:
                url = candidate_url
                try:
                    response = client.get(candidate_url)
                    response.raise_for_status()
                    break
                except Exception as exc:  # noqa: BLE001
                    last_error = str(exc)
            else:
                response = None
    except Exception as exc:  # noqa: BLE001
        last_error = str(exc)

    if response is None and source_id == "sante_tunisie":
        try:
            with httpx.Client(timeout=timeout_seconds, follow_redirects=True, headers=HEALTH_HEADERS, verify=False) as client:
                response = client.get(url)
                response.raise_for_status()
        except Exception as exc:  # noqa: BLE001
            last_error = str(exc)

    if response is None:
        return SourceHealthResult(
            source_id=source_id,
            name=str(source.get("name", source_id)),
            enabled=True,
            parser=parser,
            script_present=script_present,
            pipeline_supported=True,
            start_urls=start_urls,
            status="UNREACHABLE",
            message=last_error,
            checked_at=checked_at,
        )

    profiles_detected: int | None = None
    if parser == "generic_profile":
        profiles_detected = len(extract_generic_profile_urls(response.text, url, source))

    status = "LIVE_OK"
    message = "URL de depart accessible."
    if parser == "generic_profile" and profiles_detected == 0:
        status = "LIVE_PARTIAL"
        message = "URL accessible, mais aucun profil detecte avec la regex actuelle."

    return SourceHealthResult(
        source_id=source_id,
        name=str(source.get("name", source_id)),
        enabled=True,
        parser=parser,
        script_present=script_present,
        pipeline_supported=True,
        start_urls=start_urls,
        status=status,
        message=message,
        http_status=response.status_code,
        profiles_detected=profiles_detected,
        checked_at=checked_at,
    )


def write_source_health_report(results: list[SourceHealthResult], output_dir: str | Path = "reports") -> Path:
    directory = ROOT / output_dir
    directory.mkdir(parents=True, exist_ok=True)
    payload = {
        "generated_at": datetime.now(timezone.utc).isoformat(),
        "summary": summarize_source_health(results),
        "sources": [asdict(result) for result in results],
    }
    dated_path = directory / f"source_health_{datetime.now(timezone.utc).strftime('%Y-%m-%d')}.json"
    latest_path = directory / "source_health_latest.json"
    text = json.dumps(payload, ensure_ascii=False, indent=2)
    dated_path.write_text(text, encoding="utf-8")
    latest_path.write_text(text, encoding="utf-8")
    return latest_path


def summarize_source_health(results: list[SourceHealthResult]) -> dict[str, int]:
    summary = {
        "total": len(results),
        "enabled": 0,
        "live_ok": 0,
        "partial": 0,
        "connector_required": 0,
        "unreachable": 0,
        "unsupported": 0,
        "disabled": 0,
    }
    for result in results:
        if result.enabled:
            summary["enabled"] += 1
        if result.status == "LIVE_OK":
            summary["live_ok"] += 1
        elif result.status in {"LIVE_PARTIAL", "READY_FOR_LIVE_TEST", "NO_START_URL"}:
            summary["partial"] += 1
        elif result.status == "CONNECTOR_REQUIRED":
            summary["connector_required"] += 1
        elif result.status == "UNREACHABLE":
            summary["unreachable"] += 1
        elif result.status == "UNSUPPORTED_PARSER":
            summary["unsupported"] += 1
        elif result.status == "DISABLED":
            summary["disabled"] += 1
    return summary


def _first_med_tn_url() -> str:
    governorates = settings.governorates()
    if not governorates:
        return "https://www.med.tn/medecin/dentiste/tunis"
    urls = settings.listing_urls_for(governorates[0])
    return urls[0] if urls else "https://www.med.tn/medecin/dentiste/tunis"
