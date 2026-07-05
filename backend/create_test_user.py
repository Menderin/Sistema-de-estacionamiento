import sys
import os

# Set up the path to import database and models
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from database.database import Base, SessionLocal, engine
from database.models import User, RoleEnum
from utils.security import hash_password

def main():
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    email = "user@estacionamientoucn.com"
    password = "user123"

    user = db.query(User).filter(User.email == email).first()
    if not user:
        user = User(
            nombre="Usuario de Prueba",
            email=email,
            password=hash_password(password),
            role=RoleEnum.user,
            activo=True
        )
        db.add(user)
        db.commit()
        print(f"Test user '{email}' created successfully.")
    else:
        user.role = RoleEnum.user
        user.password = hash_password(password)
        db.commit()
        print(f"Test user '{email}' already exists. Role and password updated.")

    db.close()

if __name__ == "__main__":
    main()
