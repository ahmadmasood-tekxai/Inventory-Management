from datetime import datetime

from pydantic import BaseModel, EmailStr, Field

from app.constants import UserRole
from app.schemas.common import ORMBase


class UserCreate(BaseModel):
    username: str = Field(min_length=3, max_length=64)
    email: EmailStr
    password: str = Field(min_length=6, max_length=128)
    full_name: str = Field(default="", max_length=128)
    role: UserRole = UserRole.STAFF


class UserOut(ORMBase):
    id: int
    username: str
    email: EmailStr
    full_name: str
    role: UserRole
    is_active: bool
    created_at: datetime


class LoginRequest(BaseModel):
    username: str
    password: str


class TokenResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    user: UserOut
