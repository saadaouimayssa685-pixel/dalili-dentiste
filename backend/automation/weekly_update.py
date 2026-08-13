from __future__ import annotations

import argparse
import json
import logging
import time
import uuid
from dataclasses import asdict, dataclass, field
from datetime import datetime, timezone
from pathlib import Path
from typing import Iterable
from zoneinfo import ZoneInfo

import pandas as pd
from sqlalchemy import text

from app.config import ROOT, settings
from app.database import SessionLocal, init_db, list_dentists, list_unique_dentists, rebuild_unique_dentists
from app.models import DentistRecord
from app.services.locality_geocoding import build_locality_review, review_rows
from app.services.pipeline import ScrapingPipeline
from app.services.unique_dentists import build_unique_dentists
from automation.backup_manager import BackupManager, BackupMetadata
from automation.config import WeeklyUpdateConfig
from automation.lock_manager import WeeklyUpdateLock
from automation.notification_manager import notify_failure, notify_success
from automation.scheduler import next_scheduled_run

log = logging.getLogger(__name__)


@dataclass
class SourceRunResult:
    source_id: str
    status: str = "NOT_RUN"
    started_at: str | None = None
    finished_at: str | None = None
    pages_visited: int = 0
    profiles_detected: int = 0
    rows_collected: int = 0
    new_records: int = 0
    updated_records: int = 0
    duplicates_found: int = 0
    errors: int = 0
    duration_seconds: float = 0.0
    message: str = ""


@dataclass
class WeeklyRunResult:
    run_id: str
    status: str
    started_at: str
    finished_at: str | None = None
    timezone: str = "Africa/Tunis"
    dry_run: bool = False
    backup_path: str | None = None
    report_path: str | None = None
    export_path: str | None = None
    rows_collected: int = 0
    new_records: int = 0
    updated_records: int = 0
    unchanged_records: int = 0
    duplicates_found: int = 0
    records_needing_review: int = 0
    records_rejected: int = 0
    phones_missing: int = 0
    coordinates_missing: int = 0
    localities_unrecognized: int = 0
    specialties_unrecognized: int = 0
    sources: list[SourceRunResult] = field(default_factory=list)
    errors: list[str] = field(default_factory=list)


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description="Run Dalili Dentiste weekly update.")
    parser.add_argument("--dry-run", action="store_true", help="Simulate collection and reporting without publication.")
    parser.add_argument("--trigger-type", default="manual", choices=["manual", "scheduled", "test"])
    parser.add_argument("--max-sources", type=int, default=None)
    parser.add_argument("--max-profiles-per-source", type=int, default=None)
    args = parser.parse_args(argv)

    logging.basicConfig(level=getattr(logging, settings.log_level.upper(), logging.INFO))
    config = WeeklyUpdateConfig.from_env()
    if args.max_sources is not None or args.max_profiles_per_source is not None:
        config = WeeklyUpdateConfig(
            **{
                **asdict(config),
                "max_sources": args.max_sources if args.max_sources is not None else config.max_sources,
                "max_profiles_per_source": (
                    args.max_profiles_per_source
                    if args.max_profiles_per_source is not None
                    else config.max_profiles_per_source
                ),
            }
        )
    result = WeeklyUpdateRunner(config).run(dry_run=args.dry_run or config.dry_run, trigger_type=args.trigger_type)
    print(json.dumps(_jsonable(asdict(result)), ensure_ascii=False, indent=2))
    return 0 if result.status in {"SUCCESS", "PARTIAL_SUCCESS", "SKIPPED"} else 1


