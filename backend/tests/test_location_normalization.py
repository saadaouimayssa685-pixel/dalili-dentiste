from app.normalization.locations import locations


def test_governorate_alias():
    assert locations.governorate("Medenine") == "Médenine"


def test_locality_alias():
    loc = locations.locality("Marsa")
    assert loc.name == "La Marsa"
    assert loc.governorate == "Tunis"

