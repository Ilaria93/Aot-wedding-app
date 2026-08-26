from datetime import datetime, timedelta
import hashlib
import secrets

from sqlalchemy.orm import Session

from models.guest_magic_link_model import GuestMagicLink
from models.invite_link_model import InviteLink
from models.rsvp_model import RSVP
from models.user_model import User
from schemas.auth_schema import AuthSessionResponse
from schemas.guest_access_schema import GuestRsvpConfirmRequest
from schemas.rsvp_confirmation_schema import RSVPSubmitRequest, RsvpSubmitResponse
from services.auth_credentials_service import normalize_email
from services.auth_token_service import issue_auth_session
from services.email_service import EmailSendError, send_email
from services.rsvp_service import confirm_rsvp_for_user, update_rsvp_for_user
from settings import read_frontend_base_url, read_guest_magic_link_expires_minutes


class GuestInviteNotFoundError(Exception):
    """Raised when the invite token does not match any invite_links row."""


class GuestMagicLinkInvalidError(Exception):
    """Raised when a magic link token is unknown, expired, or already used."""


def _hash_token(raw_token: str) -> str:
    return hashlib.sha256(raw_token.encode("utf-8")).hexdigest()


def get_or_create_guest_user(db: Session, invite_link: InviteLink, email: str) -> User:
    if invite_link.user_id:
        existing_linked_user = db.query(User).filter(User.id == invite_link.user_id).first()
        if existing_linked_user:
            return existing_linked_user

    normalized_email = normalize_email(email)
    user = db.query(User).filter(User.email == normalized_email).first()
    if not user:
        user = User(
            first_name=invite_link.first_name,
            last_name=invite_link.last_name,
            email=normalized_email,
            password_hash=None,
            role="user",
            created_at=datetime.utcnow(),
            last_login_at=datetime.utcnow(),
        )
        db.add(user)
        db.flush()

    invite_link.user_id = user.id
    db.commit()
    db.refresh(user)
    return user


def _issue_and_send_magic_link(db: Session, user: User, email: str) -> None:
    db.query(GuestMagicLink).filter(
        GuestMagicLink.user_id == user.id,
        GuestMagicLink.used_at.is_(None),
    ).update({"used_at": datetime.utcnow()})

    raw_token = secrets.token_urlsafe(32)
    expires_minutes = read_guest_magic_link_expires_minutes()
    magic_link = GuestMagicLink(
        user_id=user.id,
        email=normalize_email(email),
        token_hash=_hash_token(raw_token),
        expires_at=datetime.utcnow() + timedelta(minutes=expires_minutes),
        used_at=None,
        created_at=datetime.utcnow(),
    )
    db.add(magic_link)
    db.commit()

    verify_url = f"{read_frontend_base_url()}/accedi/verifica?token={raw_token}"
    hours = max(1, expires_minutes // 60)
    send_email(
        to=email,
        subject="Il tuo link per il matrimonio",
        html_body=(
            f"<p>Ciao {user.first_name},</p>"
            f"<p>Usa questo link per rivedere o modificare la tua conferma:</p>"
            f'<p><a href="{verify_url}">{verify_url}</a></p>'
            f"<p>Il link resta valido per {hours} ore.</p>"
        ),
    )


def confirm_guest_rsvp(
    db: Session, token: str, payload: GuestRsvpConfirmRequest
) -> tuple[AuthSessionResponse, RsvpSubmitResponse]:
    invite_link = db.query(InviteLink).filter(InviteLink.token == token).first()
    if not invite_link:
        raise GuestInviteNotFoundError("Invite not found")

    user = get_or_create_guest_user(db, invite_link, payload.email)
    rsvp_payload = RSVPSubmitRequest(attending=payload.attending, guests=payload.guests)

    existing_rsvp = db.query(RSVP).filter(RSVP.user_id == user.id).first()
    rsvp_response = (
        update_rsvp_for_user(db, user, rsvp_payload)
        if existing_rsvp
        else confirm_rsvp_for_user(db, user, rsvp_payload)
    )

    session = issue_auth_session(db, user, remember_me=True)
    try:
        _issue_and_send_magic_link(db, user, payload.email)
    except EmailSendError:
        pass  # confirmation still succeeds; the guest just won't get the recap email
    return session, rsvp_response


def request_guest_magic_link(db: Session, email: str) -> None:
    normalized_email = normalize_email(email)
    user = (
        db.query(User)
        .filter(User.email == normalized_email, User.password_hash.is_(None))
        .first()
    )
    if not user:
        return
    _issue_and_send_magic_link(db, user, normalized_email)


def verify_guest_magic_link(db: Session, raw_token: str) -> AuthSessionResponse:
    token_hash = _hash_token(raw_token)
    link = db.query(GuestMagicLink).filter(GuestMagicLink.token_hash == token_hash).first()
    if not link or link.used_at is not None or link.expires_at <= datetime.utcnow():
        raise GuestMagicLinkInvalidError("This link is invalid or has expired.")

    link.used_at = datetime.utcnow()
    db.commit()

    user = db.query(User).filter(User.id == link.user_id).first()
    if not user:
        raise GuestMagicLinkInvalidError("This link is invalid or has expired.")

    return issue_auth_session(db, user, remember_me=True)
