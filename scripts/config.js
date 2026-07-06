// scripts/config.js
// Configuración para Producción (Railway)
export const API_BASE = "https://sistema-de-estacionamiento-production-7de7.up.railway.app/api";

// Coordenadas aproximadas de los sectores en UCN Coquimbo
export const SECTOR_COORDINATES = {
    "A": { lat: -29.96282203969842, lng: -71.34783321868933, nombre: "Guacolda" },
    "B": { lat: -29.96405771015899, lng: -71.34887826146702, nombre: "G5" },
    "C": { lat: -29.964616401036675, lng: -71.34786670686655, nombre: "Vicerrectoría" },
    "D": { lat: -29.963940470532304, lng: -71.34800765390582, nombre: "G6" }
};

/*
// Si quieres usarlo en local, comenta la línea de arriba y usa esta:
const hostname = window.location.hostname;
export const API_BASE = `http://${hostname}:8000/api`;
*/
