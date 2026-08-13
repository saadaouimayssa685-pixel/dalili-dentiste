from __future__ import annotations

import hashlib
import os
import re
import tempfile
from dataclasses import dataclass
from pathlib import Path
from typing import Any

from app.models import DentistRecord, PhoneSource
from app.normalization.locations import locations
from app.normalization.names import parse_name
from app.normalization.phones import extract_phone_candidates, merge_phones, normalize_phone
from app.normalization.text import compact_spaces, normalize_text


os.environ.setdefault("FLAGS_use_onednn", "0")
os.environ.setdefault("FLAGS_use_mkldnn", "0")
os.environ.setdefault("FLAGS_enable_pir_api", "0")
os.environ.setdefault("PADDLE_PDX_ENABLE_MKLDNN_BYDEFAULT", "0")
os.environ.setdefault("PADDLE_PDX_DISABLE_MODEL_SOURCE_CHECK", "True")

DENTAL_KEYWORDS = {
    "dentiste",
    "dental",
    "dental clinic",
    "dentist",
    "dentistry",
    "dentaire",
    "dentisterie",
    "clinic dentaire",
    "advance dental clinic",
    "orthodontiste",
    "orthodontie",
    "orthodontics",
    "oral surgery",
    "implantologie",
    "implantology",
    "parodontologie",
    "periodontology",
    "pedodontie",
    "pédodontie",
    "chirurgien dentiste",
    "medecin dentiste",
    "médecin dentiste",
    "طبيبة أسنان",
    "طبيب أسنان",
    "طب الأسنان",
    "طبيبة اسنان",
    "طبيب اسنان",
    "طب الاسنان",
    "عيادة أسنان",
    "عيادة الاسنان",
    "جراحة الفم",
    "زرع الأسنان",
    "زرع الاسنان",
    "تجميل الأسنان",
    "تجميل الاسنان",
    "تقويم الأسنان",
    "تقويم الاسنان",
}

REJECT_KEYWORDS = {
    "veterinaire",
    "vétérinaire",
    "avocat",
    "architecte",
    "comptable",
    "pharmacie",
    "pharmacien",
    "restaurant",
    "coiffure",
    "veterinary",
    "lawyer",
    "architect",
    "accountant",
    "صيدلية",
    "صيدلي",
    "محامي",
    "مهندس معماري",
    "مطعم",
}

OCR_LANGUAGES = ("fr", "en", "arabic")
DOCTOR_TITLE_RE = re.compile(r"(^|\b)(d\.|dr\.?|docteur|doctor|الدكتورة|الدكتور|دكتورة|دكتور|د\.)\b", re.I)
ARABIC_RE = re.compile(r"[\u0600-\u06ff]")
ARABIC_ADDRESS_TOKENS = {"شارع", "نهج", "طريق", "عمارة", "مركب", "الطابق", "عيادة", "حدائق", "حي"}
ARABIC_TITLE_WORDS = {"الدكتورة", "الدكتور", "دكتورة", "دكتور", "طبيبة", "طبيب"}
EXTRA_ARABIC_ADDRESS_TOKENS = {"مجمع", "مركز", "العيادة", "الطبي", "الطابق", "حدائق", "عمارة", "نهج"}
CABINET_KEYWORDS = {
    "cabinet",
    "cabinet dentaire",
    "clinique",
    "clinique dentaire",
    "clinic",
    "dental clinic",
    "centre medical",
    "centre médical",
    "centre dentaire",
    "عيادة",
    "العيادة",
    "مصحة",
    "مركز طبي",
    "مركز الأسنان",
}
NON_CABINET_KEYWORDS = {
    "oral surgery",
    "implantology",
    "implantologie",
    "orthodontie",
    "orthodontics",
    "chirurgie",
    "جراحة",
    "زرع",
    "تجميل",
    "تقويم",
    "طبيبة",
    "طبيب",
}
ARABIC_LOCALITY_ALIASES = {
    "حدائق العوينة": ("L'Aouina", "Ariana"),
    "العوينة": ("L'Aouina", "Ariana"),
    "أريانة": ("Ariana", "Ariana"),
    "اريانة": ("Ariana", "Ariana"),
    "تونس": ("Tunis", "Tunis"),
    "نابل": ("Nabeul", "Nabeul"),
    "سوسة": ("Sousse", "Sousse"),
    "صفاقس": ("Sfax", "Sfax"),
    "المنستير": ("Monastir", "Monastir"),
    "بن عروس": ("Ben Arous", "Ben Arous"),
}


