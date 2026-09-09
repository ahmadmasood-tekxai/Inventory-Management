from datetime import date, datetime

from sqlalchemy import Date, DateTime, ForeignKey, Numeric, func
from sqlalchemy.orm import Mapped, mapped_column

from app.core.database import Base


class CashBook(Base):
    """
    One row per calendar day. `opening_cash` is entered manually by the
    client each day (e.g. Rs. 200,000). Closing balance is always derived
    as opening_cash - SUM(expenses for that date), never stored directly,
    so it can never go stale.
    """
    __tablename__ = "cash_book"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    book_date: Mapped[date] = mapped_column(Date, unique=True, index=True, nullable=False)
    opening_cash: Mapped[float] = mapped_column(Numeric(14, 2), nullable=False, default=0)
    created_by_id: Mapped[int] = mapped_column(ForeignKey("users.id"), nullable=True)

    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )
