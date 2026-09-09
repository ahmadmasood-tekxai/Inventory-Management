"""
Generic, reusable schemas — mirrored by frontend/src/types/index.ts so the
API contract stays identical on both sides of the stack.
"""
from typing import Generic, List, TypeVar

from pydantic import BaseModel, ConfigDict

T = TypeVar("T")


class ORMBase(BaseModel):
    """Base for schemas that read directly from SQLAlchemy ORM objects."""
    model_config = ConfigDict(from_attributes=True)


class PaginatedResponse(BaseModel, Generic[T]):
    items: List[T]
    total: int
    page: int
    page_size: int
    total_pages: int


class Message(BaseModel):
    message: str
