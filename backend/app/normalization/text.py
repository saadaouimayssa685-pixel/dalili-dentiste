from __future__ import annotations

import re
import unicodedata


def strip_accents(value: str | None) -> str:
    if not value:
        return ""
    return "".join(ch for ch in unicodedata.normalize("NFKD", value) if not unicodedata.combining(ch))


def compact_spaces(value: str | None) -> str:
    return re.sub(r"\s+", " ", value or "").strip()


def normalize_text(value: str | None) -> str:
    value = strip_accents(value)
    value = re.sub(r"[^\w\s+]", " ", value, flags=re.UNICODE)
    return compact_spaces(value).casefold()


def significant_tokens(value: str | None) -> set[str]:
    stop = {"dr", "docteur", "pr", "professeur", "cabinet", "dentaire", "dentiste", "tunisie"}
    return {t for t in normalize_text(value).split() if len(t) > 2 and t not in stop}

