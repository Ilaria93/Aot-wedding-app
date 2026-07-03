from enum import Enum


class FactionEnum(str, Enum):
    scout_regiment = "scout_regiment"
    military_police = "military_police"
    garrison = "garrison"


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
