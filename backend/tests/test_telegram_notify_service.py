import httpx

from services import telegram_notify_service


def test_skips_when_not_configured(monkeypatch):
    monkeypatch.delenv("TELEGRAM_BOT_TOKEN", raising=False)
    monkeypatch.delenv("TELEGRAM_CHAT_ID", raising=False)
    calls = []
    monkeypatch.setattr(telegram_notify_service.httpx, "post", lambda *a, **k: calls.append(a))
    telegram_notify_service.notify_new_invite_request("Mario", "Rossi", "+393331234567")
    assert calls == []


def test_posts_message_to_configured_chat(monkeypatch):
    monkeypatch.setenv("TELEGRAM_BOT_TOKEN", "bot-token")
    monkeypatch.setenv("TELEGRAM_CHAT_ID", "42")
    monkeypatch.setenv("SITE_URL", "https://site")
    sent = {}

    def fake_post(url, json, timeout):
        sent.update(url=url, json=json, timeout=timeout)
        return httpx.Response(200, request=httpx.Request("POST", url))

    monkeypatch.setattr(telegram_notify_service.httpx, "post", fake_post)
    telegram_notify_service.notify_new_invite_request("Mario", "Rossi", "+393331234567")

    assert sent["url"] == "https://api.telegram.org/botbot-token/sendMessage"
    assert sent["json"]["chat_id"] == "42"
    assert "Mario Rossi" in sent["json"]["text"]
    assert "+393331234567" in sent["json"]["text"]
    assert "https://site/admin/invites" in sent["json"]["text"]
    assert sent["timeout"] == 3


def test_swallows_network_errors(monkeypatch):
    monkeypatch.setenv("TELEGRAM_BOT_TOKEN", "bot-token")
    monkeypatch.setenv("TELEGRAM_CHAT_ID", "42")

    def boom(*args, **kwargs):
        raise httpx.ConnectError("down")

    monkeypatch.setattr(telegram_notify_service.httpx, "post", boom)
    telegram_notify_service.notify_new_invite_request("Mario", "Rossi", "+393331234567")


def test_does_not_leak_bot_token_in_logs(monkeypatch, caplog):
    import logging

    monkeypatch.setenv("TELEGRAM_BOT_TOKEN", "bot-token")
    monkeypatch.setenv("TELEGRAM_CHAT_ID", "42")

    def fake_post(url, json, timeout):
        return httpx.Response(401, request=httpx.Request("POST", url))

    monkeypatch.setattr(telegram_notify_service.httpx, "post", fake_post)

    # The function should not raise even with a 401 error
    with caplog.at_level(logging.WARNING):
        telegram_notify_service.notify_new_invite_request("Mario", "Rossi", "+393331234567")

    # Verify bot-token is not leaked in logs - the critical security requirement
    assert "bot-token" not in caplog.text


def test_message_links_to_the_prefilled_add_form(monkeypatch):
    from urllib.parse import parse_qs, urlparse

    monkeypatch.setenv("TELEGRAM_BOT_TOKEN", "bot-token")
    monkeypatch.setenv("TELEGRAM_CHAT_ID", "42")
    monkeypatch.setenv("SITE_URL", "https://site")
    sent = {}
    monkeypatch.setattr(
        telegram_notify_service.httpx,
        "post",
        lambda url, json, timeout: sent.update(json=json) or httpx.Response(200, request=httpx.Request("POST", url)),
    )
    telegram_notify_service.notify_new_invite_request("Mario", "Rossi", "+393331234567", "🆕 Non è ancora in tabella.")

    text = sent["json"]["text"]
    assert "🆕 Non è ancora in tabella." in text
    link = text.splitlines()[-1]
    assert urlparse(link).path == "/admin/invites"
    assert parse_qs(urlparse(link).query) == {
        "add": ["1"], "first_name": ["Mario"], "last_name": ["Rossi"], "phone": ["+393331234567"],
    }


def test_describe_matches():
    from datetime import datetime

    from schemas.admin_invite_schema import InviteMatch, InviteMatchHead

    assert telegram_notify_service.describe_matches([]) == "🆕 Non è ancora in tabella."
    head = InviteMatchHead(id=1, first_name="Christian", last_name="Rossi", sent_at=datetime(2026, 10, 1))
    spouse = InviteMatch(id=2, first_name="Arianna", last_name="Rossi", relation="spouse", head=head)
    assert telegram_notify_service.describe_matches([spouse]) == (
        "✅ Già in tabella: Arianna Rossi (coniuge di Christian Rossi), invito inviato il 01/10/2026."
    )
    unsent = InviteMatch(id=1, first_name="Christian", last_name="Rossi", head=InviteMatchHead(id=1, first_name="Christian", last_name="Rossi"))
    assert "invito non ancora inviato" in telegram_notify_service.describe_matches([unsent])


def _capture_post(monkeypatch):
    monkeypatch.setenv("TELEGRAM_BOT_TOKEN", "bot-token")
    monkeypatch.setenv("TELEGRAM_CHAT_ID", "42")
    monkeypatch.setenv("SITE_URL", "https://site")
    sent = {}

    def fake_post(url, json, timeout):
        sent.update(json=json)
        return httpx.Response(200, request=httpx.Request("POST", url))

    monkeypatch.setattr(telegram_notify_service.httpx, "post", fake_post)
    return sent


def test_guest_rsvp_attending_message(monkeypatch):
    sent = _capture_post(monkeypatch)
    telegram_notify_service.notify_guest_rsvp("Mario", "Rossi", True, ["Mario Rossi", "Giulia Rossi"])
    text = sent["json"]["text"]
    assert "Mario Rossi ha confermato: 2 persone" in text
    assert "Mario Rossi, Giulia Rossi" in text
    assert text.endswith("https://site/admin/rsvp")


def test_guest_rsvp_declined_message(monkeypatch):
    sent = _capture_post(monkeypatch)
    telegram_notify_service.notify_guest_rsvp("Luca", "Prova", False, [])
    assert sent["json"]["text"] == "❌ Luca Prova non potrà venire\nhttps://site/admin/rsvp"


def test_guest_rsvp_skips_when_not_configured(monkeypatch):
    monkeypatch.delenv("TELEGRAM_BOT_TOKEN", raising=False)
    monkeypatch.delenv("TELEGRAM_CHAT_ID", raising=False)
    calls = []
    monkeypatch.setattr(telegram_notify_service.httpx, "post", lambda *a, **k: calls.append(a))
    telegram_notify_service.notify_guest_rsvp("Mario", "Rossi", True, ["Mario Rossi"])
    assert calls == []
