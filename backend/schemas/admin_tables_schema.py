from typing import Optional

from pydantic import BaseModel, ConfigDict


class AdminTable(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    label: str
    capacity: int
    note: Optional[str] = None


class CreateTableRequest(BaseModel):
    label: str
    capacity: int
    note: Optional[str] = None


class UpdateTableRequest(BaseModel):
    label: Optional[str] = None
    capacity: Optional[int] = None
    note: Optional[str] = None
