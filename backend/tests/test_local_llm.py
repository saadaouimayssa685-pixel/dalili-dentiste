from app.chatbot.local_llm import local_llm
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
            primary_phone="+21670111222",
            google_maps_url="https://maps.google.com/test",
        )
    ]


def test_local_llm_answers_standard_source_question():
    reply = local_llm.answer("Quelles sources utilise la base ?", sample_records())
    assert reply.model == "dalili-local-mini"
    assert reply.used_retrieval is False
    assert "Med.tn" in reply.answer


def test_local_llm_uses_retrieval_for_search():
    reply = local_llm.answer("Je cherche un orthodontiste a Ariana", sample_records())
    assert reply.used_retrieval is True
    assert "resultat" in reply.answer or "résultat" in reply.answer or "rÃ©sultat" in reply.answer
