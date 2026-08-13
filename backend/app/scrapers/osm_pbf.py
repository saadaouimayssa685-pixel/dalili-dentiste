from __future__ import annotations

from pathlib import Path
from typing import Any

from app.models import DentistRecord, PhoneSource
from app.normalization.addresses import normalize_address
from app.normalization.locations import locations
from app.normalization.names import parse_name
from app.normalization.phones import merge_phones, normalize_phone
from app.services.geography import infer_governorate, infer_locality


OSM_DENTIST_TAGS = {
    ("amenity", "dentist"),
    ("healthcare", "dentist"),
    ("healthcare:speciality", "dentist"),
    ("healthcare:speciality", "orthodontics"),
}


def extract_osm_dentists(pbf_path: str | Path, limit: int | None = None) -> list[DentistRecord]:
    try:
        import osmium  # type: ignore[import-not-found]
    except ImportError as exc:
        raise RuntimeError("Installez d'abord la dépendance optionnelle: python -m pip install osmium") from exc

    class DentistHandler(osmium.SimpleHandler):  # type: ignore[attr-defined]
        def __init__(self) -> None:
            super().__init__()
            self.records: list[DentistRecord] = []

        def node(self, obj: Any) -> None:
            self._handle(obj, getattr(obj.location, "lat", None), getattr(obj.location, "lon", None))

        def way(self, obj: Any) -> None:
            self._handle(obj, None, None)

        def relation(self, obj: Any) -> None:
            self._handle(obj, None, None)

        def _handle(self, obj: Any, lat: float | None, lon: float | None) -> None:
            if limit is not None and len(self.records) >= limit:
                return
            tags = {str(tag.k): str(tag.v) for tag in obj.tags}
            if not is_osm_dentist(tags):
                return
            record = record_from_osm_object(obj, tags, lat, lon)
            self.records.append(record)

    handler = DentistHandler()
    handler.apply_file(str(pbf_path), locations=True)
    return handler.records


def is_osm_dentist(tags: dict[str, str]) -> bool:
    normalized = {key: value.casefold() for key, value in tags.items()}
    return any(normalized.get(key) == value for key, value in OSM_DENTIST_TAGS)


def record_from_osm_object(obj: Any, tags: dict[str, str], lat: float | None, lon: float | None) -> DentistRecord:
    name = tags.get("name") or tags.get("operator") or tags.get("brand") or "Dentiste OSM"
    title_prefix, first_name, last_name, name_status = parse_name(name)
    address = build_address(tags)
    governorate = infer_governorate(address, tags.get("addr:state"), tags.get("addr:province"), tags.get("addr:city"))
    locality = infer_locality(address, tags.get("addr:city"), tags.get("addr:suburb"), governorate=governorate)
    if not locality:
        locality = locations.locality(tags.get("addr:city") or tags.get("addr:suburb")).name
    if not governorate and locality:
        governorate = locations.locality(locality).governorate
    phones = []
    for key in ["phone", "contact:phone", "mobile", "contact:mobile"]:
        if tags.get(key):
            phones.append(normalize_phone(tags[key], PhoneSource.OPENSTREETMAP))
    source_profile_url = f"https://www.openstreetmap.org/{obj.__class__.__name__.lower()}/{obj.id}"
    record = DentistRecord(
        source="openstreetmap",
        source_profile_url=source_profile_url,
        full_name_source=name,
        title_prefix=title_prefix,
        first_name=first_name,
        last_name=last_name,
        name_parsing_status=name_status,
        professional_title_exact=osm_title(tags),
        specialties=osm_specialties(tags),
        cabinet_name=name if not title_prefix else None,
        address_raw=address,
        address_normalized=normalize_address(address),
        locality=locality,
        postal_code=tags.get("addr:postcode"),
        governorate=governorate,
        phone_numbers=merge_phones(phones),
        latitude=lat,
        longitude=lon,
    )
    record.sync_phone_summary()
    return record


def build_address(tags: dict[str, str]) -> str | None:
    parts = [
        tags.get("addr:housenumber"),
        tags.get("addr:street"),
        tags.get("addr:suburb"),
        tags.get("addr:city"),
        tags.get("addr:state") or tags.get("addr:province"),
        tags.get("addr:postcode"),
        "Tunisie",
    ]
    value = " ".join(part for part in parts if part)
    return value or None


def osm_title(tags: dict[str, str]) -> str:
    if tags.get("healthcare:speciality", "").casefold() == "orthodontics":
        return "Orthodontiste"
    return "Dentiste"


def osm_specialties(tags: dict[str, str]) -> list[str]:
    specialty = tags.get("healthcare:speciality")
    if specialty:
        return [specialty]
    return ["Dentiste"]
