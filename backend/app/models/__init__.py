"""
Import every model here so `Base.metadata.create_all()` and Alembic's
autogenerate can discover all tables from a single import of this package.
"""
from app.models.cash import CashBook  # noqa: F401
from app.models.expense import ExpenseEntry  # noqa: F401
from app.models.item import Item, StockMovement  # noqa: F401
from app.models.purchase import PurchaseEntry  # noqa: F401
from app.models.sale import SaleEntry  # noqa: F401
from app.models.user import User  # noqa: F401
