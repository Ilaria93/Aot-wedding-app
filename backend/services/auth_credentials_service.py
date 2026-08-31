import hashlib
import hmac
import secrets
from typing import Optional

PASSWORD_HASH_ITERATIONS = 390000


def normalize_email(email: str) -> str:
    return email.strip().lower()


def _build_password_hash(password: str, salt: str, iterations: int) -> str:
    digest = hashlib.pbkdf2_hmac("sha256", password.encode("utf-8"), salt.encode("utf-8"), iterations)
    return digest.hex()


def hash_password(password: str) -> str:
    salt = secrets.token_hex(16)
    digest = _build_password_hash(password, salt, PASSWORD_HASH_ITERATIONS)
    return f"pbkdf2_sha256${PASSWORD_HASH_ITERATIONS}${salt}${digest}"


def verify_password(password: str, stored_password_hash: Optional[str]) -> bool:
    # Passwordless guest accounts (WhatsApp invite flow) store NULL here — they
    # can never authenticate by password, but must fail as plain bad credentials
    # rather than crashing, or the 500-vs-401 split leaks which emails are guests.
    if not stored_password_hash:
        return False
    try:
        algorithm, iterations, salt, digest = stored_password_hash.split("$", 3)
        if algorithm != "pbkdf2_sha256":
            return False
        expected_digest = _build_password_hash(password, salt, int(iterations))
        return hmac.compare_digest(expected_digest, digest)
    except ValueError:
        return False
