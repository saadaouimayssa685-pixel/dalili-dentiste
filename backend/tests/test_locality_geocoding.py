from __future__ import annotations

from app.models import DentistRecord
from app.services.locality_geocoding import (
    build_locality_review,
    is_coordinate_in_tunisia,
    match_locality,
)


def test_ariana_variants_match_same_locality() -> None:
    for value in ["Ariana", "Aryana", "أريانة"]:
        match = match_locality(value)
        assert match.is_reliable
        assert match.proposed is not None
        assert match.proposed.canonical_name == "Ariana"
        assert match.proposed.governorate == "Ariana"


def test_la_marsa_variants_match_same_locality() -> None:
    for value in ["La Marsa", "Marsa", "المرسى"]:
        match = match_locality(value)
        assert match.is_reliable
        assert match.proposed is not None
        assert match.proposed.canonical_name == "La Marsa"
        assert match.proposed.governorate == "Tunis"


def test_sidi_bou_said_accent_variant() -> None:
    match = match_locality("Sidi Bou Saïd")
    assert match.is_reliable
    assert match.proposed is not None
    assert match.proposed.canonical_name == "Sidi Bou Said"


def test_centre_ville_is_ambiguous() -> None:
    match = match_locality("Centre Ville")
    assert not match.is_reliable
    assert match.status == "ambiguous"


def test_invalid_zero_coordinates() -> None:
    assert not is_coordinate_in_tunisia(0, 0)


def test_outside_tunisia_coordinates() -> None:
    assert not is_coordinate_in_tunisia(48.8566, 2.3522)


def test_locality_without_governorate_can_propose_governorate() -> None:
    match = match_locality("La Marsa")
    assert match.is_reliable
    assert match.proposed is not None
    assert match.proposed.governorate == "Tunis"


def test_shared_artificial_point_requires_review() -> None:
    records = [
        DentistRecord(
            id=index,
            source="test",
            full_name_source=f"Dr Test {index}",
            locality="Ariana",
            governorate="Ariana",
            latitude=36.8625,
            longitude=10.1956,
        )
        for index in range(1, 7)
    ]
    proposals = build_locality_review(records)
    assert all(proposal.reason == "shared_artificial_point" for proposal in proposals)
    assert all(not proposal.is_reliable for proposal in proposals)
