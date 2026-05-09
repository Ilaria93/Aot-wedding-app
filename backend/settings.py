import os

from dotenv import load_dotenv

load_dotenv()


def read_admin_api_key() -> str:
    """Loads the secret used to authorize admin endpoints and invitation creation."""
    return os.getenv("ADMIN_API_KEY", "").strip()


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
