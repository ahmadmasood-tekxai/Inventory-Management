from datetime import date, datetime
from decimal import Decimal
from typing import Optional

from pydantic import BaseModel, Field, model_validator

from app.schemas.common import ORMBase


class PurchaseEntryCreate(BaseModel):
    item_id: Optional[int] = None
    supplier_name: Optional[str] = Field(default="", max_length=128)
    total_amount: Decimal = Field(gt=0)
    rate_per_unit: Decimal = Field(gt=0)
    purchase_date: date
    note: Optional[str] = Field(default="", max_length=255)

    @model_validator(mode="after")
    def check_rate_not_absurd(self) -> "PurchaseEntryCreate":
        if self.rate_per_unit <= 0:
            raise ValueError("rate_per_unit must be greater than zero")
        return self


class PurchaseEntryOut(ORMBase):
    id: int
    item_id: Optional[int]
    supplier_name: Optional[str]
    total_amount: Decimal
    rate_per_unit: Decimal
    quantity: Decimal
    purchase_date: date
    note: Optional[str]
    created_at: datetime
