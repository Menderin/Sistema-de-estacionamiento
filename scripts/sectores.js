import { API_BASE, SECTOR_COORDINATES } from "./config.js";
import { sendLocalNotification } from "./notifications.js";

let sectoresData = null;
let favoriteSpace = localStorage.getItem("ucn_favorite_space"); // Cargar favorito guardado
let mapInstance = null;
let mapMarkers = {};
let routingControl = null;
let userMarker = null;
let currentActiveSectorId = null;

const SECTOR_COORDS = {
    'A': [SECTOR_COORDINATES['A'].lat, SECTOR_COORDINATES['A'].lng],
    'B': [SECTOR_COORDINATES['B'].lat, SECTOR_COORDINATES['B'].lng],
    'C': [SECTOR_COORDINATES['C'].lat, SECTOR_COORDINATES['C'].lng],
    'D': [SECTOR_COORDINATES['D'].lat, SECTOR_COORDINATES['D'].lng]
};

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
function showSector(sectorId, isAutoRefresh = false) {
    const sector = sectoresData.find(s => s.id === sectorId);
    if (!sector) return;

    currentActiveSectorId = sectorId;

    // Destacar en el mapa
    if (mapInstance && mapMarkers[sectorId]) {
        const marker = mapMarkers[sectorId];

        // SOLO HACER ZOOM SI NO HAY UNA RUTA ACTIVA
        // Si hay ruta, dejamos que Leaflet Routing maneje el encuadre
        if (!routingControl) {
            mapInstance.flyTo(marker.getLatLng(), 18); // Zoom suave al sector
        }

        marker.openPopup();
    }

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

                const userTag = `user_${session.id}`;
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

            // Asignar eventos a los botones generados
            dropdown.querySelectorAll(".btn-action").forEach(btn => {
                btn.addEventListener("click", async (e) => {
                    e.stopPropagation(); // Evitar cerrar el menu inmediatamente al clickear
                    const action = btn.dataset.action;
                    if (action === "reportar") {
                        const obs = prompt("Describe el problema encontrado en el espacio:");
                        if (obs) {
                            let foto = null;
                            if (window.Capacitor) {
                                if (confirm("¿Quieres adjuntar una foto del problema?")) {
                                    foto = await takeReportPhoto();
                                }
                            }
                            // ENVIAR REPORTE (Esperamos a que la foto esté cargada)
                            await updateEspacioState(espacio.id, espacio.estado, `Reporte: ${obs}`, foto);
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
                alert("Debes iniciar sesión para realizar acciones sobre un espacio.");
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

    // Resetear vista del mapa
    if (mapInstance) {
        // SOLO HACER ZOOM SI NO HAY UNA RUTA ACTIVA
        if (!routingControl) {
            mapInstance.flyTo([-29.9637, -71.3485], 17);
        }
        mapInstance.closePopup();
    }
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

    const payload = { estado: estado };
    if (observaciones) payload.observaciones = observaciones;
    if (foto) payload.foto_base64 = foto;

    try {
        // --- SOLUCIÓN NATIVA PARA EVITAR CORS EN ANDROID ---
        if (window.Capacitor && window.Capacitor.Plugins.CapacitorHttp) {
            const Http = window.Capacitor.Plugins.CapacitorHttp;
            const options = {
                url: `${API_BASE}/espacios/${espacioId}/estado`,
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${session.access_token}`
                },
                data: payload
            };

            const response = await Http.put(options);
            if (response.status >= 200 && response.status < 300) {
                closeAllDropdowns();
                await loadSectoresData();

                // Primero mostramos el sector (con flag isAutoRefresh=true para no borrar ruta)
                showSector(espacioId.charAt(0), true);

                // Luego trazamos la ruta (el zoom de la ruta ganará al de showSector)
                if (estado === "solicitado") {
                    calculateRoute(espacioId.charAt(0));
                }
                return;
            }
        }

        // --- FALLBACK FETCH ---
        const res = await fetch(`${API_BASE}/espacios/${espacioId}/estado`, {
            method: "PUT",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${session.access_token}`
            },
            body: JSON.stringify(payload)
        });

        if (res.ok) {
            closeAllDropdowns();
            await loadSectoresData();

            // Primero mostramos el sector (con flag isAutoRefresh=true para no borrar ruta)
            showSector(espacioId.charAt(0), true);

            if (estado === "solicitado") {
                calculateRoute(espacioId.charAt(0));
            }
        }
    } catch (error) {
        console.error("Error al actualizar:", error);
    }
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
    const sectorPrefix = id.charAt(0);
    showSector(sectorPrefix);
}

// Función para tomar foto con la cámara (Capacitor)
async function takeReportPhoto() {
    try {
        const Camera = window.Capacitor.Plugins.Camera;
        const perm = await Camera.requestPermissions();
        if (perm.camera !== 'granted') return null;

        const image = await Camera.getPhoto({
            quality: 30,
            allowEditing: false,
            resultType: "base64",
            source: "camera",
            width: 600
        });

        return `data:image/${image.format};base64,${image.base64String}`;
    } catch (e) {
        return null;
    }
}

// Función para obtener ubicación GPS y calcular ruta
async function calculateRoute(sectorId) {
    if (!mapInstance) return;

    const getPosition = () => {
        return new Promise((resolve, reject) => {
            if (window.Capacitor && window.Capacitor.Plugins.Geolocation) {
                console.log("Solicitando posición vía Capacitor...");
                window.Capacitor.Plugins.Geolocation.getCurrentPosition({
                    enableHighAccuracy: true,
                    timeout: 5000
                })
                    .then(pos => resolve(pos))
                    .catch((err) => {
                        console.error("Error Geolocation Capacitor:", err);
                        navigator.geolocation.getCurrentPosition(resolve, reject, {
                            enableHighAccuracy: true,
                            timeout: 5000
                        });
                    });
            } else {
                navigator.geolocation.getCurrentPosition(resolve, reject);
            }
        });
    };

    try {
        const position = await getPosition();
        console.log("Posición obtenida:", position.coords.latitude, position.coords.longitude);
        const userCoords = [position.coords.latitude, position.coords.longitude];
        const destCoords = SECTOR_COORDS[sectorId];

        if (!destCoords) return;

        if (routingControl) mapInstance.removeControl(routingControl);

        if (userMarker) {
            userMarker.setLatLng(userCoords);
        } else {
            userMarker = L.marker(userCoords, {
                icon: L.icon({
                    iconUrl: 'https://cdn-icons-png.flaticon.com/512/1077/1077114.png',
                    iconSize: [30, 30],
                    iconAnchor: [15, 15]
                })
            }).addTo(mapInstance).bindPopup("Tu ubicación");
        }

        console.log("Trazando ruta a sector:", sectorId);
        routingControl = L.Routing.control({
            waypoints: [L.latLng(userCoords[0], userCoords[1]), L.latLng(destCoords[0], destCoords[1])],
            lineOptions: { styles: [{ color: '#3B82F6', weight: 6, opacity: 0.8 }] },
            routeWhileDragging: false,
            addWaypoints: false,
            draggableWaypoints: false,
            fitSelectedRoutes: true,
            show: false,
            router: L.Routing.osrmv1({ serviceUrl: 'https://router.project-osrm.org/route/v1' })
        }).addTo(mapInstance);

    } catch (error) {
        console.error("Error detallado GPS:", error);
        alert("No se pudo obtener tu ubicación. Verifica que el GPS esté encendido y que la aplicación tenga permisos de ubicación.");
    }
}

// Inicializar Mapa
function initMap() {
    const mapElement = document.getElementById('map-sectores');
    if (!mapElement) return;

    mapInstance = L.map('map-sectores').setView([-29.9637, -71.3485], 17);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(mapInstance);

    Object.keys(SECTOR_COORDS).forEach(id => {
        const marker = L.marker(SECTOR_COORDS[id]).addTo(mapInstance);
        marker.bindPopup(`<b>Sector ${id}</b>`);
        mapMarkers[id] = marker;
        marker.on('click', () => showSector(id));
    });
}

// Función para manejar la rotación de pantalla
function initOrientationCheck() {
    const handleOrientation = () => {
        const mapContainer = document.getElementById('map-sectores');
        const header = document.querySelector('.app-header');
        const nav = document.querySelector('.app-nav');
        const mainTitle = document.querySelector('main section');
        const sectoresView = document.getElementById('sectores-view');
        const sectorView = document.getElementById('sector-view');

        if (!mapContainer) return;

        if (window.innerWidth > window.innerHeight) {
            // MODO LANDSCAPE (Horizontal) - Limpiar pantalla para el mapa
            mapContainer.classList.add('map-fullscreen');
            if (header) header.style.display = 'none';
            if (nav) nav.style.display = 'none';
            if (mainTitle) mainTitle.style.display = 'none';
            if (sectoresView) sectoresView.style.display = 'none';
            if (sectorView) sectorView.style.display = 'none';

            if (mapInstance) {
                setTimeout(() => mapInstance.invalidateSize(), 400);
            }
        } else {
            // MODO PORTRAIT (Vertical) - Restaurar UI
            mapContainer.classList.remove('map-fullscreen');
            if (header) header.style.display = '';
            if (nav) nav.style.display = '';
            if (mainTitle) mainTitle.style.display = '';

            // Solo restaurar la vista que corresponde
            if (sectoresView && !document.getElementById('sector-view').classList.contains('hidden')) {
                // Estamos en vista de un sector, no mostrar la grilla de sectores
                sectoresView.style.display = 'none';
            } else if (sectoresView) {
                sectoresView.style.display = '';
            }

            if (sectorView && !sectorView.classList.contains('hidden')) {
                sectorView.style.display = '';
            }

            if (mapInstance) {
                setTimeout(() => mapInstance.invalidateSize(), 400);
            }
        }
    };
    window.addEventListener('resize', handleOrientation);
    window.addEventListener('orientationchange', handleOrientation);
}

// Inicializar al cargar
document.addEventListener("DOMContentLoaded", async () => {
    // Iniciar carga de datos y mapa en paralelo
    const dataPromise = loadSectoresData();
    initMap();
    initOrientationCheck();

    await dataPromise; // Esperar solo lo necesario

    // PERSISTENCIA DE RUTA ULTRA-RÁPIDA
    const session = JSON.parse(localStorage.getItem("ucn_session"));
    if (session && session.id) {
        const userTag = session.role === "admin" ? `admin_${session.id}` : `user_${session.id}`;
        let activeSectorId = null;

        sectoresData.forEach(sector => {
            if (sector.espacios.some(e => e.estado === "solicitado" && e.actualizado_por === userTag)) {
                activeSectorId = sector.id;
            }
        });

        if (activeSectorId) {
            console.log("Restaurando ruta prioritaria...");
            // Usamos un tiempo mínimo para asegurar que el DOM esté listo
            setTimeout(() => calculateRoute(activeSectorId), 300);
        }
    }

    document.querySelectorAll(".sector-card button").forEach(button => {
        button.addEventListener("click", (e) => {
            const sectorId = e.target.closest(".sector-card").dataset.sector;
            showSector(sectorId);
        });
    });

    document.getElementById("back-btn").addEventListener("click", showSectores);
});

// Monitorear favorito
setInterval(async () => {
    if (!favoriteSpace) return;
    try {
        const res = await fetch(`${API_BASE}/sectores`);
        const data = await res.json();
        let found = null;
        data.forEach(s => {
            const m = s.espacios.find(e => e.id === favoriteSpace);
            if (m) found = m;
        });

        if (found) {
            const last = localStorage.getItem("ucn_fav_last_status");
            if (last === "ocupado" && found.estado === "disponible") {
                sendLocalNotification("¡Lugar Disponible!", `Tu sitio ${found.id} se ha desocupado.`);
            }
            localStorage.setItem("ucn_fav_last_status", found.estado);
        }
    } catch (e) {}
}, 10000);
