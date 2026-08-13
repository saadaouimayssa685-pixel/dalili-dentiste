from __future__ import annotations

import re

from app.chatbot.arabizi_normalizer import normalize_arabizi_words
from app.normalization.text import compact_spaces, normalize_text


ARABIC_ALIASES = {
    "نحب": "je cherche",
    "نلقى": "trouver",
    "فما": "trouver",
    "طبيب أسنان": "dentiste",
    "طبيب اسنان": "dentiste",
    "للصغار": "enfant",
    "الصغار": "enfant",
    "صغار": "enfant",
    "تقويم الأسنان": "orthodontie",
    "تقويم الاسنان": "orthodontie",
    "زرع الأسنان": "implant",
    "زرع الاسنان": "implant",
    "اللثة": "gencive",
    "نزيف": "saignement",
    "وجيعة": "douleur",
    "قريب": "proche",
    "مني": "moi",
    "في": "a",
    "أريانة": "ariana",
    "اريانة": "ariana",
    "صفاقس": "sfax",
    "سوسة": "sousse",
    "المرسى": "la marsa",
    "بن عروس": "ben arous",
    "بنزرت": "bizerte",
    "نابل": "nabeul",
    "القيروان": "kairouan",
}


def normalize_chat_text(message: str) -> str:
    text = compact_spaces(message)
    for source, target in ARABIC_ALIASES.items():
        text = text.replace(source, f" {target} ")
    text = normalize_arabizi_words(text)
    text = re.sub(r"['\"`;]", " ", text)
    return normalize_text(text)
