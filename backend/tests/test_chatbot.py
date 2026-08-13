from app.chatbot import ChatbotContext, build_chatbot_reply, parse_message
from app.chatbot.language_detector import AssistantLanguage
from app.chatbot.search import search_dentists
from app.models import DentistRecord


def sample_records():
    return [
        DentistRecord(
            source="test",
            full_name_source="Dr Amina Orthodontiste",
            professional_title_exact="Orthodontiste",
            specialties=["Orthodontiste"],
            governorate="Ariana",
            locality="La Marsa",
            address_raw="Rue test La Marsa",
            primary_phone="+21670111222",
            google_maps_url="https://maps.google.com/test",
        ),
        DentistRecord(
            source="test",
            full_name_source="Dr Sami Enfant",
            professional_title_exact="Médecin dentiste",
            specialties=["Pédodontie"],
            governorate="Sfax",
            locality="Sfax",
            primary_phone=None,
        ),
        DentistRecord(
            source="test",
            full_name_source="Dr Imene Implant",
            professional_title_exact="Médecin dentiste",
            specialties=["Implantologie"],
            governorate="Sousse",
            locality="Sousse",
            primary_phone="+21673111222",
        ),
    ]


def test_parse_french_specialty_and_governorate():
    parsed = parse_message("Je cherche un orthodontiste à Ariana", sample_records())
    assert parsed.language == AssistantLanguage.FRENCH
    assert parsed.intent == "search_dentist"
    assert parsed.specialty == "orthodontie"
    assert parsed.governorate == "Ariana"


def test_parse_arabic_tunisian_mixed():
    parsed = parse_message("نحب نلقى orthodontiste في أريانة", sample_records())
    assert parsed.language == AssistantLanguage.TUNISIAN_ARABIC
    assert parsed.specialty == "orthodontie"
    assert parsed.governorate == "Ariana"


def test_parse_arabizi_pedodontie():
    parsed = parse_message("dentiste mta3 sghar fi Sfax", sample_records())
    assert parsed.language == AssistantLanguage.TUNISIAN_LATIN
    assert parsed.specialty == "pédodontie"
    assert parsed.governorate == "Sfax"


def test_parse_implant_with_phone():
    parsed = parse_message("implant fi Sousse avec téléphone", sample_records())
    assert parsed.specialty == "implantologie"
    assert parsed.governorate == "Sousse"
    assert parsed.phone_required is True


def test_parse_composed_city():
    parsed = parse_message("famma tbib snan fi La Marsa?", sample_records())
    assert parsed.city == "La Marsa"


def test_incomplete_conversation_two_messages():
    context = ChatbotContext()
    first = parse_message("Je cherche un orthodontiste", sample_records(), context=context)
    reply, result = build_chatbot_reply(first, sample_records(), context)
    assert result is None
    assert "ville" in reply or "gouvernorat" in reply
    second = parse_message("À Ariana", sample_records(), context=context)
    reply, result = build_chatbot_reply(second, sample_records(), context)
    assert result is not None
    assert result.total == 1


def test_reset_context():
    context = ChatbotContext(specialty="orthodontie", governorate="Ariana")
    parsed = parse_message("nouvelle recherche", sample_records(), context=context)
    reply, _ = build_chatbot_reply(parsed, sample_records(), context)
    assert context.specialty is None
    assert "Nouvelle recherche" in reply


def test_sql_injection_does_not_expand_results():
    parsed = parse_message("' OR 1=1 --", sample_records())
    result = search_dentists(sample_records(), specialty=parsed.specialty, governorate=parsed.governorate, limit=5)
    assert result.total == 3
    assert parsed.intent in {"search_dentist", "help"}


def test_emergency_detection():
    parsed = parse_message("wajhi nafekh barcha w ma najamch netnaffes", sample_records())
    assert parsed.intent == "medical_emergency"
    reply, result = build_chatbot_reply(parsed, sample_records(), ChatbotContext())
    assert result is None
    assert "urgence" in reply.lower() or "urgence" in reply.casefold()


def test_search_requires_phone_and_limits_to_five():
    many = sample_records() * 4
    result = search_dentists(many, phone_required=True, limit=5)
    assert result.total == 8
    assert len(result.records) == 5
    assert all(record.primary_phone for record in result.records)


def test_no_result_is_about_available_data():
    parsed = parse_message("orthodontiste à Sfax", sample_records())
    reply, result = build_chatbot_reply(parsed, sample_records(), ChatbotContext())
    assert result.total == 0
    assert "données disponibles" in reply
