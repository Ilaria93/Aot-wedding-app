import logging
from urllib.parse import urlencode

import httpx

from schemas.admin_invite_schema import InviteMatch
from settings import read_site_url, read_telegram_bot_token, read_telegram_chat_id

logger = logging.getLogger(__name__)
TIMEOUT_SECONDS = 3


_RELATION_LABELS = {"spouse": "coniuge", "partner": "fidanzato/a", "child": "figlio/a", "other": "accompagnatore/trice"}


def describe_matches(matches: list[InviteMatch]) -> str:
    """One line telling the admin whether the requester is already in the table."""
    if not matches:
        return "🆕 Non è ancora in tabella."
    lines = []
    for match in matches:
        who = f"{match.first_name} {match.last_name}"
        head = match.head
        if match.relation:
            who += f" ({_RELATION_LABELS[match.relation]} di {head.first_name} {head.last_name})"
        sent = f"invito inviato il {head.sent_at:%d/%m/%Y}" if head.sent_at else "invito non ancora inviato"
        lines.append(f"✅ Già in tabella: {who}, {sent}.")
    return "\n".join(lines)


def _send_message(text: str, what: str) -> None:
    """Posts `text` to the couple's Telegram chat. Runs as a background task;
    any failure is logged, never raised — whatever triggered it is already saved."""
    token = read_telegram_bot_token()
    chat_id = read_telegram_chat_id()
    if not token or not chat_id:
        logger.info("Telegram not configured; skipping %s notification.", what)
        return
    try:
        response = httpx.post(
            f"https://api.telegram.org/bot{token}/sendMessage",
            json={"chat_id": chat_id, "text": text},
            timeout=TIMEOUT_SECONDS,
        )
        response.raise_for_status()
    except httpx.HTTPError as error:
        status_code = getattr(getattr(error, "response", None), "status_code", None)
        logger.warning("Telegram notification failed: %s (status %s)", type(error).__name__, status_code)


def notify_new_invite_request(first_name: str, last_name: str, phone: str, table_status: str = "") -> None:
    """Pings the couple's Telegram chat about a new request, with a link that
    opens the admin Inviti page ready to add the person (or resend)."""
    query = urlencode({"add": 1, "first_name": first_name, "last_name": last_name, "phone": phone})
    text = (
        f"📬 Nuova richiesta invito: {first_name} {last_name} · {phone}\n"
        + (f"{table_status}\n" if table_status else "")
        + f"{read_site_url()}/admin/invites?{query}"
    )
    _send_message(text, "invite request")


def notify_guest_rsvp(first_name: str, last_name: str, attending: bool, guest_names: list[str]) -> None:
    """Tells the couple a guest answered (or changed their answer), with a link
    to the admin RSVP page."""
    name = f"{first_name} {last_name}".strip()
    if attending:
        count = len(guest_names)
        people = "1 persona" if count == 1 else f"{count} persone"
        text = f"✅ {name} ha confermato: {people}\n{', '.join(guest_names)}\n"
    else:
        text = f"❌ {name} non potrà venire\n"
    _send_message(text + f"{read_site_url()}/admin/rsvp", "guest RSVP")
