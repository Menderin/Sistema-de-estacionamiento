# test_insert.py — correr desde la raíz del proyecto
import sys
sys.path.append("./backend")

from database.database import SessionLocal
from database.models import User, Sector, Espacio, RoleEnum, EstadoEnum
import bcrypt

db = SessionLocal()

try:
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
    print("✅ Datos insertados correctamente")

except Exception as e:
    db.rollback()
    print(f"❌ Error: {e}")

finally:
    db.close()