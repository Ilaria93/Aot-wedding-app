from typing import Iterable

from models.invite_link_model import InviteLink

FAMILY_RELATIONS = ("spouse", "child")


def _join_names(names: list[str]) -> str:
    if len(names) <= 1:
        return "".join(names)
    return f"{', '.join(names[:-1])} e {names[-1]}"


def _couple_names(head: InviteLink, members: Iterable[InviteLink]) -> list[str]:
    """Head, partners and, when partners are not married to the head, their children: "Chiara, Alessandro e Viola"."""
    return [head.first_name, *(member.first_name for member in members if member.relation in ("partner", "child"))]


def greeting_names(kind: str, name: str, head: InviteLink, members: Iterable[InviteLink]) -> list[str]:
    """The names behind a greeting, for clients that join them in their own
    language ("Chiara e Luca" / "Chiara and Luca"). Only a couple has several."""
    if kind != "couple":
        return [name]
    return _couple_names(head, members)


def build_greeting(head: InviteLink, members: Iterable[InviteLink]) -> tuple[str, str]:
    """(kind, name) for the invite greeting, computed from the group on every
    call so correcting a name in the table updates the greeting on its own.

    kind: "family" ("Cara famiglia {name}"), "couple" ("Cari {name}"),
    "single_m" / "single_f" ("Caro/Cara {name}") or "single" ("Cara/o {name}").
    """
    members = list(members)
    relations = {member.relation for member in members}
    # Partners (not married) with children are greeted by first names; a spouse, or children alone, make a family.
    if head.family_name or "spouse" in relations or ("child" in relations and "partner" not in relations):
        return "family", head.family_name or head.last_name

    if "partner" in relations:
        return "couple", _join_names(_couple_names(head, members))

    return single_greeting(head)


def single_greeting(person: InviteLink) -> tuple[str, str]:
    """The greeting for one person alone: Caro/Cara/Cara-o {first name}, never the family or the couple."""
    if person.gender == "m":
        return "single_m", person.first_name
    if person.gender == "f":
        return "single_f", person.first_name
    return "single", person.first_name


def is_individual_invite(invite: InviteLink) -> bool:
    """True when the group was sent as one invite per person: a member then has a link of their own (only heads
    normally do), and the head's invite is for the head alone."""
    if invite.head_id is not None:
        return invite.token is not None
    return any(member.token is not None for member in invite.members)


def invite_greeting(invite: InviteLink) -> tuple[str, str, list[str]]:
    """(kind, name, names) as the guest opening this invite sees it: the whole group for a shared invite, just
    the one person for an individual one."""
    if is_individual_invite(invite):
        kind, name = single_greeting(invite)
        return kind, name, [name]
    kind, name = build_greeting(invite, invite.members)
    return kind, name, greeting_names(kind, name, invite, invite.members)


def default_party_guests(head: InviteLink, members: Iterable[InviteLink], site_max: int) -> int:
    """How many people the RSVP form starts with: the size the couple set (a
    starting point the guest can change up to the site limit), else the size of
    the group (head + members), else 1."""
    return min(head.party_size or 1 + len(list(members)), site_max)
