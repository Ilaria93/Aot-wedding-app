"""Log lines that explain why a session cookie did or didn't arrive.

Never logs a token or a cookie value — only which cookies came with the
request, plus the headers that say whether the browser treated the call as
cross-site (the usual reason a cookie gets dropped).
"""
import logging

from fastapi import Request

from settings import read_cookie_secure, read_cors_allow_origins

# uvicorn's own logger, so the lines show up in Render's log stream.
logger = logging.getLogger("uvicorn.error")


def describe_request(request: Request) -> str:
    headers = request.headers
    return (
        f"{request.method} {request.url.path} "
        f"origin={headers.get('origin')} "
        f"sec-fetch-site={headers.get('sec-fetch-site')} "
        f"cookies={sorted(request.cookies.keys())} "
        f"proto={headers.get('x-forwarded-proto')} "
        f"ua={(headers.get('user-agent') or '')[:120]}"
    )


def log_auth_event(event: str, request: Request, level: int = logging.INFO) -> None:
    logger.log(level, "[auth] %s | %s", event, describe_request(request))


def log_auth_config() -> None:
    secure = read_cookie_secure()
    logger.info(
        "[auth] cookie_secure=%s samesite=%s cors_origins=%s",
        secure,
        "none" if secure else "lax",
        read_cors_allow_origins(),
    )
