from urllib.parse import parse_qs, urlparse

from fastapi.testclient import TestClient

from main import app


def _create(api_client, **fields):
    payload = {"first_name": "Chiara", "last_name": "Bianchi", "gender": "f", "phone": "333 1111111"}
    payload.update(fields)
    return api_client.post("/admin/invites", json=payload)


def _couple(api_client):
    head = _create(api_client).json()
    api_client.post(
        "/admin/invites",
        json={"first_name": "Luca", "last_name": "Verdi", "gender": "m", "phone": "333 2222222", "head_id": head["id"], "relation": "partner"},
    )
    return head["id"]


def _token(url):
    return url.rsplit("/", 1)[1]


def _line(first_name):
    return {"first_name": first_name, "last_name": "X", "meal_choice": "standard", "intolerance": "none", "is_child": False}


def _rsvp(_admin_client, token, names, attending=True):
    # A guest has a client of their own: answering sets guest cookies that would replace the admin login.
    return TestClient(app).post(f"/invites/{token}/rsvp", json={"attending": attending, "guests": [_line(n) for n in names] if attending else []})


def _row(api_client):
    [row] = api_client.get("/admin/invites").json()
    return row


def test_shared_group_is_unchanged_until_made_individual(api_client, admin_headers):
    _couple(api_client)
    row = _row(api_client)
    assert row["individual"] is False
    assert row["greeting_kind"] == "couple"
    assert row["members"][0]["invite_url"] is None


def test_making_a_group_individual_gives_everyone_their_own_link_and_greeting(api_client, admin_headers):
    head_id = _couple(api_client)
    response = api_client.post(f"/admin/invites/{head_id}/individual")
    assert response.status_code == 200
    row = response.json()
    assert row["individual"] is True
    assert row["greeting_kind"] == "single_f" and row["greeting_names"] == ["Chiara"]
    member = row["members"][0]
    assert member["invite_url"] and member["invite_url"] != row["invite_url"]

    # Public greeting of each link: just that person, for one person only.
    head_invite = api_client.get(f"/invites/{_token(row['invite_url'])}").json()
    member_invite = api_client.get(f"/invites/{_token(member['invite_url'])}").json()
    assert head_invite["greeting_names"] == ["Chiara"] and head_invite["max_party_guests"] == 1
    assert member_invite["greeting_kind"] == "single_m" and member_invite["greeting_names"] == ["Luca"]
    assert (member_invite["max_party_guests"], member_invite["default_party_guests"]) == (1, 1)

    # Each person's WhatsApp message carries their own greeting and link, and goes to their own phone.
    head_url = api_client.get(f"/admin/invites/{head_id}/whatsapp/{head_id}").json()["whatsapp_url"]
    member_url = api_client.get(f"/admin/invites/{head_id}/whatsapp/{member['id']}").json()["whatsapp_url"]
    head_text = parse_qs(urlparse(head_url).query)["text"][0]
    member_text = parse_qs(urlparse(member_url).query)["text"][0]
    assert head_text.startswith("Ciao Chiara!") and row["invite_url"] in head_text
    assert member_text.startswith("Ciao Luca!") and member["invite_url"] in member_text
    assert urlparse(member_url).path == "/393332222222"

    # Doing it twice keeps the same links.
    again = api_client.post(f"/admin/invites/{head_id}/individual").json()
    assert again["members"][0]["invite_url"] == member["invite_url"]


def test_each_person_answers_for_themselves_only(api_client, admin_headers):
    head_id = _couple(api_client)
    row = api_client.post(f"/admin/invites/{head_id}/individual").json()
    member_token = _token(row["members"][0]["invite_url"])

    assert _rsvp(api_client, member_token, ["Luca", "Extra"]).status_code == 422
    assert _rsvp(api_client, member_token, ["Luca"]).status_code == 200

    row = _row(api_client)
    assert row["answer"] == "none"
    assert row["members"][0]["answer"] == "attending"
    assert api_client.get("/admin/invites", params={"filter": "answered"}).json() != []

    assert _rsvp(api_client, _token(row["invite_url"]), [], attending=False).status_code == 200
    row = _row(api_client)
    assert (row["answer"], row["members"][0]["answer"]) == ("declined", "attending")


