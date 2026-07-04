// scripts/config.js
const DEFAULT_API_BASE = "https://sistema-de-estacionamiento-production-7de7.up.railway.app/api";

export const API_BASE =
    typeof window !== "undefined" && (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1")
        ? "http://127.0.0.1:8000/api"
        : DEFAULT_API_BASE;
