from __future__ import annotations

import json
from datetime import datetime

from sqlalchemy import Boolean, DateTime, Float, Integer, String, Text, create_engine, inspect, select, text
from sqlalchemy.orm import DeclarativeBase, Mapped, Session, mapped_column, sessionmaker

from .config import settings
from .models import DentistRecord


class Base(DeclarativeBase):
    pass


class DentistORM(Base):
    __tablename__ = "dentists"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    source: Mapped[str | None] = mapped_column(String(50))
    source_profile_url: Mapped[str | None] = mapped_column(String(1000), unique=True)
    source_listing_url: Mapped[str | None] = mapped_column(String(1000))
    full_name_source: Mapped[str | None] = mapped_column(String(300))
    title_prefix: Mapped[str | None] = mapped_column(String(50))
    first_name: Mapped[str | None] = mapped_column(String(150))
    last_name: Mapped[str | None] = mapped_column(String(150))
    name_parsing_status: Mapped[str | None] = mapped_column(String(50))
    professional_title_exact: Mapped[str | None] = mapped_column(String(200))
    specialties: Mapped[str | None] = mapped_column(Text)
    cabinet_name: Mapped[str | None] = mapped_column(String(300))
    address_raw: Mapped[str | None] = mapped_column(Text)
    address_normalized: Mapped[str | None] = mapped_column(Text)
    locality: Mapped[str | None] = mapped_column(String(150))
    delegation: Mapped[str | None] = mapped_column(String(150))
    district: Mapped[str | None] = mapped_column(String(150))
    postal_code: Mapped[str | None] = mapped_column(String(20))
    governorate: Mapped[str | None] = mapped_column(String(150))
    country: Mapped[str | None] = mapped_column(String(100))
    latitude: Mapped[float | None] = mapped_column(Float)
    longitude: Mapped[float | None] = mapped_column(Float)
    geocoding_status: Mapped[str | None] = mapped_column(String(80))
    geocoding_source: Mapped[str | None] = mapped_column(String(120))
    geocoding_precision: Mapped[str | None] = mapped_column(String(40))
    geocoding_confidence: Mapped[float | None] = mapped_column(Float)
    phone_numbers: Mapped[str | None] = mapped_column(Text)
    primary_phone: Mapped[str | None] = mapped_column(String(40))
    landline_phone: Mapped[str | None] = mapped_column(String(40))
    mobile_phone: Mapped[str | None] = mapped_column(String(40))
    whatsapp_phone: Mapped[str | None] = mapped_column(String(40))
    phone_source: Mapped[str | None] = mapped_column(String(300))
    phone_raw: Mapped[str | None] = mapped_column(Text)
    phone_normalized: Mapped[str | None] = mapped_column(Text)
    phone_is_valid: Mapped[bool | None] = mapped_column(Boolean)
    phone_validation_status: Mapped[str | None] = mapped_column(String(200))
    google_maps_url: Mapped[str | None] = mapped_column(String(1000))
    duplicate_group_id: Mapped[str | None] = mapped_column(String(120))
    scraped_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    last_verified_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))


class LocalityReferenceORM(Base):
    __tablename__ = "locality_references"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    canonical_name: Mapped[str] = mapped_column(String(180), nullable=False)
    normalized_name: Mapped[str] = mapped_column(String(180), nullable=False)
    arabic_name: Mapped[str | None] = mapped_column(String(180))
    governorate: Mapped[str | None] = mapped_column(String(150))
    delegation: Mapped[str | None] = mapped_column(String(150))
    postal_code: Mapped[str | None] = mapped_column(String(20))
    latitude: Mapped[float | None] = mapped_column(Float)
    longitude: Mapped[float | None] = mapped_column(Float)
    aliases: Mapped[str | None] = mapped_column(Text)
    is_ambiguous: Mapped[bool | None] = mapped_column(Boolean)


engine = create_engine(settings.database_url, future=True)
SessionLocal = sessionmaker(engine, expire_on_commit=False, future=True)


def init_db() -> None:
    Base.metadata.create_all(engine)
    with engine.begin() as connection:
        _ensure_geocoding_columns(connection, "dentists")
        connection.execute(text("CREATE TABLE IF NOT EXISTS unique_dentists AS SELECT * FROM dentists WHERE 0"))
        _ensure_geocoding_columns(connection, "unique_dentists")
        _seed_locality_references(connection)


def _ensure_column(connection, table_name: str, column_name: str, column_type: str) -> None:
    columns = {column["name"] for column in inspect(connection).get_columns(table_name)}
    if column_name not in columns:
        connection.execute(text(f"ALTER TABLE {table_name} ADD COLUMN {column_name} {column_type}"))


