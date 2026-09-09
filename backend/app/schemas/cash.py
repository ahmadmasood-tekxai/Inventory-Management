from datetime import date, datetime
from decimal import Decimal

from pydantic import BaseModel, Field

from app.schemas.common import ORMBase


class CashBookCreate(BaseModel):
    book_date: date
    opening_cash: Decimal = Field(ge=0)


class CashBookOut(ORMBase):
    id: int
    book_date: date
    opening_cash: Decimal
    created_at: datetime
    updated_at: datetime


class CashBookWithBalanceOut(CashBookOut):
    """Opening cash + auto-derived total expenses + closing balance for the day."""
    total_expenses: Decimal
    closing_balance: Decimal
