import argparse
import random
import sys
import time
import os

sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from database.database import Base, SessionLocal, engine
from database.models import Espacio, EstadoEnum, HistorialEspacio


def choose_next_state(current_state):
    if current_state == EstadoEnum.disponible:
        return random.choices(
            [EstadoEnum.ocupado, EstadoEnum.solicitado],
            weights=[75, 25],
            k=1,
        )[0]
    if current_state in (EstadoEnum.ocupado, EstadoEnum.solicitado):
        return EstadoEnum.disponible
    return None


def simulate_once(db):
    espacios = (
        db.query(Espacio)
        .filter(Espacio.estado != EstadoEnum.inhabilitado)
        .all()
    )
    if not espacios:
        return None

    espacio = random.choice(espacios)
    estado_anterior = espacio.estado
    estado_nuevo = choose_next_state(estado_anterior)
    if estado_nuevo is None or estado_nuevo == estado_anterior:
        return None

    observaciones = None
    if estado_nuevo == EstadoEnum.solicitado:
        observaciones = "Solicitud generada por simulacion"

    historial = HistorialEspacio(
        espacio_id=espacio.id,
        estado_anterior=estado_anterior,
        estado_nuevo=estado_nuevo,
        actualizado_por="simulador",
        observaciones=observaciones,
    )
    db.add(historial)

    espacio.estado = estado_nuevo
    espacio.actualizado_por = "simulador"
    espacio.observaciones = observaciones
    db.commit()

    return espacio.id, estado_anterior.value, estado_nuevo.value


def main():
    parser = argparse.ArgumentParser(description="Simula actividad de estacionamientos.")
    parser.add_argument("--iterations", "-n", type=int, default=20, help="Cantidad de cambios a simular.")
    parser.add_argument("--delay", "-d", type=float, default=0, help="Segundos de espera entre cambios.")
    parser.add_argument("--forever", action="store_true", help="Ejecuta la simulacion indefinidamente.")
    parser.add_argument("--initial-delay", type=float, default=0, help="Segundos de espera antes de comenzar.")
    args = parser.parse_args()

    if args.initial_delay > 0:
        print(f"Esperando {args.initial_delay} segundos antes de iniciar simulacion...")
        time.sleep(args.initial_delay)

    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        iteration = 0
        while args.forever or iteration < args.iterations:
            result = simulate_once(db)
            if result:
                espacio_id, before, after = result
                print(f"{espacio_id}: {before} -> {after}")
            else:
                print("Sin espacios disponibles para simular.")
            iteration += 1
            if args.delay > 0:
                time.sleep(args.delay)
    finally:
        db.close()


if __name__ == "__main__":
    main()
