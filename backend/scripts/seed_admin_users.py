"""One-off script: create or reset admin (sposi) accounts directly in the DB.

There is no public registration endpoint — this is the only way an admin
account is created. Run from the backend/ folder, with the venv active:

    python scripts/seed_admin_users.py "Ilaria" "Rossi" ilaria@example.com
    python scripts/seed_admin_users.py "Davide" "Bianchi" davide@example.com

Generates a random password, hashes it, and either creates the account or
resets the password on an existing one with that email. Prints the plaintext
password once — it is never stored anywhere, write it down immediately.
"""
import secrets
import sys
from datetime import datetime
from pathlib import Path

# Allows running this script directly (`python scripts/seed_admin_users.py`)
# without installing the backend as a package.
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from database.base import SessionLocal  # noqa: E402
from models.user_model import User  # noqa: E402
from services.auth_credentials_service import hash_password, normalize_email  # noqa: E402


def main() -> None:
    if len(sys.argv) != 4:
        print(__doc__)
        sys.exit(1)

    first_name, last_name, email = sys.argv[1], sys.argv[2], sys.argv[3]
    normalized_email = normalize_email(email)
    password = secrets.token_urlsafe(12)

    db = SessionLocal()
    try:
        user = db.query(User).filter(User.email == normalized_email).first()
        if user:
            user.password_hash = hash_password(password)
            user.role = "admin"
            action = "Password reset for"
        else:
            user = User(
                first_name=first_name.strip(),
                last_name=last_name.strip(),
                email=normalized_email,
                password_hash=hash_password(password),
                role="admin",
                created_at=datetime.utcnow(),
            )
            db.add(user)
            action = "Created admin"
        db.commit()
    finally:
        db.close()

    print(f"{action} {normalized_email}")
    print(f"Password: {password}")
    print("Write this down now — it will not be shown again.")


if __name__ == "__main__":
    main()
