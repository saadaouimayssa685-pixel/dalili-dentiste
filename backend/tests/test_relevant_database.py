from sqlalchemy import create_engine, text
from sqlalchemy.orm import Session

from app.services.relevant_database import build_relevant_database, score_relevance


ACTIVE = {"med.tn", "tunisie_medicale"}


def test_scores_high_quality_multi_source_dentist():
    row = {
        "source": "med.tn|tunisie_medicale",
        "full_name_source": "Dr Amina Ben Salah",
        "professional_title_exact": "Medecin dentiste",
        "specialties": '["Orthodontie"]',
        "governorate": "Ariana",
        "locality": "La Marsa",
        "primary_phone": "+21670111222",
        "phone_validation_status": "VALID",
        "address_raw": "Rue test",
    }
    result = score_relevance(row, ACTIVE)
    assert result["status"] == "HIGH"
    assert result["score"] >= 75


def test_rejects_inactive_source():
    row = {
        "source": "cnomdt",
        "full_name_source": "Dr Test Dentiste",
        "professional_title_exact": "Medecin dentiste",
        "governorate": "Tunis",
    }
    result = score_relevance(row, ACTIVE)
    assert result["status"] == "REJECTED"


def test_rejects_non_dentist_profile():
    row = {
        "source": "med.tn",
        "full_name_source": "Centre Medical Test",
        "professional_title_exact": "Cardiologue",
        "governorate": "Tunis",
    }
    result = score_relevance(row, ACTIVE)
    assert result["status"] == "REJECTED"


def test_builds_clean_table_from_unique_dentists():
    engine = create_engine("sqlite:///:memory:", future=True)
    with engine.begin() as connection:
        connection.execute(
            text(
                """
                CREATE TABLE unique_dentists (
                    id INTEGER,
                    source TEXT,
                    full_name_source TEXT,
                    professional_title_exact TEXT,
                    specialties TEXT,
                    governorate TEXT,
                    delegation TEXT,
                    locality TEXT,
                    address_raw TEXT,
                    address_normalized TEXT,
                    primary_phone TEXT,
                    phone_validation_status TEXT,
                    google_maps_url TEXT,
                    latitude FLOAT,
                    longitude FLOAT,
                    source_profile_url TEXT
                )
                """
            )
        )
        connection.execute(
            text(
                """
                INSERT INTO unique_dentists VALUES (
                    1,
                    'med.tn',
                    'Dr Amina Ben Salah',
                    'Medecin dentiste',
                    '["Orthodontie"]',
                    'Ariana',
                    NULL,
                    'La Marsa',
                    'Rue test',
                    'Rue test',
                    '+21670111222',
                    'VALID',
                    NULL,
                    NULL,
                    NULL,
                    'https://example.test/profile'
                )
                """
            )
        )
    with Session(engine) as session:
        summary = build_relevant_database(session)
        rows = session.execute(text("SELECT * FROM dentists_clean")).mappings().all()
    assert summary.relevant_rows == 1
    assert list(rows[0].keys()) == [
        "id",
        "full_name",
        "title",
        "specialties",
        "governorate",
        "delegation",
        "locality",
        "address",
        "phone",
        "google_maps_url",
        "latitude",
        "longitude",
        "sources",
        "source_count",
        "quality_score",
        "quality_status",
        "updated_at",
    ]
