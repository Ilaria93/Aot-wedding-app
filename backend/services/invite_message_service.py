from typing import Optional
from urllib.parse import quote

INVITE_MESSAGE_TEMPLATE = (
    "Ciao {first_name}! Davide e Ilaria ti aspettano il 31 maggio 2027 🕊️ "
    "Ecco il tuo invito personale: {invite_url}"
)


def build_whatsapp_url(phone: Optional[str], first_name: str, invite_url: str) -> str:
    """wa.me link that opens WhatsApp with the invite message ready to send.
    Without a phone, WhatsApp lets the admin pick the contact."""
    message = INVITE_MESSAGE_TEMPLATE.format(first_name=first_name, invite_url=invite_url)
    target = (phone or "").lstrip("+")
    return f"https://wa.me/{target}?text={quote(message)}"
