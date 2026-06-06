import sys
import os

# Set up the path to import database and models
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from database.database import SessionLocal
from database.models import Sector, Espacio, EstadoEnum

def seed_sectores():
    db = SessionLocal()
    
    sectores_data = [
        {"id": "B", "nombre": "Sector G5", "num_espacios": 5},
        {"id": "C", "nombre": "Sector Vicerrectoría", "num_espacios": 5},
        {"id": "D", "nombre": "Sector G6", "num_espacios": 5}
    ]
    
    for s_data in sectores_data:
        sector_id = s_data["id"]
        # Check if sector exists
        sector = db.query(Sector).filter(Sector.id == sector_id).first()
        if not sector:
            sector = Sector(id=sector_id, nombre=s_data["nombre"])
            db.add(sector)
            db.commit()
            print(f"Sector {sector.nombre} ({sector_id}) created.")
        else:
            print(f"Sector {sector.nombre} ({sector_id}) already exists.")
            
        # Create spaces
        for i in range(1, s_data["num_espacios"] + 1):
            espacio_id = f"{sector_id}{i}"
            espacio = db.query(Espacio).filter(Espacio.id == espacio_id).first()
            if not espacio:
                espacio = Espacio(
                    id=espacio_id,
                    sector_id=sector_id,
                    estado=EstadoEnum.disponible,
                    actualizado_por="sistema"
                )
                db.add(espacio)
        
        db.commit()
        print(f"Espacios for {sector.nombre} verified/created.")

    db.close()
    print("Database seeding for sectors completed.")

if __name__ == "__main__":
    seed_sectores()