def test_sending_one_by_one_locks_the_group_and_completes_when_everyone_was_sent(api_client, admin_headers):
    head_id = _couple(api_client)
    row = api_client.post(f"/admin/invites/{head_id}/individual").json()
    member_id = row["members"][0]["id"]
    assert row["editable"] is True and row["sent_at"] is None

    partly = api_client.post(f"/admin/invites/{head_id}/mark-sent").json()
    assert partly["own_sent_at"] is not None
    assert partly["sent_at"] is None  # still to send to Luca: stays in "to send"
    assert partly["editable"] is False  # but the group is already locked
    assert api_client.patch(f"/admin/invites/{head_id}", json={"first_name": "Chiara2"}).status_code == 409

    done = api_client.post(f"/admin/invites/{head_id}/mark-sent", params={"person_id": member_id}).json()
    assert done["sent_at"] is not None
    assert done["members"][0]["sent_at"] is not None
    assert api_client.post(f"/admin/invites/{head_id}/mark-sent", params={"person_id": 9999}).status_code == 404


def test_a_group_already_sent_as_one_invite_cannot_become_individual(api_client, admin_headers):
    head_id = _couple(api_client)
    api_client.post(f"/admin/invites/{head_id}/mark-sent")
    response = api_client.post(f"/admin/invites/{head_id}/individual")
    assert response.status_code == 409


def test_a_single_person_has_nothing_to_split(api_client, admin_headers):
    head = _create(api_client, first_name="Anna", last_name="Neri", phone="333 3333333").json()
    assert api_client.post(f"/admin/invites/{head['id']}/individual").status_code == 422
    assert api_client.post("/admin/invites/9999/individual").status_code == 404


def test_someone_added_to_an_individual_group_gets_their_own_link(api_client, admin_headers):
    head_id = _couple(api_client)
    api_client.post(f"/admin/invites/{head_id}/individual")
    added = api_client.post(
        "/admin/invites",
        json={"first_name": "Sara", "last_name": "Rossi", "head_id": head_id, "relation": "other"},
    ).json()
    assert all(member["invite_url"] for member in added["members"])


# --- changing the head of a group ---------------------------------------------------------------


def _family(api_client):
    head = _create(api_client, first_name="Mario", last_name="Rossi", gender="m", phone="333 1111111", family_name="Rossi", party_size=3).json()
    for first_name, relation, phone in (("Anna", "spouse", "333 2222222"), ("Teo", "child", None)):
        api_client.post(
            "/admin/invites",
            json={"first_name": first_name, "last_name": "Rossi", "phone": phone, "head_id": head["id"], "relation": relation},
        )
    return head


def test_changing_the_head_moves_the_link_and_the_head_data(api_client, admin_headers):
    head = _family(api_client)
    anna_id = next(member["id"] for member in _row(api_client)["members"] if member["first_name"] == "Anna")

    response = api_client.post(f"/admin/invites/{head['id']}/head", json={"new_head_id": anna_id})
    assert response.status_code == 200
    row = _row(api_client)
    assert row["id"] == anna_id and row["first_name"] == "Anna"
    assert row["invite_url"] == head["invite_url"]  # the same link, now Anna's
    assert (row["family_name"], row["party_size"]) == ("Rossi", 3)
    assert {(m["first_name"], m["relation"]) for m in row["members"]} == {("Mario", "spouse"), ("Teo", "child")}
    assert api_client.get(f"/invites/{_token(row['invite_url'])}").json()["greeting_kind"] == "family"
    # The message now goes out from Anna's phone.
    assert urlparse(row["whatsapp_url"]).path == "/393332222222"


def test_a_partner_stays_a_partner_when_the_head_changes(api_client, admin_headers):
    head_id = _couple(api_client)
    luca_id = _row(api_client)["members"][0]["id"]
    api_client.post(f"/admin/invites/{head_id}/head", json={"new_head_id": luca_id})
    row = _row(api_client)
    assert row["first_name"] == "Luca"
    assert [(m["first_name"], m["relation"]) for m in row["members"]] == [("Chiara", "partner")]
    assert row["greeting_kind"] == "couple" and row["greeting_names"] == ["Luca", "Chiara"]


