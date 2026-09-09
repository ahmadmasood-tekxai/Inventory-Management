"""
Application-wide constants and enums.
Keep this the single source of truth for fixed values used across models,
schemas, and routes so the frontend TypeScript enums can mirror them 1:1.
"""
import enum


class UserRole(str, enum.Enum):
    ADMIN = "ADMIN"
    STAFF = "STAFF"


class StockMovementType(str, enum.Enum):
    """
    Every stock change is recorded as a signed movement so the item's
    remaining stock is always derivable (and auditable) instead of stored
    as a mutable counter that can drift out of sync.
    """
    OPENING = "OPENING"      # initial stock when item is created
    SALE = "SALE"             # stock going out (negative delta)
    PURCHASE = "PURCHASE"     # stock coming in via carton/purchase (positive delta)
    ADJUSTMENT = "ADJUSTMENT"  # manual correction, can be +/-


class CashEntryType(str, enum.Enum):
    OPENING = "OPENING"   # opening cash for the day
    DEPOSIT = "DEPOSIT"   # extra cash added during the day
    WITHDRAWAL = "WITHDRAWAL"  # manual cash removed (not an expense)


# Pagination defaults — mirrored in frontend/src/constants/index.ts
DEFAULT_PAGE_SIZE = 20
MAX_PAGE_SIZE = 100

# Business rule: below this remaining stock, item is flagged "low stock"
LOW_STOCK_THRESHOLD_DEFAULT = 5