class WeeklyUpdateRunner:
    def __init__(self, config: WeeklyUpdateConfig | None = None) -> None:
        self.config = config or WeeklyUpdateConfig.from_env()

    def run(self, dry_run: bool = False, trigger_type: str = "manual") -> WeeklyRunResult:
        run_id = str(uuid.uuid4())
        started = datetime.now(ZoneInfo(self.config.timezone))
        result = WeeklyRunResult(
            run_id=run_id,
            status="RUNNING",
            started_at=started.isoformat(),
            timezone=self.config.timezone,
            dry_run=dry_run,
        )
        lock = WeeklyUpdateLock(Path(self.config.runtime_root) / "weekly_update.lock", self.config.lock_stale_hours)
        lock_result = lock.acquire(run_id)
        if not lock_result.acquired:
            result.status = "SKIPPED"
            result.errors.append(lock_result.status)
            result.finished_at = datetime.now(ZoneInfo(self.config.timezone)).isoformat()
            return result

        backup: BackupMetadata | None = None
        try:
            init_db()
            ensure_automation_tables()
            reset_staging_tables()
            backup = BackupManager(self.config.backups_root, self.config.backup_retention_weeks).create_backup(run_id)
            result.backup_path = str(backup.path)
            _insert_run_started(result, trigger_type)

            sources = settings.source_configs(enabled_only=True)
            if self.config.max_sources:
                sources = sources[: self.config.max_sources]
            if not sources:
                result.status = "FAILED"
                result.errors.append("NO_ACTIVE_SOURCE")
                return self._finish(result, trigger_type, backup)

            before_records = _records_by_key(_safe_unique_records())
            collected_records = self._collect_sources(sources, result, dry_run)
            staged_records = self._stage_and_validate(collected_records, result)
            unique_preview = build_unique_dentists([*before_records.values(), *staged_records])
            result.duplicates_found = max(0, len([*before_records.values(), *staged_records]) - len(unique_preview))
            _write_staging_duplicates(result.run_id, result.duplicates_found)

            comparison = _compare_records(before_records, staged_records)
            result.new_records = comparison["new"]
            result.updated_records = comparison["updated"]
            result.unchanged_records = comparison["unchanged"]

            if dry_run:
                result.status = "SUCCESS"
            else:
                self._publish_transactionally()
                result.status = "SUCCESS"

            return self._finish(result, trigger_type, backup)
        except Exception as exc:  # noqa: BLE001
            log.exception("weekly_update_failed")
            result.status = "FAILED"
            result.errors.append(str(exc))
            notify_failure("La mise à jour Dalili a échoué. La base précédente a été conservée.")
            return self._finish(result, trigger_type, backup)
        finally:
            lock.release(run_id, result.status)

    def _collect_sources(
        self,
        sources: list[dict],
        result: WeeklyRunResult,
        dry_run: bool,
    ) -> list[DentistRecord]:
        collected: list[DentistRecord] = []
        for source in sources:
            source_id = source["id"]
            source_result = SourceRunResult(source_id=source_id, started_at=_now_iso(self.config.timezone))
            started = time.perf_counter()
            try:
                if dry_run:
                    sample = [record for record in _safe_all_records() if source_id in (record.source or "")]
                    if self.config.max_profiles_per_source:
                        sample = sample[: self.config.max_profiles_per_source]
                    source_result.status = "SUCCESS"
                    source_result.message = "dry_run_sample_from_existing_database"
                    source_result.profiles_detected = len(sample)
                    source_result.rows_collected = len(sample)
                    collected.extend(sample)
                else:
                    with SessionLocal() as session:
                        pipeline = ScrapingPipeline(session, ROOT / self.config.output_root / result.run_id / source_id)
                        limit = self.config.max_profiles_per_source
                        if source_id in {"med.tn", "tunisie_dentiste"}:
                            records_for_source = []
                            for governorate in settings.governorates():
                                summary, _paths = pipeline.run_sources([source_id], governorate, limit)
                                source_result.profiles_detected += summary.profiles_detected
                                source_result.rows_collected += summary.profiles_scraped
                                records_for_source.extend(list_dentists(session))
                            collected.extend(records_for_source)
                        else:
                            summary, _paths = pipeline.run_sources([source_id], None, limit)
                            source_result.profiles_detected = summary.profiles_detected
                            source_result.rows_collected = summary.profiles_scraped
                            collected.extend(list_dentists(session))
                        source_result.status = "SUCCESS" if source_result.errors == 0 else "PARTIAL_SUCCESS"
            except Exception as exc:  # noqa: BLE001
                source_result.status = "FAILED"
                source_result.errors += 1
                source_result.message = str(exc)
                result.errors.append(f"{source_id}: {exc}")
            finally:
                source_result.duration_seconds = round(time.perf_counter() - started, 3)
                source_result.finished_at = _now_iso(self.config.timezone)
                result.sources.append(source_result)
                _insert_source_result(result.run_id, source_result)
        result.rows_collected = len(collected)
        return collected

    def _stage_and_validate(self, records: list[DentistRecord], result: WeeklyRunResult) -> list[DentistRecord]:
        proposals = build_locality_review(records)
        proposal_by_id = {proposal.record_id: proposal for proposal in proposals if proposal.record_id}
        staged: list[DentistRecord] = []
        with SessionLocal() as session:
            for record in records:
                proposal = proposal_by_id.get(record.id)
                quality = _quality_scores(record, proposal)
                if quality["publication_status"] == "ready":
                    staged.append(record)
                elif quality["publication_status"] == "needs_review":
                    result.records_needing_review += 1
                else:
                    result.records_rejected += 1
                if not record.primary_phone:
                    result.phones_missing += 1
                if not record.latitude:
                    result.coordinates_missing += 1
                if not record.locality:
                    result.localities_unrecognized += 1
                if not record.specialties:
                    result.specialties_unrecognized += 1
                session.execute(
                    text(
                        """
                        INSERT INTO staging_dentists (
                            run_id, source, source_profile_url, full_name_source, governorate,
                            locality, primary_phone, quality_score, completeness_score,
                            matching_confidence, geolocation_confidence, publication_status,
                            payload_json, created_at
                        )
                        VALUES (
                            :run_id, :source, :source_profile_url, :full_name_source, :governorate,
                            :locality, :primary_phone, :quality_score, :completeness_score,
                            :matching_confidence, :geolocation_confidence, :publication_status,
                            :payload_json, :created_at
                        )
                        """
                    ),
                    {
                        "run_id": result.run_id,
                        "source": record.source,
                        "source_profile_url": record.source_profile_url,
                        "full_name_source": record.full_name_source,
                        "governorate": record.governorate,
                        "locality": record.locality,
                        "primary_phone": record.primary_phone,
                        **quality,
                        "payload_json": json.dumps(record.to_storage(), ensure_ascii=False, default=str),
                        "created_at": datetime.now(timezone.utc).isoformat(),
                    },
                )
            for row in review_rows(proposals):
                if row["statut"] != "ready" or not row["fiable"]:
                    session.execute(
                        text(
                            """
                            INSERT INTO staging_locations (
                                run_id, original_location, normalized_location, governorate,
                                location_confidence, location_status, payload_json, created_at
                            )
                            VALUES (:run_id, :original_location, :normalized_location, :governorate,
                                    :location_confidence, :location_status, :payload_json, :created_at)
                            """
                        ),
                        {
                            "run_id": result.run_id,
                            "original_location": row.get("valeur_originale"),
                            "normalized_location": row.get("localite_proposee"),
                            "governorate": row.get("gouvernorat"),
                            "location_confidence": row.get("score_confiance"),
                            "location_status": row.get("statut"),
                            "payload_json": json.dumps(row, ensure_ascii=False, default=str),
                            "created_at": datetime.now(timezone.utc).isoformat(),
                        },
                    )
            session.commit()
        return staged

    def _publish_transactionally(self) -> None:
        with SessionLocal() as session:
            try:
                rebuild_unique_dentists(session)
                session.commit()
            except Exception:
                session.rollback()
                raise

    def _finish(
        self,
        result: WeeklyRunResult,
        trigger_type: str,
        backup: BackupMetadata | None,
    ) -> WeeklyRunResult:
        result.finished_at = datetime.now(ZoneInfo(self.config.timezone)).isoformat()
        export_dir = ROOT / self.config.output_root / result.run_id
        if result.status in {"SUCCESS", "PARTIAL_SUCCESS"}:
            export_dir.mkdir(parents=True, exist_ok=True)
            result.export_path = str(export_dir)
            _write_weekly_exports(export_dir)
        report_paths = write_report(result, self.config, backup)
        result.report_path = str(report_paths["md"])
        _update_run_finished(result, trigger_type)
        if result.status == "SUCCESS":
            notify_success(
                f"Mise à jour Dalili terminée : {result.new_records} nouvelles fiches, "
                f"{result.updated_records} mises à jour et {result.records_needing_review} cas à vérifier."
            )
        return result


