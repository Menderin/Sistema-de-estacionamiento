from typing import List, Optional
from fastapi import APIRouter, Depends, Header, HTTPException, status
from sqlalchemy.orm import Session
from jose import JWTError, jwt
from datetime import datetime

from database.database import get_db
from database.models import Sector, Espacio, HistorialEspacio, User, RoleEnum, EstadoEnum
from utils.security import oauth2_scheme, get_current_user, get_current_admin, SECRET_KEY, ALGORITHM
from .schemas import (
    SectorOut, SectorCreate, SectorUpdate,
    EspacioOut, EspacioCreate, EspacioUpdate, EspacioUpdateEstado
)

router = APIRouter(tags=["Estacionamiento & Sectores"])

# --- ENDPOINTS PÚBLICOS ---

@router.get("/sectores", response_model=List[SectorOut])
def list_sectores(db: Session = Depends(get_db)):
    """Consulta pública: Retorna la lista de todos los sectores con sus espacios (sin autenticación)."""
    return db.query(Sector).order_by(Sector.id).all()

@router.get("/sectores/{sector_id}", response_model=SectorOut)
def get_sector(sector_id: str, db: Session = Depends(get_db)):
    """Consulta pública: Retorna un sector específico con el estado actual de sus espacios."""
    sector = db.query(Sector).filter(Sector.id == sector_id).first()
    if not sector:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Sector con ID '{sector_id}' no encontrado"
        )
    return sector

# --- CAMBIO DE ESTADO (MÚLTIPLE ACTOR: SISTEMA O ADMIN) ---

@router.put("/espacios/{espacio_id}/estado", response_model=EspacioOut)
def update_espacio_estado(
    espacio_id: str,
    update_data: EspacioUpdateEstado,
    x_cambio_por: Optional[str] = Header(None, alias="X-Cambio-Por"),
    authorization: Optional[str] = Header(None),
    db: Session = Depends(get_db)
):
    """
    Cambio de Estado de un Espacio.
    
    Permite dos modalidades:
    1. **Automatizada (Sensores IoT)**: Requiere header `X-Cambio-Por: sistema`.
    2. **Manual (Administrador)**: Requiere autenticación JWT de un usuario con rol 'admin'.
    """
    espacio = db.query(Espacio).filter(Espacio.id == espacio_id).first()
    if not espacio:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Espacio de estacionamiento '{espacio_id}' no encontrado"
        )
    
    estado_anterior = espacio.estado
    actualizado_por = None
    
    # Flujo 1: Cambio por Sistema (Sensor)
    if x_cambio_por == "sistema":
        actualizado_por = "sistema"
    # Flujo 2: Cambio Manual (Administrador)
    else:
        if not authorization:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Se requiere token de autorización para realizar cambios manuales"
            )
        
        try:
            # Extraer y decodificar el token JWT
            token = authorization.split(" ")[1] if " " in authorization else authorization
            payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
            email: str = payload.get("sub")
            if email is None:
                raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Token no válido")
        except JWTError:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Token de autorización inválido o expirado"
            )
            
        user = db.query(User).filter(User.email == email).first()
        if not user:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Usuario no encontrado")
            
        if user.role != RoleEnum.admin:
            # Si no es admin, solo puede solicitar un espacio, o reportar un problema (dejando el estado igual o pasándolo a inhabilitado si fuera necesario, pero por ahora solo solicitado y mantener estado)
            is_requesting = (update_data.estado == EstadoEnum.solicitado)
            is_reporting = (update_data.estado == espacio.estado and update_data.observaciones is not None)
            
            if not (is_requesting or is_reporting):
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="Acceso denegado: los usuarios solo pueden solicitar espacios o reportar problemas"
                )
            actualizado_por = f"user_{user.id}"
        else:
            actualizado_por = f"admin_{user.id}"
    
    # Realizar el cambio de estado o guardar nuevas observaciones
    # Se añade OR True para asegurar que siempre entre si se envían observaciones o foto como None (para limpiar)
    if espacio.estado != update_data.estado or update_data.observaciones is not None or update_data.foto_base64 is not None:
        # Registrar en Historial de Auditoría (Capa 2)
        historial = HistorialEspacio(
            espacio_id=espacio.id,
            estado_anterior=estado_anterior,
            estado_nuevo=update_data.estado,
            actualizado_por=actualizado_por,
            observaciones=update_data.observaciones,
            foto_base64=update_data.foto_base64
        )
        db.add(historial)
        
        espacio.estado = update_data.estado
        espacio.actualizado_por = actualizado_por

        # Actualizar observaciones (permitir limpiar con null/vacio)
        espacio.observaciones = update_data.observaciones if update_data.observaciones != "" else None

        # Actualizar foto (permitir limpiar con null/vacio)
        espacio.foto_base64 = update_data.foto_base64 if update_data.foto_base64 != "" else None

        db.commit()
        db.refresh(espacio)
        
    return espacio

