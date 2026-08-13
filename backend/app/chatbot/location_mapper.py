from __future__ import annotations

from dataclasses import dataclass
from difflib import get_close_matches

from app.chatbot.tunisian_normalizer import normalize_chat_text


LOCATION_ALIASES = {
    "aryena": "Ariana",
    "ariana": "Ariana",
    "أريانة": "Ariana",
    "اريانة": "Ariana",
    "sfax": "Sfax",
    "صفاقس": "Sfax",
    "sousse": "Sousse",
    "soussa": "Sousse",
    "سوسة": "Sousse",
    "marsa": "La Marsa",
    "la marsa": "La Marsa",
    "المرسى": "La Marsa",
    "ben arous": "Ben Arous",
    "بن عروس": "Ben Arous",
    "bizerte": "Bizerte",
    "banzart": "Bizerte",
    "بنزرت": "Bizerte",
    "nabeul": "Nabeul",
    "nebel": "Nabeul",
    "نابل": "Nabeul",
    "kairouan": "Kairouan",
    "9ayrawen": "Kairouan",
    "القيروان": "Kairouan",
    "tunis": "Tunis",
    "تونس": "Tunis",
}


@dataclass(frozen=True)
class LocationMatch:
    governorate: str | None = None
    city: str | None = None
    ambiguous: bool = False


def _unique(values: list[str | None]) -> list[str]:
    seen = set()
    output = []
    for value in values:
        if not value:
            continue
        key = normalize_chat_text(value)
        if key not in seen:
            seen.add(key)
            output.append(value)
    return output


def detect_location(message: str, records) -> LocationMatch:
    normalized = normalize_chat_text(message)
    governorates = _unique([record.governorate for record in records])
    cities = _unique([record.locality for record in records] + [record.delegation for record in records])

    for alias, target in LOCATION_ALIASES.items():
        alias_norm = normalize_chat_text(alias)
        if alias_norm in normalized:
            if any(normalize_chat_text(target) == normalize_chat_text(city) for city in cities):
                city = next(city for city in cities if normalize_chat_text(target) == normalize_chat_text(city))
                gov = next((record.governorate for record in records if normalize_chat_text(record.locality) == normalize_chat_text(city)), None)
                return LocationMatch(governorate=gov, city=city)
            if any(normalize_chat_text(target) == normalize_chat_text(gov) for gov in governorates):
                gov = next(gov for gov in governorates if normalize_chat_text(target) == normalize_chat_text(gov))
                return LocationMatch(governorate=gov)

    for city in sorted(cities, key=lambda value: len(value), reverse=True):
        if normalize_chat_text(city) in normalized:
            gov = next((record.governorate for record in records if normalize_chat_text(record.locality) == normalize_chat_text(city)), None)
            return LocationMatch(governorate=gov, city=city)

    for gov in sorted(governorates, key=lambda value: len(value), reverse=True):
        if normalize_chat_text(gov) in normalized:
            return LocationMatch(governorate=gov)

    tokens = normalized.split()
    choices = {normalize_chat_text(v): v for v in [*governorates, *cities] if v}
    for token in tokens:
        if len(token) < 5:
            continue
        matches = get_close_matches(token, list(choices), n=2, cutoff=0.88)
        if len(matches) == 1:
            value = choices[matches[0]]
            if value in governorates:
                return LocationMatch(governorate=value)
            gov = next((record.governorate for record in records if normalize_chat_text(record.locality) == normalize_chat_text(value)), None)
            return LocationMatch(governorate=gov, city=value)
        if len(matches) > 1:
            return LocationMatch(ambiguous=True)
    return LocationMatch()
