from typing import Iterable

from models.invite_link_model import InviteLink

FAMILY_RELATIONS = ("spouse", "child")


def _join_names(names: list[str]) -> str:
    if len(names) <= 1:
        return "".join(names)
    return f"{', '.join(names[:-1])} e {names[-1]}"


def greeting_names(kind: str, name: str, head: InviteLink, members: Iterable[InviteLink]) -> list[str]:
    """The names behind a greeting, for clients that join them in their own
    language ("Chiara e Luca" / "Chiara and Luca"). Only a couple has several."""
    if kind != "couple":
        return [name]
    return [head.first_name, *(member.first_name for member in members if member.relation == "partner")]


def build_greeting(head: InviteLink, members: Iterable[InviteLink]) -> tuple[str, str]:
    """(kind, name) for the invite greeting, computed from the group on every
    call so correcting a name in the table updates the greeting on its own.

    kind: "family" ("Cara famiglia {name}"), "couple" ("Cari {name}"),
    "single_m" / "single_f" ("Caro/Cara {name}") or "single" ("Cara/o {name}").
    """
    members = list(members)
    relations = {member.relation for member in members}
    if head.family_name or relations & set(FAMILY_RELATIONS):
        return "family", head.family_name or head.last_name

    partners = [member.first_name for member in members if member.relation == "partner"]
    if partners:
        return "couple", _join_names([head.first_name, *partners])

    if head.gender == "m":
        return "single_m", head.first_name
    if head.gender == "f":
        return "single_f", head.first_name
    return "single", head.first_name


def default_party_guests(head: InviteLink, members: Iterable[InviteLink], site_max: int) -> int:
    """How many people the RSVP form starts with: the size the couple set (a
    starting point the guest can change up to the site limit), else the size of
    the group (head + members), else 1."""
    return min(head.party_size or 1 + len(list(members)), site_max)
