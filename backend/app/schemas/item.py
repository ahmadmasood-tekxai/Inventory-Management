from datetime import datetime
from decimal import Decimal
from typing import List, Optional

from pydantic import BaseModel, Field

from app.constants import StockMovementType
from app.schemas.common import ORMBase


class ItemCreate(BaseModel):
    code: str = Field(min_length=1, max_length=64, description='Unique item code, e.g. "1500C"')
    name: str = Field(min_length=1, max_length=128)
    unit: str = Field(default="pcs", max_length=32)
    opening_stock: Decimal = Field(default=Decimal("0"), ge=0)
    low_stock_threshold: Decimal = Field(default=Decimal("5"), ge=0)
    notes: Optional[str] = ""


class ItemUpdate(BaseModel):
    name: Optional[str] = Field(default=None, max_length=128)
    unit: Optional[str] = Field(default=None, max_length=32)
    low_stock_threshold: Optional[Decimal] = Field(default=None, ge=0)
    notes: Optional[str] = None


class ItemOut(ORMBase):
    id: int
    code: str
    name: str
    unit: str
    opening_stock: Decimal
    low_stock_threshold: Decimal
    notes: Optional[str]
    created_at: datetime
    updated_at: datetime


class ItemWithStockOut(ItemOut):
    """Item + computed remaining stock, used for list & detail views."""
    remaining_stock: Decimal
    total_sold: Decimal
    total_purchased: Decimal
    is_low_stock: bool


class StockMovementOut(ORMBase):
    id: int
    item_id: int
    movement_type: StockMovementType
    quantity_delta: Decimal
    note: Optional[str]
    created_at: datetime


class ItemDetailOut(ItemWithStockOut):
    """Full item detail page: item info + full movement history."""
    movements: List[StockMovementOut] = []


class StockAdjustmentCreate(BaseModel):
    quantity_delta: Decimal = Field(description="Positive to add stock, negative to remove")
    note: Optional[str] = Field(default="", max_length=255)
