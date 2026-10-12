from datetime import datetime
from typing import Optional

from sqlalchemy import func, or_
from sqlalchemy.orm import Session

from models.invite_link_model import InviteLink
from models.refresh_token_session_model import RefreshTokenSession
from models.rsvp_model import RSVP
from models.user_model import User
from schemas.admin_invite_schema import (
    AdminInviteCreate,
    AdminInviteMember,
    AdminInviteResponse,
    InviteMatch,
    InviteMatchHead,
)
from services.invite_greeting_service import FAMILY_RELATIONS, invite_greeting, is_individual_invite
from services.invite_link_service import build_invite_url, generate_unique_token
from services.invite_message_service import build_head_whatsapp_url
from services.phone_service import InvalidPhoneError, normalize_phone


class InviteNotFoundError(Exception):
    pass


class InviteLockedError(Exception):
    """The group was already sent (to anyone): it can't change any more."""


class InvalidInviteError(Exception):
    pass


class DuplicateInviteError(Exception):
    def __init__(self, matches: list[InviteMatch]):
        super().__init__("Already in the table.")
        self.matches = matches


def _clean_phone(raw: Optional[str]) -> Optional[str]:
    if raw is None or not raw.strip():
        return None
    try:
        return normalize_phone(raw)
    except InvalidPhoneError as error:
        raise InvalidInviteError(str(error)) from error


def check_group(family_name: Optional[str], relations: list[Optional[str]]) -> None:
    """A group is either a family (spouse/children) or a couple of partners."""
    if relations.count("spouse") > 1:
        raise InvalidInviteError("A person can have only one spouse.")
    is_family = bool(family_name) or any(relation in FAMILY_RELATIONS for relation in relations)
    if is_family and "partner" in relations:
        raise InvalidInviteError("A group is either a family (spouse, children) or partners, not both.")


def _is_locked(head: InviteLink) -> bool:
    """Once the invite went out to anyone in the group, its people can't change."""
    return head.sent_at is not None or any(member.sent_at is not None for member in head.members)


def _get_head(db: Session, head_id: int) -> InviteLink:
    head = db.query(InviteLink).filter(InviteLink.id == head_id, InviteLink.head_id.is_(None)).first()
    if not head:
        raise InviteNotFoundError("Invite not found")
    return head


def find_matches(db: Session, first_name: str, last_name: str, phone: Optional[str]) -> list[InviteMatch]:
    """People already in the table with the same name or the same phone,
    heads and members alike, each with the head of their group."""
    conditions = [
        (func.lower(InviteLink.first_name) == first_name.strip().lower())
        & (func.lower(InviteLink.last_name) == last_name.strip().lower())
    ]
    normalized = _clean_phone(phone)
    if normalized:
        conditions.append(InviteLink.phone == normalized)
    rows = db.query(InviteLink).filter(or_(*conditions)).order_by(InviteLink.id).all()
    return [
        InviteMatch(
            id=row.id,
            first_name=row.first_name,
            last_name=row.last_name,
            phone=row.phone,
            relation=row.relation,
            head=InviteMatchHead(
                id=(row.head or row).id,
                first_name=(row.head or row).first_name,
                last_name=(row.head or row).last_name,
                sent_at=(row.head or row).sent_at,
            ),
        )
        for row in rows
    ]


def create_person(db: Session, data: AdminInviteCreate, confirm_duplicate: bool = False) -> InviteLink:
    phone = _clean_phone(data.phone)
    if not confirm_duplicate:
        matches = find_matches(db, data.first_name, data.last_name, phone)
        if matches:
            raise DuplicateInviteError(matches)

    if data.head_id is None:
        if data.relation:
            raise InvalidInviteError("Only people linked to a head have a relation.")
        person = InviteLink(
            token=generate_unique_token(db),
            first_name=data.first_name,
            last_name=data.last_name,
            phone=phone,
            gender=data.gender,
            family_name=data.family_name,
            party_size=data.party_size,
            created_at=datetime.utcnow(),
        )
    else:
        head = _get_head(db, data.head_id)
        if _is_locked(head):
            raise InviteLockedError("Invite already sent")
        if not data.relation:
            raise InvalidInviteError("A relation with the head is required.")
        if data.family_name or data.party_size:
            raise InvalidInviteError("Family name and party size belong to the head.")
        check_group(head.family_name, [member.relation for member in head.members] + [data.relation])
        person = InviteLink(
            head_id=head.id,
            # A member added to a group already sent person by person has a link of their own too.
            token=generate_unique_token(db) if is_individual_invite(head) else None,
            relation=data.relation,
            first_name=data.first_name,
            last_name=data.last_name,
            phone=phone,
            gender=data.gender,
            created_at=datetime.utcnow(),
        )
    db.add(person)
    db.commit()
    db.refresh(person)
    return person


