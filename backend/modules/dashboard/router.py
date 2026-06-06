from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
import os

from database.database import get_db
from database.models import Sector, Espacio, EstadoEnum, User
from utils.security import get_current_user
from .schemas import DashboardMetrics

router = APIRouter(prefix="/dashboard", tags=["Dashboard"])

@router.get("/config", tags=["Config"])
def get_public_config():
    """Retorna configuración pública del sistema (sin autenticación)."""
    return {
        "google_client_id": os.getenv("GOOGLE_CLIENT_ID", "")
    }

@router.get("/metrics", response_model=DashboardMetrics)
def get_dashboard_metrics(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    total_sectores = db.query(Sector).count()
    total_espacios = db.query(Espacio).count()
    ocupados = db.query(Espacio).filter(Espacio.estado == EstadoEnum.ocupado).count()
    disponibles = db.query(Espacio).filter(Espacio.estado == EstadoEnum.disponible).count()

    ocupacion_pct = 0.0
    if total_espacios > 0:
        ocupacion_pct = round((ocupados / total_espacios) * 100, 2)

    # Métricas por sector
    sectores = db.query(Sector).all()
    sectores_metrics = []
    sector_recomendado = None
    max_disponibles = -1

    for sector in sectores:
        total = len(sector.espacios)
        disp = sum(1 for e in sector.espacios if e.estado == EstadoEnum.disponible)
        ocup = total - disp
        sectores_metrics.append({
            "id": sector.id,
            "nombre": sector.nombre,
            "total": total,
            "disponibles": disp,
            "ocupados": ocup
        })
        if disp > max_disponibles:
            max_disponibles = disp
            sector_recomendado = sector.nombre

    return {
        "total_sectores": total_sectores,
        "total_espacios": total_espacios,
        "ocupados": ocupados,
        "disponibles": disponibles,
        "ocupacion_pct": ocupacion_pct,
        "sectores": sectores_metrics,
        "sector_recomendado": sector_recomendado
    }