@dataclass(frozen=True)
class BusinessCardOcrResult:
    text: str
    lines: list[str]
    is_dentist_card: bool
    decision: str
    confidence: int
    reasons: list[str]
    record: DentistRecord | None = None


def paddleocr_available() -> bool:
    try:
        import paddleocr  # noqa: F401

        return True
    except Exception:
        return False


def run_paddle_ocr(image_bytes: bytes, suffix: str = ".png") -> list[str]:
    try:
        from paddleocr import PaddleOCR
    except Exception as exc:  # noqa: BLE001
        raise RuntimeError("PaddleOCR n'est pas installé. Installe paddleocr et paddlepaddle pour activer le scan.") from exc

    with tempfile.NamedTemporaryFile(delete=False, suffix=suffix) as tmp:
        tmp.write(image_bytes)
        image_path = tmp.name
    try:
        lines = []
        errors = []
        for lang in OCR_LANGUAGES:
            try:
                ocr = _create_paddle_ocr(PaddleOCR, lang=lang)
                result = _run_paddle_ocr_engine(ocr, image_path)
                lines.extend(_extract_ocr_lines(result))
            except Exception as exc:  # noqa: BLE001
                errors.append(f"{lang}: {exc}")
        if not lines and errors:
            raise RuntimeError("PaddleOCR a échoué: " + " | ".join(errors))
    finally:
        Path(image_path).unlink(missing_ok=True)

    return _dedupe_lines(lines)


def _create_paddle_ocr(paddle_ocr_class, lang: str = "fr"):
    for kwargs in [
        {
            "lang": lang,
            "use_doc_orientation_classify": False,
            "use_doc_unwarping": False,
            "use_textline_orientation": False,
            "enable_mkldnn": False,
        },
        {"lang": lang, "use_textline_orientation": False},
        {"lang": lang, "use_angle_cls": True},
        {"lang": lang},
    ]:
        try:
            return paddle_ocr_class(**kwargs)
        except (TypeError, ValueError):
            continue
    return paddle_ocr_class()


def _run_paddle_ocr_engine(ocr, image_path: str):
    if hasattr(ocr, "predict"):
        return ocr.predict(image_path)
    if hasattr(ocr, "ocr"):
        try:
            return ocr.ocr(image_path)
        except TypeError:
            return ocr.ocr(image_path, cls=True)
    raise RuntimeError("Version PaddleOCR non supportée: méthode ocr/predict introuvable.")


def _extract_ocr_lines(result: Any) -> list[str]:
    lines: list[str] = []
    for page in result or []:
        if isinstance(page, dict):
            lines.extend(_extract_lines_from_dict(page))
            continue
        for item in page or []:
            if len(item) >= 2 and isinstance(item[1], (list, tuple)):
                raw_value = item[1][0]
                value = str(raw_value).strip()
                if isinstance(raw_value, str) and value:
                    lines.append(value)
            elif isinstance(item, str) and item.strip():
                lines.append(item.strip())
    return lines


def _extract_lines_from_dict(page: dict) -> list[str]:
    for key in ["rec_texts", "texts", "text"]:
        value = page.get(key)
        if isinstance(value, list):
            return [str(item).strip() for item in value if str(item).strip()]
        if isinstance(value, str) and value.strip():
            return [value.strip()]
    return []


def _dedupe_lines(lines: list[str]) -> list[str]:
    seen: set[str] = set()
    output: list[str] = []
    for line in lines:
        key = normalize_text(line)
        if key and key not in seen:
            seen.add(key)
            output.append(line)
    return output


