from datetime import date, datetime

from sqlalchemy import Date, DateTime, ForeignKey, Numeric, String, func
from sqlalchemy.orm import Mapped, mapped_column

from app.core.database import Base


class PurchaseEntry(Base):
    """
    A carton/purchase arrival. Client enters total_amount + rate_per_unit;
    quantity is always derived (total_amount / rate_per_unit) so the two
    numbers never disagree. If item_id is set, a PURCHASE stock movement
    is auto-created for that item.
    """
    __tablename__ = "purchase_entries"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    item_id: Mapped[int] = mapped_column(ForeignKey("items.id", ondelete="SET NULL"), nullable=True, index=True)
    supplier_name: Mapped[str] = mapped_column(String(128), nullable=True, default="")
    total_amount: Mapped[float] = mapped_column(Numeric(14, 2), nullable=False)
    rate_per_unit: Mapped[float] = mapped_column(Numeric(14, 4), nullable=False)
    quantity: Mapped[float] = mapped_column(Numeric(14, 2), nullable=False)  # derived, stored for fast reads
    purchase_date: Mapped[date] = mapped_column(Date, nullable=False, index=True)
    note: Mapped[str] = mapped_column(String(255), nullable=True, default="")
    created_by_id: Mapped[int] = mapped_column(ForeignKey("users.id"), nullable=True)

    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
