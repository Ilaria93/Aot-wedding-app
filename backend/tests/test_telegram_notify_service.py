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
