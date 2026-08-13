from __future__ import annotations

import re
from dataclasses import dataclass
from urllib.parse import urljoin, urlparse

from bs4 import BeautifulSoup

from app.config import settings
from app.models import DentistRecord


@dataclass(frozen=True)
class ListingProfileURL:
    profile_url: str
    listing_url: str
    source: str = "med.tn"
    record: DentistRecord | None = None


def _same_site(url: str) -> bool:
    host = urlparse(url).netloc
    return not host or host.endswith("med.tn")


def extract_profile_urls(html: str, listing_url: str) -> list[ListingProfileURL]:
    soup = BeautifulSoup(html, "html.parser")
    regex = re.compile(settings.med_sources.get("selectors", {}).get("profile_url_regex", r"/medecin/dentiste/.+\.html$"))
    listing_path = re.sub(r"/\d+$", "", urlparse(listing_url).path.rstrip("/"))
    found: dict[str, ListingProfileURL] = {}
    candidates = [a.get("href", "") for a in soup.find_all("a", href=True)]
    candidates += re.findall(r"https?://www\.med\.tn/medecin/dentiste/[^\"'\s<>]+?\.html", html)
    for href in candidates:
        absolute = urljoin(listing_url, href)
        path = urlparse(absolute).path
        under_listing = path.startswith(f"{listing_path}/") if listing_path else True
        if _same_site(absolute) and under_listing and regex.search(path):
            found[absolute] = ListingProfileURL(profile_url=absolute, listing_url=listing_url)
    return list(found.values())


def extract_pagination_urls(html: str, listing_url: str) -> list[str]:
    soup = BeautifulSoup(html, "html.parser")
    urls: set[str] = set()
    selectors = settings.med_sources.get("selectors", {}).get("pagination_links", [])
    for selector in selectors:
        for a in soup.select(selector):
            href = a.get("href")
            if href:
                urls.add(urljoin(listing_url, href))
    for a in soup.find_all("a", href=True):
        text = a.get_text(" ", strip=True).casefold()
        if text.isdigit() or "suiv" in text or "voir plus" in text:
            urls.add(urljoin(listing_url, a["href"]))
    return [u for u in urls if _same_site(u)]


def extract_ajax_listing_params(html: str) -> tuple[str, dict[str, str], int, int] | None:
    url_match = re.search(r'url:\s*["\'](?P<url>pagesmd_load\.php)["\']', html)
    data_match = re.search(r"data:\s*\{(?P<data>start:start,.*?is_medinter:'[^']*')\}", html, re.S)
    limit_match = re.search(r"var\s+limit\s*=\s*(\d+)", html)
    total_match = re.search(r"var\s+total\s*=\s*(\d+)", html)
    if not url_match or not data_match:
        return None
    params: dict[str, str] = {}
    for key, value in re.findall(r"(\w+):'([^']*)'", data_match.group("data")):
        params[key] = value
    params["start"] = "0"
    limit = int(limit_match.group(1)) if limit_match else 30
    total = int(total_match.group(1)) if total_match else limit
    return url_match.group("url"), params, limit, total
