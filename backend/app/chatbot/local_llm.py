from __future__ import annotations

from dataclasses import dataclass

from app.chatbot.intent_parser import ChatbotContext, parse_message
from app.chatbot.language_detector import AssistantLanguage
from app.chatbot.response_builder import build_chatbot_reply
from app.chatbot.tunisian_normalizer import normalize_chat_text
from app.models import DentistRecord


@dataclass(frozen=True)
class LocalLLMReply:
    answer: str
    model: str = "dalili-local-mini"
    used_retrieval: bool = False


class DaliliLocalMiniLLM:
    """Minimal local assistant for standard Dalili Dentiste questions.

    It is deliberately deterministic: no external API, no hallucinated facts.
    It answers standard questions with local templates and uses the local
    dentist records for search questions.
    """

    model_name = "dalili-local-mini"

    def answer(
        self,
        message: str,
        records: list[DentistRecord],
        context: ChatbotContext | None = None,
        preferred_language: AssistantLanguage = AssistantLanguage.AUTO,
    ) -> LocalLLMReply:
        context = context or ChatbotContext()
        parsed = parse_message(message, records, context=context, preferred_language=preferred_language)
        standard = _standard_answer(message, parsed.language)
        if standard:
            return LocalLLMReply(answer=standard, model=self.model_name, used_retrieval=False)
        answer, result = build_chatbot_reply(parsed, records, context)
        return LocalLLMReply(answer=answer, model=self.model_name, used_retrieval=result is not None)


def _standard_answer(message: str, language: AssistantLanguage) -> str | None:
    normalized = normalize_chat_text(message)
    if any(term in normalized for term in ["source", "sources", "donnees", "donnees", "base"]):
        return _by_language(
            language,
            fr=(
                "La base Dalili utilise uniquement les sources actives validees: Med.tn, Sante Tunisie, "
                "Le RDV Medical, Tunisie Medicale, Tunisie Dentiste, Bonnes Adresses, Go Africa Online, "
                "Orthodontiste.tn et Para Doctor."
            ),
            tn_lat=(
                "El base Dalili tekhdem b sources actifs w valides: Med.tn, Sante Tunisie, "
                "Le RDV Medical, Tunisie Medicale, Tunisie Dentiste, Bonnes Adresses, Go Africa Online, "
                "Orthodontiste.tn w Para Doctor."
            ),
            tn_ar="قاعدة Dalili تخدم كان بالمصادر المفعلة والمثبتة: Med.tn و Sante Tunisie وباقي الدلائل النشطة.",
        )
    if any(term in normalized for term in ["urgence", "douleur forte", "wja3", "nafekh", "saignement"]):
        return _by_language(
            language,
            fr="En cas de douleur forte, gonflement, fievre ou difficulte a respirer, contactez une urgence medicale ou un dentiste immediatement.",
            tn_lat="Ken fama wja3 qawi, nafkha, sokhana wala mochkla fel tanaffos, emchi lel urgence wala kallam dentiste tawa.",
            tn_ar="إذا فما وجيعة قوية، نفخة، سخانة أو صعوبة في التنفس، يلزم تمشي للاستعجالي أو تكلم طبيب أسنان فوراً.",
        )
    if any(term in normalized for term in ["comment", "aide", "help", "chnowa", "chna3mel"]):
        return _by_language(
            language,
            fr="Je peux chercher un dentiste par gouvernorat, ville, specialite, telephone disponible ou localisation Google Maps.",
            tn_lat="Najjem n3awnek tlawwej 3la dentiste bel gouvernorat, ville, specialite, telephone wala localisation Google Maps.",
            tn_ar="نجم نعاونك تلقى طبيب أسنان حسب الولاية، المدينة، الاختصاص، الهاتف أو موقع Google Maps.",
        )
    return None


def _by_language(language: AssistantLanguage, *, fr: str, tn_lat: str, tn_ar: str) -> str:
    if language == AssistantLanguage.TUNISIAN_ARABIC:
        return tn_ar
    if language == AssistantLanguage.TUNISIAN_LATIN:
        return tn_lat
    return fr


local_llm = DaliliLocalMiniLLM()
