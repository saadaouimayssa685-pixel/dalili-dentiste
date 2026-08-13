from __future__ import annotations

from dataclasses import dataclass

from app.chatbot.language_detector import AssistantLanguage, detect_language
from app.chatbot.location_mapper import detect_location
from app.chatbot.safety import is_emergency
from app.chatbot.specialty_mapper import detect_specialty
from app.chatbot.tunisian_normalizer import normalize_chat_text


CHATBOT_MODE = "rules"
TUNISIAN_NLP_MODE = "rules"


@dataclass
class ChatbotContext:
    specialty: str | None = None
    governorate: str | None = None
    city: str | None = None
    phone_required: bool = False
    maps_required: bool = False
    near_me: bool = False
    max_results: int = 5

    def reset(self) -> None:
        self.specialty = None
        self.governorate = None
        self.city = None
        self.phone_required = False
        self.maps_required = False
        self.near_me = False
        self.max_results = 5


@dataclass(frozen=True)
class ParsedIntent:
    intent: str
    language: AssistantLanguage
    specialty: str | None = None
    governorate: str | None = None
    city: str | None = None
    phone_required: bool = False
    maps_required: bool = False
    near_me: bool = False
    max_results: int = 5
    ambiguous_location: bool = False
    raw_message: str = ""


def parse_message(
    message: str,
    records,
    context: ChatbotContext | None = None,
    preferred_language: AssistantLanguage = AssistantLanguage.AUTO,
) -> ParsedIntent:
    language = detect_language(message, preferred_language)
    normalized = normalize_chat_text(message[:500])
    context = context or ChatbotContext()

    if not normalized:
        return ParsedIntent(intent="help", language=language, raw_message=message)
    if is_emergency(message):
        return ParsedIntent(intent="medical_emergency", language=language, raw_message=message)
    if normalized in {"reset", "nouvelle recherche", "recommencer", "effacer"}:
        return ParsedIntent(intent="reset", language=language, raw_message=message)
    if any(word in normalized for word in ["aide", "help", "comment", "شنوة", "chna3mel"]):
        return ParsedIntent(intent="help", language=language, raw_message=message)
    if any(word in normalized for word in ["combien", "nombre", "count", "قداش", "9adech"]):
        base_intent = "count_results"
    elif any(word in normalized for word in ["specialite", "spécialité", "شنوة spécialité", "chnoua specialite"]):
        base_intent = "explain_specialty"
    else:
        base_intent = "search_dentist"

    available_specialties = sorted({s for r in records for s in (r.specialties or []) if s})
    detected_specialty = detect_specialty(message, available_specialties)
    specialty = detected_specialty or context.specialty
    location = detect_location(message, records)
    location_was_detected = bool(location.governorate or location.city)
    if location_was_detected:
        governorate = location.governorate
        city = location.city
    else:
        governorate = context.governorate
        city = context.city
    phone_required = context.phone_required or any(word in normalized for word in ["telephone", "téléphone", "numero", "numéro", "phone", "هاتف", "tel"])
    maps_required = context.maps_required or any(word in normalized for word in ["maps", "map", "carte", "google maps"])
    near_me = context.near_me or any(word in normalized for word in ["pres de moi", "près de moi", "proche", "qrib moi", "qrib meni", "9rib meni"])
    intent = "find_near_me" if near_me and not (governorate or city) else base_intent

    return ParsedIntent(
        intent=intent,
        language=language,
        specialty=specialty,
        governorate=governorate,
        city=city,
        phone_required=phone_required,
        maps_required=maps_required,
        near_me=near_me,
        max_results=5,
        ambiguous_location=location.ambiguous,
        raw_message=message,
    )
