from __future__ import annotations

import re

from app.config import settings
from app.models import PhoneNumber, PhoneSource, PhoneType, PhoneValidationStatus


ARABIC_DIGITS_TRANSLATION = str.maketrans(
    {
        "٠": "0",
        "١": "1",
        "٢": "2",
        "٣": "3",
        "٤": "4",
        "٥": "5",
        "٦": "6",
        "٧": "7",
        "٨": "8",
        "٩": "9",
        "۰": "0",
        "۱": "1",
        "۲": "2",
        "۳": "3",
        "۴": "4",
        "۵": "5",
        "۶": "6",
        "۷": "7",
        "۸": "8",
        "۹": "9",
    }
)


def _digits(raw: str) -> str:
    normalized = (raw or "").translate(ARABIC_DIGITS_TRANSLATION)
    return re.sub(r"\D", "", normalized)


def classify_phone(normalized: str | None) -> PhoneType:
    if not normalized:
        return PhoneType.UNKNOWN
    national = normalized.replace("+216", "")
    prefixes = settings.phone_prefixes
    if any(national.startswith(p) for p in prefixes.get("landline_prefixes", [])):
        return PhoneType.LANDLINE
    if any(national.startswith(p) for p in prefixes.get("mobile_prefixes", [])):
        return PhoneType.MOBILE
    return PhoneType.UNKNOWN


def normalize_phone(raw: str, source: PhoneSource) -> PhoneNumber:
    text = (raw or "").strip()
    if not text or re.search(r"masqu|rendez|appoint", text, re.I):
        return PhoneNumber(raw=text, sources=[source], validation_status=PhoneValidationStatus.INVALID_FORMAT)
    digits = _digits(text)
    if digits.startswith("00216"):
        digits = digits[5:]
    elif digits.startswith("216") and len(digits) == 11:
        digits = digits[3:]
    if len(digits) != settings.phone_prefixes.get("national_number_length", 8):
        return PhoneNumber(raw=text, sources=[source], validation_status=PhoneValidationStatus.INVALID_LENGTH)
    if len(set(digits)) == 1:
        return PhoneNumber(raw=text, normalized=f"+216{digits}", sources=[source], validation_status=PhoneValidationStatus.INVALID_FORMAT)
    normalized = f"+216{digits}"
    return PhoneNumber(
        raw=text,
        normalized=normalized,
        type=classify_phone(normalized),
        sources=[source],
        is_valid=True,
        validation_status=PhoneValidationStatus.VALID,
    )


def extract_phone_candidates(text: str) -> list[str]:
    pattern = re.compile(r"(?:\+?216|00216)?[ \t().-]*(?:\d[ \t().-]*){8}")
    return [m.group(0).strip() for m in pattern.finditer(text or "")]


def merge_phones(phones: list[PhoneNumber]) -> list[PhoneNumber]:
    by_number: dict[str, PhoneNumber] = {}
    output: list[PhoneNumber] = []
    for phone in phones:
        key = phone.normalized or f"raw:{phone.raw}"
        if key in by_number:
            existing = by_number[key]
            for source in phone.sources:
                if source not in existing.sources:
                    existing.sources.append(source)
            if existing.validation_status == PhoneValidationStatus.VALID:
                phone.validation_status = PhoneValidationStatus.DUPLICATE
            continue
        by_number[key] = phone
        output.append(phone)
    return output
