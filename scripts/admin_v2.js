import { API_BASE } from "./config.js";
import { sendLocalNotification } from "./notifications.js";

const DASHBOARD_REFRESH_MS = 5000;
let lastReportCount = parseInt(localStorage.getItem("ucn_last_report_count") || "0");
let isDashboardLoading = false;

async function loadDashboardData() {
    if (isDashboardLoading) return;
    isDashboardLoading = true;

    const session = JSON.parse(localStorage.getItem("ucn_session"));
    const token = session ? session.access_token : null;

    try {
        const response = await fetch(`${API_BASE}/sectores`, {
            headers: { "Authorization": `Bearer ${token}` }
        });
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const sectores = await response.json();
        
        let totalEspacios = 0;
        let libresTotales = 0;
        let sectoresLlenos = 0;
        const tbody = document.getElementById("dash-tbody");
        tbody.innerHTML = ""; // Limpiar loading

        sectores.forEach(sector => {
            const espacios = sector.espacios || [];
            const capSector = espacios.length;
            const libres = espacios.filter(e => e.estado === "disponible").length;
            const ocupados = capSector - libres;
            
            totalEspacios += capSector;
            libresTotales += libres;
            
            let estadoI18n = "lbl_disponible";
            let estadoClase = "bg-green-100 text-green-700";
            let filaClase = "border-b hover:bg-gray-50 transition-colors border-gray-200 dark:border-gray-700 dark:hover:bg-gray-700/50";
            
            if (capSector > 0 && libres === 0) {
                sectoresLlenos++;
                estadoI18n = "adm_lleno";
                estadoClase = "bg-red-500 text-white shadow-sm";
                filaClase = "border-b bg-red-50 dark:bg-red-900/20 hover:bg-red-100 dark:hover:bg-red-900/40 transition-colors border-gray-200 dark:border-gray-700";
            } else if (capSector === 0) {
                estadoI18n = "adm_sin_espacios";
                estadoClase = "bg-gray-100 text-gray-700 dark:bg-gray-600 dark:text-gray-300";
            }

            const tr = document.createElement("tr");
            tr.className = filaClase;
            tr.innerHTML = `
                <td class="p-2.5 font-bold text-gray-800 dark:text-gray-200">${sector.nombre} (${sector.id})</td>
                <td class="p-2.5 text-center">${capSector}</td>
                <td class="p-2.5 text-center ${ocupados === capSector && capSector > 0 ? 'text-red-600 dark:text-red-400 font-bold' : ''}">${ocupados}</td>
                <td class="p-2.5 text-center font-bold ${libres > 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}">${libres}</td>
                <td class="p-2.5">
                    <span class="text-xs px-2 py-1 rounded-full font-bold ${estadoClase}" data-i18n="${estadoI18n}">${estadoI18n === 'adm_lleno' ? 'Lleno' : estadoI18n === 'adm_sin_espacios' ? 'Sin espacios' : 'Disponible'}</span>
                </td>
            `;
            tbody.appendChild(tr);
        });

        // Actualizar métricas
        document.getElementById("dash-libres").textContent = libresTotales;
        document.getElementById("dash-totales").textContent = `/ ${totalEspacios}`;
        
        const elemDashTotalesSec = document.getElementById("dash-totales-sec");
        if(elemDashTotalesSec) elemDashTotalesSec.textContent = sectores.length;
        const elemDashLlenos = document.getElementById("dash-llenos");
        if(elemDashLlenos) elemDashLlenos.textContent = sectoresLlenos;
        
        const ocupacionPct = totalEspacios > 0 ? Math.round(((totalEspacios - libresTotales) / totalEspacios) * 100) : 0;
        document.getElementById("dash-pct").textContent = `${ocupacionPct}%`;
        document.getElementById("dash-bar").style.width = `${ocupacionPct}%`;

        // Cargar reportes
        const session = JSON.parse(localStorage.getItem("ucn_session"));
        const token = session ? session.access_token : null;

        if (token) {
            const repResponse = await fetch(`${API_BASE}/dashboard/reportes`, {
                headers: { "Authorization": `Bearer ${token}` }
            });
            if (repResponse.ok) {
                const reportes = await repResponse.json();

                // NOTIFICACIÓN PARA ADMIN
                if (reportes.length > lastReportCount) {
                    sendLocalNotification(
                        "Nuevo Reporte",
                        `Se ha recibido ${reportes.length - lastReportCount} reporte(s) nuevo(s) de espacios.`
                    );
                }
                lastReportCount = reportes.length;
                localStorage.setItem("ucn_last_report_count", lastReportCount.toString());

                const rbody = document.getElementById("reportes-tbody");
                rbody.innerHTML = "";
                if (reportes.length === 0) {
                    rbody.innerHTML = `<tr><td colspan="4" class="p-4 text-center text-gray-500 dark:text-gray-400 font-medium" data-i18n="adm_rep_empty">No hay reportes o solicitudes activas.</td></tr>`;
                } else {
                    reportes.forEach(rep => {
                        const tr = document.createElement("tr");
                        tr.className = "border-b hover:bg-yellow-50 transition-colors bg-white dark:bg-gray-800 dark:border-gray-700 dark:hover:bg-gray-700";
                        tr.innerHTML = `
                            <td class="p-2.5 font-bold text-gray-800 dark:text-gray-200">${rep.sector}</td>
                            <td class="p-2.5 font-bold text-blue-600 dark:text-blue-400">${rep.espacio}</td>
                            <td class="p-2.5 text-gray-700 dark:text-gray-300 font-medium">
                                ${rep.mensaje}
                                ${rep.foto_base64 ? `<br><button class="mt-2 bg-red-600 text-white px-4 py-2 rounded-full text-xs font-black btn-ver-foto" data-foto="${rep.foto_base64}">VER EVIDENCIA 📷</button>` : '<span class="text-xs text-gray-400 italic">(Sin foto)</span>'}
                            </td>
                            <td class="p-2.5 text-right align-top relative w-48">
                                <div class="flex flex-col items-end w-full">
                                    <button class="bg-green-500 hover:bg-green-600 text-white text-xs px-3 py-1.5 rounded shadow-sm font-bold w-32 btn-resolver" data-i18n="adm_btn_resuelto">Marcar Resuelto</button>
                                    
                                    <!-- Menú de confirmación deslizable -->
                                    <div class="confirm-dropdown overflow-hidden transition-all duration-300 ease-in-out max-h-0 opacity-0 mt-2 w-48 bg-white border border-gray-200 rounded-xl shadow-xl flex flex-col z-10 text-center text-xs divide-y divide-gray-100 origin-top transform scale-95 dark:bg-gray-700 dark:border-gray-600 dark:divide-gray-600">
                                        <div class="p-3 text-gray-800 dark:text-gray-100 font-bold text-sm bg-gray-50 dark:bg-gray-800" data-i18n="adm_confirm">¿Confirmar?</div>
                                        <button class="w-full px-2 py-2.5 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 font-bold transition-colors btn-confirmar" data-espacio="${rep.espacio}" data-estado="${rep.estado}" data-i18n="adm_btn_si">Sí, resolver</button>
                                        <button class="w-full px-2 py-2.5 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-600 font-bold transition-colors btn-cancelar" data-i18n="adm_btn_no">Cancelar</button>
                                    </div>
                                </div>
                            </td>
                        `;
                        rbody.appendChild(tr);

                        // Eventos para el menú deslizante
                        const btnResolver = tr.querySelector(".btn-resolver");
                        const dropdown = tr.querySelector(".confirm-dropdown");
                        const btnCancelar = tr.querySelector(".btn-cancelar");
                        const btnConfirmar = tr.querySelector(".btn-confirmar");

                        btnResolver.addEventListener("click", () => {
                            // Cerrar otros dropdowns si existen
                            document.querySelectorAll('.confirm-dropdown').forEach(d => {
                                if (d !== dropdown) {
                                    d.classList.remove("max-h-48", "opacity-100", "scale-100");
                                    d.classList.add("max-h-0", "opacity-0", "scale-95");
                                    d.parentElement.parentElement.parentElement.classList.remove("bg-yellow-50");
                                }
                            });

                            dropdown.classList.remove("max-h-0", "opacity-0", "scale-95");
                            dropdown.classList.add("max-h-48", "opacity-100", "scale-100");
                            tr.classList.add("bg-yellow-50");
                        });

                        btnCancelar.addEventListener("click", () => {
                            dropdown.classList.remove("max-h-48", "opacity-100", "scale-100");
                            dropdown.classList.add("max-h-0", "opacity-0", "scale-95");
                            tr.classList.remove("bg-yellow-50");
                        });

                        btnConfirmar.addEventListener("click", async () => {
                            const id = btnConfirmar.dataset.espacio;
                            const estado = btnConfirmar.dataset.estado;

                            btnConfirmar.disabled = true;
                            btnConfirmar.textContent = "...";

                            const ok = await resolverReporte(id, estado);
                            if (ok) {
                                dropdown.classList.remove("max-h-48", "opacity-100", "scale-100");
                                dropdown.classList.add("max-h-0", "opacity-0", "scale-95");
                                loadDashboardData(); // Recargar para limpiar la tabla
                            } else {
                                alert("Error al resolver el reporte");
                                btnConfirmar.disabled = false;
                                btnConfirmar.textContent = "Sí, resolver";
                            }
                        });

                        // Evento para ver foto
                        const btnVerFoto = tr.querySelector(".btn-ver-foto");
                        if (btnVerFoto) {
                            btnVerFoto.addEventListener("click", () => {
                                const modal = document.getElementById("foto-modal");
                                const img = document.getElementById("foto-img");
                                img.src = btnVerFoto.dataset.foto;
                                modal.classList.remove("hidden");
                            });
                        }
                    });
                }
            }
        }

        // Reaplicar traducciones después de inyectar dinámicamente HTML
        if (typeof applyTranslations === "function") applyTranslations();

    } catch (error) {
        console.error("Error al cargar datos de administración:", error);
        document.getElementById("dash-tbody").innerHTML = `
            <tr><td colspan="5" class="p-4 text-center text-red-600">Error al conectar con el backend</td></tr>
        `;
    } finally {
        isDashboardLoading = false;
    }
}

document.addEventListener("DOMContentLoaded", () => {
    loadDashboardData();

    const refreshButton = document.getElementById("btn-refresh-dashboard");
    if (refreshButton) {
        refreshButton.addEventListener("click", loadDashboardData);
    }

    setInterval(loadDashboardData, DASHBOARD_REFRESH_MS);
});

async function resolverReporte(espacioId, estadoActual) {
    const session = JSON.parse(localStorage.getItem("ucn_session"));
    if (!session) return false;

    try {
        // Para resolver, vaciamos observaciones Y la foto
        const payload = {
            estado: estadoActual,
            observaciones: null,
            foto_base64: null
        };

        const res = await fetch(`${API_BASE}/espacios/${espacioId}/estado`, {
            method: "PUT",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${session.access_token}`
            },
            body: JSON.stringify(payload)
        });

        if (!res.ok) {
            const err = await res.json();
            console.error("Error backend:", err);
            return false;
        }

        return true;
    } catch (error) {
        console.error("Error al resolver:", error);
        return false;
    }
}
}
