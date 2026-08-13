from __future__ import annotations

import csv
import hashlib
import json
import math
from datetime import datetime
from pathlib import Path

from app.database import SessionLocal, list_unique_dentists
from app.models import DentistRecord
from app.services.activity import predict_activity
from app.services.functional_status import predict_functional_status


OUTPUT_DIR = Path("powerbi/data")
GEOJSON_SOURCE = Path("data/tunisia_governorates.geojson")
POPULATION_SOURCE = Path("data/population_governorates_ins.csv")

GOVERNORATE_DISTRICTS = {
    "Bizerte": "District 1",
    "Béja": "District 1",
    "Jendouba": "District 1",
    "Le Kef": "District 1",
    "Tunis": "District 2",
    "Ariana": "District 2",
    "Ben Arous": "District 2",
    "Manouba": "District 2",
    "Zaghouan": "District 2",
    "Nabeul": "District 2",
    "Siliana": "District 3",
    "Sousse": "District 3",
    "Kasserine": "District 3",
    "Kairouan": "District 3",
    "Monastir": "District 3",
    "Mahdia": "District 3",
    "Tozeur": "District 4",
    "Sidi Bouzid": "District 4",
    "Sfax": "District 4",
    "Gafsa": "District 4",
    "Tataouine": "District 5",
    "Gabès": "District 5",
    "Kébili": "District 5",
    "Médenine": "District 5",
}

GEOJSON_NAME = {
    "Le Kef": "El Kef",
}

SOURCE_LABELS = {
    "med.tn": "Med.tn",
    "tunisie_medicale": "Tunisie Médicale",
    "tunisie_dentiste": "Tunisie Dentiste",
    "lerdvmedical": "Le RDV Médical",
    "goafricaonline": "Go Africa Online",
    "orthodontiste_tn": "Orthodontiste.tn",
    "para_doctor": "Para Doctor",
}


def dentist_id(record: DentistRecord) -> str:
    base = "|".join(
        [
            record.full_name_source or "",
            record.governorate or "",
            record.primary_phone or "",
            record.source_profile_url or "",
        ]
    )
    return hashlib.sha1(base.encode("utf-8")).hexdigest()[:16]


def split_sources(record: DentistRecord) -> list[str]:
    return [source for source in (record.source or "").split("|") if source]


