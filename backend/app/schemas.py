from __future__ import annotations

from enum import Enum
from typing import List, Optional

from pydantic import BaseModel


class Estado(str, Enum):
    disponible = "disponible"
    ocupado = "ocupado"
    reservado = "reservado"


class EspacioBase(BaseModel):
    id: str
    estado: Estado = Estado.disponible


class EspacioCreate(EspacioBase):
    pass


class EspacioUpdate(BaseModel):
    estado: Optional[Estado] = None


class EspacioOut(EspacioBase):
    class Config:
        orm_mode = True


class SectorBase(BaseModel):
    id: str
    nombre: str
    imagen: Optional[str] = None


class SectorCreate(SectorBase):
    espacios: Optional[List[EspacioCreate]] = []


class SectorUpdate(BaseModel):
    nombre: Optional[str] = None
    imagen: Optional[str] = None
    espacios: Optional[List[EspacioUpdate]] = None


class SectorOut(SectorBase):
    espacios: List[EspacioOut] = []

    class Config:
        orm_mode = True
