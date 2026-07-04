import sys
import os

# Set up the path to import database and models
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from database.database import Base, SessionLocal, engine
from database.models import Sector, Espacio, EstadoEnum

def seed_sectores():
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    
    sectores_data = [
        {"id": "A", "nombre": "Sector Guacolda", "num_espacios": 40, "latitud": -29.9645, "longitud": -71.3485},
        {"id": "B", "nombre": "Sector G5", "num_espacios": 40, "latitud": -29.9652, "longitud": -71.3492},
        {"id": "C", "nombre": "Sector Vicerrectoría", "num_espacios": 40, "latitud": -29.9638, "longitud": -71.3478},
        {"id": "D", "nombre": "Sector G6", "num_espacios": 40, "latitud": -29.9660, "longitud": -71.3501}
    ]
    
    for s_data in sectores_data:
        sector_id = s_data["id"]
        sector = db.query(Sector).filter(Sector.id == sector_id).first()
        if not sector:
            sector = Sector(
                id=sector_id,
                nombre=s_data["nombre"],
                latitud=s_data.get("latitud"),
                longitud=s_data.get("longitud")
            )
            db.add(sector)
            db.commit()
            print(f"Sector {sector.nombre} ({sector_id}) created.")
        else:
            sector.nombre = s_data["nombre"]
            sector.latitud = s_data.get("latitud")
            sector.longitud = s_data.get("longitud")
            db.commit()
            print(f"Sector {sector.nombre} ({sector_id}) updated with coordinates.")
            
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
