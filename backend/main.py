from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from routes.auth_route import router as auth_router
from routes.admin_logistics_contact_route import router as admin_logistics_contact_router
from routes.guest_lookup_route import router as guest_router
from routes.logistics_contact_route import router as logistics_contact_router
from routes.admin_photo_album_route import router as admin_photo_album_router
from routes.photo_album_route import router as photo_album_router
from routes.rsvp_confirmation_route import router as rsvp_router
from routes.admin_guest_list_route import router as admin_guest_router
from settings import read_cors_allow_origins

app = FastAPI(
    title="AOT Wedding API",
    swagger_ui_parameters={"persistAuthorization": True},
)

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

app.include_router(guest_router)
app.include_router(rsvp_router)
app.include_router(admin_guest_router)
app.include_router(auth_router)
app.include_router(photo_album_router)
app.include_router(admin_photo_album_router)
app.include_router(logistics_contact_router)
app.include_router(admin_logistics_contact_router)