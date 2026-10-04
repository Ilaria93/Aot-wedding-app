from typing import Optional
from urllib.parse import quote

# One message per greeting kind. The link sits on its own last line: WhatsApp
# makes it tappable only for a real https:// address (not localhost), so
# SITE_URL must be the public site in the environment that sends invites.
# The emoji is a plain one (no variation selector): the dove 🕊️ showed up as a
# broken square on some phones.
_SINGLE_MESSAGE = (
    "Ciao {name}! 💌\n"
    "Davide e Ilaria si sposano il 31 maggio 2027 e ti aspettano alla festa!\n"
    "Qui c'è il tuo invito: {invite_url}"
)
_COUPLE_MESSAGE = (
    "Ciao {name}! 💌\n"
    "Davide e Ilaria si sposano il 31 maggio 2027 e vi aspettano alla festa!\n"
    "Qui c'è il vostro invito: {invite_url}"
)
_FAMILY_MESSAGE = (
    "Ciao famiglia {name}! 💌\n"
    "Davide e Ilaria si sposano il 31 maggio 2027 e vi aspettano alla festa!\n"
    "Qui c'è il vostro invito: {invite_url}"
)


def build_invite_message(greeting_kind: str, greeting_name: str, invite_url: str) -> str:
    template = {"family": _FAMILY_MESSAGE, "couple": _COUPLE_MESSAGE}.get(greeting_kind, _SINGLE_MESSAGE)
    return template.format(name=greeting_name, invite_url=invite_url)


def build_whatsapp_url(
    phone: Optional[str], greeting_kind: str, greeting_name: str, invite_url: str
) -> str:
    """wa.me link that opens WhatsApp with the invite message ready to send.
    Without a phone, WhatsApp lets the admin pick the contact."""
    message = build_invite_message(greeting_kind, greeting_name, invite_url)
    target = (phone or "").lstrip("+")
    return f"https://wa.me/{target}?text={quote(message)}"


def build_head_whatsapp_url(head, phone: Optional[str] = None) -> str:
    """wa.me link for a head's invite. `phone` overrides where it goes (e.g. a
    spouse who asked for the link); by default it targets the head's own."""
    from services.invite_greeting_service import build_greeting
    from services.invite_link_service import build_invite_url

    kind, name = build_greeting(head, head.members)
    return build_whatsapp_url(phone or head.phone, kind, name, build_invite_url(head.token))
