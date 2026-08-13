from __future__ import annotations

import json
from dataclasses import dataclass
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

from sqlalchemy import text
from sqlalchemy.orm import Session

from app.config import ROOT, settings
from app.normalization.text import normalize_text


RELEVANT_TABLE = "relevant_dentists"
CLEAN_TABLE = "dentists_clean"


@dataclass(frozen=True)
class RelevantBuildSummary:
    source_rows: int
    relevant_rows: int
    review_rows: int
    rejected_rows: int
    high_quality_rows: int
    medium_quality_rows: int
    report_path: str


def build_relevant_database(session: Session, min_score: int = 50) -> RelevantBuildSummary:
    _ensure_relevant_table(session)
    _ensure_clean_table(session)
    rows = session.execute(text("SELECT * FROM unique_dentists")).mappings().all()
    active_sources = _active_sources()
    relevant: list[dict[str, Any]] = []
    review: list[dict[str, Any]] = []
    rejected = 0
    high_quality = 0
    medium_quality = 0

    for row in rows:
        payload = dict(row)
        quality = score_relevance(payload, active_sources)
        if quality["status"] == "REJECTED":
            rejected += 1
            continue
        if quality["score"] < min_score:
            review.append(_review_payload(payload, quality))
            continue
        if quality["status"] == "HIGH":
            high_quality += 1
        else:
            medium_quality += 1
        relevant.append(_relevant_payload(payload, quality))

    session.execute(text(f"DELETE FROM {RELEVANT_TABLE}"))
    if relevant:
        columns = list(relevant[0].keys())
        statement = text(
            f"INSERT INTO {RELEVANT_TABLE} ({', '.join(columns)}) "
            f"VALUES ({', '.join(':' + column for column in columns)})"
        )
        session.execute(statement, relevant)
    _rebuild_clean_table(session)
    session.commit()

    report_path = _write_report(rows=len(rows), relevant=relevant, review=review, rejected=rejected)
    return RelevantBuildSummary(
        source_rows=len(rows),
        relevant_rows=len(relevant),
        review_rows=len(review),
        rejected_rows=rejected,
        high_quality_rows=high_quality,
        medium_quality_rows=medium_quality,
        report_path=str(report_path),
    )


def score_relevance(row: dict[str, Any], active_sources: set[str] | None = None) -> dict[str, Any]:
    active_sources = active_sources or set()
    reasons: list[str] = []
    penalties: list[str] = []
    score = 0

    source_parts = _source_parts(row.get("source"))
    if not source_parts:
        return {"score": 0, "status": "REJECTED", "reasons": ["source_absente"]}
    if any(source not in active_sources for source in source_parts):
        return {"score": 0, "status": "REJECTED", "reasons": ["source_inactive"]}

    name = str(row.get("full_name_source") or "").strip()
    title = str(row.get("professional_title_exact") or "").strip()
    specialties = _json_list(row.get("specialties"))
    haystack = normalize_text(" ".join([name, title, " ".join(specialties), str(row.get("source_profile_url") or "")]))

    if not name or len(normalize_text(name).split()) < 2:
        return {"score": 0, "status": "REJECTED", "reasons": ["nom_absent_ou_trop_court"]}
    if not ("dent" in haystack or "orthodont" in haystack):
        return {"score": 0, "status": "REJECTED", "reasons": ["pas_un_dentiste_detecte"]}

    score += 25
    reasons.append("profil_dentiste")

    if row.get("governorate"):
        score += 15
        reasons.append("gouvernorat_present")
    else:
        penalties.append("gouvernorat_absent")

    if row.get("locality") or row.get("delegation"):
        score += 10
        reasons.append("localite_ou_delegation")

    if row.get("primary_phone"):
        score += 20
        reasons.append("telephone_present")
        if str(row.get("phone_validation_status") or "").upper() == "VALID" or str(row.get("primary_phone")).startswith("+216"):
            score += 5
            reasons.append("telephone_tunisien")
    else:
        penalties.append("telephone_absent")

    if row.get("address_raw") or row.get("address_normalized"):
        score += 15
        reasons.append("adresse_presente")
    else:
        penalties.append("adresse_absente")

    if specialties:
        score += 5
        reasons.append("specialite_presente")

    if len(source_parts) > 1:
        score += 10
        reasons.append("confirme_multi_source")

    if _has_valid_coordinates(row):
        score += 10
        reasons.append("coordonnees_valides")
    elif row.get("latitude") is not None or row.get("longitude") is not None:
        penalties.append("coordonnees_invalides")

    score = min(score, 100)
    if score >= 75:
        status = "HIGH"
    elif score >= 50:
        status = "MEDIUM"
    else:
        status = "REVIEW"
    return {"score": score, "status": status, "reasons": reasons + penalties}


def _ensure_relevant_table(session: Session) -> None:
    session.execute(
        text(
            f"""
            CREATE TABLE IF NOT EXISTS {RELEVANT_TABLE} (
                id INTEGER PRIMARY KEY,
                unique_dentist_id INTEGER,
                source TEXT,
                source_count INTEGER,
                full_name TEXT NOT NULL,
                title TEXT,
                specialties TEXT,
                governorate TEXT,
                delegation TEXT,
                locality TEXT,
                address TEXT,
                primary_phone TEXT,
                google_maps_url TEXT,
                latitude FLOAT,
                longitude FLOAT,
                quality_score INTEGER NOT NULL,
                quality_status TEXT NOT NULL,
                quality_reasons TEXT NOT NULL,
                source_profile_url TEXT,
                updated_at TEXT NOT NULL
            )
            """
        )
    )
    session.commit()