# --- ENDPOINTS ADMINISTRATIVOS EXTRA PARA SECTORES Y ESPACIOS ---

@router.post("/sectores", response_model=SectorOut, status_code=status.HTTP_201_CREATED)
def create_sector(
    sector_data: SectorCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin)
):
    """Crea un nuevo sector en el campus (solo accesible por Administradores)."""
    existing = db.query(Sector).filter(Sector.id == sector_data.id).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Ya existe un sector con el identificador '{sector_data.id}'"
        )
        
    new_sector = Sector(
        id=sector_data.id,
        nombre=sector_data.nombre,
        imagen=sector_data.imagen
    )
    db.add(new_sector)
    db.commit()
    db.refresh(new_sector)
    return new_sector

@router.put("/sectores/{sector_id}", response_model=SectorOut)
def update_sector(
    sector_id: str,
    sector_data: SectorUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin)
):
    """Actualiza la información de un sector (solo accesible por Administradores)."""
    sector = db.query(Sector).filter(Sector.id == sector_id).first()
    if not sector:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Sector no encontrado")
        
    if sector_data.nombre is not None:
        sector.nombre = sector_data.nombre
    if sector_data.imagen is not None:
        sector.imagen = sector_data.imagen
        
    db.commit()
    db.refresh(sector)
    return sector

@router.delete("/sectores/{sector_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_sector(
    sector_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin)
):
    """Elimina un sector y sus espacios (solo accesible por Administradores)."""
    sector = db.query(Sector).filter(Sector.id == sector_id).first()
    if not sector:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Sector no encontrado")
        
    db.delete(sector)
    db.commit()
    return None

@router.post("/espacios", response_model=EspacioOut, status_code=status.HTTP_201_CREATED)
def create_espacio(
    espacio_data: EspacioCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin)
):
    """Crea un nuevo espacio dentro de un sector existente (solo accesible por Administradores)."""
    # Verificar si el sector existe
    sector_id = espacio_data.id[0] if len(espacio_data.id) > 1 else espacio_data.id
    # En caso de que se configure otro formato, verificamos la existencia
    # del sector referenciado en el schema de creación si tuviera un fk.
    # Usaremos el prefijo o buscaremos por sector_id. En nuestro modelo,
    # el Espacio tiene sector_id. Así que usemos un flujo genérico o
    # permitamos especificar sector_id.
    # Esperamos que el ID de espacio empiece con la letra del sector (ej: A1 -> Sector A).
    # Vamos a derivar sector_id como el primer carácter o requerir que sea válido.
    sector = db.query(Sector).filter(Sector.id == sector_id).first()
    if not sector:
        # Intentamos obtener el primer sector disponible o arrojamos error
        sector = db.query(Sector).first()
        if not sector:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Primero debes crear al menos un Sector"
            )
        sector_id = sector.id

    existing = db.query(Espacio).filter(Espacio.id == espacio_data.id).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Ya existe un espacio con el identificador '{espacio_data.id}'"
        )
        
    new_espacio = Espacio(
        id=espacio_data.id,
        sector_id=sector_id,
        estado=espacio_data.estado,
        actualizado_por=f"admin_{current_user.id}"
    )
    db.add(new_espacio)
    db.commit()
    db.refresh(new_espacio)
    return new_espacio