def test_the_head_cannot_change_once_sent_answered_or_split(api_client, admin_headers):
    head_id = _couple(api_client)
    luca_id = _row(api_client)["members"][0]["id"]

    # Someone already answered through the link.
    assert _rsvp(api_client, _token(_row(api_client)["invite_url"]), ["Chiara"]).status_code == 200
    assert api_client.post(f"/admin/invites/{head_id}/head", json={"new_head_id": luca_id}).status_code == 409

    other = _create(api_client, first_name="Gianni", last_name="Neri", phone="333 5555555").json()
    other_member = api_client.post(
        "/admin/invites",
        json={"first_name": "Rita", "last_name": "Neri", "head_id": other["id"], "relation": "spouse"},
    ).json()["members"][0]["id"]
    api_client.post(f"/admin/invites/{other['id']}/mark-sent")
    assert api_client.post(f"/admin/invites/{other['id']}/head", json={"new_head_id": other_member}).status_code == 409

    split = _create(api_client, first_name="Piero", last_name="Blu", phone="333 6666666").json()
    split_member = api_client.post(
        "/admin/invites",
        json={"first_name": "Lia", "last_name": "Blu", "head_id": split["id"], "relation": "partner"},
    ).json()["members"][0]["id"]
    api_client.post(f"/admin/invites/{split['id']}/individual")
    assert api_client.post(f"/admin/invites/{split['id']}/head", json={"new_head_id": split_member}).status_code == 409


def test_changing_the_head_to_someone_outside_the_group_is_not_found(api_client, admin_headers):
    head = _family(api_client)
    assert api_client.post(f"/admin/invites/{head['id']}/head", json={"new_head_id": head["id"]}).status_code == 404
    assert api_client.post(f"/admin/invites/{head['id']}/head", json={"new_head_id": 9999}).status_code == 404


# --- linking two people already in the table ----------------------------------------------------


def _two_singles(api_client):
    father = _create(api_client, first_name="Mario", last_name="Rossi", gender="m", phone="333 1111111", family_name="Rossi", party_size=3).json()
    mother = _create(api_client, first_name="Anna", last_name="Rossi", gender="f", phone="333 2222222", party_size=2).json()
    return father, mother


def _rows(api_client):
    return {row["first_name"]: row for row in api_client.get("/admin/invites").json()}


def test_linking_a_person_already_in_the_table_joins_them_to_the_group(api_client, admin_headers):
    father, mother = _two_singles(api_client)
    response = api_client.post(f"/admin/invites/{father['id']}/link", json={"person_id": mother["id"], "relation": "spouse"})
    assert response.status_code == 200

    rows = _rows(api_client)
    assert list(rows) == ["Mario"]  # Anna no longer has an invite of her own
    group = rows["Mario"]
    assert [(m["first_name"], m["relation"]) for m in group["members"]] == [("Anna", "spouse")]
    assert group["invite_url"] == father["invite_url"]
    assert (group["family_name"], group["party_size"]) == ("Rossi", 3)  # the head's, not Anna's
    assert group["greeting_kind"] == "family"
    # Anna's old link is gone.
    assert api_client.get(f"/invites/{_token(mother['invite_url'])}").status_code == 404


def test_linking_follows_the_group_rules(api_client, admin_headers):
    father, mother = _two_singles(api_client)
    third = _create(api_client, first_name="Gigi", last_name="Neri", phone="333 3333333").json()
    api_client.post(f"/admin/invites/{father['id']}/link", json={"person_id": mother["id"], "relation": "spouse"})
    # A second spouse, or a fiancé mixed into a family, is refused.
    assert api_client.post(f"/admin/invites/{father['id']}/link", json={"person_id": third["id"], "relation": "spouse"}).status_code == 422
    assert api_client.post(f"/admin/invites/{father['id']}/link", json={"person_id": third["id"], "relation": "partner"}).status_code == 422
    assert api_client.post(f"/admin/invites/{father['id']}/link", json={"person_id": third["id"], "relation": "child"}).status_code == 200


