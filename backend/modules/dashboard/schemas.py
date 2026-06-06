from __future__ import annotations
from pydantic import BaseModel

class SectorMetric(BaseModel):
    id: str
    nombre: str
    total: int
    disponibles: int
    ocupados: int

class DashboardMetrics(BaseModel):
    total_sectores: int
    total_espacios: int
    ocupados: int
    disponibles: int
    ocupacion_pct: float
    sectores: list[SectorMetric] = []
    sector_recomendado: str | None = None