def ensure_automation_tables() -> None:
    statements = [
        """
        CREATE TABLE IF NOT EXISTS scheduled_runs (
            run_id TEXT PRIMARY KEY,
            job_name TEXT,
            scheduled_at TEXT,
            started_at TEXT,
            finished_at TEXT,
            timezone TEXT,
            status TEXT,
            trigger_type TEXT,
            sources_total INTEGER,
            sources_success INTEGER,
            sources_failed INTEGER,
            rows_collected INTEGER,
            new_records INTEGER,
            updated_records INTEGER,
            unchanged_records INTEGER,
            duplicates_found INTEGER,
            records_needing_review INTEGER,
            records_rejected INTEGER,
            backup_path TEXT,
            report_path TEXT,
            export_path TEXT,
            error_summary TEXT,
            created_at TEXT
        )
        """,
        """
        CREATE TABLE IF NOT EXISTS scheduled_run_sources (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            run_id TEXT,
            source_id TEXT,
            status TEXT,
            started_at TEXT,
            finished_at TEXT,
            pages_visited INTEGER,
            profiles_detected INTEGER,
            rows_collected INTEGER,
            new_records INTEGER,
            updated_records INTEGER,
            duplicates_found INTEGER,
            errors INTEGER,
            duration_seconds REAL,
            message TEXT
        )
        """,
        """
        CREATE TABLE IF NOT EXISTS staging_dentists (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            run_id TEXT,
            source TEXT,
            source_profile_url TEXT,
            full_name_source TEXT,
            governorate TEXT,
            locality TEXT,
            primary_phone TEXT,
            quality_score REAL,
            completeness_score REAL,
            matching_confidence REAL,
            geolocation_confidence REAL,
            publication_status TEXT,
            payload_json TEXT,
            created_at TEXT
        )
        """,
        """
        CREATE TABLE IF NOT EXISTS staging_locations (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            run_id TEXT,
            original_location TEXT,
            normalized_location TEXT,
            governorate TEXT,
            location_confidence REAL,
            location_status TEXT,
            payload_json TEXT,
            created_at TEXT
        )
        """,
        """
        CREATE TABLE IF NOT EXISTS staging_errors (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            run_id TEXT,
            source TEXT,
            error_type TEXT,
            message TEXT,
            created_at TEXT
        )
        """,
        """
        CREATE TABLE IF NOT EXISTS staging_duplicates (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            run_id TEXT,
            duplicate_count INTEGER,
            payload_json TEXT,
            created_at TEXT
        )
        """,
    ]
    with SessionLocal() as session:
        for statement in statements:
            session.execute(text(statement))
        session.commit()


