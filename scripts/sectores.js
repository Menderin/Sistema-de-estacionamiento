import { API_BASE } from "./config.js";
import { sendLocalNotification } from "./notifications.js";

let sectoresData = null;
let favoriteSpace = localStorage.getItem("ucn_favorite_space"); // Cargar favorito guardado
let activeSector = null;
let userPosition = null;
let locationWatchId = null;
let routeLine = null;
let userMarker = null;
let sectorMarkers = [];
let maps = {};
let followLocation = true;

function initMap(containerId) {
    if (!window.L) return null;

    const container = document.getElementById(containerId);
    if (!container) return null;

    if (!maps[containerId]) {
        const map = window.L.map(containerId, {
            zoomControl: true,
            attributionControl: true
        }).setView([-29.95, -71.34], 13);

        window.L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
            maxZoom: 19,
            attribution: "&copy; OpenStreetMap contributors"
        }).addTo(map);

        maps[containerId] = map;
    }

    return maps[containerId];
}

function refreshMaps() {
    Object.values(maps).forEach((map) => {
        if (map && typeof map.invalidateSize === "function") {
            setTimeout(() => map.invalidateSize(), 100);
        }
    });
}

function clearMapOverlays() {
    if (routeLine) {
        routeLine.remove();
        routeLine = null;
    }
    sectorMarkers.forEach((marker) => marker.remove());
    sectorMarkers = [];
    if (userMarker) {
        userMarker.remove();
        userMarker = null;
    }
}

function placeSectorMarker(map, sector) {
    if (!sector || sector.latitud == null || sector.longitud == null) return;

    const marker = window.L.marker([sector.latitud, sector.longitud], {
        title: sector.nombre
    }).addTo(map);
    marker.bindPopup(`<strong>${sector.nombre}</strong>`);
    sectorMarkers.push(marker);
}

function placeUserMarker(map, position) {
    if (!position) return;

    const latlng = window.L.latLng(position.lat, position.lng);
    userMarker = window.L.marker(latlng, {
        icon: window.L.divIcon({
            className: "",
            html: '<div style="background:#2563eb;border:2px solid white;border-radius:999px;width:14px;height:14px;box-shadow:0 0 8px rgba(0,0,0,0.3);"></div>'
        })
    }).addTo(map);
    userMarker.bindPopup("Tu ubicación");
}

async function drawRoute(map, sector) {
    if (!sector || sector.latitud == null || sector.longitud == null || !userPosition) {
        return;
    }

    try {
        const response = await fetch(`https://router.project-osrm.org/route/v1/driving/${userPosition.lng},${userPosition.lat};${sector.longitud},${sector.latitud}?overview=full&geometries=geojson`);
        const data = await response.json();
        if (!data.routes || !data.routes.length) return;

        const coords = data.routes[0].geometry.coordinates.map(([lng, lat]) => [lat, lng]);
        routeLine = window.L.polyline(coords, {
            color: "#2563eb",
            weight: 5,
            opacity: 0.8
        }).addTo(map);

        const bounds = window.L.latLngBounds([
            [userPosition.lat, userPosition.lng],
            [sector.latitud, sector.longitud]
        ]);
        map.fitBounds(bounds.pad(0.2));
    } catch (error) {
        console.error("No se pudo dibujar la ruta:", error);
    }
}

async function updateSectorMap(sector) {
    activeSector = sector;

    const mapLink = document.getElementById("map-link");
    const detailMapLink = document.getElementById("detail-map-link");
    const mapLabel = document.getElementById("sector-map-label");
    const detailMapLabel = document.getElementById("detail-sector-map-label");

    const applyMapState = (link, label, currentSector) => {
        if (!link || !label) return;

        if (currentSector && currentSector.latitud != null && currentSector.longitud != null) {
            const destination = `${currentSector.latitud},${currentSector.longitud}`;
            const origin = userPosition ? `${userPosition.lat},${userPosition.lng}` : "";
            link.href = origin
                ? `https://www.google.com/maps/dir/?api=1&origin=${encodeURIComponent(origin)}&destination=${encodeURIComponent(destination)}&travelmode=driving`
                : `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(destination)}&travelmode=driving`;
            link.classList.remove("hidden");
            link.textContent = `Ver ruta a ${currentSector.nombre}`;
            label.textContent = `Ruta hacia ${currentSector.nombre}`;
        } else {
            link.href = "#";
            link.classList.add("hidden");
            label.textContent = "Selecciona un sector";
        }
    };

    applyMapState(mapLink, mapLabel, sector);
    applyMapState(detailMapLink, detailMapLabel, sector);

    const generalMap = initMap("sector-map-view");
    const detailMap = initMap("detail-sector-map-view");

    if (!generalMap || !detailMap) return;

    clearMapOverlays();

    if (sector && sector.latitud != null && sector.longitud != null) {
        placeSectorMarker(generalMap, sector);
        placeSectorMarker(detailMap, sector);

        if (userPosition) {
            placeUserMarker(generalMap, userPosition);
            placeUserMarker(detailMap, userPosition);
            await drawRoute(generalMap, sector);
            await drawRoute(detailMap, sector);
        }

        const destLatLng = window.L.latLng(sector.latitud, sector.longitud);
        generalMap.setView(destLatLng, 15);
        detailMap.setView(destLatLng, 15);

        if (userPosition) {
            const bounds = window.L.latLngBounds([
                [userPosition.lat, userPosition.lng],
                [sector.latitud, sector.longitud]
            ]);
            generalMap.fitBounds(bounds.pad(0.2));
            detailMap.fitBounds(bounds.pad(0.2));
        }
    }

    refreshMaps();
}

