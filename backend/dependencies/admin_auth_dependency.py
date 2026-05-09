from typing import Annotated, Optional

from fastapi import HTTPException, Security, status
from fastapi.security import APIKeyHeader

from settings import read_admin_api_key

# Declared for OpenAPI so Swagger shows "Authorize" for this header.
admin_api_key_scheme = APIKeyHeader(
    name="X-Admin-Api-Key",
    auto_error=False,
    description="Must match the server's ADMIN_API_KEY environment variable.",
)


# Ensures callers send the same ADMIN_API_KEY as configured on the server.
def require_admin_api_key(
    api_key: Annotated[Optional[str], Security(admin_api_key_scheme)],
):
    configured_key = read_admin_api_key()
    if not configured_key:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="ADMIN_API_KEY is not configured on this server.",
        )

    provided = (api_key or "").strip()
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