def reset_staging_tables() -> None:
    with SessionLocal() as session:
        for table in ["staging_dentists", "staging_locations", "staging_errors", "staging_duplicates"]:
            session.execute(text(f"DELETE FROM {table}"))
        session.commit()


def write_report(
    result: WeeklyRunResult,
    config: WeeklyUpdateConfig,
    backup: BackupMetadata | None,
) -> dict[str, Path]:
    report_dir = ROOT / config.reports_root
    report_dir.mkdir(parents=True, exist_ok=True)
    date_slug = datetime.now(ZoneInfo(config.timezone)).strftime("%Y-%m-%d")
    json_path = report_dir / f"weekly_update_{date_slug}.json"
    md_path = report_dir / f"weekly_update_{date_slug}.md"
    payload = _jsonable(asdict(result))
    payload["next_scheduled_run"] = next_scheduled_run(config=config).isoformat()
    payload["backup"] = _jsonable(asdict(backup)) if backup else None
    json_path.write_text(json.dumps(payload, ensure_ascii=False, indent=2), encoding="utf-8")
    lines = [
        f"# Rapport mise à jour Dalili - {date_slug}",
        "",
        f"- Statut: {result.status}",
        f"- Run ID: {result.run_id}",
        f"- Fuseau: {result.timezone}",
        f"- Mode simulation: {result.dry_run}",
        f"- Sauvegarde: {result.backup_path or '-'}",
        f"- Exports: {result.export_path or '-'}",
        "",
        "## Synthèse",
        "",
        f"- Lignes collectées: {result.rows_collected}",
        f"- Nouvelles fiches: {result.new_records}",
        f"- Fiches mises à jour: {result.updated_records}",
        f"- Fiches inchangées: {result.unchanged_records}",
        f"- Doublons détectés: {result.duplicates_found}",
        f"- Cas à vérifier: {result.records_needing_review}",
        f"- Lignes rejetées: {result.records_rejected}",
        f"- Téléphones manquants: {result.phones_missing}",
        f"- Coordonnées manquantes: {result.coordinates_missing}",
        f"- Localités non reconnues: {result.localities_unrecognized}",
        f"- Spécialités non reconnues: {result.specialties_unrecognized}",
        "",
        "## Sources",
        "",
    ]
    for source in result.sources:
        lines.append(f"- {source.source_id}: {source.status}, {source.rows_collected} lignes, erreurs {source.errors}")
    if result.errors:
        lines.extend(["", "## Erreurs", ""])
        lines.extend(f"- {error}" for error in result.errors)
    md_path.write_text("\n".join(lines) + "\n", encoding="utf-8")
    return {"json": json_path, "md": md_path}


