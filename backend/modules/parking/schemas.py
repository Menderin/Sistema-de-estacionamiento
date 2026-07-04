from __future__ import annotations

from datetime import datetime
from enum import Enum
from typing import List, Optional

from pydantic import BaseModel


class Estado(str, Enum):
    disponible = "disponible"
    ocupado = "ocupado"
    solicitado = "solicitado"
    inhabilitado = "inhabilitado"


class EspacioBase(BaseModel):
    id: str
    estado: Estado = Estado.disponible


class EspacioCreate(EspacioBase):
    pass


class EspacioUpdate(BaseModel):
    estado: Optional[Estado] = None


class EspacioUpdateEstado(BaseModel):
    """Schema para cambiar estado de espacio (solo admins/sistema)."""
    estado: Estado
    observaciones: Optional[str] = None
    foto_base64: Optional[str] = None


class EspacioOut(BaseModel):
    id: str
    estado: Estado
    actualizado_por: str  # 'sistema' | 'admin_<id>' | email
    actualizado_en: datetime
    observaciones: Optional[str] = None
    foto_base64: Optional[str] = None

    model_config = {"from_attributes": True}


class SectorBase(BaseModel):
    id: str
    nombre: str
    lat: Optional[float] = None
    lng: Optional[float] = None
    imagen: Optional[str] = None


class SectorCreate(SectorBase):
    espacios: Optional[List[EspacioCreate]] = []


class SectorUpdate(BaseModel):
    nombre: Optional[str] = None
    imagen: Optional[str] = None


class SectorOut(SectorBase):
    creado_en: datetime
    actualizado_en: datetime
    espacios: List[EspacioOut] = []

    model_config = {"from_attributes": True}
