import { API_BASE } from "./config.js";
import { sendLocalNotification } from "./notifications.js";

let sectoresData = null;
let favoriteSpace = localStorage.getItem("ucn_favorite_space"); // Cargar favorito guardado
let mapInstance = null;
let mapMarkers = {};
let routingControl = null;
let userMarker = null;

// Cargar datos del API
async function loadSectoresData() {
    try {
        console.log("Intentando conectar al API en:", `${API_BASE}/sectores`);
        const response = await fetch(`${API_BASE}/sectores`);
        if (!response.ok) throw new Error(`Status: ${response.status}`);
        sectoresData = await response.json();
        console.log("Datos de sectores recibidos exitosamente:", sectoresData);
    } catch (error) {
        console.error("ERROR CRÍTICO cargando datos del backend:", error);
    }
}

// Mostrar vista de sector
function showSector(sectorId) {
    const sector = sectoresData.find(s => s.id === sectorId);
    if (!sector) return;

    // Destacar en el mapa
    if (mapInstance && mapMarkers[sectorId]) {
        const marker = mapMarkers[sectorId];
        mapInstance.flyTo(marker.getLatLng(), 18); // Zoom suave al sector
        marker.openPopup();
    }

    // Actualizar título
    document.getElementById("sector-title").textContent = `Mapa: ${sector.nombre}`;

    // Ordenar los espacios numéricamente (A1, A2, A3... A10)
    sector.espacios.sort((a, b) => a.id.localeCompare(b.id, undefined, { numeric: true, sensitivity: 'base' }));

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
                } else if (espacio.estado === "solicitado" && espacio.actualizado_por === userTag) {
                    html += `<button class="w-full text-center px-2 py-3 text-sm font-bold text-green-600 hover:bg-green-50 btn-action" data-action="disponible">Liberar Reserva</button>`;
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

    if (typeof applyTranslations === "function") applyTranslations();
}

