from __future__ import annotations

from pydantic import BaseModel


class DashboardMetrics(BaseModel):
    total_sectores: int
    total_espacios: int
    ocupados: int
    disponibles: int
    ocupacion_pct: float
