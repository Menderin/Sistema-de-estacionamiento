import sqlite3
import os

db_path = "estacionamiento.db"
if not os.path.exists(db_path):
    print(f"Database not found at {db_path}")
else:
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()

    print("--- Table: espacios ---")
    cursor.execute("PRAGMA table_info(espacios)")
    columns = cursor.fetchall()
    for col in columns:
        print(col)

    print("\n--- Table: historial_espacios ---")
    cursor.execute("PRAGMA table_info(historial_espacios)")
    columns = cursor.fetchall()
    for col in columns:
        print(col)

    conn.close()
