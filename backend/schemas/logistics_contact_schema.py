from enum import Enum
from typing import Optional

from pydantic import BaseModel, ConfigDict, field_validator


class LogisticsContactCategoryEnum(str, Enum):
    hair = "hair"
    makeup = "makeup"
    laundry = "laundry"
    hotel = "hotel"
    transfer = "transfer"
    car_rental = "car_rental"


class LogisticsContactBase(BaseModel):
    category: LogisticsContactCategoryEnum
    label: str
    contact_person: Optional[str] = None
    phone: Optional[str] = None
    whatsapp_phone: Optional[str] = None
    email: Optional[str] = None
    website: Optional[str] = None
    instagram_url: Optional[str] = None
    facebook_url: Optional[str] = None
    tiktok_url: Optional[str] = None
    address: Optional[str] = None
    notes: Optional[str] = None
    sort_order: int = 0
    is_active: bool = True

    @field_validator(
        "label",
        "contact_person",
        "phone",
        "whatsapp_phone",
        "email",
        "website",
        "instagram_url",
        "facebook_url",
        "tiktok_url",
        "address",
        "notes",
        mode="before",
    )
    @classmethod
    def normalize_optional_text(cls, value):
        if value is None:
            return None
        normalized = str(value).strip()
        return normalized or None

    @field_validator("label")
    @classmethod
    def validate_label(cls, value: Optional[str]) -> str:
        if not value:
            raise ValueError("label is required.")
        return value


class LogisticsContactCreateRequest(LogisticsContactBase):
    pass


class LogisticsContactUpdateRequest(BaseModel):
    category: Optional[LogisticsContactCategoryEnum] = None
    label: Optional[str] = None
    contact_person: Optional[str] = None
    phone: Optional[str] = None
    whatsapp_phone: Optional[str] = None
    email: Optional[str] = None
    website: Optional[str] = None
    instagram_url: Optional[str] = None
    facebook_url: Optional[str] = None
    tiktok_url: Optional[str] = None
    address: Optional[str] = None
    notes: Optional[str] = None
    sort_order: Optional[int] = None
    is_active: Optional[bool] = None

    @field_validator(
        "label",
        "contact_person",
        "phone",
        "whatsapp_phone",
        "email",
        "website",
        "instagram_url",
        "facebook_url",
        "tiktok_url",
        "address",
        "notes",
        mode="before",
    )
    @classmethod
    def normalize_update_text(cls, value):
        if value is None:
            return None
        normalized = str(value).strip()
        return normalized or None


class LogisticsContactResponse(LogisticsContactBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
