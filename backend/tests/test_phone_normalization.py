from app.models import PhoneSource, PhoneType, PhoneValidationStatus
from app.normalization.phones import merge_phones, normalize_phone


def test_tunisian_phone_formats():
    assert normalize_phone("71 123 456", PhoneSource.MED_TN).normalized == "+21671123456"
    assert normalize_phone("00216 26 487 803", PhoneSource.MED_TN).normalized == "+21626487803"


def test_phone_type_and_invalid():
    assert normalize_phone("98.123.456", PhoneSource.MED_TN).type == PhoneType.MOBILE
    assert normalize_phone("00000000", PhoneSource.MED_TN).validation_status == PhoneValidationStatus.INVALID_FORMAT


def test_phone_dedup_sources():
    phones = merge_phones([normalize_phone("71 123 456", PhoneSource.MED_TN), normalize_phone("+21671123456", PhoneSource.TUNISIE_MEDICALE)])
    assert len(phones) == 1
    assert {s.value for s in phones[0].sources} == {"MED_TN", "TUNISIE_MEDICALE"}
