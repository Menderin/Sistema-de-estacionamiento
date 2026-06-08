import sys
import os

sys.path.append(os.path.dirname(os.path.abspath(__file__)))
from database.database import engine
from sqlalchemy import text

def update():
    with engine.connect() as conn:
        try:
            conn.execute(text("ALTER TYPE estadoenum ADD VALUE 'solicitado'"))
            conn.commit()
            print("Added solicitado")
        except Exception as e:
            print(e)
            
        try:
            conn.execute(text("ALTER TYPE estadoenum ADD VALUE 'inhabilitado'"))
            conn.commit()
            print("Added inhabilitado")
        except Exception as e:
            print(e)

if __name__ == "__main__":
    update()
