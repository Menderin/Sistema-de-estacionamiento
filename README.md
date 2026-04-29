# Sistema de Estacionamiento - UCN CQBO

Sistema web para la gestion y visualizacion de los estacionamientos de la Universidad Catolica del Norte, sede Coquimbo.

Integrantes: Daniel Trigo, Victor Jopia, Julian Gallardo, Kevin Silva

## Descripcion

Aplicacion front-end que permite visualizar la disponibilidad de espacios de estacionamiento organizados por sectores, acceder a un panel de administracion con metricas de ocupacion y consultar informacion de contacto y ubicacion del campus.

El sistema cubre 4 sectores con 36 espacios cada uno (144 en total):

| Sector | Nombre           |
|--------|------------------|
| A      | Guacolda         |
| B      | G5               |
| C      | Vicerrectoria    |
| D      | G6               |

## Stack tecnologico

- **HTML5** -- Estructura y contenido de las paginas.
- **Tailwind CSS v3.4** -- Framework de utilidades CSS para el diseno responsive.
- **Python 3** -- Script auxiliar para generacion automatizada de paginas de sectores.

No utiliza frameworks JavaScript ni backend. Es un proyecto estatico de front-end.

## Estructura del repositorio

```
Sistema-de-estacionamiento/
|-- index.html
|-- package.json
|-- tailwind.config.js
|-- .gitignore
|
|-- assets/
|   |-- css/
|   |   |-- styles.css
|   |   +-- output.css
|   |-- data/
|   |   +-- sectores.json
|   +-- img/
|       |-- logo_ucn.png
|       |-- favicon.png
|       +-- estacionamiento_inicio.jpg
|
|-- pages/
|   |-- sectores.html
|   |-- administracion.html
|   +-- contacto.html
|
+-- scripts/
    |-- sectores.js
    +-- update_sectors.py
```

## Requisitos previos

- [Node.js](https://nodejs.org/) (v16 o superior)
- npm (incluido con Node.js)
- Python 3 (solo si se necesita regenerar las paginas de sectores)

## Instalacion y ejecucion

```bash
# 1. Clonar el repositorio
git clone https://github.com/<usuario>/Sistema-de-estacionamiento.git
cd Sistema-de-estacionamiento

# 2. Instalar dependencias
npm install

# 3. Compilar Tailwind CSS en modo watch (desarrollo)
npm run watch

# 4. En otra terminal, levantar un servidor local
npx serve .
```

El servidor se abrira en `http://localhost:3000`. Es necesario usar un servidor local
porque las paginas cargan datos con `fetch()`, lo cual no funciona al abrir los archivos
directamente desde el explorador (`file://`).

### Scripts disponibles

| Comando           | Descripcion                                                  |
|-------------------|--------------------------------------------------------------|
| `npm run watch`   | Compila Tailwind CSS y observa cambios en tiempo real        |
| `npm run build`   | Compila Tailwind CSS una sola vez (build de produccion)      |

### Regenerar paginas de sectores

Si se necesita actualizar la estructura HTML de los 4 sectores de forma masiva:

```bash
python scripts/update_sectors.py
```

Este script lee un template interno y genera `sector_a.html` a `sector_d.html` con la grilla de 36 espacios cada uno.

## Paginas del sistema

- **Inicio** (`index.html`) -- Landing page con formulario de login. Diseno en dos columnas: imagen de fondo con overlay a la izquierda y formulario a la derecha.
- **Sectores** (`pages/sectores.html`) -- Vista con tarjetas interactivas para cada sector. Grid responsivo que adapta de 1 a 4 columnas.
- **Sector individual** Mapa con grilla de espacios de estacionamiento. Cada espacio indica disponibilidad con codigo de color (verde/rojo).
- **Administracion** (`pages/administracion.html`) -- Dashboard con KPIs: espacios libres, porcentaje de ocupacion y sectores llenos. Incluye tabla de desglose por sector.
- **Contacto** (`pages/contacto.html`) -- Informacion de contacto en dos columnas con mapa de Google Maps embebido.

## Notas

- El archivo `output.css` se genera automaticamente y no se versiona (esta en `.gitignore`). Siempre debe compilarse localmente con `npm run watch` o `npm run build`.
- La carpeta `node_modules/` tampoco se versiona.
- Los datos de ocupacion mostrados en el panel de administracion son estaticos (hardcoded). No hay conexion a backend ni base de datos.

## Licencia

Proyecto academico - Universidad Catolica del Norte, Coquimbo.