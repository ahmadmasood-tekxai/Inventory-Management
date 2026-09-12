from datetime import date
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.constants import DEFAULT_PAGE_SIZE, MAX_PAGE_SIZE, StockMovementType
from app.core.database import get_db
from app.models.item import Item
from app.models.purchase import PurchaseEntry
from app.models.user import User
from app.schemas.common import PaginatedResponse
from app.schemas.purchase import PurchaseEntryCreate, PurchaseEntryOut
from app.services.stock_service import record_movement

router = APIRouter(prefix="/purchases", tags=["Purchases / Carton Entries"])


@router.post("", response_model=PurchaseEntryOut, status_code=status.HTTP_201_CREATED)
def create_purchase(
    payload: PurchaseEntryCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)
):
    if payload.item_id is not None:
        item = db.query(Item).filter(Item.id == payload.item_id).first()
        if not item:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Item not found")

    # Quantity is always derived from amount / rate — never entered directly,
    # so the two numbers can never disagree.
    quantity = payload.total_amount / payload.rate_per_unit

    purchase = PurchaseEntry(
        item_id=payload.item_id,
        supplier_name=payload.supplier_name or "",
        total_amount=payload.total_amount,
        rate_per_unit=payload.rate_per_unit,
        quantity=quantity,
        purchase_date=payload.purchase_date,
        note=payload.note or "",
        created_by_id=current_user.id,
    )
    db.add(purchase)
    db.flush()

    if payload.item_id is not None:
        record_movement(
            db, payload.item_id, StockMovementType.PURCHASE, quantity,
            note=f"Purchase #{purchase.id} from {payload.supplier_name or 'supplier'}",
            created_by_id=current_user.id,
        )

    db.commit()
    db.refresh(purchase)
    return purchase


@router.get("", response_model=PaginatedResponse[PurchaseEntryOut])
def list_purchases(
    search: Optional[str] = Query(default=None),
    start_date: Optional[date] = Query(default=None),
    end_date: Optional[date] = Query(default=None),
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=DEFAULT_PAGE_SIZE, ge=1, le=MAX_PAGE_SIZE),
    db: Session = Depends(get_db), 
    current_user: User = Depends(get_current_user)
):
    query = db.query(PurchaseEntry)
    if search:
        query = query.join(Item, PurchaseEntry.item_id == Item.id, isouter=True)
        like = f"%{search}%"
        query = query.filter((PurchaseEntry.supplier_name.ilike(like)) | (Item.name.ilike(like)) | (Item.code.ilike(like)))
    if start_date:
        query = query.filter(PurchaseEntry.purchase_date >= start_date)
    if end_date:
        query = query.filter(PurchaseEntry.purchase_date <= end_date)
        
    total = query.count()
    purchases = query.order_by(PurchaseEntry.purchase_date.desc(), PurchaseEntry.id.desc()).offset((page - 1) * page_size).limit(page_size).all()
    
    total_pages = max(1, (total + page_size - 1) // page_size)
    return PaginatedResponse(items=purchases, total=total, page=page, page_size=page_size, total_pages=total_pages)
