from urllib.parse import parse_qs, urlparse

from database.base import SessionLocal
from models.invite_link_model import InviteLink


def _create(api_client, **fields):
    payload = {"first_name": "Christian", "last_name": "Rossi", "gender": "m"}
    if "head_id" not in fields:
        payload["phone"] = "333 1111111"
    payload.update(fields)
    return api_client.post("/admin/invites", json=payload)


def _head(api_client, **fields):
    response = _create(api_client, **fields)
    assert response.status_code == 201, response.text
    return response.json()


def _member(api_client, head_id, relation, first_name="Arianna", **fields):
    person = {"head_id": head_id, "relation": relation, "first_name": first_name, "last_name": "Rossi", "gender": "f", "phone": None}
    person.update(fields)
    return _create(api_client, **person)


def _message(whatsapp_url):
    return parse_qs(urlparse(whatsapp_url).query)["text"][0]


def test_requires_admin(api_client, user_headers):
    assert api_client.post("/admin/invites", json={"first_name": "A", "last_name": "B"}).status_code == 403
    assert api_client.get("/admin/invites/lookup").status_code == 403


def test_create_head_normalises_phone_and_gets_a_token(api_client, admin_headers):
    head = _head(api_client)
    assert head["phone"] == "+393331111111"
    assert head["editable"] is True
    assert head["greeting_kind"] == "single_m"
    assert "/invito/" in head["invite_url"]
    assert _message(head["whatsapp_url"]).startswith("Ciao Christian!")


def test_family_group_greeting_and_message(api_client, admin_headers):
    head = _head(api_client)
    assert _member(api_client, head["id"], "spouse").status_code == 201
    assert _member(api_client, head["id"], "child", first_name="Matteo").status_code == 201
    [row] = api_client.get("/admin/invites").json()
    assert row["greeting_kind"] == "family"
    assert row["greeting_name"] == "Rossi"
    assert [member["first_name"] for member in row["members"]] == ["Arianna", "Matteo"]
    assert _message(row["whatsapp_url"]).startswith("Ciao famiglia Rossi!")


def test_partners_make_a_couple(api_client, admin_headers):
    head = _head(api_client, first_name="Chiara", last_name="Bianchi", gender="f")
    assert _create(api_client, head_id=head["id"], relation="partner", first_name="Luca", last_name="Verdi").status_code == 201
    [row] = api_client.get("/admin/invites").json()
    assert row["greeting_kind"] == "couple"
    assert _message(row["whatsapp_url"]).startswith("Ciao Chiara e Luca!")


def test_family_and_partners_cannot_mix(api_client, admin_headers):
    family = _head(api_client)
    _member(api_client, family["id"], "spouse")
    mixed = _member(api_client, family["id"], "partner", first_name="Giulia")
    assert mixed.status_code == 422

    couple = _head(api_client, first_name="Chiara", last_name="Bianchi", phone="333 2222222")
    _create(api_client, head_id=couple["id"], relation="partner", first_name="Luca", last_name="Verdi")
    assert _member(api_client, couple["id"], "child", first_name="Teo").status_code == 422
    assert _member(api_client, couple["id"], "spouse", first_name="Eva").status_code == 422
    # A family name on a head with partners is the same mix.
    assert api_client.patch(f"/admin/invites/{couple['id']}", json={"family_name": "Bianchi"}).status_code == 422


def test_only_one_spouse(api_client, admin_headers):
    head = _head(api_client)
    assert _member(api_client, head["id"], "spouse").status_code == 201
    assert _member(api_client, head["id"], "spouse", first_name="Altra").status_code == 422


def test_member_must_link_to_a_head_and_have_a_relation(api_client, admin_headers):
    head = _head(api_client)
    member = _member(api_client, head["id"], "child", first_name="Matteo").json()
    member_id = member["members"][0]["id"]
    assert _member(api_client, member_id, "child", first_name="Nipote").status_code == 404
    assert _create(api_client, head_id=head["id"], first_name="Senza", last_name="Relazione").status_code == 422
    assert _create(api_client, relation="child", first_name="Solo", last_name="Relazione", phone=None).status_code == 422
    assert _member(api_client, 9999, "child").status_code == 404


def test_duplicates_are_reported_and_can_be_confirmed(api_client, admin_headers):
    head = _head(api_client)
    _member(api_client, head["id"], "spouse")

    by_name = _create(api_client, phone=None)
    assert by_name.status_code == 409
    assert by_name.json()["detail"]["code"] == "duplicate"

    # The spouse is found by name too, and the match points at the group head.
    again = _create(api_client, first_name="Arianna", last_name="Rossi", phone=None)
    [match] = again.json()["detail"]["matches"]
    assert match["relation"] == "spouse"
    assert match["head"]["id"] == head["id"]

    confirmed = api_client.post("/admin/invites?confirm_duplicate=true", json={"first_name": "Christian", "last_name": "Rossi"})
    assert confirmed.status_code == 201


