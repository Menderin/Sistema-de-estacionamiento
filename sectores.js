import { API_BASE } from "./config.js";
import { sendLocalNotification } from "./notifications.js";

let sectoresData = null;
let favoriteSpace = localStorage.getItem("ucn_favorite_space"); // Cargar favorito guardado

// Cargar datos del API
async function loadSectoresData() {
    try {
        const response = await fetch(`${API_BASE}/sectores`);
        sectoresData = await response.json();
    } catch (error) {
        console.error("Error cargando datos:", error);
    }
}

// Mostrar vista de sector
function showSector(sectorId) {
    const sector = sectoresData.find(s => s.id === sectorId);
    if (!sector) return;

    // Actualizar título
    document.getElementById("sector-title").textContent = `Mapa: ${sector.nombre}`;

    // Generar grilla de espacios
    const grid = document.getElementById("espacios-grid");
    grid.innerHTML = "";
    
    let session = null;
    try { session = JSON.parse(localStorage.getItem("ucn_session")); } catch(e) {}

    sector.espacios.forEach(espacio => {
        const wrapper = document.createElement("div");
        wrapper.className = "relative flex flex-col w-full";

        const spotBtn = document.createElement("div");
        let colorClass = "";
        if (espacio.estado === "disponible") colorClass = "btn-spot-disponible";
        else if (espacio.estado === "ocupado") colorClass = "btn-spot-ocupado";
        else if (espacio.estado === "solicitado") colorClass = "btn-spot-solicitado";
        else if (espacio.estado === "inhabilitado") colorClass = "btn-spot-inhabilitado";

        spotBtn.className = `${colorClass} w-full z-20 relative flex items-center justify-center min-h-[60px]`;
        spotBtn.innerHTML = `
            <span class="block font-black text-xl drop-shadow-sm pointer-events-none">${espacio.id}</span>
            ${favoriteSpace === espacio.id ? '<span class="absolute top-1 right-1 text-xs text-yellow-400 drop-shadow-sm">★</span>' : ''}
        `;
        spotBtn.dataset.espacioId = espacio.id;
        spotBtn.dataset.estado = espacio.estado;

        // Crear Dropdown Menu
        const dropdown = document.createElement("div");
        dropdown.className = "espacio-dropdown absolute top-full mt-2 w-full min-w-[140px] left-1/2 -translate-x-1/2 bg-white rounded-lg shadow-[0_10px_25px_-5px_rgba(0,0,0,0.3)] overflow-hidden transition-all duration-300 ease-in-out max-h-0 opacity-0 pointer-events-none flex flex-col border border-gray-200 divide-y divide-gray-100";

        if (session) {
            const isFav = favoriteSpace === espacio.id;
            const favText = isFav ? "Quitar Favorito" : "Marcar Favorito";
            const favIcon = isFav ? "☆" : "★";

            if (session && session.role === "admin") {
                dropdown.innerHTML = `
                    <button class="w-full text-center px-2 py-3 text-sm font-bold text-yellow-600 hover:bg-yellow-50 btn-fav-toggle" data-id="${espacio.id}">${favIcon} ${favText}</button>
                    <button class="w-full text-center px-2 py-3 text-sm font-bold text-red-600 hover:bg-red-50 btn-action" data-action="ocupado">Ocupar</button>
                    <button class="w-full text-center px-2 py-3 text-sm font-bold text-gray-600 hover:bg-gray-50 btn-action" data-action="inhabilitado">Inhabilitar</button>
                    <button class="w-full text-center px-2 py-3 text-sm font-bold text-green-600 hover:bg-green-50 btn-action" data-action="disponible">Liberar</button>
                `;
            } else {
                let html = "";
                html += `<button class="w-full text-center px-2 py-3 text-sm font-bold text-yellow-600 hover:bg-yellow-50 btn-fav-toggle" data-id="${espacio.id}">${favIcon} ${favText}</button>`;
                if (espacio.estado === "disponible") {
                    html += `<button class="w-full text-center px-2 py-3 text-sm font-bold text-blue-600 hover:bg-blue-50 btn-action" data-action="solicitado">Solicitar</button>`;
                }
                html += `<button class="w-full text-center px-2 py-3 text-sm font-bold text-orange-600 hover:bg-orange-50 btn-action" data-action="reportar">Reportar</button>`;
                dropdown.innerHTML = html;
            }

            // Evento para el botón de favorito dentro del menú
            dropdown.querySelector(".btn-fav-toggle").addEventListener("click", (e) => {
                e.stopPropagation();
                toggleFavorite(espacio.id);
            });

            dropdown.querySelectorAll(".btn-action").forEach(btn => {
                btn.addEventListener("click", async (e) => {
                    e.stopPropagation(); // Evitar cerrar el menu inmediatamente al clickear
                    const action = btn.dataset.action;
                    if (action === "reportar") {
                        const obs = prompt("Describe el problema encontrado en el espacio:");
                        if (obs) {
                            // Preguntar si quiere tomar una foto (Capacitor)
                            let foto = null;
                            if (window.Capacitor) {
                                if (confirm("¿Quieres adjuntar una foto del problema?")) {
                                    foto = await takeReportPhoto();
                                }
                            }
                            updateEspacioState(espacio.id, espacio.estado, `Reporte: ${obs}`, foto);
                        }
                    } else {
                        updateEspacioState(espacio.id, action);
                    }
                });
            });
        }

        spotBtn.addEventListener("click", (e) => {
            e.stopPropagation();
            if (!session) {
                alert(translations[currentLang]?.alert_login || "Debes iniciar sesión para realizar acciones sobre un espacio.");
                return;
            }

            // Cerrar otros dropdowns y resetear z-index
            document.querySelectorAll('.espacio-dropdown').forEach(d => {
                if (d !== dropdown) {
                    d.classList.remove("max-h-64", "opacity-100", "pointer-events-auto");
                    d.classList.add("max-h-0", "opacity-0", "pointer-events-none");
                    d.parentElement.classList.remove("z-50");
                    d.parentElement.classList.add("z-10");
                }
            });

            // Toggle este dropdown
            if (dropdown.classList.contains("max-h-0")) {
                dropdown.classList.remove("max-h-0", "opacity-0", "pointer-events-none");
                dropdown.classList.add("max-h-64", "opacity-100", "pointer-events-auto");
                wrapper.classList.remove("z-10");
                wrapper.classList.add("z-50");
                grid.style.paddingBottom = "160px";
            } else {
                dropdown.classList.add("max-h-0", "opacity-0", "pointer-events-none");
                dropdown.classList.remove("max-h-64", "opacity-100", "pointer-events-auto");
                wrapper.classList.remove("z-50");
                wrapper.classList.add("z-10");
                grid.style.paddingBottom = "0px";
            }
        });

        wrapper.classList.add("z-10");
        wrapper.appendChild(spotBtn);
        wrapper.appendChild(dropdown);
        grid.appendChild(wrapper);
    });

    // Cambiar vistas
    document.getElementById("sectores-view").classList.add("hidden");
    document.getElementById("sector-view").classList.remove("hidden");

    if (typeof applyTranslations === "function") applyTranslations();
}

