from __future__ import annotations

import re


ARABIZI_WORDS = {
    "n7eb": "nheb",
    "nal9a": "nalka",
    "9rib": "qrib",
    "sghar": "enfant",
    "sghir": "enfant",
    "snan": "dentiste",
    "snani": "dents",
    "sneni": "dents",
    "tbib": "docteur",
    "ltha": "gencive",
    "wja3": "douleur",
    "wajhi": "visage",
    "nafekh": "gonfle",
    "barcha": "important",
    "meni": "moi",
    "mta3": "pour",
    "fi": "a",
    "fil": "a",
}


def normalize_arabizi_words(text: str) -> str:
    output = text
    for source, target in ARABIZI_WORDS.items():
        output = re.sub(rf"\b{re.escape(source)}\b", target, output, flags=re.I)
    return output
