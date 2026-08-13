from __future__ import annotations

from dataclasses import dataclass

from app.models import DentistRecord


@dataclass(frozen=True)
class FunctionalStatus:
    status: str
    evidence: str


def predict_functional_status(record: DentistRecord) -> FunctionalStatus:
    sources = {source for source in (record.source or "").split("|") if source}
    phone = record.primary_phone
    if record.phone_numbers:
        record.sync_phone_summary()
        phone = record.primary_phone
    has_address = bool(record.address_raw or record.address_normalized)

    if len(sources) >= 2 and phone and has_address:
        return FunctionalStatus(
            "Probablement fonctionnel",
            "Profil confirme par plusieurs sources avec telephone et adresse.",
        )
    if phone and has_address:
        return FunctionalStatus(
            "A verifier",
            "Telephone et adresse disponibles, sans verification externe.",
        )
    if phone:
        return FunctionalStatus(
            "A verifier",
            "Telephone disponible, adresse absente ou incomplete.",
        )
    return FunctionalStatus(
        "Non verifie",
        "Pas assez de signaux publics dans les sources collectees.",
    )
