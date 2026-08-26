from __future__ import annotations

import os

import httpx
import pytest

from services.email_service import EmailSendError, send_email


def test_send_email_raises_without_api_key(monkeypatch):
    monkeypatch.delenv("RESEND_API_KEY", raising=False)
    with pytest.raises(EmailSendError, match="RESEND_API_KEY"):
        send_email(to="guest@example.com", subject="Hi", html_body="<p>Hi</p>")


def test_send_email_posts_to_resend(monkeypatch):
    monkeypatch.setenv("RESEND_API_KEY", "test-resend-key")
    monkeypatch.setenv("EMAIL_FROM_ADDRESS", "wedding@example.com")

    captured = {}

    def fake_post(url, headers=None, json=None, timeout=None):
        captured["url"] = url
        captured["headers"] = headers
        captured["json"] = json
        return httpx.Response(200, json={"id": "abc"}, request=httpx.Request("POST", url))

    monkeypatch.setattr(httpx, "post", fake_post)

    send_email(to="guest@example.com", subject="Hi", html_body="<p>Hi</p>")

    assert captured["url"] == "https://api.resend.com/emails"
    assert captured["headers"]["Authorization"] == "Bearer test-resend-key"
    assert captured["json"]["from"] == "wedding@example.com"
    assert captured["json"]["to"] == ["guest@example.com"]


def test_send_email_raises_on_provider_error(monkeypatch):
    monkeypatch.setenv("RESEND_API_KEY", "test-resend-key")

    def fake_post(url, headers=None, json=None, timeout=None):
        return httpx.Response(422, json={"message": "invalid"}, request=httpx.Request("POST", url))

    monkeypatch.setattr(httpx, "post", fake_post)

    with pytest.raises(EmailSendError, match="422"):
        send_email(to="guest@example.com", subject="Hi", html_body="<p>Hi</p>")
