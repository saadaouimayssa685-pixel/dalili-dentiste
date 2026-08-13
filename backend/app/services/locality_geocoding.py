from __future__ import annotations

import math
import re
import unicodedata
from dataclasses import dataclass
from difflib import SequenceMatcher
from typing import Iterable

from sqlalchemy import text
from sqlalchemy.orm import Session

from app.config import settings
from app.models import DentistRecord

PRECISION_LEVELS = {"exact", "street", "locality", "delegation", "governorate", "unresolved"}
TUNISIA_LAT_RANGE = (30.0, 38.5)
TUNISIA_LON_RANGE = (7.0, 12.5)
RELIABLE_CONFIDENCE = 0.9


@dataclass(frozen=True)
class LocalityReference:
    canonical_name: str
    normalized_name: str
    arabic_name: str | None
    governorate: str | None
    delegation: str | None
    postal_code: str | None
    latitude: float | None
    longitude: float | None
    aliases: tuple[str, ...]
    is_ambiguous: bool = False


@dataclass(frozen=True)
class LocalityMatch:
    original_value: str
    proposed: LocalityReference | None
    confidence: float
    status: str
    reason: str

    @property
    def is_reliable(self) -> bool:
        return (
            self.proposed is not None
            and self.status == "matched"
            and self.confidence >= RELIABLE_CONFIDENCE
            and not self.proposed.is_ambiguous
        )


@dataclass(frozen=True)
class GeocodingProposal:
    record_id: int | None
    source: str | None
    name: str | None
    original_value: str | None
    proposed_locality: str | None
    governorate: str | None
    delegation: str | None
    postal_code: str | None
    latitude: float | None
    longitude: float | None
    geocoding_status: str
    geocoding_source: str
    geocoding_precision: str
    geocoding_confidence: float
    reason: str

    @property
    def coordinates_label(self) -> str:
        if self.latitude is None or self.longitude is None:
            return ""
        return f"{self.latitude:.6f}, {self.longitude:.6f}"

    @property
    def is_reliable(self) -> bool:
        return (
            self.geocoding_status == "ready"
            and self.geocoding_confidence >= RELIABLE_CONFIDENCE
            and self.geocoding_precision in {"exact", "street", "locality"}
        )


def normalize_locality_text(value: str | None) -> str:
    if not value:
        return ""
    text_value = unicodedata.normalize("NFKD", value)
    text_value = "".join(ch for ch in text_value if not unicodedata.combining(ch))
    text_value = text_value.casefold()
    replacements = {
        "أ": "ا",
        "إ": "ا",
        "آ": "ا",
        "ى": "ي",
        "ة": "ه",
        "ؤ": "و",
        "ئ": "ي",
        "’": "'",
        "`": "'",
    }
    for old, new in replacements.items():
        text_value = text_value.replace(old, new)
    text_value = re.sub(r"\b(el|al|l)\s+", "", text_value)
    text_value = re.sub(r"[^0-9a-z\u0600-\u06ff]+", " ", text_value)
    text_value = re.sub(r"\s+", " ", text_value).strip()
    return text_value


def locality_references() -> list[LocalityReference]:
    refs = []
    for item in settings.localities_reference.get("localities", []):
        refs.append(
            LocalityReference(
                canonical_name=item.get("canonical_name") or "",
                normalized_name=normalize_locality_text(item.get("normalized_name") or item.get("canonical_name")),
                arabic_name=item.get("arabic_name"),
                governorate=item.get("governorate"),
                delegation=item.get("delegation"),
                postal_code=item.get("postal_code"),
                latitude=item.get("latitude"),
                longitude=item.get("longitude"),
                aliases=tuple(item.get("aliases") or []),
                is_ambiguous=bool(item.get("is_ambiguous", False)),
            )
        )
    return refs


def _names_for(ref: LocalityReference) -> set[str]:
    names = {ref.canonical_name, ref.normalized_name}
    if ref.arabic_name:
        names.add(ref.arabic_name)
    names.update(ref.aliases)
    return {normalize_locality_text(name) for name in names if normalize_locality_text(name)}