def _write_weekly_exports(export_dir: Path) -> None:
    with SessionLocal() as session:
        records = list_unique_dentists(session)
    date_slug = datetime.now().strftime("%Y-%m-%d")
    rows = [_record_export_row(record) for record in records]
    df = pd.DataFrame(rows)
    df.to_csv(export_dir / f"dentists_unique_{date_slug}.csv", index=False, encoding="utf-8-sig")
    _to_excel(df, export_dir / f"dentists_unique_{date_slug}.xlsx")
    quality_df = df[df.isna().any(axis=1)] if not df.empty else df
    _to_excel(quality_df, export_dir / f"quality_issues_{date_slug}.xlsx")
    duplicate_df = df[df.get("duplicate_group_id", pd.Series(dtype=str)).notna()] if not df.empty else df
    _to_excel(duplicate_df, export_dir / f"duplicates_{date_slug}.xlsx")


def _to_excel(df: pd.DataFrame, path: Path) -> None:
    try:
        df.to_excel(path, index=False)
    except ImportError:
        df.to_csv(path.with_suffix(".csv"), index=False, encoding="utf-8-sig")


def _record_export_row(record: DentistRecord) -> dict[str, object]:
    data = record.to_storage()
    data["specialties"] = " | ".join(record.specialties)
    data["phone_numbers"] = " | ".join(phone.normalized or phone.raw for phone in record.phone_numbers)
    return data


def _quality_scores(record: DentistRecord, proposal) -> dict[str, float | str]:
    checks = [
        bool(record.full_name_source),
        bool(record.specialties),
        bool(record.address_raw or record.locality),
        bool(record.governorate),
        bool(record.primary_phone),
        bool(record.source),
        bool(record.source_profile_url),
    ]
    completeness = sum(checks) / len(checks)
    geolocation_confidence = float(getattr(proposal, "geocoding_confidence", 0.0) or 0.0)
    quality_score = round((completeness * 0.75) + (geolocation_confidence * 0.25), 3)
    status = "ready" if quality_score >= 0.72 and record.full_name_source and record.source else "needs_review"
    if not record.full_name_source or not record.source:
        status = "rejected"
    return {
        "quality_score": quality_score,
        "completeness_score": round(completeness, 3),
        "matching_confidence": 1.0 if record.primary_phone else 0.65,
        "geolocation_confidence": geolocation_confidence,
        "publication_status": status,
    }


def _compare_records(before: dict[str, DentistRecord], staged: Iterable[DentistRecord]) -> dict[str, int]:
    stats = {"new": 0, "updated": 0, "unchanged": 0}
    for record in staged:
        key = _record_key(record)
        existing = before.get(key)
        if existing is None:
            stats["new"] += 1
        elif record.to_storage() == existing.to_storage():
            stats["unchanged"] += 1
        else:
            stats["updated"] += 1
    return stats


def _records_by_key(records: Iterable[DentistRecord]) -> dict[str, DentistRecord]:
    return {_record_key(record): record for record in records}


def _record_key(record: DentistRecord) -> str:
    return record.primary_phone or record.source_profile_url or "|".join(
        [record.full_name_source or "", record.governorate or "", record.locality or ""]
    ).casefold()


def _safe_unique_records() -> list[DentistRecord]:
    with SessionLocal() as session:
        return list_unique_dentists(session)


def _safe_all_records() -> list[DentistRecord]:
    with SessionLocal() as session:
        return list_dentists(session)


