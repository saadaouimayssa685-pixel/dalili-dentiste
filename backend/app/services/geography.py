from __future__ import annotations

import re

from app.models import DentistRecord
from app.normalization.locations import locations
from app.normalization.text import compact_spaces, normalize_text


def infer_governorate(*values: str | None) -> str | None:
    haystack = normalize_text(" ".join(value or "" for value in values))
    if not haystack:
        return None
    for alias, governorate in sorted(locations.gov_aliases.items(), key=lambda item: len(item[0]), reverse=True):
        if alias and re.search(rf"\b{re.escape(alias)}\b", haystack):
            return governorate
    return None


def infer_locality(*values: str | None, governorate: str | None = None) -> str | None:
    haystack = normalize_text(" ".join(value or "" for value in values))
    if not haystack:
        return None
    for alias, match in sorted(locations.locality_aliases.items(), key=lambda item: len(item[0]), reverse=True):
        if governorate and match.governorate != governorate:
            continue
        if alias and re.search(rf"\b{re.escape(alias)}\b", haystack):
            return match.name
    return None


def normalize_record_geography(record: DentistRecord) -> DentistRecord:
    record = record.model_copy(deep=True)
    governorate = locations.governorate(record.governorate)
    if not governorate:
        governorate = infer_governorate(record.locality, record.address_raw, record.source_profile_url, record.source_listing_url)
    locality = locations.locality(record.locality).name
    inferred_locality = infer_locality(record.locality, record.address_raw, governorate=governorate)
    if inferred_locality:
        locality = inferred_locality
    elif locality and governorate:
        locality = _remove_governorate_noise(locality, governorate)
    record.governorate = governorate
    record.locality = locality
    return record


def _remove_governorate_noise(locality: str, governorate: str) -> str:
    value = compact_spaces(locality)
    normalized_governorate = normalize_text(governorate)
    words = [word for word in value.split() if normalize_text(word) != normalized_governorate]
    return compact_spaces(" ".join(words)) or value
