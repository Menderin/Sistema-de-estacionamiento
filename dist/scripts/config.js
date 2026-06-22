// scripts/config.js
// Configuración para Producción (Railway)
export const API_BASE = "https://sistema-de-estacionamiento-production-7de7.up.railway.app/api";

/*
// Si quieres usarlo en local, comenta la línea de arriba y usa esta:
const hostname = window.location.hostname;
export const API_BASE = `http://${hostname}:8000/api`;
*/

// Coordenadas aproximadas de los sectores en UCN Coquimbo
export const SECTOR_COORDINATES = {
    "A": { lat: -29.9645, lng: -71.3485, nombre: "Guacolda" },
    "B": { lat: -29.9652, lng: -71.3492, nombre: "G5" },
    "C": { lat: -29.9638, lng: -71.3478, nombre: "Vicerrectoría" },
    "D": { lat: -29.9660, lng: -71.3501, nombre: "G6" }
    };