from app.models import DentistRecord, PhoneSource
from app.normalization.phones import normalize_phone
from app.services.activity import predict_activity


def test_record_quality_reliable_with_strong_signals():
    record = DentistRecord(
        source="med.tn|tunisie_medicale|lerdvmedical",
        full_name_source="Dr Aymen Khaldi",
        professional_title_exact="Dentiste",
        address_raw="Rue X Tunis",
        governorate="Tunis",
        locality="El Manar",
        source_profile_url="https://example.test/profile",
        phone_numbers=[normalize_phone("71888888", PhoneSource.MED_TN)],
    )
    prediction = predict_activity(record)
    assert prediction.status == "Fiche fiable"
    assert prediction.score >= 85


def test_record_quality_review_for_weak_but_public_profile():
    record = DentistRecord(
        source="tunisie_medicale",
        full_name_source="Wassim Guezguez & Maram Lebdi",
        professional_title_exact="Dentiste",
        source_profile_url="https://example.test/profile",
    )
    prediction = predict_activity(record)
    assert prediction.status == "A verifier"
    assert "sans telephone ni adresse" in prediction.reasons
