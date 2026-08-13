from __future__ import annotations

import hashlib

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.database import DentistORM, list_dentists, upsert_dentist
from app.models import DentistRecord
from app.normalization.text import normalize_text


class DentistRepository:
    def __init__(self, session: Session) -> None:
        self.session = session

    def save(self, record: DentistRecord) -> DentistRecord:
        row = upsert_dentist(self.session, record)
        self.session.commit()
        self.session.refresh(row)
        return DentistRecord.model_validate({**record.model_dump(), "id": row.id})

    def all(self, governorate: str | None = None) -> list[DentistRecord]:
        return list_dentists(self.session, governorate)

    def existing_profile_urls(self) -> set[str]:
        return set(self.session.scalars(select(DentistORM.source_profile_url)).all())


def assign_duplicate_groups(records: list[DentistRecord]) -> list[DentistRecord]:
    candidate_keys: dict[int, list[str]] = {}
    key_counts: dict[str, int] = {}
    for index, rec in enumerate(records):
        keys = []
        if rec.source_profile_url:
            keys.append(f"url:{rec.source_profile_url}")
        first, last = _normalized_name_parts(rec)
        governorate = normalize_text(rec.governorate)
        if first and last and governorate:
            for phone in _phones(rec):
                keys.append(f"person:{first}|{last}|{governorate}|{phone}")
            if rec.address_raw:
                keys.append(f"name_gov:{first}|{last}|{governorate}")
        if keys:
            candidate_keys[index] = sorted(keys)
            for key in set(keys):
                key_counts[key] = key_counts.get(key, 0) + 1
    repeated_keys_by_index = {
        index: [key for key in keys if key_counts.get(key, 0) > 1]
        for index, keys in candidate_keys.items()
    }
    key_to_indexes: dict[str, list[int]] = {}
    for index, keys in repeated_keys_by_index.items():
        for key in keys:
            key_to_indexes.setdefault(key, []).append(index)

    parent = list(range(len(records)))

    def find(index: int) -> int:
        while parent[index] != index:
            parent[index] = parent[parent[index]]
            index = parent[index]
        return index

    def union(left: int, right: int) -> None:
        root_left = find(left)
        root_right = find(right)
        if root_left != root_right:
            parent[root_right] = root_left

    for indexes in key_to_indexes.values():
        first = indexes[0]
        for index in indexes[1:]:
            union(first, index)

    grouped_repeated_keys: dict[int, list[str]] = {}
    for index, keys in repeated_keys_by_index.items():
        if keys:
            grouped_repeated_keys.setdefault(find(index), []).extend(keys)

    group_ids = {
        root: hashlib.sha1(sorted(keys)[0].encode("utf-8")).hexdigest()[:12]
        for root, keys in grouped_repeated_keys.items()
    }
    for index, rec in enumerate(records):
        root = find(index)
        rec.duplicate_group_id = group_ids.get(root)
    return records


def _normalized_name_parts(record: DentistRecord) -> tuple[str, str]:
    first = normalize_text(record.first_name)
    last = normalize_text(record.last_name)
    if first or last:
        return first, last
    raw = normalize_text(record.full_name_source)
    for prefix in ["dr ", "docteur ", "dentiste ", "medecin dentiste ", "chirurgien dentiste "]:
        if raw.startswith(prefix):
            raw = raw[len(prefix) :]
            break
    tokens = [token for token in raw.split() if len(token) > 1]
    if not tokens:
        return "", ""
    if len(tokens) == 1:
        return tokens[0], ""
    return tokens[0], tokens[-1]


def _phones(record: DentistRecord) -> set[str]:
    phones = {phone.normalized for phone in record.phone_numbers if phone.normalized}
    if record.primary_phone:
        phones.add(record.primary_phone)
    return phones
