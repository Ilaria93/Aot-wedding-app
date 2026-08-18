"""One-off script: generate WhatsApp invite links from a CSV of names.

Usage (from the backend/ folder, with the venv active):

    python scripts/generate_invite_links.py invitati.csv
    python scripts/generate_invite_links.py invitati.csv --base-url https://aot-wedding.it

CSV format (header required):

    first_name,last_name
    Ilaria,Rossi
    Famiglia,Bianchi

For each row: generates a random, unguessable token, saves it in the
invite_links table, and prints the ready-to-paste WhatsApp link. Also writes
invitati_output.csv next to the input file with the same rows plus the
generated token and link, so nothing gets lost.

This script only ever creates rows — it does not touch users, RSVPs, or
authentication in any way (see docs/PRODUCT_DECISIONS.md §8: passwordless
login is explicitly out of scope for this phase; this is display-only).
"""
import csv
import secrets
import sys
from datetime import datetime
from pathlib import Path

# Allows running this script directly (`python scripts/generate_invite_links.py`)
# without installing the backend as a package.
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from database.base import SessionLocal  # noqa: E402
from models.invite_link_model import InviteLink  # noqa: E402

DEFAULT_BASE_URL = "http://127.0.0.1:5173"
TOKEN_BYTES = 12  # secrets.token_urlsafe(12) -> 16 chars, 96 bits of entropy


def generate_unique_token(db) -> str:
    for _ in range(5):
        token = secrets.token_urlsafe(TOKEN_BYTES)
        if not db.query(InviteLink).filter(InviteLink.token == token).first():
            return token
    raise RuntimeError("Could not generate a unique token after 5 attempts.")


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

    output_rows = []
    db = SessionLocal()
    try:
        with input_path.open(newline="", encoding="utf-8") as csv_file:
            reader = csv.DictReader(csv_file)
            for row in reader:
                first_name = (row.get("first_name") or "").strip()
                last_name = (row.get("last_name") or "").strip()
                if not first_name or not last_name:
                    print(f"Riga saltata (nome o cognome vuoto): {row}")
                    continue

                token = generate_unique_token(db)
                db.add(
                    InviteLink(
                        token=token,
                        first_name=first_name,
                        last_name=last_name,
                        created_at=datetime.utcnow(),
                    )
                )
                db.commit()

                link = f"{base_url}/invito/{token}"
                print(f"{first_name} {last_name} -> {link}")
                output_rows.append(
                    {"first_name": first_name, "last_name": last_name, "token": token, "link": link}
                )
    finally:
        db.close()

    if output_rows:
        output_path = input_path.with_name(f"{input_path.stem}_output.csv")
        with output_path.open("w", newline="", encoding="utf-8") as out_file:
            writer = csv.DictWriter(out_file, fieldnames=["first_name", "last_name", "token", "link"])
            writer.writeheader()
            writer.writerows(output_rows)
        print(f"\n{len(output_rows)} link generati. Salvati anche in: {output_path}")


if __name__ == "__main__":
    main()
