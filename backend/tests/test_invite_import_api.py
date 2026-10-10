import io

from database.base import SessionLocal
from models.invite_link_model import InviteLink
from services.invite_import_service import ImportFileError, import_invites, parse_csv

HEADER = "first_name,last_name,gender,relation,head,family_name,phone,party_size\n"

FILE = HEADER + (
    "Matteo,Rossi,m,child,Christian Rossi,,,\n"
    "Christian,Rossi,m,,,Rossi,+39 333 1111111,5\n"
    "Arianna,Rossi,f,spouse,Christian Rossi,,333 2222222,\n"
    "Chiara,Bianchi,f,,,,333 3333333,2\n"
    "Luca,Verdi,m,partner,Chiara Bianchi,,333 4444444,\n"
    "Anna,Neri,f,,,,,\n"
)


def _upload(api_client, content: str):
    return api_client.post("/admin/invites/import", files={"file": ("invitati.csv", io.BytesIO(content.encode("utf-8")), "text/csv")})


def test_requires_admin(api_client, user_headers):
    assert _upload(api_client, FILE).status_code == 403


def test_import_creates_heads_and_linked_people_in_any_order(api_client, admin_headers):
    response = _upload(api_client, FILE)
    assert response.status_code == 200
    assert response.json() == {"created": 6, "skipped_duplicates": [], "errors": []}

    rows = {row["first_name"]: row for row in api_client.get("/admin/invites").json()}
    assert set(rows) == {"Christian", "Chiara", "Anna"}
    assert rows["Christian"]["greeting_kind"] == "family"
    assert rows["Christian"]["party_size"] == 5
    assert sorted(m["first_name"] for m in rows["Christian"]["members"]) == ["Arianna", "Matteo"]
    assert rows["Chiara"]["greeting_name"] == "Chiara e Luca"
    assert rows["Anna"]["greeting_kind"] == "single_f"
    assert rows["Christian"]["phone"] == "+393331111111"


def test_loading_the_same_file_twice_creates_nothing(api_client, admin_headers):
    _upload(api_client, FILE)
    second = _upload(api_client, FILE).json()
    assert second["created"] == 0
    assert len(second["skipped_duplicates"]) == 6
    assert second["errors"] == []
    db = SessionLocal()
    try:
        assert db.query(InviteLink).count() == 6
    finally:
        db.close()


def test_row_errors_are_reported_with_their_line(api_client, admin_headers):
    content = HEADER + (
        "Christian,Rossi,m,,,,333 1111111,\n"          # 2 ok
        "Arianna,Rossi,f,spouse,Nessuno Qui,,,\n"       # 3 head not found
        "Matteo,Rossi,x,child,Christian Rossi,,,\n"     # 4 bad gender
        "Giulia,Rossi,f,sorella,Christian Rossi,,,\n"   # 5 unknown relation
        "Paolo,Rossi,m,,Christian Rossi,,,\n"           # 6 head without relation
        "Sara,Rossi,f,spouse,,,,\n"                     # 7 relation without head
        "Teo,Rossi,m,,,,abc,\n"                         # 8 bad phone
        "Ugo,Rossi,m,,,,,tre\n"                         # 9 bad party size
        ",Rossi,m,,,,,\n"                               # 10 missing first name
        "Luca,Verdi,m,partner,Christian Rossi,,,\n"     # 11 ok (partner of Christian)
        "Eva,Verdi,f,child,Christian Rossi,,,\n"        # 12 family + partner mix
    )
    report = _upload(api_client, content).json()
    assert report["created"] == 2
    by_row = {error["row"]: error["reason"] for error in report["errors"]}
    assert set(by_row) == {3, 4, 5, 6, 7, 8, 9, 10, 12}
    assert "not found" in by_row[3]
    assert "Gender" in by_row[4]
    assert "Unknown relation" in by_row[5]
    assert "needs a relation" in by_row[6]
    assert "needs a head" in by_row[7]


def test_same_name_twice_in_a_file_is_skipped(api_client, admin_headers):
    content = HEADER + (
        "Mario,Rossi,m,,,,333 1111111,\n"
        "Mario,Rossi,m,,,,333 2222222,\n"
        "Anna,Rossi,f,spouse,Mario Rossi,,,\n"
    )
    report = _upload(api_client, content).json()
    # The second Mario shares the name with the first: skipped as a duplicate.
    assert report["skipped_duplicates"] == ["Mario Rossi"]
    assert report["created"] == 2
    assert report["errors"] == []


def test_ambiguous_head_is_an_error(api_client, admin_headers):
    for phone in ("333 1111111", "333 2222222"):
        api_client.post(
            "/admin/invites?confirm_duplicate=true",
            json={"first_name": "Mario", "last_name": "Rossi", "phone": phone},
        )
    report = _upload(api_client, HEADER + "Anna,Rossi,f,spouse,Mario Rossi,,,\n").json()
    assert report["created"] == 0
    assert "more than one" in report["errors"][0]["reason"]


def test_semicolon_separator_and_bom(api_client, admin_headers):
    content = "﻿" + HEADER.replace(",", ";") + "Anna;Neri;f;;;;333 5555555;\n"
    response = api_client.post("/admin/invites/import", files={"file": ("a.csv", io.BytesIO(content.encode("utf-8")), "text/csv")})
    assert response.json()["created"] == 1


def test_invalid_files_are_rejected(api_client, admin_headers):
    assert _upload(api_client, "").status_code == 422
    assert _upload(api_client, "nome,cognome\nA,B\n").status_code == 422
    big = api_client.post("/admin/invites/import", files={"file": ("a.csv", io.BytesIO(b"x" * 1_000_001), "text/csv")})
    assert big.status_code == 413


def test_parse_csv_rejects_bad_files():
    for raw in (b"", b"\xff\xfe\x00", b"a,b\n1,2\n"):
        try:
            parse_csv(raw)
        except ImportFileError:
            continue
        raise AssertionError(f"{raw!r} should be rejected")


def test_import_returns_created_heads_for_the_script(api_client, admin_headers):
    db = SessionLocal()
    try:
        report, heads = import_invites(db, parse_csv(FILE.encode("utf-8")))
        assert report.created == 6
        assert sorted(head.first_name for head in heads) == ["Anna", "Chiara", "Christian"]
        assert all(head.token for head in heads)
        assert all(member.token is None for head in heads for member in head.members)
    finally:
        db.close()


LEGEND = (
    "COLONNA,OBBLIGATORIO,VALORI ACCETTATI\n"
    "first_name,sì,testo\n"
    "relation,no,\"spouse, partner, child, other\"\n"
    "\n"
)


def test_legend_above_the_header_is_ignored_and_errors_use_file_lines(api_client, admin_headers):
    content = LEGEND + HEADER + "Anna,Neri,f,,,,,\n,Rossi,m,,,,,\nPaolo,Verdi,m,,,,,\n"
    report = _upload(api_client, content).json()
    assert report["created"] == 2
    # The header is on line 5, so the nameless row is on line 7.
    assert [error["row"] for error in report["errors"]] == [7]


def test_extra_columns_are_ignored(api_client, admin_headers):
    content = HEADER.strip() + ",riga_excel,da_controllare\nAnna,Neri,f,,,,,,12,una nota\n"
    assert _upload(api_client, content).json() == {"created": 1, "skipped_duplicates": [], "errors": []}


def test_a_file_with_only_a_legend_is_rejected(api_client, admin_headers):
    assert _upload(api_client, LEGEND).status_code == 422
