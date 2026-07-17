"""RSVP party limits and faction balancing order."""

from schemas.rsvp_enums import FactionEnum

MAX_PARTY_GUESTS = 10
MIN_PARTY_GUESTS = 1

# Balancing tie-break order; FactionEnum is the single source of truth for valid faction ids.
FACTION_IDS: tuple[str, ...] = tuple(faction.value for faction in FactionEnum)
