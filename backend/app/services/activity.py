from __future__ import annotations

from dataclasses import dataclass

from app.models import DentistRecord


@dataclass(frozen=True)
class ActivityPrediction:
    score: int
    status: str
    reasons: list[str]


def predict_activity(record: DentistRecord) -> ActivityPrediction:
    score = 20
    reasons: list[str] = ["profil public collecte"]

    sources = {source for source in (record.source or "").split("|") if source}
    if len(sources) >= 3:
        score += 30
        reasons.append("present sur 3 sources ou plus")
    elif len(sources) == 2:
        score += 22
        reasons.append("present sur 2 sources")
    elif len(sources) == 1:
        score += 8
        reasons.append("present sur 1 source")

    record.sync_phone_summary()
    if record.primary_phone:
        score += 22
        reasons.append("telephone public valide")
    if record.landline_phone:
        score += 8
        reasons.append("fixe disponible")
    if record.mobile_phone:
        score += 6
        reasons.append("mobile disponible")

    if record.address_raw or record.address_normalized:
        score += 14
        reasons.append("adresse disponible")
    if record.governorate:
        score += 8
        reasons.append("gouvernorat identifie")
    if record.locality:
        score += 4
        reasons.append("localite identifiee")
    if record.source_profile_url:
        score += 4
        reasons.append("URL source disponible")

    if not record.primary_phone and not (record.address_raw or record.address_normalized):
        score -= 18
        reasons.append("sans telephone ni adresse")
    elif not record.primary_phone:
        score -= 8
        reasons.append("sans telephone")
    elif not (record.address_raw or record.address_normalized):
        score -= 5
        reasons.append("sans adresse complete")

    score = max(0, min(100, score))
    return ActivityPrediction(score=score, status=_quality_status_from_score(score), reasons=reasons)


def _quality_status_from_score(score: int) -> str:
    if score >= 85:
        return "Fiche fiable"
    if score >= 70:
        return "Fiche correcte"
    if score >= 45:
        return "A completer"
    return "A verifier"
