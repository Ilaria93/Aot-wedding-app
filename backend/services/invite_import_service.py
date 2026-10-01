import csv
import io
from typing import Optional

from sqlalchemy import func
from sqlalchemy.orm import Session

from models.invite_link_model import InviteLink
from schemas.admin_invite_schema import AdminInviteCreate, ImportReport, ImportRowError
from services.admin_invite_service import (
    InvalidInviteError,
    InviteLockedError,
    InviteNotFoundError,
    create_person,
    find_matches,
)

MAX_ROWS = 1000
EXPECTED_COLUMNS = ("first_name", "last_name", "gender", "relation", "head", "family_name", "phone", "party_size")

# Italian spellings accepted next to the canonical values.
_RELATIONS = {
    "spouse": "spouse", "coniuge": "spouse", "moglie": "spouse", "marito": "spouse",
    "partner": "partner", "fidanzato": "partner", "fidanzata": "partner",
    "child": "child", "figlio": "child", "figlia": "child",
    "other": "other", "altro": "other",
}


class ImportFileError(Exception):
    pass


def parse_csv(raw: bytes) -> list[dict[str, str]]:
    """Rows of a guest-list CSV. Accepts a UTF-8 BOM (Excel) and `,` or `;`
    as separator; header names are matched case-insensitively."""
    try:
        text = raw.decode("utf-8-sig")
    except UnicodeDecodeError as error:
        raise ImportFileError("The file must be UTF-8 encoded.") from error
    header = text.split("\n", 1)[0]
    delimiter = ";" if header.count(";") > header.count(",") else ","
    reader = csv.DictReader(io.StringIO(text), delimiter=delimiter)
    if not reader.fieldnames:
        raise ImportFileError("The file is empty.")
    fields = {(name or "").strip().lower() for name in reader.fieldnames}
    if not {"first_name", "last_name"} <= fields:
        raise ImportFileError("The header must contain first_name and last_name.")
    rows = [
        {(key or "").strip().lower(): (value or "").strip() for key, value in row.items() if key}
        for row in reader
    ]
    if len(rows) > MAX_ROWS:
        raise ImportFileError(f"Too many rows (max {MAX_ROWS}).")
    return rows


def _label(row: dict[str, str]) -> str:
    return f"{row.get('first_name', '')} {row.get('last_name', '')}".strip()


def _resolve_head(db: Session, reference: str) -> InviteLink:
    wanted = " ".join(reference.lower().split())
    heads = (
        db.query(InviteLink)
        .filter(
            InviteLink.head_id.is_(None),
            func.lower(InviteLink.first_name + " " + InviteLink.last_name) == wanted,
        )
        .all()
    )
    if not heads:
        raise InvalidInviteError(f'Head "{reference}" not found.')
    if len(heads) > 1:
        raise InvalidInviteError(f'Head "{reference}" matches more than one person.')
    return heads[0]


def _build_payload(row: dict[str, str], head_id: Optional[int]) -> AdminInviteCreate:
    gender = row.get("gender", "").lower() or None
    if gender not in (None, "m", "f"):
        raise InvalidInviteError('Gender must be "m" or "f".')
    raw_size = row.get("party_size", "")
    if raw_size and not raw_size.isdigit():
        raise InvalidInviteError("party_size must be a number.")
    relation = _RELATIONS[row["relation"].lower()] if row.get("relation") else None
    return AdminInviteCreate(
        first_name=row.get("first_name", ""),
        last_name=row.get("last_name", ""),
        gender=gender,
        phone=row.get("phone") or None,
        head_id=head_id,
        relation=relation,
        family_name=row.get("family_name") or None,
        party_size=int(raw_size) if raw_size else None,
    )


def import_invites(db: Session, rows: list[dict[str, str]]) -> tuple[ImportReport, list[InviteLink]]:
    """Creates heads first, then the people linked to them, so row order does
    not matter. People already in the table (same name or phone) are skipped,
    so the same file can be loaded again. Returns the report and the heads
    created."""
    errors: list[ImportRowError] = []
    skipped: list[str] = []
    created_heads: list[InviteLink] = []
    created = 0

    def fail(number: int, reason: str) -> None:
        errors.append(ImportRowError(row=number, reason=reason))

    def add(number: int, row: dict[str, str], head: Optional[InviteLink]) -> Optional[InviteLink]:
        try:
            payload = _build_payload(row, head.id if head else None)
            if find_matches(db, payload.first_name, payload.last_name, payload.phone):
                skipped.append(_label(row))
                return None
            return create_person(db, payload, confirm_duplicate=True)
        except (InvalidInviteError, InviteLockedError, InviteNotFoundError, ValueError) as error:
            fail(number, _error_text(error))
            return None

    numbered = list(enumerate(rows, start=2))  # row 1 is the header
    for number, row in numbered:
        if row.get("relation") or not row.get("head"):
            continue
        fail(number, "A person with a head needs a relation.")
    for number, row in numbered:
        if row.get("relation") or row.get("head"):
            continue
        person = add(number, row, None)
        if person:
            created += 1
            created_heads.append(person)
    for number, row in numbered:
        if not row.get("relation"):
            continue  # a head, or a row already reported above
        if not row.get("head"):
            fail(number, "A relation needs a head (Name Surname).")
            continue
        if row["relation"].lower() not in _RELATIONS:
            fail(number, f'Unknown relation "{row["relation"]}".')
            continue
        try:
            head = _resolve_head(db, row["head"])
        except InvalidInviteError as error:
            fail(number, str(error))
            continue
        if add(number, row, head):
            created += 1

    errors.sort(key=lambda error: error.row)
    return ImportReport(created=created, skipped_duplicates=skipped, errors=errors), created_heads


def _error_text(error: Exception) -> str:
    if isinstance(error, ValueError) and hasattr(error, "errors"):
        first = error.errors()[0]  # pydantic ValidationError
        return f"{first['loc'][-1]}: {first['msg']}" if first.get("loc") else first["msg"]
    return str(error)
