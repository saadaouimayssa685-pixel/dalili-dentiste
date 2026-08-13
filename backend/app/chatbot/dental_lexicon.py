from __future__ import annotations


SPECIALTY_SYNONYMS: dict[str, list[str]] = {
    "orthodontie": [
        "orthodontiste",
        "orthodontie",
        "appareil dentaire",
        "appareil pour les dents",
        "appareil lel snani",
        "alignement des dents",
        "bagues dentaires",
        "ta9wim snan",
        "تقويم الأسنان",
    ],
    "pédodontie": [
        "pedodontie",
        "pédodontie",
        "pedodontiste",
        "pédodontiste",
        "dentiste pour enfant",
        "dentiste enfant",
        "dentiste mta3 sghar",
        "tbib snan lel sghar",
        "طبيب أسنان للصغار",
        "soins dentaires enfant",
    ],
    "implantologie": [
        "implant",
        "implants",
        "implants dentaires",
        "implantologie",
        "implantologue",
        "zra3et snan",
        "زرع الأسنان",
    ],
    "parodontologie": [
        "parodontologie",
        "parodontiste",
        "gencive",
        "gencives",
        "ltha",
        "اللثة",
        "probleme de gencive",
        "problème de gencive",
    ],
    "chirurgie orale": [
        "chirurgie orale",
        "chirurgie dentaire",
        "chirurgien dentiste",
        "chirurgien oral",
        "extraction complexe",
        "dent de sagesse",
        "na7i sen",
        "قلع ضرس",
        "ضرس العقل",
    ],
}


HELP_SUGGESTIONS = {
    "fr": [
        "Trouver un orthodontiste à Ariana",
        "Dentiste pour enfant à Sfax",
        "Implantologie à Sousse avec téléphone",
        "Dentiste près de La Marsa",
    ],
    "tn_ar": [
        "نلقى طبيب أسنان في أريانة",
        "طبيب أسنان للصغار في صفاقس",
        "طبيب قريب مني",
        "طبيب عندو رقم هاتف",
    ],
    "tn_lat": [
        "Nal9a dentiste fi Ariana",
        "Dentiste mta3 sghar fi Sfax",
        "Dentiste 9rib meni",
        "Dentiste 3andou numéro",
    ],
}
