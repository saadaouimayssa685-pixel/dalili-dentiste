from __future__ import annotations

import re
from urllib.parse import urljoin

from bs4 import BeautifulSoup

from app.models import DentistRecord, PhoneSource
from app.normalization.addresses import normalize_address
from app.normalization.locations import locations
from app.normalization.names import parse_name
from app.normalization.phones import extract_phone_candidates, merge_phones, normalize_phone
from app.normalization.text import compact_spaces
from app.services.geography import infer_governorate, infer_locality


def _text(node) -> str:
    return compact_spaces(node.get_text(" ", strip=True)) if node else ""


def _meta(soup: BeautifulSoup, name: str) -> str | None:
    node = soup.find("meta", attrs={"property": name}) or soup.find("meta", attrs={"name": name})
    return node.get("content") if node and node.get("content") else None


def _heading_section(soup: BeautifulSoup, heading_text: str) -> str | None:
    heading = soup.find(["h2", "h3", "h4"], string=re.compile(heading_text, re.I))
    if not heading:
        return None
    chunks: list[str] = []
    for sib in heading.next_siblings:
        name = getattr(sib, "name", None)
        if name in {"h2", "h3", "h4"}:
            break
        value = _text(sib) if name else compact_spaces(str(sib))
        if value:
            chunks.append(value)
    return compact_spaces(" | ".join(chunks)) or None


def _extract_name_title(soup: BeautifulSoup) -> tuple[str | None, str | None]:
    physician = soup.select_one("[itemscope][itemtype*='Physician']")
    if physician:
        raw = _text(physician)
        match = re.search(r"\b(Dr|Docteur|Pr|Professeur)\s+(.+?)\s+(Dentiste|Médecin dentiste|Orthodontiste)\b", raw, re.I)
        if match:
            return compact_spaces(f"{match.group(1)} {match.group(2)}"), match.group(3)
    title = _meta(soup, "og:title") or (soup.title.string if soup.title else None)
    match = re.search(r"(Dr|Docteur|Pr|Professeur)\s+(.+?)\s+(Dentiste|Médecin dentiste|Orthodontiste)", _text(BeautifulSoup(title or "", "html.parser")), re.I)
    if match:
        return compact_spaces(f"{match.group(1)} {match.group(2)}"), match.group(3)
    return None, None


def _extract_address_parts(soup: BeautifulSoup) -> tuple[str | None, str | None, str | None, str | None]:
    contact = None
    for box in soup.select(".profile__box"):
        if "Informations de contact" in _text(box):
            contact = box
            break
    contact_text = _text(contact) if contact else _text(soup.select_one("[itemscope][itemtype*='Physician']"))
    contact_text = re.sub(r"Informations de contact|Envoyer un message|Afficher le numéro", " ", contact_text, flags=re.I)
    postal = (re.search(r"\b([1-9]\d{3})\b", contact_text) or [None, None])[1]
    gov = None
    for known in locations.gov_aliases.values():
        if re.search(rf"\b{re.escape(known)}\b", contact_text, re.I):
            gov = known
            break
    locality = None
    if postal:
        before = contact_text[: contact_text.find(postal)].strip()
        words = before.split()
        locality = " ".join(words[-3:]) if words else None
    address = compact_spaces(contact_text)
    return address or None, locality, postal, gov


def _extract_specialties(soup: BeautifulSoup) -> list[str]:
    specs: list[str] = []
    section = _heading_section(soup, r"Spécialités|Specialites")
    if section:
        specs.extend([s.strip() for s in re.split(r"\s*\|\s*|,", section) if s.strip()])
    qualification = _heading_section(soup, r"Qualification professionnelle")
    if qualification:
        specs.extend([s.strip() for s in qualification.split("|") if s.strip()])
    seen: set[str] = set()
    output: list[str] = []
    for item in specs:
        key = item.casefold()
        if key not in seen and not re.search(r"Actes et soins|Bridge|Détartrage", item, re.I):
            seen.add(key)
            output.append(item)
    return output


def _extract_phones(soup: BeautifulSoup) -> list:
    raw_values: list[str] = []
    for a in soup.find_all("a", href=True):
        if a["href"].lower().startswith("tel:"):
            raw_values.append(a["href"][4:])
            raw_values.append(a.get_text(" ", strip=True))
    public_text = _text(soup.select_one(".profile__box")) or _text(soup)
    raw_values.extend(extract_phone_candidates(public_text))
    return merge_phones([normalize_phone(raw, PhoneSource.MED_TN) for raw in raw_values if raw])


def parse_profile(html: str, profile_url: str, listing_url: str | None = None) -> DentistRecord:
    soup = BeautifulSoup(html, "html.parser")
    full_name, title = _extract_name_title(soup)
    title_prefix, first_name, last_name, name_status = parse_name(full_name)
    address, locality, postal_code, governorate = _extract_address_parts(soup)
    governorate = governorate or infer_governorate(locality, address, profile_url, listing_url)
    loc = locations.locality(locality)
    governorate = locations.governorate(governorate or loc.governorate)
    locality = infer_locality(locality, address, governorate=governorate) or loc.name
    record = DentistRecord(
        source_profile_url=urljoin("https://www.med.tn", profile_url),
        source_listing_url=listing_url,
        full_name_source=full_name,
        title_prefix=title_prefix,
        first_name=first_name,
        last_name=last_name,
        name_parsing_status=name_status,
        professional_title_exact=title,
        specialties=_extract_specialties(soup),
        address_raw=address,
        address_normalized=normalize_address(address),
        locality=locality,
        postal_code=postal_code,
        governorate=governorate,
        phone_numbers=_extract_phones(soup),
    )
    record.sync_phone_summary()
    return record
