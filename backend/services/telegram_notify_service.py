import logging

import httpx

from settings import read_site_url, read_telegram_bot_token, read_telegram_chat_id

logger = logging.getLogger(__name__)
TIMEOUT_SECONDS = 3


def notify_new_invite_request(first_name: str, last_name: str, phone: str) -> None:
    """Pings the couple's Telegram chat about a new request. Runs as a
    background task; any failure is logged, never raised — the request is
    already saved and the admin badge still shows it."""
    token = read_telegram_bot_token()
    chat_id = read_telegram_chat_id()
    if not token or not chat_id:
        logger.info("Telegram not configured; skipping invite request notification.")
        return

    text = (
        f"📬 Nuova richiesta invito: {first_name} {last_name} · {phone}\n"
        f"{read_site_url()}/admin/invites"
    )
    try:
        response = httpx.post(
            f"https://api.telegram.org/bot{token}/sendMessage",
            json={"chat_id": chat_id, "text": text},
            timeout=TIMEOUT_SECONDS,
        )
        response.raise_for_status()
    except httpx.HTTPError as error:
        logger.warning("Telegram notification failed: %s", error)