def _ensure_clean_table(session: Session) -> None:
    session.execute(
        text(
            f"""
            CREATE TABLE IF NOT EXISTS {CLEAN_TABLE} (
                id INTEGER PRIMARY KEY,
                full_name TEXT NOT NULL,
                title TEXT,
                specialties TEXT,
                governorate TEXT,
                delegation TEXT,
                locality TEXT,
                address TEXT,
                phone TEXT,
                google_maps_url TEXT,
                latitude FLOAT,
                longitude FLOAT,
                sources TEXT,
                source_count INTEGER,
                quality_score INTEGER NOT NULL,
                quality_status TEXT NOT NULL,
                updated_at TEXT NOT NULL
            )
            """
        )
    )
    session.commit()


def _rebuild_clean_table(session: Session) -> None:
    session.execute(text(f"DELETE FROM {CLEAN_TABLE}"))
    session.execute(
        text(
            f"""
            INSERT INTO {CLEAN_TABLE} (
                id,
                full_name,
                title,
                specialties,
                governorate,
                delegation,
                locality,
                address,
                phone,
                google_maps_url,
                latitude,
                longitude,
                sources,
                source_count,
                quality_score,
                quality_status,
                updated_at
            )
            SELECT
                id,
                full_name,
                title,
                specialties,
                governorate,
                delegation,
                locality,
                address,
                primary_phone,
                google_maps_url,
                latitude,
                longitude,
                source,
                source_count,
                quality_score,
                quality_status,
                updated_at
            FROM {RELEVANT_TABLE}
            ORDER BY governorate, locality, full_name
            """
        )
    )


def _relevant_payload(row: dict[str, Any], quality: dict[str, Any]) -> dict[str, Any]:
    lat, lon = _best_coordinates(row)
    return {
        "unique_dentist_id": row.get("id"),
        "source": row.get("source"),
        "source_count": len(_source_parts(row.get("source"))),
        "full_name": row.get("full_name_source"),
        "title": row.get("professional_title_exact"),
        "specialties": json.dumps(_json_list(row.get("specialties")), ensure_ascii=False),
        "governorate": row.get("governorate"),
        "delegation": row.get("delegation"),
        "locality": row.get("locality"),
        "address": row.get("address_normalized") or row.get("address_raw"),
        "primary_phone": row.get("primary_phone"),
        "google_maps_url": row.get("google_maps_url"),
        "latitude": lat,
        "longitude": lon,
        "quality_score": quality["score"],
        "quality_status": quality["status"],
        "quality_reasons": json.dumps(quality["reasons"], ensure_ascii=False),
        "source_profile_url": row.get("source_profile_url"),
        "updated_at": datetime.now(timezone.utc).isoformat(),
    }


def _review_payload(row: dict[str, Any], quality: dict[str, Any]) -> dict[str, Any]:
    return {
        "id": row.get("id"),
        "source": row.get("source"),
        "full_name": row.get("full_name_source"),
        "governorate": row.get("governorate"),
        "phone": row.get("primary_phone"),
        "score": quality["score"],
        "status": quality["status"],
        "reasons": quality["reasons"],
    }


def _write_report(rows: int, relevant: list[dict[str, Any]], review: list[dict[str, Any]], rejected: int) -> Path:
    report_dir = ROOT / "reports"
    report_dir.mkdir(parents=True, exist_ok=True)
    payload = {
        "generated_at": datetime.now(timezone.utc).isoformat(),
        "source_rows": rows,
        "relevant_rows": len(relevant),
        "review_rows": len(review),
        "rejected_rows": rejected,
        "high_quality_rows": sum(1 for row in relevant if row["quality_status"] == "HIGH"),
        "medium_quality_rows": sum(1 for row in relevant if row["quality_status"] == "MEDIUM"),
        "review_sample": review[:100],
    }
    path = report_dir / "relevant_database_report.json"
    path.write_text(json.dumps(payload, ensure_ascii=False, indent=2), encoding="utf-8")
    return path


def _active_sources() -> set[str]:
    return {str(source["id"]) for source in settings.source_configs(enabled_only=True)}


def _source_parts(value: Any) -> list[str]:
    return [part.strip() for part in str(value or "").split("|") if part and part.strip()]


def _json_list(value: Any) -> list[str]:
    if not value:
        return []
    if isinstance(value, list):
        return [str(item) for item in value if item]
    try:
        parsed = json.loads(str(value))
    except json.JSONDecodeError:
        return [str(value)]
    return [str(item) for item in parsed if item] if isinstance(parsed, list) else []


def _best_coordinates(row: dict[str, Any]) -> tuple[float | None, float | None]:
    lat = row.get("latitude")
    lon = row.get("longitude")
    if _is_tunisia_coordinate(lat, lon):
        return float(lat), float(lon)
    return None, None


def _has_valid_coordinates(row: dict[str, Any]) -> bool:
    lat, lon = _best_coordinates(row)
    return lat is not None and lon is not None


def _is_tunisia_coordinate(lat: Any, lon: Any) -> bool:
    try:
        lat_f = float(lat)
        lon_f = float(lon)
    except (TypeError, ValueError):
        return False
    if lat_f == 0 and lon_f == 0:
        return False
    return 30.0 <= lat_f <= 38.5 and 7.0 <= lon_f <= 12.5
