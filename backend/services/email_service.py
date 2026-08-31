import httpx

from settings import read_email_from_address, read_resend_api_key

RESEND_API_URL = "https://api.resend.com/emails"


class EmailSendError(Exception):
    """Raised when the transactional email provider rejects or fails a send."""


def send_email(to: str, subject: str, html_body: str) -> None:
    api_key = read_resend_api_key()
    if not api_key:
        raise EmailSendError("RESEND_API_KEY is not configured on this server.")

    response = httpx.post(
        RESEND_API_URL,
        headers={"Authorization": f"Bearer {api_key}"},
        json={
            "from": read_email_from_address(),
            "to": [to],
            "subject": subject,
            "html": html_body,
        },
        timeout=10.0,
    )
    if response.status_code >= 400:
        raise EmailSendError(f"Resend API error {response.status_code}: {response.text}")
