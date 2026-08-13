from __future__ import annotations

import re

from .text import compact_spaces

TITLE_RE = re.compile(r"^(?P<title>dr\.?|docteur|pr\.?|professeur)\s+", re.I)


def parse_name(full_name: str | None) -> tuple[str | None, str | None, str | None, str]:
    if not full_name:
        return None, None, None, "EMPTY"
    original = compact_spaces(full_name.replace("\xa0", " "))
    match = TITLE_RE.match(original)
    title = match.group("title").rstrip(".").title() if match else None
    cleaned = TITLE_RE.sub("", original).strip()
    if re.search(r"\bet\b|/|&|,", cleaned, re.I):
        return title, None, None, "REVIEW_REQUIRED"
    parts = cleaned.split()
    if len(parts) < 2 or len(parts) > 4:
        return title, None, None, "REVIEW_REQUIRED"
    if any(p.isupper() and len(p) > 1 for p in parts[1:]):
        first = " ".join(parts[:-1])
        last = parts[-1]
    else:
        first = parts[0]
        last = " ".join(parts[1:])
    return title, first or None, last or None, "PARSED"

