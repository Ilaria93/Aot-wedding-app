from fastapi import FastAPI
from database.base import Base, engine

# Imports models so SQLAlchemy can create tables at startup.
from models import guest_model, rsvp_model  # noqa: F401
from routes.guest_lookup_route import router as guest_router
from routes.rsvp_confirmation_route import router as rsvp_router
from routes.admin_guest_list_route import router as admin_guest_router

app = FastAPI()

@app.on_event("startup")
def startup():
    Base.metadata.create_all(bind=engine)

@app.get("/health")
def health():
    return {"status": "ok"}

app.include_router(guest_router)
app.include_router(rsvp_router)
app.include_router(admin_guest_router)