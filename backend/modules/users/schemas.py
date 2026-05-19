from __future__ import annotations

from datetime import datetime
from enum import Enum
from typing import Optional

from pydantic import BaseModel, EmailStr


class Role(str, Enum):
    admin = "admin"
    staff = "staff"
    user = "user"


class UserBase(BaseModel):
    nombre: str
    email: EmailStr
    role: Role = Role.user


class UserCreate(UserBase):
    password: str


class UserUpdate(BaseModel):
    nombre: Optional[str] = None
    email: Optional[EmailStr] = None
    role: Optional[Role] = None
    activo: Optional[bool] = None


class UserOut(UserBase):
    id: int
    activo: bool
    creado_en: datetime

    class Config:
        orm_mode = True
