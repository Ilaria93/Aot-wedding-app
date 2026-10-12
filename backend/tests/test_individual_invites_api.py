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
