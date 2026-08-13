from __future__ import annotations

from app.chatbot.intent_parser import ChatbotContext, ParsedIntent
from app.chatbot.language_detector import AssistantLanguage
from app.chatbot.safety import emergency_reply, safety_notice
from app.chatbot.search import SearchResult, search_dentists


def _region_label(parsed: ParsedIntent) -> str:
    return parsed.city or parsed.governorate or ""


def _reply_prefix(language: AssistantLanguage, total: int, specialty: str | None, region: str) -> str:
    spec = specialty or "dentistes"
    if language == AssistantLanguage.TUNISIAN_ARABIC:
        return f"لقيت {total} نتيجة في البيانات المتوفرة" + (f" في {region}" if region else "") + "."
    if language == AssistantLanguage.TUNISIAN_LATIN:
        return f"L9it {total} résultat(s) fil données disponibles" + (f" fi {region}" if region else "") + "."
    return f"J’ai trouvé {total} résultat(s) dans les données disponibles" + (f" pour {spec} à {region}" if region else f" pour {spec}") + "."


def build_chatbot_reply(parsed: ParsedIntent, records, context: ChatbotContext) -> tuple[str, SearchResult | None]:
    if parsed.intent == "reset":
        context.reset()
        return "Nouvelle recherche prête. Décrivez simplement le dentiste ou la région souhaitée.", None
    if parsed.intent == "medical_emergency":
        return f"{emergency_reply(parsed.language)}\n\n{safety_notice(parsed.language)}", None
    if parsed.intent == "help":
        return (
            "Je peux chercher dans la base Dalili par spécialité, gouvernorat, ville et téléphone. "
            "Exemples: orthodontiste à Ariana, dentiste pour enfant à Sfax, implant à Sousse avec téléphone.\n\n"
            + safety_notice(parsed.language)
        ), None
    if parsed.ambiguous_location:
        return "Le lieu semble ambigu. Pouvez-vous préciser le gouvernorat ou la ville ?", None
    if parsed.intent == "find_near_me":
        return "Pour chercher près de vous, indiquez votre ville ou gouvernorat. Je ne récupère pas votre position sans consentement explicite.", None
    if parsed.intent == "explain_specialty" and parsed.specialty and not (parsed.governorate or parsed.city):
        context.specialty = parsed.specialty
        return f"Pour ce besoin, vous pouvez rechercher: {parsed.specialty}. Dans quelle région souhaitez-vous chercher ?\n\n{safety_notice(parsed.language)}", None
    if not (parsed.governorate or parsed.city) and not parsed.near_me:
        context.specialty = parsed.specialty
        context.phone_required = parsed.phone_required
        return "Dans quelle ville ou quel gouvernorat souhaitez-vous chercher ?", None

    context.specialty = parsed.specialty
    context.governorate = parsed.governorate
    context.city = parsed.city
    context.phone_required = parsed.phone_required
    context.maps_required = parsed.maps_required
    context.near_me = parsed.near_me

    result = search_dentists(
        records,
        specialty=parsed.specialty,
        governorate=parsed.governorate,
        city=parsed.city,
        phone_required=parsed.phone_required,
        maps_required=parsed.maps_required,
        limit=parsed.max_results,
    )
    region = _region_label(parsed)
    if result.total == 0:
        spec = parsed.specialty or "dentiste"
        return (
            f"Je n’ai trouvé aucun résultat pour {spec}"
            + (f" à {region}" if region else "")
            + " dans les données disponibles. Vous pouvez élargir la recherche ou retirer un filtre.\n\n"
            + safety_notice(parsed.language)
        ), result
    shown = min(len(result.records), parsed.max_results)
    reply = _reply_prefix(parsed.language, result.total, parsed.specialty, region)
    reply += f" Voici les {shown} première(s) fiche(s)."
    reply += f"\n\n{safety_notice(parsed.language)}"
    return reply, result
