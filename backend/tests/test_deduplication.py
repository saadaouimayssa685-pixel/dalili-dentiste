from app.models import DentistRecord, PhoneSource
from app.normalization.phones import normalize_phone
from app.repositories.dentists import assign_duplicate_groups
from app.services.unique_dentists import build_unique_dentists


def test_duplicate_by_profile_url():
    records = [DentistRecord(source_profile_url="https://x/a.html"), DentistRecord(source_profile_url="https://x/a.html")]
    out = assign_duplicate_groups(records)
    assert out[0].duplicate_group_id == out[1].duplicate_group_id


def test_duplicate_by_phone_same_name():
    records = [
        DentistRecord(full_name_source="Dr A", phone_numbers=[normalize_phone("71123456", PhoneSource.MED_TN)]),
        DentistRecord(full_name_source="Dr A", phone_numbers=[normalize_phone("+21671123456", PhoneSource.TUNISIE_MEDICALE)]),
    ]
    out = assign_duplicate_groups(records)
    assert out[0].duplicate_group_id == out[1].duplicate_group_id


def test_duplicate_requires_same_person_when_phone_is_shared():
    records = [
        DentistRecord(full_name_source="Dr Raja Gmati", governorate="Tunis", phone_numbers=[normalize_phone("71891918", PhoneSource.TUNISIE_DENTISTE)]),
        DentistRecord(full_name_source="Dr Ramzi Trabelsi", governorate="Tunis", phone_numbers=[normalize_phone("71891918", PhoneSource.TUNISIE_MEDICALE)]),
    ]
    out = assign_duplicate_groups(records)
    assert out[0].duplicate_group_id is None
    assert out[1].duplicate_group_id is None


def test_duplicate_by_first_last_governorate_and_phone():
    records = [
        DentistRecord(first_name="Saber", last_name="Gabsi", full_name_source="Dr Saber GABSI", governorate="Ariana", phone_numbers=[normalize_phone("56787766", PhoneSource.MED_TN)]),
        DentistRecord(first_name="Saber", last_name="Gabsi", full_name_source="Saber Gabsi", governorate="Ariana", phone_numbers=[normalize_phone("+21656787766", PhoneSource.TUNISIE_MEDICALE)]),
    ]
    out = assign_duplicate_groups(records)
    assert out[0].duplicate_group_id == out[1].duplicate_group_id


def test_duplicate_merges_connected_phone_keys():
    records = [
        DentistRecord(full_name_source="Dr Walid Yahyaoui", governorate="Tunis", phone_numbers=[normalize_phone("71842020", PhoneSource.MED_TN), normalize_phone("58721000", PhoneSource.MED_TN)]),
        DentistRecord(full_name_source="Dr Walid Yahyaoui", governorate="Tunis", phone_numbers=[normalize_phone("71842020", PhoneSource.LERDVMEDICAL)]),
        DentistRecord(full_name_source="Walid Yahyaoui", governorate="Tunis", phone_numbers=[normalize_phone("58721000", PhoneSource.TUNISIE_MEDICALE)]),
    ]
    out = assign_duplicate_groups(records)
    assert len({record.duplicate_group_id for record in out}) == 1


def test_single_record_is_not_marked_duplicate():
    out = assign_duplicate_groups([DentistRecord(source_profile_url="https://x/unique.html")])
    assert out[0].duplicate_group_id is None


def test_unique_base_keeps_goafrica_named_doctor():
    records = [
        DentistRecord(
            source="goafricaonline",
            full_name_source="DR KHAIREDDINE HAMDANE",
            professional_title_exact="Dentiste",
            source_profile_url="https://www.goafricaonline.com/tn/dr-khaireddine",
        )
    ]
    assert len(build_unique_dentists(records)) == 1


def test_unique_base_excludes_goafrica_business_without_doctor():
    records = [
        DentistRecord(
            source="goafricaonline",
            full_name_source="DENTAL JOY LAB",
            professional_title_exact="Dentiste",
            source_profile_url="https://www.goafricaonline.com/tn/dental-joy-lab",
        )
    ]
    assert build_unique_dentists(records) == []


def test_unique_base_keeps_incomplete_unlocated_named_profile():
    records = [
        DentistRecord(
            source="tunisie_medicale",
            full_name_source="Wassim Guezguez & Maram Lebdi à",
            professional_title_exact="Dentiste",
            source_profile_url="https://tunisie-medicale.com/index.php/dentiste/3547-wassim-guezguez-maram-lebdi",
        )
    ]
    unique = build_unique_dentists(records)
    assert len(unique) == 1
    assert unique[0].full_name_source == "Wassim Guezguez & Maram Lebdi"
