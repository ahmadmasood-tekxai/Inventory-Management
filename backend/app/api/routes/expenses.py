from datetime import date
from decimal import Decimal
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.constants import DEFAULT_PAGE_SIZE, MAX_PAGE_SIZE
from app.core.database import get_db
from app.models.expense import ExpenseEntry
from app.models.user import User
from app.schemas.common import PaginatedResponse
from app.schemas.expense import DailyExpenseSummary, ExpenseCreate, ExpenseOut

router = APIRouter(prefix="/expenses", tags=["Expenses"])


@router.post("", response_model=ExpenseOut, status_code=status.HTTP_201_CREATED)
def create_expense(payload: ExpenseCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    expense = ExpenseEntry(
        amount=payload.amount,
        description=payload.description or "",
        expense_date=payload.expense_date,
        created_by_id=current_user.id,
    )
    db.add(expense)
    db.commit()
    db.refresh(expense)
    return expense


@router.get("", response_model=PaginatedResponse[ExpenseOut])
def list_expenses(
    search: Optional[str] = Query(default=None),
    start_date: Optional[date] = Query(default=None),
    end_date: Optional[date] = Query(default=None),
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=DEFAULT_PAGE_SIZE, ge=1, le=MAX_PAGE_SIZE),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    query = db.query(ExpenseEntry)
    if search:
        query = query.filter(ExpenseEntry.description.ilike(f"%{search}%"))
    if start_date:
        query = query.filter(ExpenseEntry.expense_date >= start_date)
    if end_date:
        query = query.filter(ExpenseEntry.expense_date <= end_date)
        
    total = query.count()
    expenses = query.order_by(ExpenseEntry.expense_date.desc(), ExpenseEntry.id.desc()).offset((page - 1) * page_size).limit(page_size).all()
    
    total_pages = max(1, (total + page_size - 1) // page_size)
    return PaginatedResponse(items=expenses, total=total, page=page, page_size=page_size, total_pages=total_pages)


@router.get("/summary/{for_date}", response_model=DailyExpenseSummary)
def daily_summary(for_date: date, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    entries = db.query(ExpenseEntry).filter(ExpenseEntry.expense_date == for_date).order_by(ExpenseEntry.id).all()
    total = db.query(func.coalesce(func.sum(ExpenseEntry.amount), 0)).filter(
        ExpenseEntry.expense_date == for_date
    ).scalar()
    return DailyExpenseSummary(expense_date=for_date, total_expenses=Decimal(total or 0), entries=entries)


@router.delete("/{expense_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_expense(expense_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    expense = db.query(ExpenseEntry).filter(ExpenseEntry.id == expense_id).first()
    if not expense:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Expense not found")
    db.delete(expense)
    db.commit()
