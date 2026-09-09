from datetime import date, datetime

from sqlalchemy import Date, DateTime, ForeignKey, Numeric, String, func
from sqlalchemy.orm import Mapped, mapped_column

from app.core.database import Base


class SaleEntry(Base):
    """
    A sale (cotton/piece sold). Only quantity is captured — no rate/price,
    matching the client's requirement that this is a stock ledger, not a
    billing system. Creating a SaleEntry auto-creates a matching negative
    StockMovement.
    """
    __tablename__ = "sale_entries"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    item_id: Mapped[int] = mapped_column(ForeignKey("items.id", ondelete="CASCADE"), index=True, nullable=False)
    quantity: Mapped[float] = mapped_column(Numeric(14, 2), nullable=False)
    sale_date: Mapped[date] = mapped_column(Date, nullable=False, index=True)
    note: Mapped[str] = mapped_column(String(255), nullable=True, default="")
    created_by_id: Mapped[int] = mapped_column(ForeignKey("users.id"), nullable=True)

    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
