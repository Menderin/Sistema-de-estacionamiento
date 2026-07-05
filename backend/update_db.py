import sys
import os
from sqlalchemy import text

# Asegurar que el entorno reconozca el módulo backend
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from database.database import engine
from database.models import Base

def update_schema():
    print("Iniciando actualización de esquema...")
    
    # 1. Crear tablas si no existen
    Base.metadata.create_all(bind=engine)
    print("Tablas base verificadas/creadas.")

    with engine.connect() as conn:
        # 2. Agregar columna foto_base64 a tabla espacios
        try:
            conn.execute(text("ALTER TABLE espacios ADD COLUMN foto_base64 TEXT;"))
            print("OK: Columna 'foto_base64' agregada a 'espacios'.")
        except Exception:
            print("Info: La columna 'foto_base64' ya existe en 'espacios'.")

        # 3. Agregar columna foto_base64 a tabla historial_espacios
        try:
            conn.execute(text("ALTER TABLE historial_espacios ADD COLUMN foto_base64 TEXT;"))
            print("OK: Columna 'foto_base64' agregada a 'historial_espacios'.")
        except Exception:
            print("Info: La columna 'foto_base64' ya existe en 'historial_espacios'.")
        
        conn.commit()
    print("Proceso completado.")

if __name__ == "__main__":
    update_schema()