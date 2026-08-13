from app.services.business_card_ocr import _extract_ocr_lines, analyze_business_card_text


def test_business_card_dentist_is_validated():
    result = analyze_business_card_text(
        [
            "Dr Hela Haloui",
            "Médecin dentiste",
            "B2 Centre Médical Eya Avenue Hedi Nouira",
            "Nabeul",
            "+216 72 270 822",
        ]
    )

    assert result.is_dentist_card is True
    assert result.record is not None
    assert result.record.primary_phone == "+21672270822"
    assert result.record.governorate == "Nabeul"


def test_business_card_english_dentist_is_validated():
    result = analyze_business_card_text(
        [
            "D. Marwa Rekik",
            "Advance Dental Clinic",
            "Oral surgery and implantology",
            "+216 93 755 377",
        ]
    )

    assert result.is_dentist_card is True
    assert result.record is not None
    assert result.record.full_name_source == "Dr Marwa Rekik"
    assert result.record.primary_phone == "+21693755377"


def test_business_card_arabic_dentist_is_validated():
    result = analyze_business_card_text(
        [
            "الدكتورة مروة الرقيق",
            "طبيبة أسنان",
            "جراحة الفم وزرع الأسنان",
            "شارع المنجي سليم حدائق العوينة",
            "93 755 377",
        ]
    )

    assert result.is_dentist_card is True
    assert result.record is not None
    assert result.record.full_name_source == "د. مروة الرقيق"
    assert result.record.professional_title_exact == "Chirurgien dentiste"
    assert result.record.primary_phone == "+21693755377"


def test_business_card_arabic_digits_are_normalized():
    result = analyze_business_card_text(
        [
            "د. مروة الرقيق",
            "طبيبة اسنان",
            "العيادة: شارع المنجي سليم",
            "٩٣ ٧٥٥ ٣٧٧",
        ]
    )

    assert result.is_dentist_card is True
    assert result.record is not None
    assert result.record.full_name_source == "د. مروة الرقيق"
    assert result.record.primary_phone == "+21693755377"
    assert result.record.address_raw == "العيادة: شارع المنجي سليم"


def test_business_card_arabic_name_without_doctor_title():
    result = analyze_business_card_text(
        [
            "مروة الرقيق",
            "عيادة أسنان",
            "تقويم الأسنان",
            "70 755 377",
        ]
    )

    assert result.is_dentist_card is True
    assert result.record is not None
    assert result.record.full_name_source == "مروة الرقيق"
    assert result.record.professional_title_exact == "Orthodontiste"


def test_business_card_extracts_cabinet_and_arabic_location():
    result = analyze_business_card_text(
        [
            "الدكتورة مروة الرقيق",
            "طبيبة أسنان",
            "جراحة الفم وزرع الأسنان",
            "D. Marwa Rekik",
            "Advance Dental Clinic",
            "مركب عائشة الطبي - عيادة A14 - الطابق الأول",
            "شارع المنجي سليم - حدائق العوينة 2045",
            "93 755 377 - 70 755 377",
            "dr.marwa.rekik@gmail.com",
        ]
    )

    assert result.is_dentist_card is True
    assert result.record is not None
    assert result.record.cabinet_name == "Advance Dental Clinic"
    assert result.record.address_raw == "مركب عائشة الطبي - عيادة A14 - الطابق الأول, شارع المنجي سليم - حدائق العوينة 2045"
    assert result.record.locality == "L'Aouina"
    assert result.record.governorate == "Ariana"
    assert result.record.primary_phone == "+21693755377"


def test_business_card_non_dentist_is_rejected():
    result = analyze_business_card_text(
        [
            "Cabinet Architecture Moderne",
            "Architecte principal",
            "Rue de Marseille Tunis",
            "+216 71 222 333",
        ]
    )

    assert result.is_dentist_card is False
    assert result.record is None


def test_extract_ocr_lines_from_legacy_paddle_format():
    result = [[[[[0, 0], [1, 1]], ("Dr Hela Haloui", 0.99)]]]
    assert _extract_ocr_lines(result) == ["Dr Hela Haloui"]


def test_extract_ocr_lines_from_paddle_v3_dict_format():
    result = [{"rec_texts": ["Médecin dentiste", "Nabeul"]}]
    assert _extract_ocr_lines(result) == ["Médecin dentiste", "Nabeul"]