def analyze_business_card_text(lines: list[str]) -> BusinessCardOcrResult:
    clean_lines = [compact_spaces(line) for line in lines if compact_spaces(line)]
    text = "\n".join(clean_lines)
    normalized = normalize_text(text)
    reasons: list[str] = []
    score = 0

    if any(keyword in normalized for keyword in DENTAL_KEYWORDS):
        score += 45
        reasons.append("mot clé dentaire détecté")
    if DOCTOR_TITLE_RE.search(normalized) or DOCTOR_TITLE_RE.search(text):
        score += 20
        reasons.append("titre docteur détecté")
    phones = extract_phone_candidates(text)
    valid_phones = [normalize_phone(phone, PhoneSource.BUSINESS_CARD_OCR) for phone in phones]
    valid_phones = [phone for phone in valid_phones if phone.is_valid]
    if valid_phones:
        score += 15
        reasons.append("téléphone tunisien détecté")
    gov = extract_governorate(text)
    locality = extract_locality(text)
    if gov or locality:
        score += 10
        reasons.append("localisation tunisienne détectée")
    if any(keyword in normalized for keyword in REJECT_KEYWORDS):
        score -= 45
        reasons.append("mot clé non dentaire détecté")

    name = extract_name(clean_lines)
    if name:
        score += 10
        reasons.append("nom probable détecté")

    confidence = max(0, min(score, 100))
    is_dentist = confidence >= 60
    decision = "VALIDATED_DENTIST_CARD" if is_dentist else "REJECTED_NOT_DENTIST_CARD"
    record = build_record(text, clean_lines, name, gov, locality, valid_phones) if is_dentist else None
    return BusinessCardOcrResult(text, clean_lines, is_dentist, decision, confidence, reasons, record)


def scan_business_card(image_bytes: bytes, suffix: str = ".png") -> BusinessCardOcrResult:
    lines = run_paddle_ocr(image_bytes, suffix=suffix)
    return analyze_business_card_text(lines)


def extract_name(lines: list[str]) -> str | None:
    for line in lines:
        if _is_non_name_line(line):
            continue
        if re.search(r"^\s*(d\.|dr\b|docteur\b|doctor\b)", line, flags=re.I):
            cleaned = re.sub(r"^\s*d\.\s*", "Dr ", line, flags=re.I)
            cleaned = re.sub(r"\b(doctor|docteur)\b", "Dr", cleaned, flags=re.I)
            return compact_spaces(cleaned)
        if re.search(r"^\s*(الدكتورة|الدكتور|دكتورة|دكتور|د\.)\b", line):
            cleaned = re.sub(r"^\s*(الدكتورة|الدكتور|دكتورة|دكتور|د\.)\s*", "د. ", line)
            return compact_spaces(cleaned)
    for line in lines:
        normalized = normalize_text(line)
        if any(keyword in normalized for keyword in DENTAL_KEYWORDS):
            continue
        if _is_non_name_line(line):
            continue
        if 2 <= len(line.split()) <= 5 and (re.search(r"[A-Za-zÀ-ÿ]", line) or ARABIC_RE.search(line)):
            return compact_spaces(line)
    return None


def _is_non_name_line(line: str) -> bool:
    normalized = normalize_text(line)
    if extract_phone_candidates(line) or "@" in line or "www." in normalized:
        return True
    if any(keyword in normalized for keyword in DENTAL_KEYWORDS | REJECT_KEYWORDS):
        return True
    if any(token in line for token in ARABIC_ADDRESS_TOKENS):
        return True
    return False


def extract_governorate(text: str) -> str | None:
    for alias, (_, governorate) in ARABIC_LOCALITY_ALIASES.items():
        if alias in text:
            return governorate
    normalized = normalize_text(text)
    for alias, governorate in locations.gov_aliases.items():
        if re.search(rf"\b{re.escape(alias)}\b", normalized):
            return governorate
    return None


def extract_locality(text: str) -> str | None:
    for alias, (locality_name, _) in ARABIC_LOCALITY_ALIASES.items():
        if alias in text:
            return locality_name
    normalized = normalize_text(text)
    for alias, match in locations.locality_aliases.items():
        if re.search(rf"\b{re.escape(alias)}\b", normalized):
            return match.name
    return None


