from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from database.database import get_db
from database.models import Sector, Espacio, EstadoEnum, User
from utils.security import get_current_user
from .schemas import DashboardMetrics

router = APIRouter(prefix="/dashboard", tags=["Dashboard"])

@router.get("/metrics", response_model=DashboardMetrics)
def get_dashboard_metrics(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Retorna las métricas de ocupación globales del estacionamiento para el panel (requiere autenticación)."""
    total_sectores = db.query(Sector).count()
    total_espacios = db.query(Espacio).count()
    ocupados = db.query(Espacio).filter(Espacio.estado == EstadoEnum.ocupado).count()
    disponibles = db.query(Espacio).filter(Espacio.estado == EstadoEnum.disponible).count()
    
    ocupacion_pct = 0.0
    if total_espacios > 0:
        ocupacion_pct = round((ocupados / total_espacios) * 100, 2)
        
    return {
        "total_sectores": total_sectores,
        "total_espacios": total_espacios,
        "ocupados": ocupados,
        "disponibles": disponibles,
        "ocupacion_pct": ocupacion_pct
    }
