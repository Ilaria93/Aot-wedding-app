import os

from dotenv import load_dotenv

load_dotenv()

DEFAULT_DATABASE_URL = "postgresql+psycopg://postgres:postgres@127.0.0.1:5432/aot_wedding_app"
DEFAULT_TEST_DATABASE_URL = "postgresql+psycopg://postgres:postgres@127.0.0.1:5432/aot_wedding_app_test"


def read_database_url() -> str:
    """Primary database used by the FastAPI app."""
    return os.getenv("DATABASE_URL", DEFAULT_DATABASE_URL).strip()


def read_test_database_url() -> str:
    """Dedicated database used by automated tests."""
    return os.getenv("TEST_DATABASE_URL", DEFAULT_TEST_DATABASE_URL).strip()


def read_jwt_secret_key() -> str:
    """Secret used to sign access and refresh JWT tokens."""
    return os.getenv("JWT_SECRET_KEY", "").strip()


def read_access_token_expiration_minutes() -> int:
    """Short-lived access token lifetime in minutes."""
    raw_value = os.getenv("ACCESS_TOKEN_EXPIRES_MINUTES", "30").strip()
    try:
        return max(5, int(raw_value))
    except ValueError:
        return 30


def read_refresh_token_expiration_days() -> int:
    """Persistent refresh token lifetime in days for remembered sessions."""
    raw_value = os.getenv("REFRESH_TOKEN_EXPIRES_DAYS", "30").strip()
    try:
        return max(1, int(raw_value))
    except ValueError:
        return 30


def read_short_refresh_token_expiration_hours() -> int:
    """Refresh token lifetime for sessions that should not stay connected for long."""
    raw_value = os.getenv("SHORT_SESSION_REFRESH_TOKEN_EXPIRES_HOURS", "24").strip()
    try:
        return max(1, int(raw_value))
    except ValueError:
        return 24


def read_cors_allow_origins() -> list[str]:
    """Comma-separated origins for browser clients. '*' allows any origin."""
    raw = os.getenv("CORS_ALLOW_ORIGINS", "").strip()
    if raw == "*":
        return ["*"]
    if raw:
        return [origin.strip() for origin in raw.split(",") if origin.strip()]
    return [
        "http://localhost:5173",
        "http://localhost:8081",
        "http://127.0.0.1:5173",
        "http://127.0.0.1:8081",
        "http://localhost:19006",
        "http://127.0.0.1:19006",
    ]


def read_s3_bucket_name() -> str:
    """Bucket used for wedding photo uploads."""
    return os.getenv("S3_BUCKET_NAME", "").strip()


def read_s3_region() -> str:
    """Region used to sign S3-compatible uploads."""
    return os.getenv("S3_REGION", "eu-central-1").strip()


def read_s3_access_key_id() -> str:
    """Access key used for server-side S3 signing."""
    return os.getenv("S3_ACCESS_KEY_ID", "").strip()


def read_s3_secret_access_key() -> str:
    """Secret key used for server-side S3 signing."""
    return os.getenv("S3_SECRET_ACCESS_KEY", "").strip()


def read_s3_endpoint_url() -> str:
    """Optional custom endpoint for S3-compatible providers."""
    return os.getenv("S3_ENDPOINT_URL", "").strip()


def read_s3_public_base_url() -> str:
    """Optional public CDN/base URL used to render uploaded photos."""
    return os.getenv("S3_PUBLIC_BASE_URL", "").strip().rstrip("/")


def read_photo_upload_expiration_seconds() -> int:
    """How long a presigned upload URL remains valid."""
    raw_value = os.getenv("PHOTO_UPLOAD_URL_EXPIRES_SECONDS", "900").strip()
    try:
        return max(60, int(raw_value))
    except ValueError:
        return 900


def read_photo_max_upload_bytes() -> int:
    """Maximum accepted photo size for guest uploads."""
    raw_value = os.getenv("PHOTO_MAX_UPLOAD_BYTES", str(10 * 1024 * 1024)).strip()
    try:
        return max(1024, int(raw_value))
    except ValueError:
        return 10 * 1024 * 1024