def build_record(
    text: str,
    lines: list[str],
    name: str | None,
    governorate: str | None,
    locality: str | None,
    phones,
) -> DentistRecord:
    title_prefix, first_name, last_name, name_status = parse_name(name)
    cabinet = extract_cabinet_name(lines)
    address = extract_address(lines)
    if not governorate and locality:
        loc = locations.locality(locality)
        governorate = loc.governorate
    source_id = hashlib.sha1(text.encode("utf-8")).hexdigest()[:16]
    record = DentistRecord(
        source="business_card_ocr",
        source_profile_url=f"business-card-ocr:{source_id}",
        full_name_source=name,
        title_prefix=title_prefix,
        first_name=first_name,
        last_name=last_name,
        name_parsing_status=name_status,
        professional_title_exact=extract_title(text),
        specialties=[extract_title(text) or "Dentiste"],
        cabinet_name=cabinet,
        address_raw=address,
        locality=locality,
        governorate=governorate,
        phone_numbers=merge_phones(phones),
    )
    record.sync_phone_summary()
    return record


def extract_title(text: str) -> str:
    normalized = normalize_text(text)
    arabic_text = _normalize_arabic(text)
    if "تقويم" in arabic_text or "orthodontics" in normalized:
        return "Orthodontiste"
    if "orthodont" in normalized:
        return "Orthodontiste"
    if "جراحه الفم" in arabic_text or "جراحه" in arabic_text:
        return "Chirurgien dentiste"
    if "chirurgien dentiste" in normalized:
        return "Chirurgien dentiste"
    if (
        "medecin dentiste" in normalized
        or "médecin dentiste" in normalized
        or "طبيبه اسنان" in arabic_text
        or "طبيب اسنان" in arabic_text
    ):
        return "Médecin dentiste"
    return "Dentiste"


def _normalize_arabic(text: str) -> str:
    return (
        text.replace("أ", "ا")
        .replace("إ", "ا")
        .replace("آ", "ا")
        .replace("ى", "ي")
        .replace("ة", "ه")
    )


def extract_cabinet_name(lines: list[str]) -> str | None:
    fallback: str | None = None
    for line in lines:
        normalized = normalize_text(line)
        if _is_contact_line(line):
            continue
        if DOCTOR_TITLE_RE.search(line) or DOCTOR_TITLE_RE.search(normalized):
            continue
        if not _contains_any(normalized, line, CABINET_KEYWORDS):
            continue
        if _contains_any(normalized, line, NON_CABINET_KEYWORDS) and not _looks_like_named_cabinet(line):
            fallback = fallback or compact_spaces(line)
            continue
        return compact_spaces(line)
    return fallback


def extract_address(lines: list[str]) -> str | None:
    candidates = []
    for line in lines:
        normalized = normalize_text(line)
        if extract_phone_candidates(line):
            continue
        if "@" in line or "www." in normalized:
            continue
        if any(token in normalized for token in ["avenue", "rue", "immeuble", "centre", "route", "bloc", "etage", "étage"]):
            candidates.append(line)
        elif any(token in line for token in ["شارع", "نهج", "طريق", "عمارة", "مركب", "الطابق", "عيادة", "العيادة", "حدائق", "حي"]):
            candidates.append(line)
        elif any(token in line for token in EXTRA_ARABIC_ADDRESS_TOKENS):
            candidates.append(line)
        elif any(alias in line for alias in ARABIC_LOCALITY_ALIASES):
            candidates.append(line)
    return compact_spaces(", ".join(candidates)) if candidates else None


def _is_contact_line(line: str) -> bool:
    normalized = normalize_text(line)
    return bool(extract_phone_candidates(line) or "@" in line or "www." in normalized)


def _contains_any(normalized: str, raw: str, keywords: set[str]) -> bool:
    return any(keyword in normalized or keyword in raw for keyword in keywords)


def _looks_like_named_cabinet(line: str) -> bool:
    normalized = normalize_text(line)
    if any(token in normalized for token in ["clinic", "clinique", "cabinet", "centre"]):
        return True
    if any(token in line for token in ["عيادة", "العيادة", "مركز", "مصحة"]):
        return len(line.split()) >= 2
    return False
