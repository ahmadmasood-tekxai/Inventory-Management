from datetime import date, datetime
from decimal import Decimal
from typing import Optional

from pydantic import BaseModel, Field

from app.schemas.common import ORMBase


class ExpenseCreate(BaseModel):
    amount: Decimal = Field(gt=0)
    description: str = Field(default="", max_length=255)
    expense_date: date


class ExpenseOut(ORMBase):
    id: int
    amount: Decimal
    description: str
    expense_date: date
    created_at: datetime


class DailyExpenseSummary(BaseModel):
    expense_date: date
    total_expenses: Decimal
    entries: list[ExpenseOut]
