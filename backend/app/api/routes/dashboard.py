from datetime import date
from decimal import Decimal

from fastapi import APIRouter, Depends
from pydantic import BaseModel
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.core.database import get_db
from app.models.cash import CashBook
from app.models.expense import ExpenseEntry
from app.models.item import Item
from app.models.user import User
from app.services.stock_service import build_item_with_stock

router = APIRouter(prefix="/dashboard", tags=["Dashboard"])


class DashboardSummary(BaseModel):
    total_items: int
    low_stock_items: int
    today_expenses_total: Decimal
    today_closing_cash: Decimal | None
    recent_low_stock_codes: list[str]


@router.get("/summary", response_model=DashboardSummary)
def get_dashboard_summary(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    today = date.today()

    items = db.query(Item).all()
    enriched = [build_item_with_stock(db, item) for item in items]
    low_stock = [i for i in enriched if i["is_low_stock"]]

    today_expenses = db.query(func.coalesce(func.sum(ExpenseEntry.amount), 0)).filter(
        ExpenseEntry.expense_date == today
    ).scalar()

    cash_book = db.query(CashBook).filter(CashBook.book_date == today).first()
    closing_cash = None
    if cash_book:
        closing_cash = Decimal(cash_book.opening_cash) - Decimal(today_expenses or 0)

    return DashboardSummary(
        total_items=len(items),
        low_stock_items=len(low_stock),
        today_expenses_total=Decimal(today_expenses or 0),
        today_closing_cash=closing_cash,
        recent_low_stock_codes=[i["code"] for i in low_stock[:10]],
    )
