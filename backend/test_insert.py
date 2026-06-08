import sys
import os
import bcrypt

# Asegurar que el entorno reconozca los módulos correctos
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from database.database import SessionLocal
from database.models import User, Sector, Espacio, RoleEnum, EstadoEnum

db = SessionLocal()

try:
    # Limpiar tablas existentes para pruebas limpias
    db.query(Espacio).delete()
    db.query(Sector).delete()
    db.query(User).delete()
    db.commit()

    # 1. Insertar un admin
    admin = User(
        nombre="Admin UCN",
        email="admin@ucn.cl",
        password=bcrypt.hashpw("admin123".encode("utf-8"), bcrypt.gensalt()).decode("utf-8"),
        role=RoleEnum.admin,
        activo=True
    )
    db.add(admin)

    # 2. Insertar un sector
    sector_a = Sector(
        id="A",
        nombre="Sector Guacolda",
        imagen=None
    )
    db.add(sector_a)
    db.flush()  # para que sector_a.id esté disponible antes de los espacios

    # 3. Insertar espacios
    for i in range(1, 6):  # A1 a A5
        espacio = Espacio(
            id=f"A{i}",
            sector_id="A",
            estado=EstadoEnum.disponible,
            actualizado_por="sistema"
        )
        db.add(espacio)

    db.commit()
    print("✅ Datos insertados correctamente en la base de datos PostgreSQL")

except Exception as e:
    db.rollback()
    print(f"❌ Error: {e}")

finally:
    db.close()
