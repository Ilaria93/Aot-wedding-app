from sqlalchemy import Column, Integer, String

from database.base import Base


# One physical table at the reception, admin-managed (create/edit/delete from
# the RSVP dashboard) — capacity backs the "X/Y posti" progress bars, note is
# a free-text blurb like "Zona panoramica" or "Davide, Ilaria, Testimoni".
class WeddingTable(Base):
    __tablename__ = "wedding_tables"

    id = Column(Integer, primary_key=True, index=True)
    label = Column(String(80), nullable=False)
    capacity = Column(Integer, nullable=False)
    note = Column(String(120), nullable=True)
