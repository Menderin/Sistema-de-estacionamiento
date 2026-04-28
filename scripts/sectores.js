let sectoresData = null;

// Cargar datos del JSON
async function loadSectoresData() {
    try {
        const response = await fetch("../assets/data/sectores.json");
        sectoresData = await response.json();
    } catch (error) {
        console.error("Error cargando datos:", error);
    }
}

// Mostrar vista de sector
function showSector(sectorId) {
    const sector = sectoresData.sectores.find(s => s.id === sectorId);
    if (!sector) return;

    // Actualizar título
    document.getElementById("sector-title").textContent = `Mapa: ${sector.nombre}`;

    // Generar grilla de espacios
    const grid = document.getElementById("espacios-grid");
    grid.innerHTML = "";
    sector.espacios.forEach(espacio => {
        const div = document.createElement("div");
        div.className = espacio.estado === "disponible" ? "btn-spot-disponible" : "btn-spot-ocupado";
        div.innerHTML = `<span class="block font-black text-xl drop-shadow-sm">${espacio.id}</span>`;
        grid.appendChild(div);
    });

    // Cambiar vistas
    document.getElementById("sectores-view").classList.add("hidden");
    document.getElementById("sector-view").classList.remove("hidden");
}

// Volver a vista de sectores
function showSectores() {
    document.getElementById("sector-view").classList.add("hidden");
    document.getElementById("sectores-view").classList.remove("hidden");
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
