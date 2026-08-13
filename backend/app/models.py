from __future__ import annotations

from datetime import datetime, timezone
from enum import StrEnum
from typing import Any

from pydantic import BaseModel, ConfigDict, Field


def utcnow() -> datetime:
    return datetime.now(timezone.utc)


class PhoneType(StrEnum):
    LANDLINE = "LANDLINE"
    MOBILE = "MOBILE"
    WHATSAPP = "WHATSAPP"
    UNKNOWN = "UNKNOWN"


class PhoneSource(StrEnum):
    MED_TN = "MED_TN"
    LERDVMEDICAL = "LERDVMEDICAL"
    TUNISIE_MEDICALE = "TUNISIE_MEDICALE"
    TUNISIE_DENTISTE = "TUNISIE_DENTISTE"
    SANTE_TUNISIE = "SANTE_TUNISIE"
    BONNES_ADRESSES = "BONNES_ADRESSES"
    GOAFRICAONLINE = "GOAFRICAONLINE"
    ORTHODONTISTE_TN = "ORTHODONTISTE_TN"
    PARA_DOCTOR = "PARA_DOCTOR"
    OPENSTREETMAP = "OPENSTREETMAP"
    BUSINESS_CARD_OCR = "BUSINESS_CARD_OCR"
    TABIBI = "TABIBI"
    OFFICIAL_WEBSITE = "OFFICIAL_WEBSITE"
    SOCIAL_PRO_PAGE = "SOCIAL_PRO_PAGE"


class PhoneValidationStatus(StrEnum):
    VALID = "VALID"
    INVALID_LENGTH = "INVALID_LENGTH"
    INVALID_FORMAT = "INVALID_FORMAT"
    DUPLICATE = "DUPLICATE"
    REVIEW_REQUIRED = "REVIEW_REQUIRED"


class PhoneNumber(BaseModel):
    raw: str
    normalized: str | None = None
    type: PhoneType = PhoneType.UNKNOWN
    sources: list[PhoneSource] = Field(default_factory=list)
    is_public_professional: bool = True
    is_valid: bool = False
    validation_status: PhoneValidationStatus = PhoneValidationStatus.REVIEW_REQUIRED


class DentistRecord(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int | None = None
    source: str = "med.tn"
    source_profile_url: str | None = None
    source_listing_url: str | None = None
    full_name_source: str | None = None
    title_prefix: str | None = None
    first_name: str | None = None
    last_name: str | None = None
    name_parsing_status: str | None = None
    professional_title_exact: str | None = None
    specialties: list[str] = Field(default_factory=list)
    cabinet_name: str | None = None
    address_raw: str | None = None
    address_normalized: str | None = None
    locality: str | None = None
    delegation: str | None = None
    district: str | None = None
    postal_code: str | None = None
    governorate: str | None = None
    country: str = "Tunisie"
    latitude: float | None = None
    longitude: float | None = None
    geocoding_status: str | None = None
    geocoding_source: str | None = None
    geocoding_precision: str | None = None
    geocoding_confidence: float | None = None
    phone_numbers: list[PhoneNumber] = Field(default_factory=list)
    primary_phone: str | None = None
    landline_phone: str | None = None
    mobile_phone: str | None = None
    whatsapp_phone: str | None = None
    phone_source: str | None = None
    phone_raw: str | None = None
    phone_normalized: str | None = None
    phone_is_valid: bool | None = None
    phone_validation_status: str | None = None
    google_maps_url: str | None = None
    duplicate_group_id: str | None = None
    scraped_at: datetime = Field(default_factory=utcnow)
    last_verified_at: datetime | None = None

    def sync_phone_summary(self) -> None:
        valid = [p for p in self.phone_numbers if p.normalized and p.is_valid]
        self.primary_phone = valid[0].normalized if valid else None
        self.landline_phone = next((p.normalized for p in valid if p.type == PhoneType.LANDLINE), None)
        self.mobile_phone = next((p.normalized for p in valid if p.type == PhoneType.MOBILE), None)
        self.whatsapp_phone = next((p.normalized for p in valid if p.type == PhoneType.WHATSAPP), None)
        self.phone_source = "|".join(sorted({s.value for p in valid for s in p.sources})) or None
        self.phone_raw = "|".join(p.raw for p in self.phone_numbers) or None
        self.phone_normalized = "|".join(p.normalized for p in valid if p.normalized) or None
        self.phone_is_valid = bool(valid) if self.phone_numbers else None
        statuses = {p.validation_status.value for p in self.phone_numbers}
        self.phone_validation_status = "|".join(sorted(statuses)) if statuses else None

    def to_storage(self) -> dict[str, Any]:
        data = self.model_dump()
        for key in ["specialties", "phone_numbers"]:
            data[key] = self.model_dump(mode="json")[key]
        return data
