from __future__ import annotations

import re
from urllib.parse import urljoin, urlparse

from bs4 import BeautifulSoup

from app.models import DentistRecord, PhoneSource
from app.normalization.addresses import normalize_address
from app.normalization.locations import locations
from app.normalization.names import parse_name
from app.normalization.phones import extract_phone_candidates, merge_phones, normalize_phone
from app.normalization.text import compact_spaces, normalize_text
from app.scrapers.med_tn_listings import ListingProfileURL

PHONE_SOURCE_BY_ID = {
    "lerdvmedical": PhoneSource.LERDVMEDICAL,
    "tunisie_medicale": PhoneSource.TUNISIE_MEDICALE,
    "tunisie_dentiste": PhoneSource.TUNISIE_DENTISTE,
    "sante_tunisie": PhoneSource.SANTE_TUNISIE,
    "bonnes_adresses": PhoneSource.BONNES_ADRESSES,
    "goafricaonline": PhoneSource.GOAFRICAONLINE,
    "orthodontiste_tn": PhoneSource.ORTHODONTISTE_TN,
    "para_doctor": PhoneSource.PARA_DOCTOR,
    "tabibi": PhoneSource.TABIBI,
}


def extract_generic_profile_urls(html: str, listing_url: str, source_config: dict) -> list[ListingProfileURL]:
    soup = BeautifulSoup(html, "html.parser")
    pattern = source_config.get("profile_url_regex")
    regex = re.compile(pattern) if pattern else None
    found: dict[str, ListingProfileURL] = {}
    for a in soup.find_all("a", href=True):
        absolute = urljoin(listing_url, a["href"])
        path = urlparse(absolute).path
        if regex and not regex.search(path):
            continue
        if not regex and "dent" not in normalize_text(a.get_text(" ", strip=True) + " " + absolute):
            continue
        found[absolute] = ListingProfileURL(profile_url=absolute, listing_url=listing_url, source=source_config["id"])
    return list(found.values())


def extract_generic_pagination_urls(html: str, listing_url: str) -> list[str]:
    soup = BeautifulSoup(html, "html.parser")
    urls: set[str] = set()
    for a in soup.find_all("a", href=True):
        text = normalize_text(a.get_text(" ", strip=True))
        href = a["href"]
        rel = " ".join(a.get("rel", [])) if isinstance(a.get("rel"), list) else str(a.get("rel") or "")
        if (
            text in {"suivant", "next", "2", "3", "4", "5"}
            or "next" in rel
            or "page-numbers" in " ".join(a.get("class", []))
            or re.search(r"/index/\d+/?$", href)
        ):
            urls.add(urljoin(listing_url, href))
    return list(urls)


def parse_generic_profile(html: str, profile_url: str, source_id: str, listing_url: str | None = None) -> DentistRecord:
    soup = BeautifulSoup(html, "html.parser")
    raw_text = soup.get_text("\n", strip=True)
    text = compact_spaces(soup.get_text(" ", strip=True))
    full_name = _extract_name(soup, text)
    if source_id == "goafricaonline" and not full_name:
        full_name = _extract_goafrica_business_name(soup)
    title_prefix, first_name, last_name, status = parse_name(full_name)
    if full_name and source_id in {"goafricaonline"} and not normalize_text(full_name).startswith(("dr ", "docteur ")):
        first_name = None
        last_name = None
        status = "REVIEW_REQUIRED"
    title = _extract_title(text)
    address = _extract_address(raw_text, source_id)
    if source_id == "tunisie_dentiste" and not address:
        address = _extract_tunisie_dentiste_location(text)
    governorate = _extract_governorate(" ".join([address or "", profile_url]), profile_url, source_id)
    locality = _extract_locality(address or "", governorate)
    loc = locations.locality(locality)
    governorate = locations.governorate(governorate or loc.governorate)
    locality = loc.name
    phones = _extract_phones(soup, text, source_id)
    record = DentistRecord(
        source=source_id,
        source_profile_url=profile_url,
        source_listing_url=listing_url,
        full_name_source=full_name,
        title_prefix=title_prefix,
        first_name=first_name,
        last_name=last_name,
        name_parsing_status=status,
        professional_title_exact=title,
        specialties=[title] if title else [],
        cabinet_name=full_name if full_name and not normalize_text(full_name).startswith("dr ") else None,
        address_raw=address,
        address_normalized=normalize_address(address),
        locality=locality,
        governorate=governorate,
        phone_numbers=phones,
    )
    record.sync_phone_summary()
    return record


def parse_direct_listing_records(html: str, listing_url: str, source_id: str, limit: int | None = None) -> list[DentistRecord]:
    if source_id == "orthodontiste_tn":
        return _parse_orthodontiste_listing(html, listing_url, limit)
    if source_id == "para_doctor":
        return _parse_para_doctor_listing(html, listing_url, limit)
    return []