def match_locality(value: str | None, governorate: str | None = None) -> LocalityMatch:
    original = (value or "").strip()
    normalized = normalize_locality_text(original)
    if not normalized:
        return LocalityMatch(original, None, 0.0, "unresolved", "locality_missing")

    refs = locality_references()
    exact_matches = [ref for ref in refs if normalized in _names_for(ref)]
    if governorate:
        same_governorate = [ref for ref in exact_matches if ref.governorate == governorate or ref.governorate is None]
        if same_governorate:
            exact_matches = same_governorate
    if len(exact_matches) == 1:
        ref = exact_matches[0]
        if ref.is_ambiguous or not ref.governorate:
            return LocalityMatch(original, ref, 0.55, "ambiguous", "ambiguous_reference")
        return LocalityMatch(original, ref, 0.98, "matched", "exact_alias")
    if len(exact_matches) > 1:
        return LocalityMatch(original, None, 0.5, "ambiguous", "multiple_exact_matches")

    scored: list[tuple[float, LocalityReference]] = []
    for ref in refs:
        if governorate and ref.governorate and ref.governorate != governorate:
            continue
        score = max((SequenceMatcher(None, normalized, name).ratio() for name in _names_for(ref)), default=0.0)
        if score >= 0.82:
            scored.append((score, ref))
    scored.sort(key=lambda item: item[0], reverse=True)
    if not scored:
        return LocalityMatch(original, None, 0.0, "unresolved", "no_reference_match")
    if len(scored) > 1 and scored[0][0] - scored[1][0] < 0.04:
        return LocalityMatch(original, None, scored[0][0], "ambiguous", "near_duplicate_fuzzy_matches")
    score, ref = scored[0]
    if ref.is_ambiguous or not ref.governorate:
        return LocalityMatch(original, ref, min(score, 0.55), "ambiguous", "ambiguous_reference")
    if score >= 0.88:
        return LocalityMatch(original, ref, round(score, 3), "matched", "light_typo_fuzzy")
    return LocalityMatch(original, ref, round(score, 3), "review", "weak_fuzzy_match")


def is_coordinate_in_tunisia(latitude: float | None, longitude: float | None) -> bool:
    if latitude is None or longitude is None:
        return False
    if abs(latitude) < 0.00001 and abs(longitude) < 0.00001:
        return False
    return TUNISIA_LAT_RANGE[0] <= latitude <= TUNISIA_LAT_RANGE[1] and TUNISIA_LON_RANGE[0] <= longitude <= TUNISIA_LON_RANGE[1]


def dentist_lat_lon(record: DentistRecord) -> tuple[float | None, float | None]:
    return record.latitude, record.longitude


def _original_location_value(record: DentistRecord) -> str | None:
    values = [record.locality, record.delegation, record.address_raw, record.governorate]
    return next((value.strip() for value in values if value and value.strip()), None)


