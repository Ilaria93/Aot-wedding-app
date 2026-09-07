from datetime import datetime, timedelta
import hashlib
import secrets

from sqlalchemy.orm import Session

from constants.auth_error_codes import INVALID_RESET_TOKEN
from models.password_reset_token_model import PasswordResetToken
from models.user_model import User
from services.auth_credentials_service import hash_password, normalize_email
from services.auth_errors import AuthValidationError
from services.email_service import EmailSendError, send_email
from settings import read_frontend_base_url, read_password_reset_expires_minutes


def _hash_token(raw_token: str) -> str:
    return hashlib.sha256(raw_token.encode("utf-8")).hexdigest()


# Sends a set/reset-password link if the email belongs to an admin account.
# Always succeeds from the caller's point of view — the response never
# reveals whether the email matched, to avoid leaking which addresses have
# accounts.
def request_password_reset(db: Session, email: str) -> None:
    normalized_email = normalize_email(email)
    user = db.query(User).filter(User.email == normalized_email, User.role == "admin").first()
    if not user:
        return

    raw_token = secrets.token_urlsafe(32)
    expires_minutes = read_password_reset_expires_minutes()
    db.add(
        PasswordResetToken(
            user_id=user.id,
            token_hash=_hash_token(raw_token),
            created_at=datetime.utcnow(),
            expires_at=datetime.utcnow() + timedelta(minutes=expires_minutes),
            used_at=None,
        )
    )
    db.commit()

    reset_url = f"{read_frontend_base_url()}/auth/reset-password?token={raw_token}"
    try:
        send_email(
            to=normalized_email,
            subject="Imposta la tua password",
            text=(
                f"Usa questo link per impostare la password del tuo account:\n\n{reset_url}\n\n"
                f"Il link resta valido per {expires_minutes} minuti."
            ),
        )
    except EmailSendError:
        pass  # the token still exists; the admin can ask for a new email if this one didn't arrive


def confirm_password_reset(db: Session, raw_token: str, new_password: str) -> None:
    token_hash = _hash_token(raw_token)
    reset_token = (
        db.query(PasswordResetToken)
        .filter(PasswordResetToken.token_hash == token_hash, PasswordResetToken.used_at.is_(None))
        .first()
    )
    if not reset_token or reset_token.expires_at <= datetime.utcnow():
        raise AuthValidationError("This link is invalid or has expired.", code=INVALID_RESET_TOKEN)

    user = db.query(User).filter(User.id == reset_token.user_id).first()
    if not user:
        raise AuthValidationError("This link is invalid or has expired.", code=INVALID_RESET_TOKEN)

    user.password_hash = hash_password(new_password)
    reset_token.used_at = datetime.utcnow()
    db.commit()
