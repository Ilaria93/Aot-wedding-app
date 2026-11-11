from sqlalchemy import Column, ForeignKey, Integer, String

from database.base import Base


# A supplier's person who eats at the reception (band member, photographer, ...).
# They have no invite or RSVP: the couple fills in the menu for them, and they
# take a seat at one of the wedding tables like any guest.
class StaffGuest(Base):
    __tablename__ = "staff_guests"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(120), nullable=False)
    # What they do ("Band", "Fotografo"): free text, shown next to the name.
    role = Column(String(80), nullable=True)
    meal_choice = Column(String(30), nullable=False, default="standard")
    intolerance = Column(String(30), nullable=False, default="none")
    dietary_notes = Column(String(250), nullable=True)
    table_id = Column(Integer, ForeignKey("wedding_tables.id"), nullable=True, index=True)
