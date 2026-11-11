from typing import Optional

from pydantic import BaseModel, ConfigDict, Field, field_validator

from schemas.rsvp_enums import IntoleranceEnum, MealChoiceEnum


class StaffGuestResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str
    role: Optional[str] = None
    meal_choice: MealChoiceEnum
    intolerance: IntoleranceEnum
    dietary_notes: Optional[str] = None
    table_id: Optional[int] = None
    table_label: Optional[str] = None


class StaffGuestCreate(BaseModel):
    name: str = Field(max_length=120)
    role: Optional[str] = Field(default=None, max_length=80)
    meal_choice: MealChoiceEnum = MealChoiceEnum.standard
    intolerance: IntoleranceEnum = IntoleranceEnum.none
    dietary_notes: Optional[str] = Field(default=None, max_length=250)
    table_id: Optional[int] = None

    @field_validator("name")
    @classmethod
    def name_not_blank(cls, value: str) -> str:
        value = value.strip()
        if not value:
            raise ValueError("Required.")
        return value

    @field_validator("role", "dietary_notes")
    @classmethod
    def blank_to_none(cls, value: Optional[str]) -> Optional[str]:
        return (value or "").strip() or None


class StaffGuestUpdate(BaseModel):
    name: Optional[str] = Field(default=None, max_length=120)
    role: Optional[str] = Field(default=None, max_length=80)
    meal_choice: Optional[MealChoiceEnum] = None
    intolerance: Optional[IntoleranceEnum] = None
    dietary_notes: Optional[str] = Field(default=None, max_length=250)
    table_id: Optional[int] = None

    @field_validator("name")
    @classmethod
    def name_not_blank(cls, value: Optional[str]) -> Optional[str]:
        if value is not None and not value.strip():
            raise ValueError("Required.")
        return value.strip() if value else value

    @field_validator("role", "dietary_notes")
    @classmethod
    def blank_to_none(cls, value: Optional[str]) -> Optional[str]:
        return (value or "").strip() or None