def propose_geocoding(record: DentistRecord) -> GeocodingProposal:
    original = _original_location_value(record)
    lat, lon = dentist_lat_lon(record)
    if lat is not None or lon is not None:
        if is_coordinate_in_tunisia(lat, lon):
            source = "source_coordinates" if record.google_maps_url else "existing_coordinates"
            return GeocodingProposal(
                record_id=record.id,
                source=record.source,
                name=record.full_name_source,
                original_value=original,
                proposed_locality=record.locality,
                governorate=record.governorate,
                delegation=record.delegation,
                postal_code=record.postal_code,
                latitude=lat,
                longitude=lon,
                geocoding_status="ready",
                geocoding_source=source,
                geocoding_precision="exact",
                geocoding_confidence=0.96,
                reason="valid_existing_coordinates",
            )
        return GeocodingProposal(
            record_id=record.id,
            source=record.source,
            name=record.full_name_source,
            original_value=original,
            proposed_locality=record.locality,
            governorate=record.governorate,
            delegation=record.delegation,
            postal_code=record.postal_code,
            latitude=lat,
            longitude=lon,
            geocoding_status="review",
            geocoding_source="existing_coordinates",
            geocoding_precision="unresolved",
            geocoding_confidence=0.0,
            reason="invalid_or_outside_tunisia_coordinates",
        )

    match = match_locality(original, record.governorate)
    ref = match.proposed
    if ref and match.is_reliable:
        return GeocodingProposal(
            record_id=record.id,
            source=record.source,
            name=record.full_name_source,
            original_value=match.original_value,
            proposed_locality=ref.canonical_name,
            governorate=record.governorate or ref.governorate,
            delegation=record.delegation or ref.delegation,
            postal_code=record.postal_code or ref.postal_code,
            latitude=ref.latitude,
            longitude=ref.longitude,
            geocoding_status="ready",
            geocoding_source="locality_reference",
            geocoding_precision="locality",
            geocoding_confidence=match.confidence,
            reason=match.reason,
        )
    if record.governorate:
        return GeocodingProposal(
            record_id=record.id,
            source=record.source,
            name=record.full_name_source,
            original_value=original,
            proposed_locality=ref.canonical_name if ref else None,
            governorate=record.governorate,
            delegation=record.delegation,
            postal_code=record.postal_code,
            latitude=None,
            longitude=None,
            geocoding_status="review",
            geocoding_source="governorate_only",
            geocoding_precision="governorate",
            geocoding_confidence=0.35,
            reason=match.reason,
        )
    return GeocodingProposal(
        record_id=record.id,
        source=record.source,
        name=record.full_name_source,
        original_value=original,
        proposed_locality=ref.canonical_name if ref else None,
        governorate=ref.governorate if ref else None,
        delegation=ref.delegation if ref else None,
        postal_code=ref.postal_code if ref else None,
        latitude=ref.latitude if ref else None,
        longitude=ref.longitude if ref else None,
        geocoding_status="review",
        geocoding_source="manual_review",
        geocoding_precision="unresolved",
        geocoding_confidence=match.confidence,
        reason=match.reason,
    )


def detect_shared_artificial_points(records: Iterable[DentistRecord], min_count: int = 5) -> dict[tuple[float, float], int]:
    counts: dict[tuple[float, float], int] = {}
    for record in records:
        lat, lon = dentist_lat_lon(record)
        if not is_coordinate_in_tunisia(lat, lon):
            continue
        key = (round(float(lat), 4), round(float(lon), 4))
        counts[key] = counts.get(key, 0) + 1
    return {point: count for point, count in counts.items() if count >= min_count}


def build_locality_review(records: Iterable[DentistRecord]) -> list[GeocodingProposal]:
    proposals = [propose_geocoding(record) for record in records]
    shared_points = detect_shared_artificial_points(records)
    if not shared_points:
        return proposals
    adjusted = []
    for proposal in proposals:
        if proposal.latitude is None or proposal.longitude is None:
            adjusted.append(proposal)
            continue
        point = (round(proposal.latitude, 4), round(proposal.longitude, 4))
        if point not in shared_points:
            adjusted.append(proposal)
            continue
        adjusted.append(
            GeocodingProposal(
                **{
                    **proposal.__dict__,
                    "geocoding_status": "review",
                    "geocoding_precision": "locality",
                    "geocoding_confidence": min(proposal.geocoding_confidence, 0.72),
                    "reason": "shared_artificial_point",
                }
            )
        )
    return adjusted


def review_rows(proposals: Iterable[GeocodingProposal]) -> list[dict[str, object]]:
    return [
        {
            "id": proposal.record_id,
            "nom": proposal.name,
            "valeur_originale": proposal.original_value,
            "localite_proposee": proposal.proposed_locality,
            "gouvernorat": proposal.governorate,
            "delegation": proposal.delegation,
            "code_postal": proposal.postal_code,
            "score_confiance": round(proposal.geocoding_confidence, 3),
            "coordonnees": proposal.coordinates_label,
            "source": proposal.source,
            "geocoding_source": proposal.geocoding_source,
            "precision": proposal.geocoding_precision,
            "statut": proposal.geocoding_status,
            "raison": proposal.reason,
            "fiable": proposal.is_reliable,
        }
        for proposal in proposals
    ]


