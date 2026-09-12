from datetime import date
from decimal import Decimal
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.constants import DEFAULT_PAGE_SIZE, MAX_PAGE_SIZE
from app.core.database import get_db
from app.models.cash import CashBook
from app.models.expense import ExpenseEntry
from app.models.user import User
from app.schemas.cash import CashBookCreate, CashBookWithBalanceOut
from app.schemas.common import PaginatedResponse

router = APIRouter(prefix="/cash", tags=["Cash Book"])


def _with_balance(db: Session, book: CashBook) -> CashBookWithBalanceOut:
    total_expenses = db.query(func.coalesce(func.sum(ExpenseEntry.amount), 0)).filter(
        ExpenseEntry.expense_date == book.book_date
    ).scalar()
    total_expenses = Decimal(total_expenses or 0)
    closing = Decimal(book.opening_cash) - total_expenses
    return CashBookWithBalanceOut(
        id=book.id, book_date=book.book_date, opening_cash=book.opening_cash,
        created_at=book.created_at, updated_at=book.updated_at,
        total_expenses=total_expenses, closing_balance=closing,
    )


@router.post("", response_model=CashBookWithBalanceOut, status_code=status.HTTP_201_CREATED)
def set_opening_cash(payload: CashBookCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    book = db.query(CashBook).filter(CashBook.book_date == payload.book_date).first()
    if book:
        book.opening_cash = payload.opening_cash
    else:
        book = CashBook(book_date=payload.book_date, opening_cash=payload.opening_cash, created_by_id=current_user.id)
        db.add(book)
    db.commit()
    db.refresh(book)
    return _with_balance(db, book)


@router.get("/{book_date}", response_model=CashBookWithBalanceOut)
def get_cash_for_date(book_date: date, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    book = db.query(CashBook).filter(CashBook.book_date == book_date).first()
    if not book:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="No cash entry for this date yet")
    return _with_balance(db, book)


@router.get("", response_model=PaginatedResponse[CashBookWithBalanceOut])
def list_cash_book(
    start_date: Optional[date] = Query(default=None),
    end_date: Optional[date] = Query(default=None),
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=DEFAULT_PAGE_SIZE, ge=1, le=MAX_PAGE_SIZE),
    db: Session = Depends(get_db), 
    current_user: User = Depends(get_current_user)
):
    query = db.query(CashBook)
    if start_date:
        query = query.filter(CashBook.book_date >= start_date)
    if end_date:
        query = query.filter(CashBook.book_date <= end_date)
        
    total = query.count()
    books = query.order_by(CashBook.book_date.desc()).offset((page - 1) * page_size).limit(page_size).all()
    items = [_with_balance(db, b) for b in books]
    
    total_pages = max(1, (total + page_size - 1) // page_size)
    return PaginatedResponse(items=items, total=total, page=page, page_size=page_size, total_pages=total_pages)
