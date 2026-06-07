from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from database.database import get_db
from database.models import User, RoleEnum
from utils.security import get_current_user, get_current_admin, hash_password
from .schemas import UserCreate, UserUpdate, UserOut

router = APIRouter(prefix="/users", tags=["Usuarios"])

@router.get("/me", response_model=UserOut)
def read_current_user(current_user: User = Depends(get_current_user)):
    """Retorna la información del usuario actualmente autenticado."""
    return current_user

@router.get("/", response_model=List[UserOut])
def read_all_users(
    db: Session = Depends(get_db), 
    current_user: User = Depends(get_current_admin)
):
    """Retorna todos los usuarios del sistema (solo accesible por Administradores)."""
    return db.query(User).order_by(User.id).all()

@router.post("/", response_model=UserOut, status_code=status.HTTP_201_CREATED)
def create_user(
    user_data: UserCreate, 
    db: Session = Depends(get_db), 
    current_user: User = Depends(get_current_admin)
):
    """Crea un nuevo usuario en el sistema (solo accesible por Administradores)."""
    existing_user = db.query(User).filter(User.email == user_data.email).first()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Ya existe un usuario registrado con este correo electrónico"
        )
    
    new_user = User(
        nombre=user_data.nombre,
        email=user_data.email,
        password=hash_password(user_data.password),
        role=user_data.role,
        activo=True
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    return new_user

@router.put("/{user_id}", response_model=UserOut)
def update_user(
    user_id: int, 
    user_data: UserUpdate, 
    db: Session = Depends(get_db), 
    current_user: User = Depends(get_current_admin)
):
    """Actualiza la información de un usuario (solo accesible por Administradores)."""
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Usuario no encontrado"
        )
    
    if user_data.nombre is not None:
        user.nombre = user_data.nombre
    if user_data.email is not None:
        existing = db.query(User).filter(User.email == user_data.email, User.id != user_id).first()
        if existing:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="El correo electrónico ya está en uso por otro usuario"
            )
        user.email = user_data.email
    if user_data.role is not None:
        user.role = user_data.role
    if user_data.activo is not None:
        if user.id == current_user.id and not user_data.activo:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="No puedes desactivar tu propia cuenta de administrador"
            )
        user.activo = user_data.activo
        
    db.commit()
    db.refresh(user)
    return user
