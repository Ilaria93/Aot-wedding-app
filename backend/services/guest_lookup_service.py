import secrets

from sqlalchemy.orm import Session

from models.guest_model import Guest


# Finds a guest by invitation token.
def get_guest_by_token(db: Session, token: str):
    return db.query(Guest).filter(Guest.invitation_token == token).first()


# Generates a unique invitation token not yet used in DB.
def generate_unique_invitation_token(db: Session) -> str:
    while True:
        candidate_token = secrets.token_urlsafe(18)
        existing_guest = get_guest_by_token(db, candidate_token)
        if not existing_guest:
            return candidate_token


# Creates a new guest with a generated invitation token.
def create_guest_invitation(db: Session, full_name: str) -> Guest:
    invitation_token = generate_unique_invitation_token(db)
    new_guest = Guest(full_name=full_name, invitation_token=invitation_token)
    db.add(new_guest)
    db.commit()
    db.refresh(new_guest)
    return new_guest
