from fastapi import Response

from schemas.auth_schema import AuthSessionResponse
from settings import read_cookie_secure

ACCESS_TOKEN_COOKIE = "access_token"
REFRESH_TOKEN_COOKIE = "refresh_token"


# Puts both JWTs in httpOnly cookies instead of the JSON body — the browser
# sends them back automatically, and client-side JS can never read them.
def set_auth_cookies(response: Response, session: AuthSessionResponse) -> None:
    secure = read_cookie_secure()
    # Frontend and backend live on different domains in production (Vercel +
    # Render), so the browser only attaches the cookie to those cross-site
    # fetch calls when SameSite=None — which itself requires Secure. Locally
    # both run on "localhost" (same site, different port), where Lax already
    # works and Secure would require https.
    samesite = "none" if secure else "lax"
    response.set_cookie(
        ACCESS_TOKEN_COOKIE,
        session.access_token,
        max_age=session.access_token_expires_in_seconds,
        httponly=True,
        secure=secure,
        samesite=samesite,
        path="/",
    )
    response.set_cookie(
        REFRESH_TOKEN_COOKIE,
        session.refresh_token,
        max_age=session.refresh_token_expires_in_seconds,
        httponly=True,
        secure=secure,
        samesite=samesite,
        path="/",
    )


def clear_auth_cookies(response: Response) -> None:
    response.delete_cookie(ACCESS_TOKEN_COOKIE, path="/")
    response.delete_cookie(REFRESH_TOKEN_COOKIE, path="/")
