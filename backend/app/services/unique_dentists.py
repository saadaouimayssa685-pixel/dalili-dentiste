from __future__ import annotations

import hashlib
from collections import defaultdict

from app.models import DentistRecord, PhoneNumber
from app.normalization.phones import merge_phones
from app.normalization.text import normalize_text
from app.repositories.dentists import assign_duplicate_groups
from app.services.geography import normalize_record_geography
from app.services.record_filter import is_tunisian_dentist_record


SOURCE_PRIORITY = {
    "med.tn": 10,
    "tunisie_medicale": 20,
    "lerdvmedical": 30,
    "tunisie_dentiste": 40,
    "goafricaonline": 50,
    "orthodontiste_tn": 60,
    "para_doctor": 70,
    "openstreetmap": 80,
}


def build_unique_dentists(records: list[DentistRecord]) -> list[DentistRecord]:
    records = [record for record in records if is_tunisian_dentist_record(record)]
    records = [normalize_record_geography(record) for record in records]
    records = [_clean_display_name(record) for record in records]
    records = assign_duplicate_groups(records)
    grouped: dict[str, list[DentistRecord]] = defaultdict(list)
    for record in records:
        key = record.duplicate_group_id or f"single:{record.source_profile_url or record.id or id(record)}"
        grouped[key].append(record)
    unique = [_merge_group(group_id, group) for group_id, group in grouped.items()]
    return sorted(unique, key=lambda r: (normalize_text(r.governorate), normalize_text(r.full_name_source)))


def _merge_group(group_id: str, records: list[DentistRecord]) -> DentistRecord:
    records = sorted(records, key=_quality_sort_key)
    primary = records[0].model_copy(deep=True)
    primary.source = "|".join(sorted({r.source for r in records if r.source}))
    primary.source_profile_url = " | ".join(_ordered_values([r.source_profile_url for r in records]))
    primary.source_listing_url = " | ".join(_ordered_values([r.source_listing_url for r in records]))
    primary.full_name_source = _best_value([r.full_name_source for r in records]) or primary.full_name_source
    primary.professional_title_exact = _best_value([r.professional_title_exact for r in records]) or primary.professional_title_exact
    primary.cabinet_name = _best_value([r.cabinet_name for r in records]) or primary.cabinet_name
    primary.address_raw = _best_value([r.address_raw for r in records]) or primary.address_raw
    primary.address_normalized = _best_value([r.address_normalized for r in records]) or primary.address_normalized
    primary.locality = _best_value([r.locality for r in records]) or primary.locality
    primary.governorate = _best_value([r.governorate for r in records]) or primary.governorate
    primary.postal_code = _best_value([r.postal_code for r in records]) or primary.postal_code
    primary.specialties = _ordered_values([item for r in records for item in r.specialties])
    primary.phone_numbers = _merge_phones([phone for r in records for phone in r.phone_numbers])
    primary.duplicate_group_id = group_id if len(records) > 1 else None
    primary.sync_phone_summary()
    return primary


def _quality_sort_key(record: DentistRecord) -> tuple[int, int]:
    completeness = sum(
        bool(value)
        for value in [
            record.full_name_source,
            record.primary_phone,
            record.address_raw,
            record.governorate,
            record.locality,
            record.professional_title_exact,
        ]
    )
    return (-completeness, SOURCE_PRIORITY.get(record.source, 999))


def _best_value(values: list[str | None]) -> str | None:
    present = [value.strip() for value in values if value and value.strip()]
    if not present:
        return None
    return sorted(present, key=lambda value: (-len(value), value))[0]


def _ordered_values(values: list[str | None]) -> list[str]:
    seen: set[str] = set()
    output: list[str] = []
    for value in values:
        if not value:
            continue
        value = value.strip()
        if value and value not in seen:
            seen.add(value)
            output.append(value)
    return output


def _merge_phones(phones: list[PhoneNumber]) -> list[PhoneNumber]:
    return merge_phones(phones)


def _clean_display_name(record: DentistRecord) -> DentistRecord:
    record = record.model_copy(deep=True)
    if record.full_name_source:
        record.full_name_source = _strip_trailing_location_marker(record.full_name_source)
    if record.cabinet_name:
        record.cabinet_name = _strip_trailing_location_marker(record.cabinet_name)
    return record


def _strip_trailing_location_marker(value: str) -> str:
    cleaned = value.strip()
    cleaned = cleaned.removesuffix(" à").removesuffix(" a").strip()
    return cleaned or value.strip()


def unique_export_id(record: DentistRecord) -> str:
    base = "|".join(
        [
            normalize_text(record.full_name_source),
            normalize_text(record.governorate),
            normalize_text(record.primary_phone),
        ]
    )
    return hashlib.sha1(base.encode("utf-8")).hexdigest()[:12]
