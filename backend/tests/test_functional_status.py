from app.models import DentistRecord
from app.services.functional_status import predict_functional_status


def test_functional_probable_with_multi_source_phone_and_address():
    record = DentistRecord(
        source="med.tn|tunisie_medicale",
        primary_phone="+21670111222",
        address_raw="Rue test Tunis",
    )
    assert predict_functional_status(record).status == "Probablement fonctionnel"


def test_functional_review_with_phone_only():
    record = DentistRecord(primary_phone="+21670111222")
    assert predict_functional_status(record).status == "A verifier"


def test_functional_not_verified_without_signals():
    record = DentistRecord()
    assert predict_functional_status(record).status == "Non verifie"