def _ensure_geocoding_columns(connection, table_name: str) -> None:
    _ensure_column(connection, table_name, "district", "VARCHAR(150)")
    _ensure_column(connection, table_name, "latitude", "FLOAT")
    _ensure_column(connection, table_name, "longitude", "FLOAT")
    _ensure_column(connection, table_name, "geocoding_status", "VARCHAR(80)")
    _ensure_column(connection, table_name, "geocoding_source", "VARCHAR(120)")
    _ensure_column(connection, table_name, "geocoding_precision", "VARCHAR(40)")
    _ensure_column(connection, table_name, "geocoding_confidence", "FLOAT")


def _seed_locality_references(connection) -> None:
    connection.execute(text("DELETE FROM locality_references"))
    statement = text(
        """
        INSERT INTO locality_references (
            canonical_name,
            normalized_name,
            arabic_name,
            governorate,
            delegation,
            postal_code,
            latitude,
            longitude,
            aliases,
            is_ambiguous
        )
        VALUES (
            :canonical_name,
            :normalized_name,
            :arabic_name,
            :governorate,
            :delegation,
            :postal_code,
            :latitude,
            :longitude,
            :aliases,
            :is_ambiguous
        )
        """
    )
    for item in settings.localities_reference.get("localities", []):
        connection.execute(
            statement,
            {
                "canonical_name": item.get("canonical_name"),
                "normalized_name": item.get("normalized_name"),
                "arabic_name": item.get("arabic_name"),
                "governorate": item.get("governorate"),
                "delegation": item.get("delegation"),
                "postal_code": item.get("postal_code"),
                "latitude": item.get("latitude"),
                "longitude": item.get("longitude"),
                "aliases": _dump(item.get("aliases") or []),
                "is_ambiguous": bool(item.get("is_ambiguous", False)),
            },
        )


def _dump(value: object) -> str:
    return json.dumps(value, ensure_ascii=False, default=str)


def _load_json(value: str | None, default: object) -> object:
    return json.loads(value) if value else default


def _record_from_storage(data: dict) -> DentistRecord:
    data["specialties"] = _load_json(data.get("specialties"), [])
    data["phone_numbers"] = _load_json(data.get("phone_numbers"), [])
    return DentistRecord.model_validate(data)


def orm_to_record(row: DentistORM) -> DentistRecord:
    data = {col.name: getattr(row, col.name) for col in DentistORM.__table__.columns}
    return _record_from_storage(data)


def _record_payload(record: DentistRecord) -> dict:
    record.sync_phone_summary()
    payload = record.to_storage()
    payload["specialties"] = _dump(payload["specialties"])
    payload["phone_numbers"] = _dump(payload["phone_numbers"])
    return payload


def upsert_dentist(session: Session, record: DentistRecord) -> DentistORM:
    existing = None
    if record.source_profile_url:
        existing = session.scalar(select(DentistORM).where(DentistORM.source_profile_url == record.source_profile_url))
    payload = _record_payload(record)
    payload.pop("id", None)
    if existing:
        for key, value in payload.items():
            setattr(existing, key, value)
        return existing
    row = DentistORM(**payload)
    session.add(row)
    return row


def list_dentists(session: Session, governorate: str | None = None) -> list[DentistRecord]:
    query = select(DentistORM)
    if governorate:
        query = query.where(DentistORM.governorate == governorate)
    return [orm_to_record(row) for row in session.scalars(query).all()]


def rebuild_unique_dentists(session: Session) -> list[DentistRecord]:
    from app.services.unique_dentists import build_unique_dentists

    records = build_unique_dentists(list_dentists(session))
    columns = [col.name for col in DentistORM.__table__.columns]
    session.execute(text("DELETE FROM unique_dentists"))
    placeholders = ", ".join(f":{column}" for column in columns)
    column_list = ", ".join(columns)
    statement = text(f"INSERT INTO unique_dentists ({column_list}) VALUES ({placeholders})")
    for index, record in enumerate(records, start=1):
        payload = _record_payload(record)
        payload["id"] = index
        session.execute(statement, {column: payload.get(column) for column in columns})
    session.commit()
    return records


def list_unique_dentists(session: Session, governorate: str | None = None) -> list[DentistRecord]:
    init_db()
    query = "SELECT * FROM unique_dentists"
    params = {}
    if governorate:
        query += " WHERE governorate = :governorate"
        params["governorate"] = governorate
    rows = session.execute(text(query), params).mappings().all()
    if not rows:
        return rebuild_unique_dentists(session)
    return [_record_from_storage(dict(row)) for row in rows]
