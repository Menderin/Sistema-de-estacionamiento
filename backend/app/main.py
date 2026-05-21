from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import sys
import os

# Asegurar que el entorno reconozca el mÃ³dulo backend
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from database.database import engine
from database.models import Base

# Crear las tablas en la base de datos si no existen
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="API Estacionamiento UCN CQBO",
    description="Backend modular del sistema de gestión de estacionamientos",
    version="1.0.0"
)

# Configuración de CORS para permitir peticiones desde el frontend estático
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # En producción cambiar por la URL específica del frontend (ej: http://localhost:3000)
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def root():
    return {"mensaje": "API Estacionamiento activa (Arquitectura Modular)"}
