from __future__ import annotations

import io
import json
from datetime import datetime, timezone
from pathlib import Path
from typing import Any
from uuid import uuid4

import pandas as pd
from fastapi import FastAPI, File, HTTPException, Query, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from sqlalchemy import func, or_, text

from app.chatbot import ChatbotContext, local_llm
from app.config import ROOT
from app.database import SessionLocal, init_db
from app.models import DentistRecord
from app.services.business_card_ocr import paddleocr_available, scan_business_card


app = FastAPI(title="Dalili Dentiste API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:3000",
        "http://127.0.0.1:3000",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class ChatRequest(BaseModel):
    message: str
    session_id: str | None = None


class CabinetProposal(BaseModel):
    name: str | None = None
    speciality: str | None = None
    phone: str | None = None
    address: str | None = None
    localite: str | None = None


@app.on_event("startup")
def startup() -> None:
    init_db()


@app.get("/api/health")
def health() -> dict[str, Any]:
    return {"status": "ok", "database": "dentists_clean"}


@app.get("/api/dentists")
def dentists(
    q: str | None = None,
    search: str | None = None,
    gouvernorat: str | None = None,
    governorate: str | None = None,
    localite: str | None = None,
    locality: str | None = None,
    speciality: str | None = None,
    specialty: str | None = None,
    source: str | None = None,
    name: str | None = None,
    has_phone: bool = False,
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    limit: int | None = Query(None, ge=1, le=100),
    offset: int | None = Query(None, ge=0),
) -> dict[str, Any]:
    page_size = limit or page_size
    offset = offset if offset is not None else (page - 1) * page_size
    filters = {
        "q": q or search,
        "governorate": _clean(gouvernorat or governorate),
        "locality": _clean(localite or locality),
        "specialty": _clean(speciality or specialty),
        "source": _clean(source),
        "name": _clean(name),
        "has_phone": has_phone,
    }
    with SessionLocal() as session:
        where_sql, params = _dentist_where(filters)
        total = session.execute(text(f"SELECT COUNT(*) FROM dentists_clean {where_sql}"), params).scalar_one()
        rows = session.execute(
            text(
                f"""
                SELECT *
                FROM dentists_clean
                {where_sql}
                ORDER BY quality_score DESC, source_count DESC, full_name
                LIMIT :limit OFFSET :offset
                """
            ),
            {**params, "limit": page_size, "offset": offset},
        ).mappings()
        items = [_public_dentist(dict(row)) for row in rows]
    return {"items": items, "total": total, "page": page, "page_size": page_size}


@app.get("/api/dentists/filters")
def dentist_filters() -> dict[str, Any]:
    with SessionLocal() as session:
        rows = session.execute(
            text(
                """
                SELECT governorate, locality, specialties, sources
                FROM dentists_clean
                """
            )
        ).mappings()
        governorates: set[str] = set()
        localities: dict[str, set[str]] = {}
        specialties: set[str] = set()
        sources: set[str] = set()
        for row in rows:
            gov = _clean(row["governorate"])
            loc = _clean(row["locality"])
            if gov:
                governorates.add(gov)
                if loc:
                    localities.setdefault(gov, set()).add(loc)
            for item in _json_list(row["specialties"]):
                specialties.add(item)
            for item in _split_sources(row["sources"]):
                sources.add(item)
    return {
        "gouvernorats": sorted(governorates),
        "localites": {gov: sorted(values) for gov, values in sorted(localities.items())},
        "specialites": sorted(specialties),
        "sources": sorted(sources),
    }


@app.get("/api/dentists/{dentist_id}")
def dentist_detail(dentist_id: int) -> dict[str, Any]:
    with SessionLocal() as session:
        row = session.execute(
            text("SELECT * FROM dentists_clean WHERE id = :id"),
            {"id": dentist_id},
        ).mappings().first()
    if not row:
        raise HTTPException(status_code=404, detail="Dentiste introuvable.")
    return _public_dentist(dict(row))


@app.get("/api/stats")
def stats() -> dict[str, Any]:
    with SessionLocal() as session:
        total = session.execute(text("SELECT COUNT(*) FROM dentists_clean")).scalar_one()
        with_phone = session.execute(
            text("SELECT COUNT(*) FROM dentists_clean WHERE phone IS NOT NULL AND TRIM(phone) != ''")
        ).scalar_one()
        governorates = session.execute(
            text("SELECT COUNT(DISTINCT governorate) FROM dentists_clean WHERE governorate IS NOT NULL AND TRIM(governorate) != ''")
        ).scalar_one()
        specs = session.execute(text("SELECT specialties FROM dentists_clean")).scalars().all()
    return {
        "dentists": total,
        "with_phone": with_phone,
        "governorates_covered": governorates,
        "governorates_total": 24,
        "specialties": len({item for value in specs for item in _json_list(value)}),
    }


@app.get("/api/governorates")
def governorates() -> dict[str, Any]:
    with SessionLocal() as session:
        rows = session.execute(
            text(
                """
                SELECT governorate AS name, COUNT(*) AS count
                FROM dentists_clean
                WHERE governorate IS NOT NULL AND TRIM(governorate) != ''
                GROUP BY governorate
                ORDER BY count DESC, governorate
                """
            )
        ).mappings()
    return {"items": [{"name": row["name"], "count": row["count"]} for row in rows]}


@app.get("/api/overview")
def overview(
    gouvernorat: str | None = None,
    speciality: str | None = None,
    source: str | None = None,
) -> dict[str, Any]:
    """Return dashboard aggregates computed from the consolidated SQL table."""
    filters = {
        "q": None,
        "governorate": _clean(gouvernorat),
        "locality": None,
        "specialty": _clean(speciality),
        "source": _clean(source),
        "name": None,
        "has_phone": False,
    }
    where_sql, params = _dentist_where(filters)
    with SessionLocal() as session:
        rows = [dict(row) for row in session.execute(
            text(f"SELECT * FROM dentists_clean {where_sql}"), params
        ).mappings()]

    total = len(rows)
    source_rows = sum(max(1, int(row.get("source_count") or 1)) for row in rows)
    with_phone = sum(bool(_clean(row.get("phone"))) for row in rows)
    with_specialty = sum(bool(_json_list(row.get("specialties"))) for row in rows)
    with_locality = sum(bool(_clean(row.get("locality"))) for row in rows)
    duplicate_rows = sum(int(row.get("source_count") or 1) > 1 for row in rows)

    def counts(key: str) -> list[dict[str, Any]]:
        grouped: dict[str, int] = {}
        for row in rows:
            value = _clean(row.get(key)) or "Non renseigné"
            grouped[value] = grouped.get(value, 0) + 1
        return [{"name": name, "dentists": count} for name, count in sorted(grouped.items(), key=lambda item: (-item[1], item[0]))]

    speciality_counts: dict[str, int] = {}
    source_counts: dict[str, dict[str, int]] = {}
    for row in rows:
        for item in _json_list(row.get("specialties")) or ["Omnipratique"]:
            speciality_counts[item] = speciality_counts.get(item, 0) + 1
        for item in _split_sources(row.get("sources")) or ["Source inconnue"]:
            bucket = source_counts.setdefault(item, {"phone": 0, "noPhone": 0, "duplicates": 0})
            if _clean(row.get("phone")):
                bucket["phone"] += 1
            else:
                bucket["noPhone"] += 1
            if int(row.get("source_count") or 1) > 1:
                bucket["duplicates"] += 1

    quality = [
        {"label": "Complétude téléphone", "value": round((with_phone / total) * 100, 1) if total else 0, "tone": "good"},
        {"label": "Complétude spécialité", "value": round((with_specialty / total) * 100, 1) if total else 0, "tone": "good"},
        {"label": "Complétude localité", "value": round((with_locality / total) * 100, 1) if total else 0, "tone": "good"},
        {"label": "Doublons inter-sources", "value": round((duplicate_rows / total) * 100, 1) if total else 0, "tone": "warn"},
        {"label": "Qualité globale", "value": round(sum(float(row.get("quality_score") or 0) for row in rows) / total, 1) if total else 0, "tone": "good"},
    ]
    return {
        "updatedAt": datetime.now(timezone.utc).isoformat(),
        "kpis": {
            "dentists": total,
            "rows": source_rows,
            "withPhone": with_phone,
            "withPhonePct": quality[0]["value"],
            "governorates": f"{len({row.get('governorate') for row in rows if _clean(row.get('governorate'))})}/24",
            "governoratesPct": round((len({row.get('governorate') for row in rows if _clean(row.get('governorate'))}) / 24) * 100, 1),
        },
        "monthly": [{"month": datetime.now(timezone.utc).strftime("%b"), "dentists": total}],
        "topGovernorates": counts("governorate")[:10],
        "specialities": [{"name": name, "value": value} for name, value in sorted(speciality_counts.items(), key=lambda item: -item[1])[:8]],
        "sources": [{"name": name, **values} for name, values in sorted(source_counts.items(), key=lambda item: -sum(item[1].values()))],
        "coverage": counts("governorate"),
        "localities": [
            {"locality": name, "governorate": next((row.get("governorate") for row in rows if _clean(row.get("locality")) == name), None), "dentists": count}
            for name, count in [(item["name"], item["dentists"]) for item in counts("locality")[:20]]
        ],
        "quality": quality,
    }


@app.get("/api/exports/source")
def export_source_data(
    source: str = Query(..., min_length=1),
    format: str = Query("csv", pattern="^(csv|xlsx)$"),
) -> StreamingResponse:
    source_clean = _clean(source)
    if not source_clean:
        raise HTTPException(status_code=400, detail="Source invalide.")

    with SessionLocal() as session:
        rows = session.execute(
            text(
                """
                SELECT
                    id,
                    full_name,
                    title,
                    specialties,
                    governorate,
                    delegation,
                    locality,
                    address,
                    phone,
                    google_maps_url,
                    latitude,
                    longitude,
                    sources,
                    source_count,
                    quality_score,
                    quality_status,
                    updated_at
                FROM dentists_clean
                WHERE sources LIKE :source
                ORDER BY quality_score DESC, source_count DESC, full_name
                """
            ),
            {"source": f"%{source_clean}%"},
        ).mappings().all()

    if not rows:
        raise HTTPException(status_code=404, detail="Aucune donnée trouvée pour cette source.")

    export_rows = [
        {
            "ID": row.get("id"),
            "Nom complet": row.get("full_name"),
            "Titre": row.get("title"),
            "Specialites": ", ".join(_json_list(row.get("specialties"))),
            "Gouvernorat": row.get("governorate"),
            "Delegation": row.get("delegation"),
            "Localite": row.get("locality"),
            "Adresse": row.get("address"),
            "Telephone": row.get("phone"),
            "Google Maps": row.get("google_maps_url"),
            "Latitude": row.get("latitude"),
            "Longitude": row.get("longitude"),
            "Sources": row.get("sources"),
            "Nombre de sources": row.get("source_count"),
            "Score qualite": row.get("quality_score"),
            "Statut qualite": row.get("quality_status"),
            "Mise a jour": row.get("updated_at"),
        }
        for row in rows
    ]

    safe_name = source_clean.replace(".", "-").replace(" ", "-").lower()
    dataframe = pd.DataFrame(export_rows)

    if format == "xlsx":
        buffer = io.BytesIO()
        with pd.ExcelWriter(buffer, engine="openpyxl") as writer:
            dataframe.to_excel(writer, index=False, sheet_name="dentists")
        buffer.seek(0)
        return StreamingResponse(
            buffer,
            media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            headers={"Content-Disposition": f'attachment; filename="{safe_name}.xlsx"'},
        )

    csv_data = dataframe.to_csv(index=False, sep=";", encoding="utf-8-sig")
    return StreamingResponse(
        io.BytesIO(csv_data.encode("utf-8-sig")),
        media_type="text/csv; charset=utf-8",
        headers={"Content-Disposition": f'attachment; filename="{safe_name}.csv"'},
    )


@app.get("/api/scan-card/status")
def scan_status() -> dict[str, Any]:
    return {"available": paddleocr_available(), "engine": "PaddleOCR", "languages": ["fr", "en", "arabic"]}


@app.post("/api/scan-card")
async def scan_card(file: UploadFile = File(...)) -> dict[str, Any]:
    data = await file.read()
    suffix = Path(file.filename or "card.png").suffix or ".png"
    try:
        result = scan_business_card(data, suffix=suffix)
    except RuntimeError as exc:
        raise HTTPException(status_code=503, detail=str(exc)) from exc
    record = result.record
    fields = {
        "name": record.full_name_source if record else "",
        "speciality": (record.specialties[0] if record and record.specialties else ""),
        "phone": record.primary_phone if record else "",
        "address": record.address_raw if record else "",
        "localite": record.locality if record else "",
    }
    return {
        "decision": result.decision,
        "confidence": result.confidence,
        "reasons": result.reasons,
        "text": result.text,
        "fields": fields,
    }


@app.post("/api/chat")
def chat(payload: ChatRequest) -> dict[str, Any]:
    records = _chat_records()
    session_id = payload.session_id or str(uuid4())
    reply = local_llm.answer(payload.message, records, context=ChatbotContext())
    dentists = _chat_search_sample(records, payload.message)
    return {
        "session_id": session_id,
        "message": reply.answer,
        "model": reply.model,
        "used_retrieval": reply.used_retrieval,
        "dentists": dentists,
    }


@app.delete("/api/chat/{session_id}")
def reset_chat(session_id: str) -> dict[str, Any]:
    return {"session_id": session_id, "status": "reset"}


@app.post("/api/cabinet-proposals")
def cabinet_proposal(payload: CabinetProposal) -> dict[str, Any]:
    proposal_dir = ROOT / "data" / "proposals"
    proposal_dir.mkdir(parents=True, exist_ok=True)
    proposal_id = str(uuid4())
    path = proposal_dir / "cabinet_proposals.jsonl"
    row = {"id": proposal_id, **payload.model_dump()}
    with path.open("a", encoding="utf-8") as file:
        file.write(json.dumps(row, ensure_ascii=False) + "\n")
    return {"id": proposal_id, "status": "received"}


def _dentist_where(filters: dict[str, Any]) -> tuple[str, dict[str, Any]]:
    clauses: list[str] = []
    params: dict[str, Any] = {}
    if filters["q"]:
        params["q"] = f"%{filters['q']}%"
        clauses.append(
            "(full_name LIKE :q OR title LIKE :q OR specialties LIKE :q OR governorate LIKE :q OR locality LIKE :q OR address LIKE :q)"
        )
    if filters["governorate"]:
        params["governorate"] = filters["governorate"]
        clauses.append("governorate = :governorate")
    if filters["locality"]:
        params["locality"] = f"%{filters['locality']}%"
        clauses.append("(locality LIKE :locality OR delegation LIKE :locality OR address LIKE :locality)")
    if filters["specialty"]:
        params["specialty"] = f"%{filters['specialty']}%"
        clauses.append("specialties LIKE :specialty")
    if filters["source"]:
        params["source"] = f"%{filters['source']}%"
        clauses.append("sources LIKE :source")
    if filters["name"]:
        params["name"] = f"%{filters['name']}%"
        clauses.append("full_name LIKE :name")
    if filters["has_phone"]:
        clauses.append("phone IS NOT NULL AND TRIM(phone) != ''")
    return (f"WHERE {' AND '.join(clauses)}" if clauses else "", params)


def _public_dentist(row: dict[str, Any]) -> dict[str, Any]:
    return {
        "id": str(row.get("id")),
        "name": row.get("full_name"),
        "full_name": row.get("full_name"),
        "speciality": _first_specialty(row.get("specialties")) or row.get("title"),
        "specialties": _json_list(row.get("specialties")),
        "gouvernorat": row.get("governorate"),
        "governorate": row.get("governorate"),
        "localite": row.get("locality") or row.get("delegation"),
        "locality": row.get("locality"),
        "address": row.get("address"),
        "phone": row.get("phone"),
        "telephone": row.get("phone"),
        "google_maps_url": _maps_url(row),
        "latitude": row.get("latitude"),
        "longitude": row.get("longitude"),
        "sources": _split_sources(row.get("sources")),
        "source_count": row.get("source_count"),
        "quality_score": row.get("quality_score"),
        "quality_status": row.get("quality_status"),
    }


def _maps_url(row: dict[str, Any]) -> str | None:
    if row.get("google_maps_url"):
        return row["google_maps_url"]
    lat, lon = row.get("latitude"), row.get("longitude")
    if lat is not None and lon is not None:
        return f"https://www.google.com/maps/search/?api=1&query={lat},{lon}"
    parts = [row.get("full_name"), row.get("address"), row.get("locality"), row.get("governorate"), "Tunisie"]
    query = "+".join(str(part).strip().replace(" ", "+") for part in parts if part)
    return f"https://www.google.com/maps/search/?api=1&query={query}" if query else None


def _chat_records(limit: int = 1200) -> list[DentistRecord]:
    with SessionLocal() as session:
        rows = session.execute(
            text(
                """
                SELECT *
                FROM dentists_clean
                ORDER BY quality_score DESC, source_count DESC, full_name
                LIMIT :limit
                """
            ),
            {"limit": limit},
        ).mappings()
        return [_record_from_clean_row(dict(row)) for row in rows]


def _record_from_clean_row(row: dict[str, Any]) -> DentistRecord:
    return DentistRecord(
        id=row.get("id"),
        source=row.get("sources") or "dentists_clean",
        full_name_source=row.get("full_name"),
        professional_title_exact=row.get("title"),
        specialties=_json_list(row.get("specialties")),
        address_raw=row.get("address"),
        locality=row.get("locality"),
        delegation=row.get("delegation"),
        governorate=row.get("governorate"),
        latitude=row.get("latitude"),
        longitude=row.get("longitude"),
        primary_phone=row.get("phone"),
        google_maps_url=_maps_url(row),
    )


def _chat_search_sample(records: list[DentistRecord], message: str) -> list[dict[str, Any]]:
    lowered = message.casefold()
    matches = []
    for record in records:
        haystack = " ".join(
            str(value or "")
            for value in [
                record.full_name_source,
                record.governorate,
                record.locality,
                " ".join(record.specialties),
            ]
        ).casefold()
        if any(token in haystack for token in lowered.split() if len(token) >= 4):
            matches.append(_public_dentist(_clean_row_from_record(record)))
        if len(matches) >= 5:
            break
    return matches


def _clean_row_from_record(record: DentistRecord) -> dict[str, Any]:
    return {
        "id": record.id,
        "full_name": record.full_name_source,
        "title": record.professional_title_exact,
        "specialties": json.dumps(record.specialties, ensure_ascii=False),
        "governorate": record.governorate,
        "delegation": record.delegation,
        "locality": record.locality,
        "address": record.address_raw,
        "phone": record.primary_phone,
        "google_maps_url": record.google_maps_url,
        "latitude": record.latitude,
        "longitude": record.longitude,
        "sources": record.source,
        "source_count": len(_split_sources(record.source)),
        "quality_score": None,
        "quality_status": None,
    }


def _json_list(value: Any) -> list[str]:
    if not value:
        return []
    if isinstance(value, list):
        return [str(item) for item in value if item]
    try:
        parsed = json.loads(str(value))
    except json.JSONDecodeError:
        return [str(value)]
    return [str(item) for item in parsed if item] if isinstance(parsed, list) else []


def _first_specialty(value: Any) -> str | None:
    items = _json_list(value)
    return items[0] if items else None


def _split_sources(value: Any) -> list[str]:
    return [part.strip() for part in str(value or "").split("|") if part.strip()]


def _clean(value: Any) -> str | None:
    if value is None:
        return None
    text_value = str(value).strip()
    return None if not text_value or text_value == "all" else text_value