def update_person(db: Session, person_id: int, changes: dict) -> InviteLink:
    person = db.query(InviteLink).filter(InviteLink.id == person_id).first()
    if not person:
        raise InviteNotFoundError("Invite not found")
    head = person.head or person
    if _is_locked(head):
        raise InviteLockedError("Invite already sent")

    for required in ("first_name", "last_name"):
        if required in changes and not changes[required]:
            raise InvalidInviteError("First and last name are required.")
    if "phone" in changes:
        changes["phone"] = _clean_phone(changes["phone"])

    is_head = person.head_id is None
    if is_head and changes.get("relation"):
        raise InvalidInviteError("Only people linked to a head have a relation.")
    if not is_head:
        if changes.get("family_name") or changes.get("party_size"):
            raise InvalidInviteError("Family name and party size belong to the head.")
        if "relation" in changes and not changes["relation"]:
            raise InvalidInviteError("A relation with the head is required.")

    relations = [member.relation for member in head.members if member.id != person.id]
    if not is_head:
        relations.append(changes.get("relation", person.relation))
    family_name = changes["family_name"] if is_head and "family_name" in changes else head.family_name
    check_group(family_name, relations)

    for field, value in changes.items():
        setattr(person, field, value)
    db.commit()
    db.refresh(person)
    return person


# ponytail: N+1 per invite, join RSVP if the list ever grows large
def _answer_for(db: Session, person: InviteLink) -> str:
    if not person.user_id:
        return "none"
    rsvp = db.query(RSVP).filter(RSVP.user_id == person.user_id).first()
    if not rsvp:
        return "none"
    return "attending" if rsvp.attending else "declined"


def _group_sent_at(head: InviteLink, individual: bool) -> Optional[datetime]:
    """A shared invite is sent when the head's is; an individual group only once every person's has gone out."""
    if not individual:
        return head.sent_at
    times = [person.sent_at for person in [head, *head.members]]
    return max(times) if all(times) else None


def to_admin_invite(db: Session, head: InviteLink) -> AdminInviteResponse:
    kind, name, names = invite_greeting(head)
    individual = is_individual_invite(head)
    return AdminInviteResponse(
        id=head.id,
        first_name=head.first_name,
        last_name=head.last_name,
        phone=head.phone,
        gender=head.gender,
        family_name=head.family_name,
        party_size=head.party_size,
        sent_at=_group_sent_at(head, individual),
        own_sent_at=head.sent_at,
        answer=_answer_for(db, head),
        individual=individual,
        invite_url=build_invite_url(head.token),
        whatsapp_url=build_head_whatsapp_url(head),
        greeting_kind=kind,
        greeting_name=name,
        greeting_names=names,
        editable=not _is_locked(head),
        members=[
            AdminInviteMember(
                id=member.id,
                first_name=member.first_name,
                last_name=member.last_name,
                phone=member.phone,
                gender=member.gender,
                relation=member.relation,
                sent_at=member.sent_at,
                answer=_answer_for(db, member),
                invite_url=build_invite_url(member.token) if member.token else None,
            )
            for member in head.members
        ],
    )


def list_admin_invites(db: Session, filter: Optional[str], search: Optional[str]) -> list[AdminInviteResponse]:
    query = db.query(InviteLink).filter(InviteLink.head_id.is_(None))
    if search and search.strip():
        pattern = f"%{search.strip()}%"
        matching = db.query(InviteLink).filter(
            or_(
                InviteLink.first_name.ilike(pattern),
                InviteLink.last_name.ilike(pattern),
                InviteLink.phone.ilike(pattern),
            )
        )
        head_ids = {row.head_id or row.id for row in matching.all()}
        query = query.filter(InviteLink.id.in_(head_ids))
    invites = [to_admin_invite(db, head) for head in query.order_by(InviteLink.id).all()]
    if filter == "to_send":
        return [invite for invite in invites if invite.sent_at is None]
    if filter == "sent":
        return [invite for invite in invites if invite.sent_at is not None]
    if filter == "answered":
        return [invite for invite in invites if invite.answer != "none" or any(m.answer != "none" for m in invite.members)]
    return invites


def get_admin_invite(db: Session, invite_id: int) -> AdminInviteResponse:
    return to_admin_invite(db, _get_head(db, invite_id))


def mark_invite_sent(db: Session, invite_id: int, person_id: Optional[int] = None) -> AdminInviteResponse:
    """Records that the invite went out. A shared invite is the head's; for an individual group `person_id` says
    whose own invite it was (the head's when omitted). Resending keeps the first-sent date."""
    head = _get_head(db, invite_id)
    person = head
    if person_id is not None and person_id != head.id and is_individual_invite(head):
        person = next((member for member in head.members if member.id == person_id), None)
        if person is None:
            raise InviteNotFoundError("Person not found in this group")
    if person.sent_at is None:
        person.sent_at = datetime.utcnow()
    db.commit()
    db.refresh(head)
    return to_admin_invite(db, head)


