document.addEventListener("DOMContentLoaded", async () => {
    try {
        const response = await fetch("http://localhost:8000/api/sectores");
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
            
            let estadoTexto = "Disponible";
            let estadoClase = "bg-green-100 text-green-700";
            let filaClase = "border-b hover:bg-gray-50 transition-colors";
            
            if (capSector > 0 && libres === 0) {
                sectoresLlenos++;
                estadoTexto = "Lleno";
                estadoClase = "bg-red-500 text-white shadow-sm";
                filaClase = "border-b bg-red-50 hover:bg-red-100 transition-colors";
            } else if (capSector === 0) {
                estadoTexto = "Sin espacios";
                estadoClase = "bg-gray-100 text-gray-700";
            }

            const tr = document.createElement("tr");
            tr.className = filaClase;
            tr.innerHTML = `
                <td class="p-2.5 font-bold text-gray-800">${sector.nombre} (${sector.id})</td>
                <td class="p-2.5 text-center">${capSector}</td>
                <td class="p-2.5 text-center ${ocupados === capSector && capSector > 0 ? 'text-red-600 font-bold' : ''}">${ocupados}</td>
                <td class="p-2.5 text-center font-bold ${libres > 0 ? 'text-green-600' : 'text-red-600'}">${libres}</td>
                <td class="p-2.5">
                    <span class="text-xs px-2 py-1 rounded-full font-bold ${estadoClase}">${estadoTexto}</span>
                </td>
            `;
            tbody.appendChild(tr);
        });

        // Actualizar métricas
        document.getElementById("dash-libres").textContent = libresTotales;
        document.getElementById("dash-totales").textContent = `/ ${totalEspacios}`;
        
        const ocupacionPct = totalEspacios > 0 ? Math.round(((totalEspacios - libresTotales) / totalEspacios) * 100) : 0;
        document.getElementById("dash-pct").textContent = `${ocupacionPct}%`;
        document.getElementById("dash-bar").style.width = `${ocupacionPct}%`;

    } catch (error) {
        console.error("Error al cargar datos de administración:", error);
        document.getElementById("dash-tbody").innerHTML = `
            <tr><td colspan="5" class="p-4 text-center text-red-600">Error al conectar con el backend</td></tr>
        `;
    }
});
