import os
from dotenv import load_dotenv

# Cargar el archivo .env desde el directorio de la base de datos
backend_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
env_path = os.path.join(backend_dir, "database", ".env")
if os.path.exists(env_path):
    load_dotenv(dotenv_path=env_path)
else:
    load_dotenv()

class Settings:
    DATABASE_URL: str = os.getenv("DATABASE_URL", "sqlite:///./estacionamiento.db")
    SECRET_KEY: str = os.getenv("SECRET_KEY", "3ddd100a30814f6ccf4ddeaf9caa7623")
    DEBUG: bool = os.getenv("DEBUG", "True").lower() in ("true", "1", "t", "yes")

settings = Settings()
