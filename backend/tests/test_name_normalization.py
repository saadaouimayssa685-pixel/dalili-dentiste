from app.normalization.names import parse_name


def test_simple_name():
    assert parse_name("Dr Aymen Khaldi")[:3] == ("Dr", "Aymen", "Khaldi")


def test_compound_first_name():
    title, first, last, status = parse_name("Docteur Mohamed Ali Ben Salah")
    assert title == "Docteur"
    assert status == "PARSED"
    assert first == "Mohamed"
    assert last == "Ali Ben Salah"


def test_multiple_doctors_review():
    assert parse_name("Dr A et Dr B")[3] == "REVIEW_REQUIRED"