def test_linking_is_refused_for_yourself_members_and_unknown_people(api_client, admin_headers):
    father, mother = _two_singles(api_client)
    assert api_client.post(f"/admin/invites/{father['id']}/link", json={"person_id": father["id"], "relation": "spouse"}).status_code == 422
    assert api_client.post(f"/admin/invites/{father['id']}/link", json={"person_id": 9999, "relation": "spouse"}).status_code == 404
    assert api_client.post("/admin/invites/9999/link", json={"person_id": mother["id"], "relation": "spouse"}).status_code == 404

    # Someone who already has a group of their own can't be linked.
    api_client.post("/admin/invites", json={"first_name": "Teo", "last_name": "Rossi", "head_id": mother["id"], "relation": "child"})
    assert api_client.post(f"/admin/invites/{father['id']}/link", json={"person_id": mother["id"], "relation": "spouse"}).status_code == 422


def test_linking_is_refused_once_sent_or_answered(api_client, admin_headers):
    father, mother = _two_singles(api_client)
    api_client.post(f"/admin/invites/{mother['id']}/mark-sent")
    assert api_client.post(f"/admin/invites/{father['id']}/link", json={"person_id": mother["id"], "relation": "spouse"}).status_code == 409
    assert api_client.post(f"/admin/invites/{mother['id']}/link", json={"person_id": father["id"], "relation": "spouse"}).status_code == 409

    answered = _create(api_client, first_name="Ugo", last_name="Blu", phone="333 7777777").json()
    other = _create(api_client, first_name="Eva", last_name="Blu", phone="333 8888888").json()
    assert _rsvp(api_client, _token(answered["invite_url"]), ["Ugo"]).status_code == 200
    assert api_client.post(f"/admin/invites/{other['id']}/link", json={"person_id": answered["id"], "relation": "spouse"}).status_code == 409


def test_a_member_may_have_only_a_first_name_but_the_head_may_not(api_client, admin_headers):
    head = _create(api_client).json()
    ok = api_client.post("/admin/invites", json={"first_name": "Giovanni", "last_name": "", "head_id": head["id"], "relation": "partner"})
    assert ok.status_code == 201
    row = _row(api_client)
    assert row["greeting_kind"] == "couple" and row["greeting_names"] == ["Chiara", "Giovanni"]
    assert row["members"][0]["last_name"] == ""
    assert api_client.post("/admin/invites", json={"first_name": "Solo", "last_name": ""}).status_code in (400, 422)
    assert api_client.patch(f"/admin/invites/{head['id']}", json={"last_name": ""}).status_code in (400, 422)


def test_stats_count_invites_and_the_people_they_stand_for(api_client, admin_headers):
    solo = _create(api_client, first_name="Solo", last_name="Uno", phone="333 5550001").json()
    family = _create(api_client, first_name="Fam", last_name="Due", phone="333 5550002", party_size=4).json()
    couple = _couple(api_client)
    api_client.post(f"/admin/invites/{couple}/individual")
    api_client.post(f"/admin/invites/{family['id']}/mark-sent")

    invites = api_client.get("/admin/rsvp-stats").json()["invites"]
    assert invites["total"] == 4  # solo + family + the two of the individual couple
    assert invites["to_send"] == {"invites": 3, "persons": 3}
    assert invites["waiting"] == {"invites": 1, "persons": 4}
    assert invites["attending"]["invites"] == 0 and solo


def test_export_reads_back_through_the_import(api_client, admin_headers):
    _couple(api_client)
    csv_text = api_client.get("/admin/invites/export").text
    assert csv_text.splitlines()[0].startswith("first_name,last_name")
    assert "Luca,Verdi,m,partner,Chiara Bianchi" in csv_text
    report = api_client.post("/admin/invites/import", files={"file": ("x.csv", csv_text.encode(), "text/csv")}).json()
    assert report["created"] == 0 and len(report["skipped_duplicates"]) == 2