def _record_from_listing(
    source_id: str,
    listing_url: str,
    full_name: str,
    title: str,
    address: str | None,
    raw_phone: str | None = None,
    index: int = 0,
) -> DentistRecord:
    title_prefix, first_name, last_name, status = parse_name(full_name)
    if full_name and source_id in {"goafricaonline"} and not normalize_text(full_name).startswith(("dr ", "docteur ")):
        first_name = None
        last_name = None
        status = "REVIEW_REQUIRED"
    governorate = _extract_governorate(" ".join([address or "", listing_url]), listing_url, source_id)
    locality = _extract_locality(address or "", governorate)
    loc = locations.locality(locality)
    governorate = locations.governorate(governorate or loc.governorate)
    locality = loc.name
    source = PHONE_SOURCE_BY_ID.get(source_id, PhoneSource.OFFICIAL_WEBSITE)
    phones = merge_phones([normalize_phone(raw_phone, source)]) if raw_phone else []
    slug = re.sub(r"[^a-z0-9]+", "-", normalize_text(full_name)).strip("-")
    record = DentistRecord(
        source=source_id,
        source_profile_url=f"{listing_url.rstrip('/')}#record-{index}-{slug}",
        source_listing_url=listing_url,
        full_name_source=full_name,
        title_prefix=title_prefix,
        first_name=first_name,
        last_name=last_name,
        name_parsing_status=status,
        professional_title_exact=title,
        specialties=[title] if title else [],
        cabinet_name=full_name if full_name and not normalize_text(full_name).startswith("dr ") else None,
        address_raw=address,
        address_normalized=normalize_address(address),
        locality=locality,
        governorate=governorate,
        phone_numbers=phones,
    )
    record.sync_phone_summary()
    return record


def _parse_orthodontiste_listing(html: str, listing_url: str, limit: int | None) -> list[DentistRecord]:
    soup = BeautifulSoup(html, "html.parser")
    records: list[DentistRecord] = []
    for idx, card in enumerate(soup.select(".doctor-card"), start=1):
        text = compact_spaces(card.get_text(" ", strip=True))
        match = re.search(
            r"(Dr\.?\s+[A-ZÀ-ÿ][A-Za-zÀ-ÿ' .-]+?)\s+Orthodontiste\s+(?P<phone>\+?216[\s().-]*(?:\d[\s().-]*){8}|(?:\d[\s().-]*){8})\s+(?P<address>.+?)(?:\s+Appeler|\s+Détails|\s+Itinéraire|$)",
            text,
            re.I,
        )
        if not match:
            continue
        name = compact_spaces(match.group(1))
        address = compact_spaces(match.group("address"))
        records.append(_record_from_listing("orthodontiste_tn", listing_url, name, "Orthodontiste", address, match.group("phone"), idx))
        if limit and len(records) >= limit:
            break
    return records


def _parse_para_doctor_listing(html: str, listing_url: str, limit: int | None) -> list[DentistRecord]:
    soup = BeautifulSoup(html, "html.parser")
    title = compact_spaces(soup.find("h1").get_text(" ", strip=True)) if soup.find("h1") else ""
    location_match = re.search(r"à\s+(.+)$", title, re.I)
    location = compact_spaces(location_match.group(1)) if location_match else None
    records: list[DentistRecord] = []
    for idx, heading in enumerate(soup.select("h4.end"), start=1):
        name = compact_spaces(heading.get_text(" ", strip=True))
        if not name.lower().startswith("dr"):
            continue
        records.append(_record_from_listing("para_doctor", listing_url, name, "Médecin dentiste", location, None, idx))
        if limit and len(records) >= limit:
            break
    return records


def _extract_name(soup: BeautifulSoup, text: str) -> str | None:
    for selector in ["h1", "h2", "h3", "[class*='doctor'] h1", "[class*='doctor'] h2"]:
        for node in soup.select(selector):
            value = compact_spaces(node.get_text(" ", strip=True))
            if re.search(r"\bDr\b|dentiste|dentaire", value, re.I):
                match = re.search(r"(Dr\.?\s+[A-ZÀ-ÿ][^|\n–-]+)", value, re.I)
                candidate = compact_spaces(match.group(1)) if match else value
                return _clean_name_candidate(candidate)
    title = soup.title.get_text(" ", strip=True) if soup.title else ""
    match = re.search(r"(Dr\.?\s+[A-ZÀ-ÿ][^-|]+)", title, re.I)
    if match:
        return _clean_name_candidate(compact_spaces(match.group(1)))
    match = re.search(r"\b([A-ZÀ-ÿ][A-Za-zÀ-ÿ' -]{2,80})\s+(?:à|a)\s+(?:Tunis|Ariana|Sousse|Sfax)", text)
    return _clean_name_candidate(compact_spaces(match.group(1))) if match else None


def _extract_goafrica_business_name(soup: BeautifulSoup) -> str | None:
    for selector in ["h1", "h2"]:
        for node in soup.select(selector):
            value = compact_spaces(node.get_text(" ", strip=True))
            if value and "go africa online" not in normalize_text(value):
                return _clean_name_candidate(value)
    return None


