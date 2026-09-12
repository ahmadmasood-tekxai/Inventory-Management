"""
Core stock calculation logic. Kept in one place so remaining-stock math
is never duplicated (and never drifts) across routes.
"""
from decimal import Decimal

from sqlalchemy import func
from sqlalchemy.orm import Session

from app.constants import StockMovementType
from app.models.item import Item, StockMovement


def get_movement_sum(db: Session, item_id: int) -> Decimal:
    total = (
        db.query(func.coalesce(func.sum(StockMovement.quantity_delta), 0))
        .filter(StockMovement.item_id == item_id)
        .scalar()
    )
    return Decimal(total or 0)


def get_remaining_stock(db: Session, item: Item) -> Decimal:
    return get_movement_sum(db, item.id)


def get_total_by_type(db: Session, item_id: int, movement_type: StockMovementType) -> Decimal:
    total = (
        db.query(func.coalesce(func.sum(StockMovement.quantity_delta), 0))
        .filter(StockMovement.item_id == item_id, StockMovement.movement_type == movement_type)
        .scalar()
    )
    return Decimal(total or 0)


def build_item_with_stock(db: Session, item: Item) -> dict:
    remaining = get_remaining_stock(db, item)
    total_sold = abs(get_total_by_type(db, item.id, StockMovementType.SALE))
    total_purchased = get_total_by_type(db, item.id, StockMovementType.PURCHASE)
    return {
        "id": item.id,
        "code": item.code,
        "name": item.name,
        "unit": item.unit,
        "opening_stock": item.opening_stock,
        "low_stock_threshold": item.low_stock_threshold,
        "notes": item.notes,
        "created_at": item.created_at,
        "updated_at": item.updated_at,
        "remaining_stock": remaining,
        "total_sold": total_sold,
        "total_purchased": total_purchased,
        "is_low_stock": remaining <= Decimal(item.low_stock_threshold),
        "image_path": item.image_path,
    }


def record_movement(
    db: Session,
    item_id: int,
    movement_type: StockMovementType,
    quantity_delta: Decimal,
    note: str = "",
    created_by_id: int | None = None,
) -> StockMovement:
    movement = StockMovement(
        item_id=item_id,
        movement_type=movement_type,
        quantity_delta=quantity_delta,
        note=note,
        created_by_id=created_by_id,
    )
    db.add(movement)
    db.flush()
    return movement
