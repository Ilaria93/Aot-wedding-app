from types import SimpleNamespace

from services.invite_greeting_service import build_greeting, default_party_guests


def _person(first_name="Mario", last_name="Rossi", gender=None, relation=None, family_name=None, party_size=None):
    return SimpleNamespace(
        first_name=first_name, last_name=last_name, gender=gender,
        relation=relation, family_name=family_name, party_size=party_size,
    )


def test_single_greeting_follows_gender():
    assert build_greeting(_person(gender="m"), []) == ("single_m", "Mario")
    assert build_greeting(_person(first_name="Anna", gender="f"), []) == ("single_f", "Anna")
    assert build_greeting(_person(), []) == ("single", "Mario")


def test_spouse_or_children_make_a_family_named_after_the_head():
    head = _person(first_name="Christian")
    assert build_greeting(head, [_person(first_name="Arianna", relation="spouse")]) == ("family", "Rossi")
    assert build_greeting(head, [_person(relation="child")]) == ("family", "Rossi")


def test_explicit_family_name_wins_over_last_name():
    assert build_greeting(_person(family_name="Rossi-Bianchi"), []) == ("family", "Rossi-Bianchi")


def test_partners_make_a_couple():
    head = _person(first_name="Chiara", last_name="Bianchi")
    assert build_greeting(head, [_person(first_name="Luca", relation="partner")]) == ("couple", "Chiara e Luca")


def test_other_members_do_not_change_the_greeting():
    head = _person(gender="m")
    assert build_greeting(head, [_person(first_name="Zia", relation="other")]) == ("single_m", "Mario")


def test_default_party_guests():
    head = _person()
    assert default_party_guests(head, [], 10) == 1
    assert default_party_guests(head, [_person(), _person()], 10) == 3
    assert default_party_guests(head, [_person()] * 20, 10) == 10
    assert default_party_guests(_person(party_size=4), [_person()], 10) == 4
    assert default_party_guests(_person(party_size=40), [], 10) == 10
