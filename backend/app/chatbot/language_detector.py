from __future__ import annotations

import re
from enum import StrEnum


class AssistantLanguage(StrEnum):
    AUTO = "auto"
    FRENCH = "fr"
    TUNISIAN_ARABIC = "tn_ar"
    TUNISIAN_LATIN = "tn_lat"


ARABIC_RE = re.compile(r"[\u0600-\u06ff]")
ARABIZI_RE = re.compile(r"\b(n7eb|nheb|nal9a|famma|mta3|sghar|snan|snani|ltha|9rib|meni|fi|fil|wja3|barcha)\b", re.I)


def detect_language(message: str, preferred: AssistantLanguage = AssistantLanguage.AUTO) -> AssistantLanguage:
    if preferred != AssistantLanguage.AUTO:
        return preferred
    if ARABIC_RE.search(message):
        return AssistantLanguage.TUNISIAN_ARABIC
    if ARABIZI_RE.search(message):
        return AssistantLanguage.TUNISIAN_LATIN
    return AssistantLanguage.FRENCH