def _insert_run_started(result: WeeklyRunResult, trigger_type: str) -> None:
    with SessionLocal() as session:
        session.execute(
            text(
                """
                INSERT OR REPLACE INTO scheduled_runs (
                    run_id, job_name, scheduled_at, started_at, timezone, status, trigger_type,
                    backup_path, created_at
                )
                VALUES (:run_id, :job_name, :scheduled_at, :started_at, :timezone, :status, :trigger_type,
                        :backup_path, :created_at)
                """
            ),
            {
                "run_id": result.run_id,
                "job_name": WeeklyUpdateConfig.from_env().job_name,
                "scheduled_at": next_scheduled_run().isoformat(),
                "started_at": result.started_at,
                "timezone": result.timezone,
                "status": result.status,
                "trigger_type": trigger_type,
                "backup_path": result.backup_path,
                "created_at": datetime.now(timezone.utc).isoformat(),
            },
        )
        session.commit()


def _insert_source_result(run_id: str, source: SourceRunResult) -> None:
    with SessionLocal() as session:
        session.execute(
            text(
                """
                INSERT INTO scheduled_run_sources (
                    run_id, source_id, status, started_at, finished_at, pages_visited, profiles_detected,
                    rows_collected, new_records, updated_records, duplicates_found, errors,
                    duration_seconds, message
                )
                VALUES (:run_id, :source_id, :status, :started_at, :finished_at, :pages_visited,
                        :profiles_detected, :rows_collected, :new_records, :updated_records,
                        :duplicates_found, :errors, :duration_seconds, :message)
                """
            ),
            {"run_id": run_id, **asdict(source)},
        )
        session.commit()


def _update_run_finished(result: WeeklyRunResult, trigger_type: str) -> None:
    with SessionLocal() as session:
        session.execute(
            text(
                """
                UPDATE scheduled_runs
                SET finished_at = :finished_at,
                    status = :status,
                    trigger_type = :trigger_type,
                    sources_total = :sources_total,
                    sources_success = :sources_success,
                    sources_failed = :sources_failed,
                    rows_collected = :rows_collected,
                    new_records = :new_records,
                    updated_records = :updated_records,
                    unchanged_records = :unchanged_records,
                    duplicates_found = :duplicates_found,
                    records_needing_review = :records_needing_review,
                    records_rejected = :records_rejected,
                    backup_path = :backup_path,
                    report_path = :report_path,
                    export_path = :export_path,
                    error_summary = :error_summary
                WHERE run_id = :run_id
                """
            ),
            {
                "run_id": result.run_id,
                "finished_at": result.finished_at,
                "status": result.status,
                "trigger_type": trigger_type,
                "sources_total": len(result.sources),
                "sources_success": len([source for source in result.sources if source.status == "SUCCESS"]),
                "sources_failed": len([source for source in result.sources if source.status == "FAILED"]),
                "rows_collected": result.rows_collected,
                "new_records": result.new_records,
                "updated_records": result.updated_records,
                "unchanged_records": result.unchanged_records,
                "duplicates_found": result.duplicates_found,
                "records_needing_review": result.records_needing_review,
                "records_rejected": result.records_rejected,
                "backup_path": result.backup_path,
                "report_path": result.report_path,
                "export_path": result.export_path,
                "error_summary": "\n".join(result.errors),
            },
        )
        session.commit()


def _write_staging_duplicates(run_id: str, duplicate_count: int) -> None:
    with SessionLocal() as session:
        session.execute(
            text(
                """
                INSERT INTO staging_duplicates (run_id, duplicate_count, payload_json, created_at)
                VALUES (:run_id, :duplicate_count, :payload_json, :created_at)
                """
            ),
            {
                "run_id": run_id,
                "duplicate_count": duplicate_count,
                "payload_json": json.dumps({"duplicate_count": duplicate_count}),
                "created_at": datetime.now(timezone.utc).isoformat(),
            },
        )
        session.commit()


def _now_iso(timezone_name: str) -> str:
    return datetime.now(ZoneInfo(timezone_name)).isoformat()


def _jsonable(value):
    if isinstance(value, Path):
        return str(value)
    if isinstance(value, datetime):
        return value.isoformat()
    if isinstance(value, dict):
        return {key: _jsonable(item) for key, item in value.items()}
    if isinstance(value, list):
        return [_jsonable(item) for item in value]
    return value


if __name__ == "__main__":
    raise SystemExit(main())
