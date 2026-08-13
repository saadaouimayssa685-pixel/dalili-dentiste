from __future__ import annotations

from app.chatbot.language_detector import AssistantLanguage
from app.chatbot.tunisian_normalizer import normalize_chat_text


EMERGENCY_TERMS = [
    "saignement important",
    "difficulte a respirer",
    "difficulté à respirer",
    "traumatisme grave",
    "gonflement important",
    "perte de connaissance",
    "douleur insupportable",
    "dam barcha",
    "نزيف كبير",
    "ma najamch netnaffes",
    "ما نجمش نتنفس",
    "wajhi nafekh barcha",
    "وجهي منفخ برشا",
    "wja3 ma yet7amlch",
    "وجيعة ما تتستحملش",
    "فقدان الوعي",
]


def is_emergency(message: str) -> bool:
    normalized = normalize_chat_text(message)
    raw = message.casefold()
    return any(term.casefold() in raw or normalize_chat_text(term) in normalized for term in EMERGENCY_TERMS)


def safety_notice(language: AssistantLanguage) -> str:
    if language == AssistantLanguage.TUNISIAN_ARABIC:
        return "المساعد هذا يعاونك تلقى مختص، أما ما يعوضش رأي وفحص طبيب."
    if language == AssistantLanguage.TUNISIAN_LATIN:
        return "El assistant hedha y3awnek tal9a spécialiste, ama ma y3awadhch ra2y w fحص tbib."
    return "Cet assistant facilite la recherche d’un professionnel et ne remplace pas un avis médical."


def emergency_reply(language: AssistantLanguage) -> str:
    if language == AssistantLanguage.TUNISIAN_ARABIC:
        return "إذا فما صعوبة في التنفس، نزيف كبير، انتفاخ قوي أو وجيعة ما تتستحملش، اتصل بسرعة بالإسعاف أو امشي للاستعجالي. ما نجمش نعطي تشخيص."
    if language == AssistantLanguage.TUNISIAN_LATIN:
        return "Ken fama s3ouba fi tanaffos, dam barcha, naf5a kbira walla wja3 ma yet7ammelch, etasel bel urgence walla emchi lel ista3jali. Ma najamch na3ti diagnostic."
    return "Si vous avez une difficulté à respirer, un saignement important, un gonflement sévère ou une douleur insupportable avec signes inquiétants, contactez rapidement les urgences ou un professionnel de santé. Je ne peux pas poser de diagnostic."
