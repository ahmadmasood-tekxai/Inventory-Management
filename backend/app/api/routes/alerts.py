"""
Alerts endpoint — returns low-stock items so the frontend can show badge / notifications.
No auth skip: requires a valid token so only logged-in users can poll this.
"""
from typing import List

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.core.database import get_db
from app.models.item import Item
from app.models.user import User
from app.schemas.item import ItemWithStockOut
from app.services.stock_service import build_item_with_stock

router = APIRouter(prefix="/alerts", tags=["Alerts"])


@router.get("/low-stock", response_model=List[ItemWithStockOut])
def get_low_stock_alerts(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Return all items whose remaining stock is at or below their low_stock_threshold."""
    items = db.query(Item).order_by(Item.code).all()
    result = []
    for item in items:
        data = build_item_with_stock(db, item)
        if data["is_low_stock"]:
            result.append(data)
    return result