function getPositionFromCoordinates(position) {
    return {
        lat: position.coords.latitude,
        lng: position.coords.longitude
    };
}

function handleGeolocationSuccess(position) {
    userPosition = getPositionFromCoordinates(position);
    if (followLocation && activeSector) {
        updateSectorMap(activeSector);
    }
}

function handleGeolocationError(error) {
    console.warn("No se pudo obtener la ubicación:", error);
}

function startGeolocation() {
    if (window.Capacitor && window.Capacitor.Plugins && window.Capacitor.Plugins.Geolocation) {
        window.Capacitor.Plugins.Geolocation.getCurrentPosition({ enableHighAccuracy: true })
            .then(handleGeolocationSuccess)
            .catch(() => {
                if (navigator.geolocation) {
                    navigator.geolocation.getCurrentPosition(handleGeolocationSuccess, handleGeolocationError, { enableHighAccuracy: true });
                }
            });

        if (window.Capacitor.Plugins.Geolocation.watchPosition) {
            window.Capacitor.Plugins.Geolocation.watchPosition({ enableHighAccuracy: true }, (position, error) => {
                if (error) {
                    handleGeolocationError(error);
                    return;
                }
                handleGeolocationSuccess(position);
            });
        }
        return;
    }

    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(handleGeolocationSuccess, handleGeolocationError, { enableHighAccuracy: true });
        locationWatchId = navigator.geolocation.watchPosition(handleGeolocationSuccess, handleGeolocationError, { enableHighAccuracy: true });
    }
}

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
    const titleContainer = document.getElementById("sector-title");
    titleContainer.innerHTML = `Mapa: ${sector.nombre}`;
    updateSectorMap(sector);

    const navBtn = document.createElement("button");
    navBtn.className = "ml-4 bg-blue-600 hover:bg-blue-700 text-white text-xs px-3 py-1.5 rounded-full shadow-md transition-all flex items-center gap-1 inline-flex align-middle";
    navBtn.innerHTML = `📍 <span data-i18n="btn_como_llegar">Cómo llegar</span>`;
    navBtn.onclick = (e) => {
        e.stopPropagation();
        openGoogleMaps(sector);
    };
    titleContainer.appendChild(navBtn);

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
                                    console.log("Abriendo cámara...");
                                    foto = await takeReportPhoto();
                                    if (foto) {
                                        console.log("Foto recibida en el reporte principal.");
                                    } else {
                                        console.warn("No se recibió foto de la cámara.");
                                    }
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
    setTimeout(refreshMaps, 150);

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
async function updateEspacioState(espacioId, estado, observaciones = null, foto = null) {
    const session = JSON.parse(localStorage.getItem("ucn_session"));
    if (!session) return;

    const payload = { estado: estado };
    if (observaciones) payload.observaciones = observaciones;
    if (foto) payload.foto_base64 = foto;

    try {
        // --- SOLUCIÓN NATIVA PARA EVITAR CORS EN ANDROID ---
        if (window.Capacitor && window.Capacitor.Plugins.CapacitorHttp) {
            console.log("Enviando petición HTTP Nativa...");
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
            console.log("Respuesta Nativa:", response);

            if (response.status >= 200 && response.status < 300) {
                closeAllDropdowns();
                await loadSectoresData();
                showSector(espacioId.charAt(0));
                return;
            } else {
                console.error(`[ERROR NATIVO] Status: ${response.status}`, response.data);
                alert(`Error del servidor (${response.status}): No se pudo guardar.`);
                return;
            }
        }

        // --- FALLBACK FETCH (Para PC/Navegador) ---
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

// Función para tomar foto con la cámara (Capacitor)
async function takeReportPhoto() {
    try {
        const Camera = window.Capacitor.Plugins.Camera;

        // FORZAR PETICIÓN DE PERMISOS
        const perm = await Camera.requestPermissions();
        if (perm.camera !== 'granted') {
            alert("Necesitas dar permiso a la cámara para tomar fotos.");
            return null;
        }

        const image = await Camera.getPhoto({
            quality: 30,
            allowEditing: false,
            resultType: "base64",
            source: "camera",
            width: 600
        });

        const fullBase64 = `data:image/${image.format};base64,${image.base64String}`;
        console.log("¡FOTO CAPTURADA EXITOSAMENTE!");
        return fullBase64;
    } catch (e) {
        console.warn("Cámara cancelada o no disponible:", e);
        return null;
    }
}

async function openGoogleMaps(sector) {
    if (!sector || sector.latitud == null || sector.longitud == null) {
        alert("Este sector aún no tiene coordenadas configuradas.");
        return;
    }

    const url = `https://www.google.com/maps/dir/?api=1&destination=${sector.latitud},${sector.longitud}&travelmode=driving`;
    window.open(url, "_blank", "noopener,noreferrer");
}

// Event listeners
document.addEventListener("DOMContentLoaded", async () => {
    await loadSectoresData();
    startGeolocation();
    updateSectorMap(sectoresData?.[0] || null);
    window.addEventListener("resize", refreshMaps);

    // Agregar event listeners a las tarjetas de sector
    document.querySelectorAll(".sector-card button").forEach(button => {
        button.addEventListener("click", (e) => {
            const sectorId = e.target.closest(".sector-card").dataset.sector;
            showSector(sectorId);
        });
    });

    // Botón de volver
    document.getElementById("back-btn").addEventListener("click", () => {
        showSectores();
        updateSectorMap(sectoresData?.[0] || null);
    });
});

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
