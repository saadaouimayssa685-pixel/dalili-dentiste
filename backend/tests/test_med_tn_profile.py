from pathlib import Path

from app.scrapers.med_tn_profile import parse_profile

FIX = Path(__file__).parent / "fixtures"


def test_parse_complete_profile_with_phone():
    record = parse_profile((FIX / "profile_complete.html").read_text(encoding="utf-8"), "https://www.med.tn/x.html")
    assert record.full_name_source == "Dr Wejden MANNAI"
    assert record.professional_title_exact == "Dentiste"
    assert record.postal_code == "2092"
    assert record.governorate == "Tunis"
    assert record.primary_phone == "+21698140412"
    assert "Implantologie" in record.specialties


def test_parse_profile_without_specialty_or_postal_code():
    record = parse_profile((FIX / "profile_missing.html").read_text(encoding="utf-8"), "https://www.med.tn/x.html")
    assert record.full_name_source == "Dr Fatma Ben Ali"
    assert record.postal_code is None
    assert record.specialties == []

