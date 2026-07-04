from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import sys
import os

# Asegurar que el entorno reconozca el módulo backend
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from database.database import engine
from database.models import Base

# Importar los routers de los módulos
from modules.auth.router import router as auth_router
from modules.parking.router import router as parking_router
from modules.users.router import router as users_router
from modules.dashboard.router import router as dashboard_router

# Crear las tablas en la base de datos si no existen
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="API Estacionamiento UCN CQBO",
    description="Backend modular del sistema de gestión de estacionamientos de la universidad",
    version="1.0.0"
)

# Configuración de CORS de Alta Compatibilidad para Móvil
app.add_middleware(
    CORSMiddleware,
    allow_origin_regex="https?://.*", # Permitir cualquier origen mediante regex para evitar conflictos con credenciales
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Registrar los routers del sistema bajo el prefijo /api
app.include_router(auth_router, prefix="/api")
app.include_router(parking_router, prefix="/api")
app.include_router(users_router, prefix="/api")
app.include_router(dashboard_router, prefix="/api")

@app.get("/", tags=["General"])
def root():
    return {
        "mensaje": "API Estacionamiento activa (Arquitectura Modular)",
        "estado": "Online",
        "documentacion": "/docs"
    }
