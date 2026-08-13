from __future__ import annotations

from app.models import DentistRecord
from app.normalization.text import normalize_text


BUSINESS_ONLY_TERMS = {
    "centre",
    "clinique",
    "lab",
    "laboratoire",
    "prothese",
    "protheses",
    "studio",
    "solutions",
}


def is_tunisian_dentist_record(record: DentistRecord) -> bool:
    title = normalize_text(record.professional_title_exact)
    name = normalize_text(record.full_name_source)
    cabinet = normalize_text(record.cabinet_name)
    haystack = " ".join([name, cabinet, normalize_text(record.source_profile_url)])

    if record.country and normalize_text(record.country) not in {"tunisie", "tunisia"}:
        return False
    if not _has_reasonable_person_name(record):
        return False
    if "dent" not in " ".join([title, haystack]) and "orthodont" not in " ".join([title, haystack]):
        return False

    is_named_doctor = name.startswith(("dr ", "docteur ")) or bool(record.first_name and record.last_name)
    if is_named_doctor:
        return True

    if record.source == "goafricaonline":
        return False

    return not any(term in haystack.split() for term in BUSINESS_ONLY_TERMS)


def _has_reasonable_person_name(record: DentistRecord) -> bool:
    name = normalize_text(record.full_name_source)
    if not name:
        return False
    words = name.split()
    if len(words) > 6:
        return False
    if name.count(" dr ") or name.count(" docteur "):
        return False
    noisy_phrases = [
        "medecin dentiste invite",
        "cabinet dentaire a",
        "specialiste en soins",
        "chirurgien dentiste a",
    ]
    if any(phrase in name for phrase in noisy_phrases):
        return False
    return True
