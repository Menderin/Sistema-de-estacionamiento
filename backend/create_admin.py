import sys
import os

# Set up the path to import database and models
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from database.database import SessionLocal
from database.models import User, RoleEnum
from utils.security import hash_password

def main():
    db = SessionLocal()
    email = "admin@estacionamientoucn.com"
    password = "estacionamiento202601"
    
    user = db.query(User).filter(User.email == email).first()
    if not user:
        user = User(
            nombre="Administrador",
            email=email,
            password=hash_password(password),
            role=RoleEnum.admin,
            activo=True
        )
        db.add(user)
        db.commit()
        print(f"Admin user '{email}' created successfully.")
    else:
        user.role = RoleEnum.admin
        user.password = hash_password(password)
        db.commit()
        print(f"Admin user '{email}' already exists. Role and password updated.")
    
    db.close()

if __name__ == "__main__":
    main()