def review_summary(proposals: Iterable[GeocodingProposal]) -> dict[str, int]:
    summary = {"fiables": 0, "a_verifier": 0, "invalides": 0, "non_resolus": 0}
    for proposal in proposals:
        if proposal.is_reliable:
            summary["fiables"] += 1
        elif proposal.reason == "invalid_or_outside_tunisia_coordinates":
            summary["invalides"] += 1
        elif proposal.geocoding_precision == "unresolved":
            summary["non_resolus"] += 1
        else:
            summary["a_verifier"] += 1
    return summary


def locality_options(records: Iterable[DentistRecord]) -> dict[str, list[str]]:
    delegations = {record.delegation for record in records if record.delegation}
    localities = {record.locality for record in records if record.locality}
    for ref in locality_references():
        if ref.delegation:
            delegations.add(ref.delegation)
        if ref.canonical_name and not ref.is_ambiguous:
            localities.add(ref.canonical_name)
    return {
        "delegations": sorted(delegations),
        "localities": sorted(localities),
    }


def distance_km(lat1: float | None, lon1: float | None, lat2: float | None, lon2: float | None) -> float | None:
    if None in (lat1, lon1, lat2, lon2):
        return None
    radius = 6371.0
    phi1 = math.radians(float(lat1))
    phi2 = math.radians(float(lat2))
    delta_phi = math.radians(float(lat2) - float(lat1))
    delta_lambda = math.radians(float(lon2) - float(lon1))
    a = math.sin(delta_phi / 2) ** 2 + math.cos(phi1) * math.cos(phi2) * math.sin(delta_lambda / 2) ** 2
    return radius * 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))


def reference_coordinates_for_locality(locality: str | None, governorate: str | None = None) -> tuple[float | None, float | None]:
    match = match_locality(locality, governorate)
    if match.proposed and match.proposed.latitude is not None and match.proposed.longitude is not None:
        return match.proposed.latitude, match.proposed.longitude
    return None, None


def apply_reliable_geocoding_matches(session: Session, proposals: Iterable[GeocodingProposal]) -> int:
    applied = 0
    for proposal in proposals:
        if not proposal.record_id or not proposal.is_reliable:
            continue
        session.execute(
            text(
                """
                UPDATE dentists
                SET locality = COALESCE(:locality, locality),
                    delegation = COALESCE(:delegation, delegation),
                    governorate = COALESCE(:governorate, governorate),
                    postal_code = COALESCE(:postal_code, postal_code),
                    latitude = :latitude,
                    longitude = :longitude,
                    geocoding_status = :status,
                    geocoding_source = :source,
                    geocoding_precision = :precision,
                    geocoding_confidence = :confidence
                WHERE id = :id
                """
            ),
            {
                "id": proposal.record_id,
                "locality": proposal.proposed_locality,
                "delegation": proposal.delegation,
                "governorate": proposal.governorate,
                "postal_code": proposal.postal_code,
                "latitude": proposal.latitude,
                "longitude": proposal.longitude,
                "status": "validated_auto",
                "source": proposal.geocoding_source,
                "precision": proposal.geocoding_precision,
                "confidence": proposal.geocoding_confidence,
            },
        )
        applied += 1
    session.commit()
    return applied


def apply_manual_geocoding(
    session: Session,
    record_id: int,
    *,
    locality: str | None,
    governorate: str | None,
    delegation: str | None,
    postal_code: str | None,
    latitude: float | None,
    longitude: float | None,
    status: str,
) -> None:
    precision = "locality" if is_coordinate_in_tunisia(latitude, longitude) else "unresolved"
    session.execute(
        text(
            """
            UPDATE dentists
            SET locality = :locality,
                delegation = :delegation,
                governorate = :governorate,
                postal_code = :postal_code,
                latitude = :latitude,
                longitude = :longitude,
                geocoding_status = :status,
                geocoding_source = 'manual_validation',
                geocoding_precision = :precision,
                geocoding_confidence = :confidence
            WHERE id = :id
            """
        ),
        {
            "id": record_id,
            "locality": locality,
            "delegation": delegation,
            "governorate": governorate,
            "postal_code": postal_code,
            "latitude": latitude,
            "longitude": longitude,
            "status": status,
            "precision": precision,
            "confidence": 1.0 if status == "validated_manual" else 0.0,
        },
    )
    session.commit()
