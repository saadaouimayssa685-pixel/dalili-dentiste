from __future__ import annotations

from dataclasses import dataclass

from app.chatbot.specialty_mapper import specialty_matches_record
from app.chatbot.tunisian_normalizer import normalize_chat_text
from app.models import DentistRecord


@dataclass(frozen=True)
class SearchResult:
    total: int
    records: list[DentistRecord]


def search_dentists(
    records: list[DentistRecord],
    *,
    specialty: str | None = None,
    governorate: str | None = None,
    city: str | None = None,
    phone_required: bool = False,
    maps_required: bool = False,
    limit: int = 5,
) -> SearchResult:
    safe_limit = max(1, min(int(limit or 5), 25))
    filtered = []
    gov_norm = normalize_chat_text(governorate)
    city_norm = normalize_chat_text(city)
    for record in records:
        if governorate and normalize_chat_text(record.governorate) != gov_norm:
            continue
        if city:
            loc_text = " ".join([record.locality or "", record.delegation or "", record.address_raw or ""])
            if city_norm not in normalize_chat_text(loc_text):
                continue
        if phone_required and not record.primary_phone:
            continue
        if maps_required and not (record.google_maps_url or (record.latitude is not None and record.longitude is not None)):
            continue
        if not specialty_matches_record(specialty, record.specialties or [], record.professional_title_exact):
            continue
        filtered.append(record)
    filtered.sort(
        key=lambda record: (
            0 if record.primary_phone else 1,
            0 if record.google_maps_url or record.latitude is not None else 1,
            normalize_chat_text(record.governorate),
            normalize_chat_text(record.full_name_source or record.cabinet_name),
        )
    )
    return SearchResult(total=len(filtered), records=filtered[:safe_limit])
