from sqlalchemy import create_engine, inspect, text
from sqlalchemy.orm import sessionmaker, declarative_base
import os

DATABASE_URL = os.getenv("DATABASE_URL") or "sqlite:///./estacionamiento.db"

if DATABASE_URL.startswith("postgres") or DATABASE_URL.startswith("postgresql"):
    try:
        engine = create_engine(DATABASE_URL)
        with engine.connect() as connection:
            connection.execute(text("SELECT 1"))
    except Exception:
        DATABASE_URL = "sqlite:///./estacionamiento.db"
        engine = create_engine(
            DATABASE_URL,
            connect_args={"check_same_thread": False}
        )
else:
    engine = create_engine(
        DATABASE_URL,
        connect_args={"check_same_thread": False} if DATABASE_URL.startswith("sqlite") else {}
    )

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

def ensure_sector_coordinates_columns():
    inspector = inspect(engine)
    if "sectores" not in inspector.get_table_names():
        return

    existing_columns = {column["name"] for column in inspector.get_columns("sectores")}
    if "latitud" not in existing_columns or "longitud" not in existing_columns:
        with engine.begin() as connection:
            if "latitud" not in existing_columns:
                connection.execute(text("ALTER TABLE sectores ADD COLUMN latitud FLOAT"))
            if "longitud" not in existing_columns:
                connection.execute(text("ALTER TABLE sectores ADD COLUMN longitud FLOAT"))


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()