def _clean_name_candidate(value: str | None) -> str | None:
    if not value:
        return None
    value = re.sub(r"^(?:dentiste|médecin dentiste|chirurgien dentiste)\s+", "", value, flags=re.I)
    value = re.sub(r"\s+(?:à|a)\s+[A-ZÀ-ÿ][A-Za-zÀ-ÿ' -]+$", "", value, flags=re.I)
    return compact_spaces(value)


def _extract_title(text: str) -> str | None:
    for pattern in [r"Médecin dentiste", r"Chirurgien dentiste", r"Orthodontiste", r"Pédodontiste", r"Dentiste"]:
        match = re.search(pattern, text, re.I)
        if match:
            return match.group(0)
    return None


def _extract_address(text: str, source_id: str | None = None) -> str | None:
    if source_id == "lerdvmedical":
        match = re.search(r"Adresse\s*:?\s*(.+?)(?:\s+العنوان\s*:|\s+Itinéraire\s+|\s+Contact\s*:|$)", text, re.I | re.S)
        if match:
            return _clean_address(compact_spaces(match.group(1)))
    if source_id == "tunisie_dentiste":
        match = re.search(r"Informations de contact\s+Adresse\s+(.+?)(?:\s+Email\s+|\s+À propos\s+|\s+A propos\s+|$)", text, re.I)
        if match:
            return _clean_address(compact_spaces(match.group(1)))
    if source_id == "goafricaonline":
        lines = [compact_spaces(line) for line in text.splitlines() if compact_spaces(line)]
        for idx, line in enumerate(lines):
            if re.search(r"\b(?:Sfax|Sousse|Tunis|Bizerte|Hammamet|Nabeul)\b.*\bTunisie\b", line, re.I):
                previous = lines[idx - 1] if idx > 0 else ""
                if previous and not re.search(r"Coordonnées|Avis|Dentistes|vues|entreprise", previous, re.I):
                    return _clean_address(f"{previous}, {line}")
                return _clean_address(line)
    match = re.search(r"Adresse\s*:\s*(.+?)(?:Téléphone|Contact|Appeler|Itinéraire|Copyright|$)", text, re.I)
    if match:
        return _clean_address(compact_spaces(match.group(1)))
    match = re.search(r"(?:Adresse|العنوان)\s*:\s*(.+?)(?:Contact|TUNIS|QUI SOMME|$)", text, re.I)
    return _clean_address(compact_spaces(match.group(1))) if match else None


def _extract_tunisie_dentiste_location(text: str) -> str | None:
    match = re.search(
        r"(?:Dentiste|Médecin Dentiste|Chirurgien Dentiste)\s+([A-ZÀ-ÿ][A-Za-zÀ-ÿ' -]{2,60},\s*(?:Tunis|Ariana|Ben arous|Sousse|Sfax|Nabeul|Monastir))\s+Informations de contact",
        text,
        re.I,
    )
    return compact_spaces(match.group(1)) if match else None


def _clean_address(value: str | None) -> str | None:
    if not value:
        return None
    value = re.sub(r"\s+(?:Tel|Gsm|Téléphone|Telephone)\s*:?\s*.*$", "", value, flags=re.I)
    return compact_spaces(value)


def _extract_governorate(text: str, profile_url: str, source_id: str | None = None) -> str | None:
    haystack_raw = f"{profile_url} {text[:2500]}" if source_id == "goafricaonline" else f"{text[:2500]} {profile_url}"
    haystack = normalize_text(haystack_raw)
    matches: list[tuple[int, str]] = []
    for gov in set(locations.gov_aliases.values()):
        pattern = rf"(?<![a-z0-9]){re.escape(normalize_text(gov))}(?![a-z0-9])"
        match = re.search(pattern, haystack)
        if match:
            matches.append((match.start(), gov))
    if matches:
        return sorted(matches, key=lambda item: item[0])[0][1]
    return None


def _extract_locality(text: str, governorate: str | None) -> str | None:
    if not text:
        return None
    normalized = normalize_text(text)
    for alias, match in locations.locality_aliases.items():
        if alias in normalized and (not governorate or match.governorate == governorate):
            return match.name
    if governorate:
        gov_norm = normalize_text(governorate)
        matches = list(re.finditer(rf"(?<![a-z0-9]){re.escape(gov_norm)}(?![a-z0-9])", normalized))
        if matches:
            tail = re.sub(r"\b\d{4}\b", " ", normalized[matches[-1].end() :]).strip(" ,-")
            if not tail or tail in {"tunisie", "tn"}:
                return None
            words = tail.split()
            if words:
                return " ".join(words[:3]).title()
    return None


def _extract_phones(soup: BeautifulSoup, text: str, source_id: str) -> list:
    source = PHONE_SOURCE_BY_ID.get(source_id, PhoneSource.OFFICIAL_WEBSITE)
    raw_values: list[str] = []
    for a in soup.find_all("a", href=True):
        if a["href"].lower().startswith("tel:"):
            raw_values.append(a["href"][4:])
            raw_values.append(a.get_text(" ", strip=True))
    raw_values.extend(extract_phone_candidates(text))
    return merge_phones([normalize_phone(raw, source) for raw in raw_values if raw])
