from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session

import os
from database.database import get_db
from database.models import User, RoleEnum
from utils.security import create_access_token, verify_password, hash_password
from .schemas import LoginRequest, Token, GoogleLoginRequest

from google.oauth2 import id_token
from google.auth.transport import requests
import uuid

router = APIRouter(prefix="/auth", tags=["Autenticación"])

@router.post("/login", response_model=Token)
def login(login_data: LoginRequest, db: Session = Depends(get_db)):
    """Inicia sesión con credenciales JSON (email y password)."""
    user = db.query(User).filter(User.email == login_data.email).first()
    if not user or not verify_password(login_data.password, user.password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Credenciales de acceso incorrectas",
            headers={"WWW-Authenticate": "Bearer"},
        )
    if not user.activo:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="La cuenta se encuentra desactivada"
        )
    
    access_token = create_access_token(data={"sub": user.email})
    return {"access_token": access_token, "token_type": "bearer"}

@router.post("/login/form", response_model=Token, include_in_schema=False)
def login_form(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    """Inicia sesión usando formulario estándar (para soporte en FastAPI Docs /docs)."""
    user = db.query(User).filter(User.email == form_data.username).first()
    if not user or not verify_password(form_data.password, user.password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Credenciales de acceso incorrectas",
            headers={"WWW-Authenticate": "Bearer"},
        )
    if not user.activo:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="La cuenta se encuentra desactivada"
        )
    
    access_token = create_access_token(data={"sub": user.email})
    return {"access_token": access_token, "token_type": "bearer"}

@router.post("/google", response_model=Token)
def google_login(login_data: GoogleLoginRequest, db: Session = Depends(get_db)):
    """Inicia sesión o registra un usuario mediante Google OAuth2."""
    client_id = os.getenv("GOOGLE_CLIENT_ID")
    if not client_id:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Google Client ID no configurado en el servidor"
        )

    try:
        idinfo = id_token.verify_oauth2_token(
            login_data.token,
            requests.Request(),
            client_id,  # necesario para que Google valide el token
            clock_skew_in_seconds=10
        )
        email = idinfo.get("email")
        name = idinfo.get("name", "Usuario Google")

        if not email:
            raise HTTPException(status_code=400, detail="El token de Google no contiene email")

    except Exception as e:
        print(f"[GOOGLE AUTH ERROR] {str(e)}")  
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token de Google inválido o expirado"
        )

    user = db.query(User).filter(User.email == email).first()

    if not user:
        user = User(
            nombre=name,
            email=email,
            password=hash_password(str(uuid.uuid4())), 
            role=RoleEnum.user,
            activo=True
        )
        db.add(user)
        db.commit()
        db.refresh(user)

    elif not user.activo:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="La cuenta se encuentra desactivada"
        )

    access_token = create_access_token(data={"sub": user.email})
    return {"access_token": access_token, "token_type": "bearer"}
