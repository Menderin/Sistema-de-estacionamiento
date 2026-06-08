let sectoresData = null;

// Cargar datos del API
async function loadSectoresData() {
    try {
        const response = await fetch("http://localhost:8000/api/sectores");
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

        spotBtn.className = `${colorClass} w-full z-20 relative`;
        spotBtn.innerHTML = `<span class="block font-black text-xl drop-shadow-sm pointer-events-none">${espacio.id}</span>`;
        spotBtn.dataset.espacioId = espacio.id;
        spotBtn.dataset.estado = espacio.estado;

        // Crear Dropdown Menu
        const dropdown = document.createElement("div");
        dropdown.className = "espacio-dropdown absolute top-full mt-2 w-full min-w-[140px] left-1/2 -translate-x-1/2 bg-white rounded-lg shadow-[0_10px_25px_-5px_rgba(0,0,0,0.3)] overflow-hidden transition-all duration-300 ease-in-out max-h-0 opacity-0 pointer-events-none flex flex-col border border-gray-200 divide-y divide-gray-100";

        if (session) {
            if (session && session.role === "admin") {
                dropdown.innerHTML = `
                    <button class="w-full text-center px-2 py-3 text-sm font-bold text-red-600 hover:bg-red-50 hover:text-red-700 transition-colors btn-action dark:text-red-400 dark:hover:bg-red-900/30" data-action="ocupado" data-i18n="btn_ocupar">Ocupar</button>
                    <button class="w-full text-center px-2 py-3 text-sm font-bold text-gray-600 hover:bg-gray-50 hover:text-gray-700 transition-colors btn-action dark:text-gray-300 dark:hover:bg-gray-700" data-action="inhabilitado" data-i18n="btn_inhabilitar">Inhabilitar</button>
                    <button class="w-full text-center px-2 py-3 text-sm font-bold text-green-600 hover:bg-green-50 hover:text-green-700 transition-colors btn-action dark:text-green-400 dark:hover:bg-green-900/30" data-action="disponible" data-i18n="btn_liberar">Liberar</button>
                `;
            } else {
                let html = "";
                if (espacio.estado === "disponible") {
                    html += `<button class="w-full text-center px-2 py-3 text-sm font-bold text-blue-600 hover:bg-blue-50 hover:text-blue-700 transition-colors btn-action dark:text-blue-400 dark:hover:bg-blue-900/30" data-action="solicitado" data-i18n="btn_solicitar">Solicitar</button>`;
                }
                html += `<button class="w-full text-center px-2 py-3 text-sm font-bold text-yellow-600 hover:bg-yellow-50 hover:text-yellow-700 transition-colors btn-action dark:text-yellow-400 dark:hover:bg-yellow-900/30" data-action="reportar" data-i18n="btn_reportar">Reportar</button>`;
                dropdown.innerHTML = html;
            }
            
            // Asignar eventos a los botones generados
            dropdown.querySelectorAll(".btn-action").forEach(btn => {
                btn.addEventListener("click", (e) => {
                    e.stopPropagation(); // Evitar cerrar el menu inmediatamente al clickear
                    const action = btn.dataset.action;
                    if (action === "reportar") {
                        const obs = prompt("Describe el problema encontrado en el espacio:");
                        if (obs) updateEspacioState(espacio.id, espacio.estado, `Reporte: ${obs}`);
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
async function updateEspacioState(espacioId, estado, observaciones = null) {
    const session = JSON.parse(localStorage.getItem("ucn_session"));
    if (!session) return;

    try {
        const payload = { estado: estado };
        if (observaciones) payload.observaciones = observaciones;

        const res = await fetch(`http://localhost:8000/api/espacios/${espacioId}/estado`, {
            method: "PUT",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${session.access_token}`
            },
            body: JSON.stringify(payload)
        });

        if (!res.ok) {
            const err = await res.json();
            alert("Error: " + (err.detail || "No se pudo actualizar"));
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