def change_head(db: Session, head_id: int, new_head_id: int) -> AdminInviteResponse:
    """Makes a member of the group the head: the invite then goes out from their phone. The old head becomes a
    member (spouse/partner stay as they were, anything else becomes "other"); the link, family name and party size
    move to the new head. Only while nothing went out or was answered: after that the link is already in use."""
    head = _get_head(db, head_id)
    if _is_locked(head) or is_individual_invite(head):
        raise InviteLockedError("Invite already sent")
    new_head = next((member for member in head.members if member.id == new_head_id), None)
    if new_head is None:
        raise InviteNotFoundError("Member not found")
    if any(person.user_id is not None for person in [head, *head.members]):
        raise InviteLockedError("Someone already answered this invite")

    others = [member for member in head.members if member.id != new_head.id]
    old_head_relation = new_head.relation if new_head.relation in ("spouse", "partner") else "other"
    check_group(head.family_name, [old_head_relation, *(member.relation for member in others)])

    token = head.token
    head.token = None
    db.flush()
    new_head.head_id = None
    new_head.relation = None
    new_head.token = token
    new_head.family_name = head.family_name
    new_head.party_size = head.party_size
    head.family_name = None
    head.party_size = None
    db.flush()
    head.head_id = new_head.id
    head.relation = old_head_relation
    for member in others:
        member.head_id = new_head.id
    db.commit()
    db.refresh(new_head)
    return to_admin_invite(db, new_head)


def make_individual(db: Session, head_id: int) -> AdminInviteResponse:
    """Switches a group to one invite per person: every member gets a link of their own (the head already has
    one). Decided at the first send: a group already sent as a shared invite can't change, its link is out."""
    head = _get_head(db, head_id)
    if not head.members:
        raise InvalidInviteError("A single person already has an invite of their own.")
    if not is_individual_invite(head) and _is_locked(head):
        raise InviteLockedError("Invite already sent as a group")
    for member in head.members:
        if member.token is None:
            member.token = generate_unique_token(db)
            db.flush()
    db.commit()
    db.refresh(head)
    return to_admin_invite(db, head)


def _delete_guest_accounts(db: Session, user_ids: list[int]) -> None:
    """Answers, sessions and guest accounts bound to people that are being removed."""
    db.flush()
    if not user_ids:
        return
    for rsvp in db.query(RSVP).filter(RSVP.user_id.in_(user_ids)).all():
        db.delete(rsvp)
    db.query(RefreshTokenSession).filter(RefreshTokenSession.user_id.in_(user_ids)).delete(synchronize_session=False)
    db.flush()
    db.query(User).filter(User.id.in_(user_ids)).delete(synchronize_session=False)


def delete_member(db: Session, head_id: int, member_id: int) -> None:
    """Removes one person from a group, leaving the head and the others. Like any edit of the group,
    it is only possible until the invite has been sent."""
    head = _get_head(db, head_id)
    if _is_locked(head):
        raise InviteLockedError("Invite already sent")
    member = next((person for person in head.members if person.id == member_id), None)
    if member is None:
        raise InviteNotFoundError("Member not found")
    user_ids = [member.user_id] if member.user_id is not None else []
    db.delete(member)
    _delete_guest_accounts(db, user_ids)
    db.commit()


def delete_invite(db: Session, invite_id: int) -> None:
    """Removes a head and the whole group linked to them. If the guest already
    answered, their RSVP (with its guest lines), sessions and the guest account
    behind it go too: nothing is left pointing at the deleted invite."""
    head = _get_head(db, invite_id)
    user_ids = [person.user_id for person in [head, *head.members] if person.user_id is not None]
    for member in list(head.members):
        db.delete(member)
    db.delete(head)
    _delete_guest_accounts(db, user_ids)
    db.commit()


def whatsapp_url_for_person(db: Session, head_id: int, person_id: int) -> str:
    """The invite addressed to one person of the group: the head's shared invite sent to their phone (e.g. the
    spouse who asked for the link from the site), or, in an individual group, that person's own invite."""
    head = _get_head(db, head_id)
    person = next((member for member in [head, *head.members] if member.id == person_id), None)
    if not person:
        raise InviteNotFoundError("Person not found in this group")
    if not person.phone:
        raise InvalidInviteError("This person has no phone number.")
    if is_individual_invite(head):
        return build_head_whatsapp_url(person, phone=person.phone)
    return build_head_whatsapp_url(head, phone=person.phone)
