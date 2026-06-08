// scripts/config.js
const hostname = window.location.hostname;
// Si accedemos por localhost, usa localhost. Si accedemos por IP (celular), usa esa misma IP.
export const API_BASE = `http://${hostname}:8000/api`;
