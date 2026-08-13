from pathlib import Path

from app.scrapers.generic_directory import extract_generic_pagination_urls, extract_generic_profile_urls, parse_direct_listing_records, parse_generic_profile

FIX = Path(__file__).parent / "fixtures"


def test_extract_generic_profile_urls():
    source = {"id": "lerdvmedical", "profile_url_regex": "/archives/doctors/[^#?]+$"}
    html = (FIX / "generic_listing.html").read_text(encoding="utf-8")
    items = extract_generic_profile_urls(html, "https://lerdvmedical.tn/medecin-dentiste-a-tunis", source)
    assert len(items) == 1
    assert items[0].source == "lerdvmedical"


def test_extract_generic_pagination_urls_with_numeric_offsets():
    html = """
    <a href="https://tunisie-medicale.com/index.php/dentiste/index/100">6</a>
    <a href="https://tunisie-medicale.com/index.php/dentiste/index/120">7</a>
    """
    urls = extract_generic_pagination_urls(html, "https://tunisie-medicale.com/index.php/dentiste")
    assert "https://tunisie-medicale.com/index.php/dentiste/index/100" in urls
    assert "https://tunisie-medicale.com/index.php/dentiste/index/120" in urls


def test_parse_generic_profile():
    html = (FIX / "generic_profile.html").read_text(encoding="utf-8")
    record = parse_generic_profile(html, "https://lerdvmedical.tn/archives/doctors/dr-meriam-hamdani", "lerdvmedical")
    assert record.source == "lerdvmedical"
    assert record.full_name_source == "Dr Meriam HAMDANI"
    assert record.professional_title_exact == "Médecin dentiste"
    assert record.governorate == "Tunis"
    assert record.primary_phone == "+21623107272"


def test_generic_name_cleanup_and_first_governorate():
    html = """
    <html><head><title>dentiste Jihed Yacoubi à Tunis</title></head><body>
    <h1>dentiste Jihed Yacoubi à Tunis</h1>
    Adresse : Campus Médical El Manar Tunis
    Top gouvernorats Zaghouan Sousse
    Téléphone : (+216) 21 139 297
    </body></html>
    """
    record = parse_generic_profile(html, "https://tunisie-medicale.com/index.php/dentiste/3725-jihed-yacoubi-tunis", "tunisie_medicale")
    assert record.full_name_source == "Jihed Yacoubi"
    assert record.governorate == "Tunis"


def test_parse_orthodontiste_direct_listing():
    html = """
    <div class="doctor-card">
      <h3>Dr. Nizar KETATA</h3>
      <p>Orthodontiste</p>
      <p>+216 74 401 456</p>
      <p>Av. Majida Boulila, Sfax</p>
      <a>Appeler</a>
    </div>
    """
    records = parse_direct_listing_records(html, "https://orthodontiste.tn/dr/", "orthodontiste_tn", limit=1)
    assert len(records) == 1
    assert records[0].full_name_source == "Dr. Nizar KETATA"
    assert records[0].primary_phone == "+21674401456"
    assert records[0].governorate == "Sfax"
