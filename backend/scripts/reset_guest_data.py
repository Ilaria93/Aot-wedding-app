"""Wipe every guest-side record so the site starts clean: invites (heads and members), RSVPs and their
guest lines, guest accounts and their sessions, and the "request an invite" queue.

KEPT on purpose: the couple's admin account(s), the tables (seating plan), the logistics contacts and
the photo album.

Usage (from backend/, venv active). It targets whatever DATABASE_URL points to — local by default;
for production set DATABASE_URL to the Neon connection string in the shell, never in a file:

    python scripts/reset_guest_data.py                        # dry run: only prints what would go
    python scripts/reset_guest_data.py --apply --confirm-host <host shown by the dry run>

Deleting is final: there is no undo. Take a Neon branch/backup first if the data matters.
"""
import argparse
import importlib
import pkgutil
import sys
from pathlib import Path

# Allows running this script directly without installing the backend as a package.
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

import models  # noqa: E402

for _module in pkgutil.iter_modules(models.__path__):
    importlib.import_module(f"models.{_module.name}")

from database.base import SessionLocal, engine  # noqa: E402
from models.invite_link_model import InviteLink  # noqa: E402
from models.invite_request_model import InviteRequest  # noqa: E402
from models.refresh_token_session_model import RefreshTokenSession  # noqa: E402
from models.rsvp_guest_model import RsvpGuest  # noqa: E402
from models.rsvp_model import RSVP  # noqa: E402
from models.user_model import User  # noqa: E402
from schemas.auth_schema import UserRoleEnum  # noqa: E402


def reset_guest_data(db, apply: bool) -> dict[str, int]:
    """Counts what is (or, with apply, was) deleted, in foreign-key order. Commits only when apply is True."""
    guest_ids = [row[0] for row in db.query(User.id).filter(User.role == UserRoleEnum.user.value).all()]
    steps = [
        ("rsvp_guests", db.query(RsvpGuest)),
        ("rsvps", db.query(RSVP)),
        ("invite_links", db.query(InviteLink)),
        ("invite_requests", db.query(InviteRequest)),
        ("guest_sessions", db.query(RefreshTokenSession).filter(RefreshTokenSession.user_id.in_(guest_ids))),
        ("guest_users", db.query(User).filter(User.id.in_(guest_ids))),
    ]
    counts: dict[str, int] = {}
    for name, query in steps:
        counts[name] = query.count()
        if apply:
            query.delete(synchronize_session=False)
    if apply:
        db.commit()
    else:
        db.rollback()
    return counts


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument("--apply", action="store_true", help="really delete (default: dry run)")
    parser.add_argument("--confirm-host", help="the database host printed by the dry run, to prove you meant this one")
    args = parser.parse_args()

    host = engine.url.host
    print(f"Database: {engine.url.database} on {host}")
    if args.apply and args.confirm_host != host:
        sys.exit(f"Refusing to delete: pass --confirm-host {host} to confirm this is the right database.")

    db = SessionLocal()
    try:
        counts = reset_guest_data(db, apply=args.apply)
    finally:
        db.close()
    verb = "Deleted" if args.apply else "Would delete (dry run)"
    print(verb + ":")
    for name, count in counts.items():
        print(f"  {name:16} {count}")
    if not args.apply:
        print(f"Nothing changed. To delete: python scripts/reset_guest_data.py --apply --confirm-host {host}")


if __name__ == "__main__":
    main()
