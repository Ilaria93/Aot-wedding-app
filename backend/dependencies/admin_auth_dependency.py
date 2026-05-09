from typing import Optional

from fastapi import Header, HTTPException, status

from settings import read_admin_api_key


# Ensures callers send the same ADMIN_API_KEY as configured on the server.
def require_admin_api_key(x_admin_api_key: Optional[str] = Header(default=None)):
    configured_key = read_admin_api_key()
    if not configured_key:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="ADMIN_API_KEY is not configured on this server.",
        )

    provided = (x_admin_api_key or "").strip()
    if not provided:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing admin API key (send header X-Admin-Api-Key).",
        )
    if provided != configured_key:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid admin API key.",
        )