// Nueva función centralizada para favoritos
function toggleFavorite(id) {
    if (favoriteSpace === id) {
        favoriteSpace = null;
        localStorage.removeItem("ucn_favorite_space");
    } else {
        favoriteSpace = id;
        localStorage.setItem("ucn_favorite_space", id);
    }
    // Refrescar la vista actual para actualizar las estrellitas y el menú
    const sectorPrefix = id.charAt(0);
    showSector(sectorPrefix);
}

// Función para monitorear el favorito
async function checkFavoriteStatus() {
    if (!favoriteSpace) return;

    try {
        const response = await fetch(`${API_BASE}/sectores`);
        const data = await response.json();

        // Buscar el espacio favorito en todos los sectores
        let foundSpace = null;
        data.forEach(sector => {
            const match = sector.espacios.find(e => e.id === favoriteSpace);
            if (match) foundSpace = match;
        });

        if (foundSpace) {
            const lastStatus = localStorage.getItem("ucn_fav_last_status");
            if (lastStatus === "ocupado" && foundSpace.estado === "disponible") {
                sendLocalNotification(
                    "¡Espacio Disponible!",
                    `Tu lugar favorito ${foundSpace.id} se ha desocupado.`
                );
            }
            localStorage.setItem("ucn_fav_last_status", foundSpace.estado);
        }
    } catch (e) {
        console.warn("Error monitoreando favorito:", e);
    }
}

