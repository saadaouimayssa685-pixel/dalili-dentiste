from __future__ import annotations

import csv
import json
from pathlib import Path

from app.models import DentistRecord
from app.services.activity import predict_activity
from app.services.functional_status import predict_functional_status


CSV_COLUMNS = [
    "SOURCE",
    "NOM",
    "PRENOM",
    "NOM_COMPLET_SOURCE",
    "TITRE_METIER_EXACT",
    "SPECIALITES",
    "NOM_CABINET",
    "ADRESSE_CABINET",
    "LOCALITE",
    "DELEGATION",
    "CODE_POSTAL",
    "GOUVERNORAT",
    "TELEPHONE_PRINCIPAL",
    "TELEPHONE_FIXE",
    "TELEPHONE_MOBILE",
    "TELEPHONE_WHATSAPP",
    "TOUS_LES_TELEPHONES",
    "SOURCE_TELEPHONE",
    "URL_SOURCE_PROFIL",
    "URL_PROFIL_MED_TN",
    "URL_GOOGLE_MAPS",
    "STATUT_FONCTIONNEL",
    "PREUVE_FONCTIONNEMENT",
    "SCORE_QUALITE_FICHE",
    "STATUT_QUALITE_FICHE",
    "RAISONS_QUALITE_FICHE",
    "DATE_COLLECTE",
]


def ensure_dir(output_dir: str | Path) -> Path:
    path = Path(output_dir)
    path.mkdir(parents=True, exist_ok=True)
    return path


def export_csv(records: list[DentistRecord], output_dir: str | Path) -> Path:
    path = ensure_dir(output_dir) / "dentistes_tunisie.csv"
    with path.open("w", encoding="utf-8-sig", newline="") as fh:
        writer = csv.DictWriter(fh, fieldnames=CSV_COLUMNS, delimiter=";")
        writer.writeheader()
        for r in records:
            r.sync_phone_summary()
            activity = predict_activity(r)
            functional = predict_functional_status(r)
            writer.writerow(
                {
                    "NOM": r.last_name or "",
                    "SOURCE": r.source or "",
                    "PRENOM": r.first_name or "",
                    "NOM_COMPLET_SOURCE": r.full_name_source or "",
                    "TITRE_METIER_EXACT": r.professional_title_exact or "",
                    "SPECIALITES": ", ".join(r.specialties),
                    "NOM_CABINET": r.cabinet_name or "",
                    "ADRESSE_CABINET": r.address_raw or "",
                    "LOCALITE": r.locality or "",
                    "DELEGATION": r.delegation or "",
                    "CODE_POSTAL": r.postal_code or "",
                    "GOUVERNORAT": r.governorate or "",
                    "TELEPHONE_PRINCIPAL": r.primary_phone or "",
                    "TELEPHONE_FIXE": r.landline_phone or "",
                    "TELEPHONE_MOBILE": r.mobile_phone or "",
                    "TELEPHONE_WHATSAPP": r.whatsapp_phone or "",
                    "TOUS_LES_TELEPHONES": r.phone_normalized or "",
                    "SOURCE_TELEPHONE": r.phone_source or "",
                    "URL_SOURCE_PROFIL": r.source_profile_url or "",
                    "URL_PROFIL_MED_TN": r.source_profile_url or "",
                    "URL_GOOGLE_MAPS": r.google_maps_url or "",
                    "STATUT_FONCTIONNEL": functional.status,
                    "PREUVE_FONCTIONNEMENT": functional.evidence,
                    "SCORE_QUALITE_FICHE": activity.score,
                    "STATUT_QUALITE_FICHE": activity.status,
                    "RAISONS_QUALITE_FICHE": " | ".join(activity.reasons),
                    "DATE_COLLECTE": r.scraped_at.isoformat() if r.scraped_at else "",
                }
            )
    return path


def export_json(records: list[DentistRecord], output_dir: str | Path) -> Path:
    path = ensure_dir(output_dir) / "dentistes_tunisie.json"
    data = []
    for record in records:
        item = record.model_dump(mode="json")
        activity = predict_activity(record)
        functional = predict_functional_status(record)
        item["functional_status"] = functional.status
        item["functional_evidence"] = functional.evidence
        item["record_quality_score"] = activity.score
        item["record_quality_status"] = activity.status
        item["record_quality_reasons"] = activity.reasons
        data.append(item)
    path.write_text(json.dumps(data, ensure_ascii=False, indent=2), encoding="utf-8")
    return path


def export_review(records: list[DentistRecord], output_dir: str | Path) -> Path:
    path = ensure_dir(output_dir) / "records_to_review.csv"
    with path.open("w", encoding="utf-8-sig", newline="") as fh:
        fields = ["source_profile_url", "full_name", "source", "governorate", "phone", "review_reason", "review_status"]
        writer = csv.DictWriter(fh, fieldnames=fields, delimiter=";")
        writer.writeheader()
        for record in records:
            record.sync_phone_summary()
            reasons = []
            if not record.primary_phone:
                reasons.append("telephone_absent")
            if not (record.address_raw or record.address_normalized):
                reasons.append("adresse_absente")
            if not record.governorate:
                reasons.append("gouvernorat_absent")
            if not reasons:
                continue
            writer.writerow(
                {
                    "source_profile_url": record.source_profile_url,
                    "full_name": record.full_name_source,
                    "source": record.source,
                    "governorate": record.governorate,
                    "phone": record.primary_phone,
                    "review_reason": "|".join(reasons),
                    "review_status": "PENDING",
                }
            )
    return path


def export_errors(errors: list[dict], output_dir: str | Path) -> Path:
    path = ensure_dir(output_dir) / "scraping_errors.csv"
    with path.open("w", encoding="utf-8-sig", newline="") as fh:
        fields = ["URL", "TYPE_ERREUR", "MESSAGE", "NOMBRE_TENTATIVES", "DATE"]
        writer = csv.DictWriter(fh, fieldnames=fields, delimiter=";")
        writer.writeheader()
        for err in errors:
            writer.writerow(err)
    return path
