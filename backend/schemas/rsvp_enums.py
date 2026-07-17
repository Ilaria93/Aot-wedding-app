from enum import Enum


# Declaration order is also the faction-balancing tie-break order (see rsvp_faction_service).
class FactionEnum(str, Enum):
    scout_regiment = "scout_regiment"
    garrison = "garrison"
    military_police = "military_police"


class MealChoiceEnum(str, Enum):
    standard = "standard"
    vegetarian = "vegetarian"
    vegan = "vegan"
    gluten_free = "gluten_free"
    baby = "baby"


class IntoleranceEnum(str, Enum):
    none = "none"
    gluten = "gluten"
    lactose = "lactose"
    eggs = "eggs"
    nuts = "nuts"
    seafood = "seafood"
    other = "other"
