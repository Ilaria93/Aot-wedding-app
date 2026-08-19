from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from routes.auth_route import router as auth_router
from routes.admin_logistics_contact_route import router as admin_logistics_contact_router
from routes.invite_link_route import router as invite_link_router
from routes.logistics_contact_route import router as logistics_contact_router
from routes.photo_album_route import router as photo_album_router
from routes.rsvp_confirmation_route import router as rsvp_router
from routes.admin_user_list_route import router as admin_user_router
from services.auth_service import AuthConfigError
from settings import read_cors_allow_origins

app = FastAPI(
    title="AOT Wedding API",
    swagger_ui_parameters={"persistAuthorization": True},
)


# Server misconfiguration (e.g. missing JWT_SECRET_KEY) is identical across every auth
# endpoint, so it is handled once here instead of a repeated try/except per route.
@app.exception_handler(AuthConfigError)
def handle_auth_config_error(request: Request, error: AuthConfigError) -> JSONResponse:
    return JSONResponse(status_code=503, content={"detail": str(error)})

cors_origins = read_cors_allow_origins()
_open_cors = cors_origins == ["*"]

app.add_middleware(
    CORSMiddleware,
    allow_origins=cors_origins,
    allow_credentials=not _open_cors,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/health")
def health():
    return {"status": "ok"}

app.include_router(rsvp_router)
app.include_router(admin_user_router)
app.include_router(auth_router)
app.include_router(photo_album_router)
app.include_router(logistics_contact_router)
app.include_router(admin_logistics_contact_router)
app.include_router(invite_link_router)
