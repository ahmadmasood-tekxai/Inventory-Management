from datetime import datetime

from sqlalchemy import DateTime, Enum, ForeignKey, Numeric, String, Text, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.constants import StockMovementType
from app.core.database import Base


class Item(Base):
    """
    A stock item (client called these 'atoms'). Dynamic — new items are
    added freely, no fixed catalogue size.
    """
    __tablename__ = "items"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    code: Mapped[str] = mapped_column(String(64), unique=True, index=True, nullable=False)
    name: Mapped[str] = mapped_column(String(128), nullable=False)
    unit: Mapped[str] = mapped_column(String(32), nullable=False, default="pcs")
    opening_stock: Mapped[float] = mapped_column(Numeric(14, 2), nullable=False, default=0)
    low_stock_threshold: Mapped[float] = mapped_column(Numeric(14, 2), nullable=False, default=5)
    notes: Mapped[str] = mapped_column(Text, nullable=True, default="")

    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )

    movements: Mapped[list["StockMovement"]] = relationship(
        back_populates="item", cascade="all, delete-orphan", order_by="StockMovement.created_at"
    )


class StockMovement(Base):
    """
    Immutable audit log of every stock change (sale, purchase, adjustment).
    Remaining stock = item.opening_stock + SUM(quantity_delta).
    Storing every movement (instead of a mutable running counter) means the
    balance can never silently drift and the full history is always queryable.
    """
    __tablename__ = "stock_movements"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    item_id: Mapped[int] = mapped_column(ForeignKey("items.id", ondelete="CASCADE"), index=True)
    movement_type: Mapped[StockMovementType] = mapped_column(Enum(StockMovementType), nullable=False)
    # Signed delta: negative for SALE, positive for PURCHASE, +/- for ADJUSTMENT
    quantity_delta: Mapped[float] = mapped_column(Numeric(14, 2), nullable=False)
    note: Mapped[str] = mapped_column(Text, nullable=True, default="")
    created_by_id: Mapped[int] = mapped_column(ForeignKey("users.id"), nullable=True)

    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), index=True)

    item: Mapped["Item"] = relationship(back_populates="movements")
