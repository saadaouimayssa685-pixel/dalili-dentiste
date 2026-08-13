from __future__ import annotations

from .text import compact_spaces, normalize_text, significant_tokens


def normalize_address(address: str | None) -> str | None:
    cleaned = compact_spaces(address)
    return cleaned or None


def address_similarity(a: str | None, b: str | None) -> float:
    at = significant_tokens(a)
    bt = significant_tokens(b)
    if not at or not bt:
        return 0.0
    return len(at & bt) / len(at | bt)


def contains_postal_code(text: str | None, postal_code: str | None) -> bool:
    return bool(postal_code and postal_code in normalize_text(text))

