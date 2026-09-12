from datetime import date
from decimal import Decimal
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.constants import DEFAULT_PAGE_SIZE, MAX_PAGE_SIZE, StockMovementType
from app.core.database import get_db
from app.models.item import Item, StockMovement
from app.models.sale import SaleEntry
from app.models.user import User
from app.schemas.common import PaginatedResponse
from app.schemas.item import (
    ItemCreate,
    ItemDetailOut,
    ItemUpdate,
    ItemWithStockOut,
    StockAdjustmentCreate,
)
from app.schemas.sale import SaleEntryCreate, SaleEntryWithItemOut
from app.services.stock_service import build_item_with_stock, get_remaining_stock, record_movement

router = APIRouter(prefix="/items", tags=["Items & Stock"])


@router.post("", response_model=ItemWithStockOut, status_code=status.HTTP_201_CREATED)
def create_item(payload: ItemCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    existing = db.query(Item).filter(Item.code == payload.code).first()
    if existing:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail=f'Item code "{payload.code}" already exists')

    item = Item(
        code=payload.code,
        name=payload.name,
        unit=payload.unit,
        opening_stock=payload.opening_stock,
        low_stock_threshold=payload.low_stock_threshold,
        notes=payload.notes or "",
    )
    db.add(item)
    db.flush()

    # Record the opening stock as the first auditable movement.
    record_movement(db, item.id, StockMovementType.OPENING, payload.opening_stock, note="Opening stock", created_by_id=current_user.id)

    db.commit()
    db.refresh(item)
    return build_item_with_stock(db, item)


@router.get("", response_model=PaginatedResponse[ItemWithStockOut])
def list_items(
    search: Optional[str] = Query(default=None, description="Search by item code or name"),
    low_stock_only: bool = Query(default=False),
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=DEFAULT_PAGE_SIZE, ge=1, le=MAX_PAGE_SIZE),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    query = db.query(Item)
    if search:
        like = f"%{search}%"
        query = query.filter((Item.code.ilike(like)) | (Item.name.ilike(like)))

    items = query.order_by(Item.code).all()
    enriched = [build_item_with_stock(db, item) for item in items]

    if low_stock_only:
        enriched = [i for i in enriched if i["is_low_stock"]]

    total = len(enriched)
    start = (page - 1) * page_size
    page_items = enriched[start : start + page_size]
    total_pages = max(1, (total + page_size - 1) // page_size)

    return PaginatedResponse(items=page_items, total=total, page=page, page_size=page_size, total_pages=total_pages)


@router.get("/{item_id}", response_model=ItemDetailOut)
def get_item_detail(item_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    item = db.query(Item).filter(Item.id == item_id).first()
    if not item:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Item not found")

    data = build_item_with_stock(db, item)
    movements = (
        db.query(StockMovement)
        .filter(StockMovement.item_id == item_id)
        .order_by(StockMovement.created_at.desc())
        .all()
    )
    data["movements"] = movements
    return data


@router.patch("/{item_id}", response_model=ItemWithStockOut)
def update_item(
    item_id: int, payload: ItemUpdate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)
):
    item = db.query(Item).filter(Item.id == item_id).first()
    if not item:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Item not found")

    dump = payload.model_dump(exclude_unset=True)
    
    # If opening_stock is being updated, we must also update the OPENING stock movement.
    if "opening_stock" in dump and item.opening_stock != dump["opening_stock"]:
        opening_movement = db.query(StockMovement).filter(
            StockMovement.item_id == item.id, 
            StockMovement.movement_type == StockMovementType.OPENING
        ).first()
        if opening_movement:
            opening_movement.quantity_delta = dump["opening_stock"]

    for field, value in dump.items():
        setattr(item, field, value)

    db.commit()
    db.refresh(item)
    return build_item_with_stock(db, item)


@router.post("/{item_id}/adjust", response_model=ItemWithStockOut)
def adjust_stock(
    item_id: int,
    payload: StockAdjustmentCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    item = db.query(Item).filter(Item.id == item_id).first()
    if not item:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Item not found")

    record_movement(
        db, item.id, StockMovementType.ADJUSTMENT, payload.quantity_delta,
        note=payload.note or "Manual adjustment", created_by_id=current_user.id,
    )
    db.commit()
    db.refresh(item)
    return build_item_with_stock(db, item)


@router.delete("/{item_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_item(item_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    item = db.query(Item).filter(Item.id == item_id).first()
    if not item:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Item not found")
    db.delete(item)
    db.commit()


# ---------------------------------------------------------------------------
# Sale entries (nested under items conceptually, exposed at top-level path)
# ---------------------------------------------------------------------------
sales_router = APIRouter(prefix="/sales", tags=["Sales"])


@sales_router.post("", response_model=SaleEntryWithItemOut, status_code=status.HTTP_201_CREATED)
def create_sale_entry(
    payload: SaleEntryCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)
):
    item = db.query(Item).filter(Item.id == payload.item_id).first()
    if not item:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Item not found")

    current_remaining = get_remaining_stock(db, item)
    if payload.quantity > current_remaining:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Cannot sell {payload.quantity} — only {current_remaining} {item.unit} remaining for {item.code}",
        )

    sale = SaleEntry(
        item_id=item.id, quantity=payload.quantity, sale_date=payload.sale_date, note=payload.note or "",
        created_by_id=current_user.id,
    )
    db.add(sale)
    db.flush()

    record_movement(
        db, item.id, StockMovementType.SALE, -payload.quantity,
        note=f"Sale #{sale.id}: {payload.note or ''}".strip(), created_by_id=current_user.id,
    )
    db.commit()
    db.refresh(sale)

    remaining_after = get_remaining_stock(db, item)
    return SaleEntryWithItemOut(
        **{c: getattr(sale, c) for c in ["id", "item_id", "quantity", "sale_date", "note", "created_at"]},
        item_code=item.code, item_name=item.name, remaining_stock_after=remaining_after,
    )


@sales_router.get("", response_model=PaginatedResponse[SaleEntryWithItemOut])
def list_sale_entries(
    item_id: Optional[int] = Query(default=None),
    search: Optional[str] = Query(default=None),
    start_date: Optional[date] = Query(default=None),
    end_date: Optional[date] = Query(default=None),
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=DEFAULT_PAGE_SIZE, ge=1, le=MAX_PAGE_SIZE),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    query = db.query(SaleEntry).join(Item, SaleEntry.item_id == Item.id)
    if item_id:
        query = query.filter(SaleEntry.item_id == item_id)
    if search:
        like = f"%{search}%"
        query = query.filter((Item.code.ilike(like)) | (Item.name.ilike(like)))
    if start_date:
        query = query.filter(SaleEntry.sale_date >= start_date)
    if end_date:
        query = query.filter(SaleEntry.sale_date <= end_date)

    total = query.count()
    sales = query.order_by(SaleEntry.sale_date.desc(), SaleEntry.id.desc()).offset((page - 1) * page_size).limit(page_size).all()

    results = []
    for sale in sales:
        item = db.query(Item).filter(Item.id == sale.item_id).first()
        results.append(
            SaleEntryWithItemOut(
                **{c: getattr(sale, c) for c in ["id", "item_id", "quantity", "sale_date", "note", "created_at"]},
                item_code=item.code, item_name=item.name, remaining_stock_after=get_remaining_stock(db, item),
            )
        )
    
    total_pages = max(1, (total + page_size - 1) // page_size)
    return PaginatedResponse(items=results, total=total, page=page, page_size=page_size, total_pages=total_pages)
