from datetime import date, datetime
from decimal import Decimal
from typing import Optional

from pydantic import BaseModel, Field

from app.schemas.common import ORMBase


class SaleEntryCreate(BaseModel):
    item_id: int
    quantity: Decimal = Field(gt=0, description="Quantity sold — no rate/price captured here")
    sale_date: date
    note: Optional[str] = Field(default="", max_length=255)


class SaleEntryOut(ORMBase):
    id: int
    item_id: int
    quantity: Decimal
    sale_date: date
    note: Optional[str]
    created_at: datetime


class SaleEntryWithItemOut(SaleEntryOut):
    item_code: str
    item_name: str
    remaining_stock_after: Decimal
