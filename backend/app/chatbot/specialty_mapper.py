from __future__ import annotations

from app.chatbot.dental_lexicon import SPECIALTY_SYNONYMS
from app.chatbot.tunisian_normalizer import normalize_chat_text


def detect_specialty(message: str, available_specialties: list[str] | None = None) -> str | None:
    normalized = normalize_chat_text(message)
    for canonical, synonyms in SPECIALTY_SYNONYMS.items():
        if normalize_chat_text(canonical) in normalized:
            return canonical
        for synonym in synonyms:
            if normalize_chat_text(synonym) in normalized:
                return canonical
    for specialty in available_specialties or []:
        cleaned = normalize_chat_text(specialty)
        if cleaned and cleaned in normalized:
            return specialty
    return None


def specialty_matches_record(requested: str | None, record_specialties: list[str], title: str | None) -> bool:
    if not requested:
        return True
    requested_norm = normalize_chat_text(requested)
    haystack = " ".join([title or "", *(record_specialties or [])])
    haystack_norm = normalize_chat_text(haystack)
    if requested_norm in haystack_norm:
        return True
    synonyms = SPECIALTY_SYNONYMS.get(requested_norm, []) + SPECIALTY_SYNONYMS.get(requested, [])
    return any(normalize_chat_text(synonym) in haystack_norm for synonym in synonyms)
