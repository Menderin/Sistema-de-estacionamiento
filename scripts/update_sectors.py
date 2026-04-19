import os

sectors = {
    'a': 'Sector Guacolda',
    'b': 'Sector G5',
    'c': 'Sector Vicerrectoría',
    'd': 'Sector G6'
}

html_template = """<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <link rel="stylesheet" href="../assets/css/output.css">
    <link rel="icon" href="../assets/img/favicon.png" type="image/png">
    <title>{sector_name} - Estacionamiento UCN CQBO</title>
</head>

<body class="bg-gray-100 font-sans text-gray-800 flex flex-col min-h-screen">
    <header class="bg-gray-800 text-white p-4 flex items-center justify-between md:px-8">
        <img src="../assets/img/logo_ucn.png" alt="Logo UCN" class="h-12 w-auto">
        <h1 class="text-2xl md:text-3xl font-bold text-center flex-grow">Estacionamientos UCN CQBO</h1>
        <div class="w-12"></div>
    </header>

    <nav class="bg-gray-700 text-white p-3">
        <ul class="flex flex-col sm:flex-row justify-center gap-4 text-center">
            <li><a href="../index.html" class="hover:text-blue-300">Inicio</a></li>
            <li><a href="sectores.html" class="text-blue-300 font-semibold border-b-2 border-blue-300 pb-1">Sectores</a></li>
            <li><a href="#" class="hover:text-blue-300">Administración</a></li>
            <li><a href="contacto.html" class="hover:text-blue-300">Contacto y ubicación</a></li>
        </ul>
    </nav>

    <main class="flex-grow w-full flex flex-col items-center">
        <!-- Barra de Título y Leyenda -->
        <div class="w-full bg-white shadow-sm p-4 flex flex-col md:flex-row justify-between items-center z-10 relative">
            <h2 class="text-2xl font-bold text-blue-900 mb-2 md:mb-0">Mapa: {sector_name}</h2>
            <div class="flex gap-6 text-sm font-semibold text-gray-700">
                <div class="flex items-center gap-2"><span class="w-4 h-4 bg-green-500 rounded border border-green-600 block"></span> Disponible</div>
                <div class="flex items-center gap-2"><span class="w-4 h-4 bg-red-500 rounded border border-red-600 block"></span> Ocupado</div>
            </div>
        </div>

        <!-- Contenedor del Mapa (Aquí irá la imagen de fondo eventualmente) -->
        <div class="w-full flex-grow relative bg-gray-300 border-t border-gray-400 overflow-hidden flex items-center justify-center p-4 md:p-10" id="mapa-contenedor">
            <!-- Nota informativa para los desarrolladores -->
            <p class="absolute bottom-4 right-4 text-gray-500 font-bold bg-white/50 px-2 py-1 rounded backdrop-blur-sm pointer-events-none drop-shadow">
                [Futura zona de mapa de fondo]
            </p>

            <!-- Grilla Puesta como "Capa" sobre el contenedor del mapa -->
            <div class="relative z-10 w-full max-w-6xl mx-auto grid grid-cols-4 sm:grid-cols-6 lg:grid-cols-9 gap-3">
{grid_items}
            </div>
        </div>
    </main>

    <footer class="bg-gray-800 text-white text-center p-4 mt-auto">
        <p>Copyright © 2026 Estacionamiento UCN CQBO</p>
    </footer>
</body>
</html>
"""

def generate_grid(sector_letter):
    items = []
    # Usaremos 36 lugares
    for i in range(1, 37):
        item = f'''                <div class="btn-spot-disponible">
                    <span class="block font-black text-xl drop-shadow-sm">{sector_letter.upper()}{i}</span>
                </div>'''
        items.append(item)
    return "\n".join(items)

def main():
    for letter, name in sectors.items():
        filename = f"sector_{letter}.html"
        content = html_template.replace('{sector_name}', name).replace('{grid_items}', generate_grid(letter))
        with open(f"pages/sector_{letter}.html", "w", encoding="utf-8") as f:
            f.write(content)
        print(f"Updated {filename}")

if __name__ == '__main__':
    main()