def write_csv(path: Path, rows: list[dict]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    if not rows:
        path.write_text("", encoding="utf-8-sig")
        return
    with path.open("w", encoding="utf-8-sig", newline="") as fh:
        writer = csv.DictWriter(fh, fieldnames=list(rows[0]))
        writer.writeheader()
        writer.writerows(rows)


def load_population() -> dict[str, dict]:
    if not POPULATION_SOURCE.exists():
        return {}
    with POPULATION_SOURCE.open("r", encoding="utf-8-sig", newline="") as fh:
        rows = list(csv.DictReader(fh))
    return {
        row["gouvernorat"]: {
            "population": int(row["population"]),
            "year": int(row["year"]),
            "source": row["source"],
        }
        for row in rows
    }


def fact_dentists(records: list[DentistRecord]) -> list[dict]:
    rows = []
    for record in records:
        record.sync_phone_summary()
        sources = split_sources(record)
        activity = predict_activity(record)
        functional = predict_functional_status(record)
        rows.append(
            {
                "dentist_id": dentist_id(record),
                "nom_complet": record.full_name_source or "",
                "prenom": record.first_name or "",
                "nom": record.last_name or "",
                "titre": record.professional_title_exact or "",
                "specialites": ", ".join(record.specialties),
                "gouvernorat": record.governorate or "Non renseigné",
                "has_governorate": bool(record.governorate),
                "localite": record.locality or "",
                "adresse": record.address_raw or "",
                "telephone": record.primary_phone or "",
                "has_phone": bool(record.primary_phone),
                "has_address": bool(record.address_raw),
                "source_count": len(sources),
                "sources": " | ".join(sources),
                "source_profile_url": record.source_profile_url or "",
                "google_maps_url": record.google_maps_url or "",
                "functional_status": functional.status,
                "functional_evidence": functional.evidence,
                "record_quality_score": activity.score,
                "record_quality_status": activity.status,
                "record_quality_reasons": " | ".join(activity.reasons),
                "scraped_at": record.scraped_at.isoformat() if record.scraped_at else "",
            }
        )
    return rows


def dim_governorates(records: list[DentistRecord]) -> list[dict]:
    population = load_population()
    rows = []
    for governorate, district in GOVERNORATE_DISTRICTS.items():
        gov_records = [record for record in records if record.governorate == governorate]
        population_row = population.get(governorate, {})
        rows.append(
            {
                "gouvernorat": governorate,
                "district": district,
                "geojson_name": GEOJSON_NAME.get(governorate, governorate),
                "population": population_row.get("population", ""),
                "population_year": population_row.get("year", ""),
                "dentistes": len(gov_records),
                "avec_telephone": sum(bool(record.primary_phone) for record in gov_records),
                "avec_adresse": sum(bool(record.address_raw) for record in gov_records),
            }
        )
    unknown_records = [record for record in records if not record.governorate]
    rows.append(
        {
            "gouvernorat": "Non renseigné",
            "district": "À vérifier",
            "geojson_name": "",
            "dentistes": len(unknown_records),
            "avec_telephone": sum(bool(record.primary_phone) for record in unknown_records),
            "avec_adresse": sum(bool(record.address_raw) for record in unknown_records),
        }
    )
    return rows


def dim_sources(records: list[DentistRecord]) -> list[dict]:
    seen = sorted({source for record in records for source in split_sources(record)})
    return [{"source_id": source, "source_name": SOURCE_LABELS.get(source, source)} for source in seen]


def bridge_dentist_sources(records: list[DentistRecord]) -> list[dict]:
    rows = []
    for record in records:
        did = dentist_id(record)
        for source in split_sources(record):
            rows.append({"dentist_id": did, "source_id": source})
    return rows


def agg_governorate(records: list[DentistRecord]) -> list[dict]:
    population = load_population()
    rows = []
    for governorate in GOVERNORATE_DISTRICTS:
        gov_records = [record for record in records if record.governorate == governorate]
        sources = {source for record in gov_records for source in split_sources(record)}
        total = len(gov_records)
        with_phone = sum(bool(record.primary_phone) for record in gov_records)
        pop = population.get(governorate, {}).get("population", 0)
        rows.append(
            {
                "gouvernorat": governorate,
                "district": GOVERNORATE_DISTRICTS[governorate],
                "population": pop,
                "dentistes": total,
                "avec_telephone": with_phone,
                "sans_telephone": total - with_phone,
                "taux_telephone": round(with_phone / total, 4) if total else 0,
                "dentistes_par_100k": round((total / pop) * 100000, 2) if pop else 0,
                "sources": len(sources),
            }
        )
    unknown_records = [record for record in records if not record.governorate]
    unknown_sources = {source for record in unknown_records for source in split_sources(record)}
    total = len(unknown_records)
    with_phone = sum(bool(record.primary_phone) for record in unknown_records)
    rows.append(
        {
            "gouvernorat": "Non renseigné",
            "district": "À vérifier",
            "dentistes": total,
            "avec_telephone": with_phone,
            "sans_telephone": total - with_phone,
            "taux_telephone": round(with_phone / total, 4) if total else 0,
            "sources": len(unknown_sources),
        }
    )
    return rows


def market_potential(records: list[DentistRecord]) -> list[dict]:
    population = load_population()
    gov_stats = []
    for governorate, district in GOVERNORATE_DISTRICTS.items():
        gov_records = [record for record in records if record.governorate == governorate]
        pop = population.get(governorate, {}).get("population", 0)
        dentists = len(gov_records)
        with_phone = sum(bool(record.primary_phone) for record in gov_records)
        with_address = sum(bool(record.address_raw) for record in gov_records)
        density = (dentists / pop) * 100000 if pop else 0
        gov_stats.append(
            {
                "gouvernorat": governorate,
                "district": district,
                "population": pop,
                "dentistes": dentists,
                "avec_telephone": with_phone,
                "avec_adresse": with_address,
                "dentistes_par_100k": density,
                "data_quality": ((with_phone / dentists) * 0.6 + (with_address / dentists) * 0.4) if dentists else 0,
            }
        )

    total_pop = sum(row["population"] for row in gov_stats)
    total_dentists = sum(row["dentistes"] for row in gov_stats)
    national_density = (total_dentists / total_pop) * 100000 if total_pop else 0
    max_population = max(row["population"] for row in gov_stats) or 1
    deficits = []
    for row in gov_stats:
        expected = (row["population"] / 100000) * national_density
        deficit = max(0, expected - row["dentistes"])
        row["expected_dentists_national_density"] = expected
        row["deficit_estime"] = deficit
        row["low_density_gap"] = max(0, national_density - row["dentistes_par_100k"])
        deficits.append(deficit)
    max_deficit = max(deficits) or 1
    max_gap = max(row["low_density_gap"] for row in gov_stats) or 1

    rows = []
    for row in gov_stats:
        deficit_score = row["deficit_estime"] / max_deficit
        population_score = math.sqrt(row["population"] / max_population)
        density_score = row["low_density_gap"] / max_gap
        quality_score = row["data_quality"]
        score = round((0.45 * deficit_score + 0.25 * population_score + 0.20 * density_score + 0.10 * quality_score) * 100, 1)
        if row["dentistes"] < 10 or row["data_quality"] < 0.45:
            segment = "Données à vérifier"
            recommendation = "Valider la collecte avant décision"
        elif score >= 70:
            segment = "Fort potentiel"
            recommendation = "Priorité implantation / prospection"
        elif score >= 45:
            segment = "Potentiel moyen"
            recommendation = "Analyser localités et concurrence"
        elif row["dentistes_par_100k"] > national_density * 1.35:
            segment = "Zone dense"
            recommendation = "Marché probablement concurrentiel"
        else:
            segment = "Équilibré"
            recommendation = "Suivi régulier"
        rows.append(
            {
                "gouvernorat": row["gouvernorat"],
                "district": row["district"],
                "population": row["population"],
                "dentistes": row["dentistes"],
                "dentistes_par_100k": round(row["dentistes_par_100k"], 2),
                "densite_nationale_reference": round(national_density, 2),
                "dentistes_attendus_reference": round(row["expected_dentists_national_density"], 1),
                "deficit_estime": round(row["deficit_estime"], 1),
                "score_potentiel": score,
                "segment_opportunite": segment,
                "qualite_donnees": round(row["data_quality"], 3),
                "recommendation": recommendation,
            }
        )
    return sorted(rows, key=lambda item: item["score_potentiel"], reverse=True)


def confidence_score(record: DentistRecord) -> int:
    record.sync_phone_summary()
    score = 0
    if record.full_name_source:
        score += 20
    if record.first_name and record.last_name:
        score += 10
    if record.primary_phone:
        score += 25
    if record.address_raw:
        score += 20
    if record.governorate:
        score += 10
    if len(split_sources(record)) > 1:
        score += 15
    return min(score, 100)


def crm_prospection(records: list[DentistRecord]) -> list[dict]:
    potential_by_gov = {row["gouvernorat"]: row for row in market_potential(records)}
    rows = []
    for record in records:
        record.sync_phone_summary()
        gov_potential = potential_by_gov.get(record.governorate or "", {})
        confidence = confidence_score(record)
        opportunity = float(gov_potential.get("score_potentiel") or 0)
        if not record.primary_phone:
            contact_status = "Non contactable"
            priority = "Basse"
        elif opportunity >= 70 and confidence >= 70:
            contact_status = "Prêt prospection"
            priority = "Haute"
        elif opportunity >= 45 and confidence >= 60:
            contact_status = "À qualifier"
            priority = "Moyenne"
        else:
            contact_status = "Suivi"
            priority = "Basse"
        rows.append(
            {
                "dentist_id": dentist_id(record),
                "nom_complet": record.full_name_source or "",
                "telephone": record.primary_phone or "",
                "gouvernorat": record.governorate or "Non renseigné",
                "localite": record.locality or "",
                "adresse": record.address_raw or "",
                "sources": " | ".join(split_sources(record)),
                "score_confiance": confidence,
                "score_potentiel_gouvernorat": opportunity,
                "segment_opportunite": gov_potential.get("segment_opportunite", ""),
                "priorite_contact": priority,
                "statut_contact": contact_status,
                "prochaine_action": next_action(priority, contact_status),
                "url_source": record.source_profile_url or "",
                "google_maps_url": record.google_maps_url or "",
            }
        )
    return sorted(rows, key=lambda item: (item["priorite_contact"] != "Haute", item["priorite_contact"] != "Moyenne", -item["score_potentiel_gouvernorat"], -item["score_confiance"]))


def next_action(priority: str, status: str) -> str:
    if status == "Non contactable":
        return "Chercher telephone via source officielle active"
    if priority == "Haute":
        return "Contacter en priorité"
    if priority == "Moyenne":
        return "Vérifier adresse puis contacter"
    return "Garder en suivi"


def copy_geojson() -> None:
    if not GEOJSON_SOURCE.exists():
        return
    target = OUTPUT_DIR / "tunisia_governorates.geojson"
    geojson = json.loads(GEOJSON_SOURCE.read_text(encoding="utf-8"))
    target.write_text(json.dumps(geojson, ensure_ascii=False), encoding="utf-8")


def main() -> None:
    with SessionLocal() as session:
        records = list_unique_dentists(session)

    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    write_csv(OUTPUT_DIR / "fact_dentists.csv", fact_dentists(records))
    write_csv(OUTPUT_DIR / "dim_governorates.csv", dim_governorates(records))
    write_csv(OUTPUT_DIR / "dim_sources.csv", dim_sources(records))
    write_csv(OUTPUT_DIR / "bridge_dentist_sources.csv", bridge_dentist_sources(records))
    write_csv(OUTPUT_DIR / "agg_governorate.csv", agg_governorate(records))
    write_csv(OUTPUT_DIR / "market_potential_governorate.csv", market_potential(records))
    write_csv(OUTPUT_DIR / "crm_prospection.csv", crm_prospection(records))
    copy_geojson()

    metadata = {
        "generated_at": datetime.now().isoformat(timespec="seconds"),
        "dentists": len(records),
        "governorates": len(GOVERNORATE_DISTRICTS),
        "sources": len(dim_sources(records)),
    }
    (OUTPUT_DIR / "metadata.json").write_text(json.dumps(metadata, ensure_ascii=False, indent=2), encoding="utf-8")
    print(json.dumps(metadata, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()
