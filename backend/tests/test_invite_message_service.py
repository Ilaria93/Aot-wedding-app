from urllib.parse import parse_qs, urlparse

from services.invite_link_service import build_invite_url
from services.invite_message_service import build_invite_message, build_whatsapp_url


def test_invite_url_uses_site_url(monkeypatch):
    monkeypatch.setenv("SITE_URL", "https://aot-wedding.it/")
    assert build_invite_url("tok123") == "https://aot-wedding.it/invito/tok123"


def test_whatsapp_url_targets_phone_with_prefilled_message():
    url = build_whatsapp_url("+393331234567", "single", "Mario", "https://site/invito/tok")
    parsed = urlparse(url)
    assert parsed.netloc == "wa.me"
    assert parsed.path == "/393331234567"
    assert parse_qs(parsed.query)["text"] == [
        "Ciao Mario! Davide e Ilaria ti aspettano il 31 maggio 2027 🕊️ "
        "Ecco il tuo invito personale: https://site/invito/tok"
    ]


def test_whatsapp_url_without_phone_lets_admin_pick_contact():
    url = build_whatsapp_url(None, "single", "Mario", "https://site/invito/tok")
    assert url.startswith("https://wa.me/?text=")


def test_message_for_couple_and_family():
    couple = build_invite_message("couple", "Chiara e Luca", "https://site/invito/tok")
    assert couple == (
        "Cari Chiara e Luca! Davide e Ilaria vi aspettano il 31 maggio 2027 🕊️ "
        "Ecco il vostro invito personale: https://site/invito/tok"
    )
    family = build_invite_message("family", "Rossi", "https://site/invito/tok")
    assert family.startswith("Cara famiglia Rossi! Davide e Ilaria vi aspettano")