// Volver a vista de sectores
function showSectores() {
    document.getElementById("sector-view").classList.add("hidden");
    document.getElementById("sectores-view").classList.remove("hidden");

    // Resetear vista del mapa
    if (mapInstance) {
        mapInstance.flyTo([-29.9637, -71.3485], 17);
        mapInstance.closePopup();

        // Limpiar ruta al volver
        if (routingControl) {
            mapInstance.removeControl(routingControl);
            routingControl = null;
        }
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
                // Si se solicita, mostrar la ruta
                if (estado === "solicitado") {
                    calculateRoute(espacioId.charAt(0));
                    // Pequeño aviso de cortesía
                    console.log("Nueva reserva activa. Cualquier reserva previa ha sido liberada automáticamente.");
                }

                closeAllDropdowns();
                await loadSectoresData();
                showSector(espacioId.charAt(0));
                return;
            } else {
                console.error(`[ERROR NATIVO] Status: ${response.status}`, response.data);
                const msg = response.data?.detail || "No se pudo completar la acción.";
                alert(`Error: ${msg}`);
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
            const errData = await res.json();
            const msg = errData.detail || "Error al actualizar el espacio.";
            alert(`Error: ${msg}`);
            return;
        }

        // Si se solicita, mostrar la ruta
        if (estado === "solicitado") {
            calculateRoute(espacioId.charAt(0));
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

// Función para obtener ubicación GPS y calcular ruta
async function calculateRoute(sectorId) {
    if (!mapInstance) return;

    const getPosition = () => {
        return new Promise((resolve, reject) => {
            // Intentar con Capacitor primero (Nativo)
            if (window.Capacitor && window.Capacitor.Plugins.Geolocation) {
                window.Capacitor.Plugins.Geolocation.getCurrentPosition({ enableHighAccuracy: true })
                    .then(pos => resolve(pos))
                    .catch(err => {
                        console.warn("Capacitor Geolocation falló, intentando navegador...", err);
                        navigator.geolocation.getCurrentPosition(resolve, reject, { enableHighAccuracy: true });
                    });
            } else {
                // Fallback para Navegador PC
                navigator.geolocation.getCurrentPosition(resolve, reject, { enableHighAccuracy: true });
            }
        });
    };

    try {
        console.log("Calculando ruta al sector:", sectorId);

        // Mostrar aviso de carga
        const loadingMsg = alert("Solicitando permisos de GPS... Por favor, acepta el permiso en tu navegador o celular.");

        const position = await getPosition();
        const userCoords = [position.coords.latitude, position.coords.longitude];

        const sector = sectoresData.find(s => s.id === sectorId);
        if (!sector || !sector.lat) return;
        const destCoords = [sector.lat, sector.lng];

        // Limpiar ruta previa
        if (routingControl) {
            mapInstance.removeControl(routingControl);
        }

        // Crear marcador de usuario
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

        // Crear ruta vehicular
        routingControl = L.Routing.control({
            waypoints: [
                L.latLng(userCoords[0], userCoords[1]),
                L.latLng(destCoords[0], destCoords[1])
            ],
            lineOptions: {
                styles: [{ color: '#3B82F6', weight: 6, opacity: 0.8 }]
            },
            routeWhileDragging: false,
            addWaypoints: false,
            draggableWaypoints: false,
            fitSelectedRoutes: true,
            show: false,
            router: L.Routing.osrmv1({
                serviceUrl: 'https://router.project-osrm.org/route/v1'
            })
        }).addTo(mapInstance);

    } catch (error) {
        console.error("Error GPS detallado:", error);
        alert("No se pudo obtener la ubicación. Asegúrate de tener el GPS activado y haber dado permisos en el navegador.");
    }
}

// Inicializar Mapa con Marcadores de Sectores
async function initMap() {
    const mapElement = document.getElementById('map-sectores');
    if (!mapElement) return;

    // Si aún no hay datos, esperar a que carguen
    if (!sectoresData) {
        await loadSectoresData();
    }

    // Coordenadas centrales UCN Coquimbo (Centrado en estacionamientos)
    const ucnCoords = [-29.9637, -71.3485];

    // Crear el mapa si no existe
    if (!mapInstance) {
        mapInstance = L.map('map-sectores').setView(ucnCoords, 17);

        // Capa de mapa vectorial (OpenStreetMap)
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '© OpenStreetMap contributors'
        }).addTo(mapInstance);
    }

    // Añadir marcadores desde la base de datos (sectoresData)
    if (sectoresData) {
        console.log("Cargando marcadores:", sectoresData);
        sectoresData.forEach(s => {
            if (s.lat && s.lng) {
                const marker = L.marker([s.lat, s.lng]).addTo(mapInstance);
                marker.bindPopup(`<b>Sector ${s.id}</b><br>${s.nombre}`);

                mapMarkers[s.id] = marker; // Guardar referencia

                marker.on('click', () => {
                    showSector(s.id);
                });
            } else {
                console.warn(`Sector ${s.id} no tiene coordenadas válidas.`);
            }
        });
    }
}

// Inicializar al cargar el script
document.addEventListener("DOMContentLoaded", async () => {
    await loadSectoresData();
    await initMap(); // Ahora con await
    initOrientationCheck();

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

// Función para manejar la rotación de pantalla
function initOrientationCheck() {
    const handleOrientation = () => {
        const mapContainer = document.getElementById('map-sectores');
        if (!mapContainer) return;

        // Si el ancho es mayor al alto, estamos en modo landscape (horizontal)
        if (window.innerWidth > window.innerHeight) {
            console.log("Modo Landscape detectado - Expandiendo mapa");
            mapContainer.classList.add('map-fullscreen');

            // Forzar a Leaflet a recalcular el tamaño del mapa
            if (mapInstance) {
                setTimeout(() => mapInstance.invalidateSize(), 300);
            }

            // Opcional: Notificación al usuario
            // sendLocalNotification("Modo Mapa Extendido", "Gira el teléfono para volver a la lista.");
        } else {
            console.log("Modo Portrait detectado - Restaurando vista");
            mapContainer.classList.remove('map-fullscreen');

            if (mapInstance) {
                setTimeout(() => mapInstance.invalidateSize(), 300);
            }
        }
    };

    // Escuchar el cambio de tamaño/orientación
    window.addEventListener('resize', handleOrientation);
    window.addEventListener('orientationchange', handleOrientation);
}