// Iniciar monitoreo cada 10 segundos
setInterval(checkFavoriteStatus, 10000);

// Volver a vista de sectores
function showSectores() {
    document.getElementById("sector-view").classList.add("hidden");
    document.getElementById("sectores-view").classList.remove("hidden");
}

// Eliminar lógica antigua del modal
function closeAllDropdowns() {
    document.querySelectorAll('.espacio-dropdown').forEach(d => {
        d.classList.remove("max-h-64", "opacity-100", "pointer-events-auto");
        d.classList.add("max-h-0", "opacity-0", "pointer-events-none");
        if (d.parentElement) {
            d.parentElement.classList.remove("z-50");
            d.parentElement.classList.add("z-10");
        }
    });
    const grid = document.getElementById("espacios-grid");
    if (grid) grid.style.paddingBottom = "0px";
}

// Cerrar al clickear fuera
document.addEventListener("click", () => {
    closeAllDropdowns();
});

// Actualizar estado API
async function updateEspacioState(espacioId, estado, observaciones = null, foto = null) {
    const session = JSON.parse(localStorage.getItem("ucn_session"));
    if (!session) return;

    try {
        const payload = { estado: estado };
        if (observaciones) payload.observaciones = observaciones;
        if (foto) payload.foto_base64 = foto;

        const res = await fetch(`${API_BASE}/espacios/${espacioId}/estado`, {
            method: "PUT",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${session.access_token}`
            },
            body: JSON.stringify(payload)
        });

        if (!res.ok) {
            const errorText = await res.text();
            console.error(`[ERROR API] Status: ${res.status}, Body: ${errorText}`);
            alert(`Error del servidor (${res.status}): No se pudo guardar el reporte.`);
            return;
        }

        // Refrescar datos y UI
        closeAllDropdowns();
        await loadSectoresData();
        
        // Encontrar el sector actual activo para refrescarlo
        const sectorPrefix = espacioId.charAt(0); // A1 -> A
        showSector(sectorPrefix);
    } catch (error) {
        console.error("Error al actualizar:", error);
        alert("Error de conexión con el servidor");
    }
}

// Función para tomar foto con la cámara (Capacitor)
async function takeReportPhoto() {
    try {
        const Camera = window.Capacitor.Plugins.Camera;
        const image = await Camera.getPhoto({
            quality: 30, // Calidad ultra-baja para asegurar que pase el límite de tamaño
            allowEditing: false,
            resultType: "base64",
            source: "camera",
            width: 600 // Ancho máximo de 600px
        });
        return `data:image/${image.format};base64,${image.base64String}`;
    } catch (e) {
        console.warn("Cámara cancelada o no disponible.");
        return null;
    }
}

// Event listeners
document.addEventListener("DOMContentLoaded", async () => {
    await loadSectoresData();

    // Agregar event listeners a las tarjetas de sector
    document.querySelectorAll(".sector-card button").forEach(button => {
        button.addEventListener("click", (e) => {
            const sectorId = e.target.closest(".sector-card").dataset.sector;
            showSector(sectorId);
        });
    });

    // Botón de volver
    document.getElementById("back-btn").addEventListener("click", showSectores);
});