def test_lookup_by_phone_and_name(api_client, admin_headers):
    head = _head(api_client)
    [by_phone] = api_client.get("/admin/invites/lookup", params={"phone": "+39 333 1111111"}).json()
    assert by_phone["head"]["id"] == head["id"]
    [by_name] = api_client.get("/admin/invites/lookup", params={"first_name": "christian", "last_name": "ROSSI"}).json()
    assert by_name["id"] == head["id"]
    assert api_client.get("/admin/invites/lookup", params={"first_name": "Nessuno", "last_name": "Qui"}).json() == []
    assert api_client.get("/admin/invites/lookup", params={"phone": "abc"}).status_code == 422


def test_group_is_locked_after_send_but_resend_still_works(api_client, admin_headers):
    head = _head(api_client)
    member_id = _member(api_client, head["id"], "spouse").json()["members"][0]["id"]
    sent = api_client.post(f"/admin/invites/{head['id']}/mark-sent").json()
    assert sent["editable"] is False

    assert api_client.patch(f"/admin/invites/{head['id']}", json={"first_name": "Cristian"}).status_code == 409
    assert api_client.patch(f"/admin/invites/{member_id}", json={"first_name": "Ari"}).status_code == 409
    assert _member(api_client, head["id"], "child", first_name="Matteo").status_code == 409
    again = api_client.post(f"/admin/invites/{head['id']}/mark-sent")
    assert again.status_code == 200
    assert again.json()["sent_at"] == sent["sent_at"]


def test_update_before_send(api_client, admin_headers):
    head = _head(api_client)
    updated = api_client.patch(
        f"/admin/invites/{head['id']}",
        json={"first_name": "Cristian", "family_name": "Rossi Verdi", "party_size": 5, "phone": None},
    )
    assert updated.status_code == 200
    body = updated.json()
    assert body["first_name"] == "Cristian"
    assert body["greeting_name"] == "Rossi Verdi"
    assert body["party_size"] == 5
    assert body["phone"] is None
    assert api_client.patch(f"/admin/invites/{head['id']}", json={"first_name": ""}).status_code == 422
    assert api_client.patch("/admin/invites/9999", json={"first_name": "X"}).status_code == 404


def test_delete_removes_the_head_and_its_members(api_client, admin_headers):
    head = _head(api_client)
    _member(api_client, head["id"], "spouse")
    assert api_client.delete(f"/admin/invites/{head['id']}").status_code == 204
    assert api_client.get("/admin/invites").json() == []


def test_list_shows_only_heads_and_search_finds_members(api_client, admin_headers):
    head = _head(api_client)
    _member(api_client, head["id"], "spouse")
    other = _head(api_client, first_name="Anna", last_name="Neri", phone="333 3333333")
    rows = api_client.get("/admin/invites").json()
    assert [row["id"] for row in rows] == [head["id"], other["id"]]
    found = api_client.get("/admin/invites", params={"search": "arianna"}).json()
    assert [row["id"] for row in found] == [head["id"]]


def test_whatsapp_link_to_a_member(api_client, admin_headers):
    head = _head(api_client)
    member_id = _member(api_client, head["id"], "spouse", phone="333 2222222").json()["members"][0]["id"]
    no_phone = _member(api_client, head["id"], "child", first_name="Matteo").json()["members"][1]["id"]

    response = api_client.get(f"/admin/invites/{head['id']}/whatsapp/{member_id}")
    assert response.status_code == 200
    url = response.json()["whatsapp_url"]
    assert urlparse(url).path == "/393332222222"
    assert _message(url).startswith("Ciao famiglia Rossi!")
    assert api_client.get(f"/admin/invites/{head['id']}/whatsapp/{no_phone}").status_code == 422
    assert api_client.get(f"/admin/invites/{head['id']}/whatsapp/9999").status_code == 404


def test_public_invite_exposes_greeting_and_group_size(api_client, admin_headers):
    head = _head(api_client)
    _member(api_client, head["id"], "spouse")
    _member(api_client, head["id"], "child", first_name="Matteo")
    token = api_client.get("/admin/invites").json()[0]["invite_url"].rsplit("/", 1)[1]

    body = api_client.get(f"/invites/{token}").json()
    assert body["greeting_kind"] == "family"
    assert body["greeting_name"] == "Rossi"
    assert body["greeting_names"] == ["Rossi"]
    assert body["max_party_guests"] == 10
    assert body["default_party_guests"] == 3
    assert "phone" not in body


def test_members_have_no_token_and_cannot_be_looked_up_by_one():
    db = SessionLocal()
    try:
        assert db.query(InviteLink).filter(InviteLink.token.is_(None)).count() == 0
    finally:
        db.close()


def test_public_invite_lists_couple_names_separately(api_client, admin_headers):
    head = _head(api_client, first_name="Chiara", last_name="Bianchi", gender="f")
    _create(api_client, head_id=head["id"], relation="partner", first_name="Luca", last_name="Verdi")
    token = api_client.get("/admin/invites").json()[0]["invite_url"].rsplit("/", 1)[1]
    body = api_client.get(f"/invites/{token}").json()
    assert body["greeting_kind"] == "couple"
    assert body["greeting_names"] == ["Chiara", "Luca"]
