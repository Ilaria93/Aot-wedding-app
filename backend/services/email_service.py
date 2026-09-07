import httpx

from settings import read_email_from_address, read_resend_api_key

RESEND_API_URL = "https://api.resend.com/emails"


class EmailSendError(Exception):
    """Raised when the Resend API rejects or fails to send an email."""


# Sends a plain-text transactional email via Resend's HTTP API.
def send_email(to: str, subject: str, text: str) -> None:
    api_key = read_resend_api_key()
    if not api_key:
        raise EmailSendError("RESEND_API_KEY is not configured on this server.")

    try:
        response = httpx.post(
            RESEND_API_URL,
            headers={"Authorization": f"Bearer {api_key}"},
            json={
                "from": read_email_from_address(),
                "to": [to],
                "subject": subject,
                "text": text,
            },
            timeout=10.0,
        )
        response.raise_for_status()
    except httpx.HTTPError as error:
        raise EmailSendError(str(error)) from error
