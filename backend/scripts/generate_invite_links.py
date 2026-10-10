"""Import the guest list from a CSV and print the invite links.

Usage (from the backend/ folder, with the venv active):

    python scripts/generate_invite_links.py invitati.csv
    python scripts/generate_invite_links.py invitati.csv --base-url https://aot-wedding.it

CSV format (header required; only first_name and last_name are mandatory):

    first_name,last_name,gender,relation,head,family_name,phone,party_size
    Christian,Rossi,m,,,Rossi,+39 333 1111111,5
    Arianna,Rossi,f,spouse,Christian Rossi,,+39 333 2222222,
    Matteo,Rossi,m,child,Christian Rossi,,,
    Chiara,Bianchi,f,,,,+39 333 3333333,2
    Luca,Verdi,m,partner,Chiara Bianchi,,+39 333 4444444,

A row without `head` is a head: the person who receives the invite, with a
personal link. A row with `head` ("Name Surname" of a head in the file or
already in the table) and a `relation` (spouse, partner, child, other) is
linked to that head and has no link of its own. A group is either a family
(spouse/children) or partners, never both. `gender` is m or f. `party_size`
pre-fills the max guest count of the head's RSVP form.

People already in the table (same name or same phone) are skipped, so the same
file can be loaded again with new rows at the bottom. Writes
<file>_output.csv next to the input with a link for every new head.

The same import is available in the admin panel (Inviti > Importa CSV); a
guest's account is created lazily on their first confirmation (see
services/guest_access_service.py).
"""
import csv
import sys
from pathlib import Path

# Allows running this script directly (`python scripts/generate_invite_links.py`)
# without installing the backend as a package.
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from database.base import SessionLocal  # noqa: E402
# Relationships resolve their targets by class name when SQLAlchemy configures
# the mappers (InviteLink.user, RSVP.guests, RSVP.table). These imports make
# sure every model is registered even though nothing here uses them directly.
from models.rsvp_guest_model import RsvpGuest  # noqa: E402,F401
from models.rsvp_model import RSVP  # noqa: E402,F401
from models.user_model import User  # noqa: E402,F401
from models.wedding_table_model import WeddingTable  # noqa: E402,F401
from services.invite_import_service import ImportFileError, import_invites, parse_csv  # noqa: E402

DEFAULT_BASE_URL = "http://localhost:5173"


def main() -> None:
    if len(sys.argv) < 2:
        print(__doc__)
        sys.exit(1)

    input_path = Path(sys.argv[1])
    base_url = DEFAULT_BASE_URL
    if "--base-url" in sys.argv:
        base_url = sys.argv[sys.argv.index("--base-url") + 1]
    base_url = base_url.rstrip("/")

    if base_url == DEFAULT_BASE_URL:
        print(f"Attenzione: nessun --base-url passato, uso il default di sviluppo ({DEFAULT_BASE_URL}).")
        print("Per i link da mandare su WhatsApp usa --base-url https://tuosito.it\n")

    if not input_path.exists():
        print(f"File non trovato: {input_path}")
        sys.exit(1)

    db = SessionLocal()
    try:
        try:
            rows = parse_csv(input_path.read_bytes())
        except ImportFileError as error:
            print(f"File non valido: {error}")
            sys.exit(1)
        report, heads = import_invites(db, rows)
        output_rows = [
            {
                "first_name": head.first_name,
                "last_name": head.last_name,
                "phone": head.phone or "",
                "party_size": head.party_size or "",
                "token": head.token,
                "link": f"{base_url}/invito/{head.token}",
            }
            for head in heads
        ]
    finally:
        db.close()

    for row in output_rows:
        print(f"{row['first_name']} {row['last_name']} -> {row['link']}")
    for name in report.skipped_duplicates:
        print(f"Già in tabella, saltato: {name}")
    for error in report.errors:
        print(f"Riga {error.row} non importata: {error.reason}")

    if output_rows:
        output_path = input_path.with_name(f"{input_path.stem}_output.csv")
        with output_path.open("w", newline="", encoding="utf-8") as out_file:
            writer = csv.DictWriter(
                out_file, fieldnames=["first_name", "last_name", "phone", "party_size", "token", "link"]
            )
            writer.writeheader()
            writer.writerows(output_rows)
        print(f"\n{len(output_rows)} link generati. Salvati anche in: {output_path}")
    print(f"{report.created} persone create, {len(report.skipped_duplicates)} saltate, {len(report.errors)} errori.")


if __name__ == "__main__":
    main()
