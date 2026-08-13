from app.scrapers.osm_pbf import is_osm_dentist, record_from_osm_object


class FakeOsmObject:
    id = 123


def test_osm_dentist_tags():
    assert is_osm_dentist({"amenity": "dentist"})
    assert is_osm_dentist({"healthcare": "dentist"})
    assert is_osm_dentist({"healthcare:speciality": "orthodontics"})
    assert not is_osm_dentist({"amenity": "pharmacy"})


def test_osm_record_from_tags():
    record = record_from_osm_object(
        FakeOsmObject(),
        {
            "name": "Cabinet Dentaire Test",
            "amenity": "dentist",
            "addr:city": "Tunis",
            "phone": "+216 71 123 456",
        },
        36.8,
        10.18,
    )
    assert record.source == "openstreetmap"
    assert record.full_name_source == "Cabinet Dentaire Test"
    assert record.governorate == "Tunis"
    assert record.primary_phone == "+21671123456"
    assert record.latitude == 36.8
