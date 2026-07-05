import sys
import os
from sqlalchemy import text

# Asegurar que el entorno reconozca el módulo backend
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from database.database import engine

def update_schema():
    print("Iniciando actualización de esquema de base de datos...")
    with engine.connect() as conn:
        # 1. Agregar columna foto_base64 a tabla espacios
        try:
            conn.execute(text("ALTER TABLE espacios ADD COLUMN IF NOT EXISTS foto_base64 TEXT;"))
            print("OK: Columna 'foto_base64' verificada/agregada en tabla 'espacios'.")
        except Exception as e:
            print(f"Error al actualizar tabla 'espacios': {e}")

        # 2. Agregar columna foto_base64 a tabla historial_espacios
        try:
            conn.execute(text("ALTER TABLE historial_espacios ADD COLUMN IF NOT EXISTS foto_base64 TEXT;"))
            print("OK: Columna 'foto_base64' verificada/agregada en tabla 'historial_espacios'.")
        except Exception as e:
            print(f"Error al actualizar tabla 'historial_espacios': {e}")

        conn.commit()
    print("Actualización completada.")

if __name__ == "__main__":
    update_schema()
