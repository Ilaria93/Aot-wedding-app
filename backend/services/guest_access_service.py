from datetime import datetime

from sqlalchemy.orm import Session

from models.invite_link_model import InviteLink
from models.rsvp_model import RSVP
from models.user_model import User
from schemas.auth_schema import AuthSessionResponse
from schemas.rsvp_confirmation_schema import RSVPSubmitRequest, RsvpSubmitResponse
from services.auth_token_service import issue_auth_session
from services.rsvp_service import (
    assert_rsvp_editable_window,
    confirm_rsvp_for_user,
    update_rsvp_for_user,
)


class GuestInviteNotFoundError(Exception):
    """Raised when the invite token does not match any invite_links row."""


def get_or_create_guest_user(db: Session, invite_link: InviteLink) -> User:
    # `invite_link.user_id` is the ONLY thing that identifies the bound guest
    # — there is no email or password to look one up by. A repeat visit to
    # the same link reuses this same account instead of creating another.
    if invite_link.user_id:
        existing_linked_user = db.query(User).filter(User.id == invite_link.user_id).first()
        if existing_linked_user:
            return existing_linked_user

    user = User(
        first_name=invite_link.first_name,
        last_name=invite_link.last_name,
        phone=invite_link.phone,
        email=None,
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


def confirm_guest_rsvp(
    db: Session, token: str, payload: RSVPSubmitRequest
) -> tuple[AuthSessionResponse, RsvpSubmitResponse]:
    invite_link = db.query(InviteLink).filter(InviteLink.token == token).first()
    if not invite_link:
        raise GuestInviteNotFoundError("Invite not found")

    # Deadline first: get_or_create_guest_user commits (creates the guest and
    # permanently binds the invite to it), so a later check would leave those
    # side effects behind a 403.
    assert_rsvp_editable_window()

    user = get_or_create_guest_user(db, invite_link)

    existing_rsvp = db.query(RSVP).filter(RSVP.user_id == user.id).first()
    rsvp_response = (
        update_rsvp_for_user(db, user, payload)
        if existing_rsvp
        else confirm_rsvp_for_user(db, user, payload)
    )

    session = issue_auth_session(db, user, remember_me=False)
    return session, rsvp_response
