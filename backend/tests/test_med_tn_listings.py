from pathlib import Path

from app.scrapers.med_tn_listings import extract_ajax_listing_params, extract_pagination_urls, extract_profile_urls


FIX = Path(__file__).parent / "fixtures"


def test_extract_listing_profiles_and_pagination():
    html = (FIX / "listing.html").read_text(encoding="utf-8")
    profiles = extract_profile_urls(html, "https://www.med.tn/medecin/dentiste/tunis")
    pages = extract_pagination_urls(html, "https://www.med.tn/medecin/dentiste/tunis")
    assert len(profiles) == 2
    assert profiles[1].profile_url.endswith("dr-wassim-guezguez-215971.html")
    assert "https://www.med.tn/medecin/dentiste/tunis/2" in pages


def test_extract_ajax_listing_params():
    html = """
    <script>
    var limit = 30; var total = 72;
    $.ajax({url:"pagesmd_load.php", data:{start:start,spe:'29',gov:'23',del:'',is_medinter:'0'}});
    </script>
    """
    extracted = extract_ajax_listing_params(html)
    assert extracted is not None
    endpoint, params, page_size, total = extracted
    assert endpoint == "pagesmd_load.php"
    assert params["spe"] == "29"
    assert page_size == 30
    assert total == 72
