# Sistema de Estacionamiento - UCN CQBO

Sistema web para la gestion y visualizacion de los estacionamientos de la Universidad Catolica del Norte, sede Coquimbo.

Integrantes: Daniel Trigo, Victor Jopia, Julian Gallardo, Kevin Silva

Link al repositorio: https://github.com/Menderin/Sistema-de-estacionamiento

## Descripcion

Aplicacion web para consultar sectores de estacionamiento, revisar disponibilidad de espacios, iniciar sesion, solicitar/reportar espacios y administrar estados desde un panel protegido.

El sistema trabaja con 4 sectores y 40 espacios por sector en la carga inicial:

| Sector | Nombre          |
|--------|-----------------|
| A      | Guacolda        |
| B      | G5              |
| C      | Vicerrectoria   |
| D      | G6              |

Los datos se guardan en PostgreSQL dentro de Docker. Los sectores, espacios, usuarios y estados se mantienen mientras no se elimine el volumen de la base de datos.

## Stack tecnologico

- **HTML5, CSS y JavaScript** -- Interfaz web estatica.
- **Tailwind CSS v3.4** -- Utilidades CSS para estilos responsivos.
- **FastAPI** -- API backend modular.
- **SQLAlchemy** -- Modelos y acceso a datos.
- **PostgreSQL 15** -- Base de datos principal en Docker.
- **Docker Compose** -- Orquestacion de frontend, backend y base de datos.

## Estructura del repositorio

```text
Sistema-de-estacionamiento/
|-- index.html
|-- docker-compose.yml
|-- package.json
|-- tailwind.config.js
|
|-- assets/
|   |-- css/
|   +-- img/
|
|-- backend/
|   |-- app/
|   |-- core/
|   |-- database/
|   |-- modules/
|   |-- utils/
|   |-- Dockerfile
|   |-- requirements.txt
|   |-- create_admin.py
|   +-- seed_sectores.py
|
|-- pages/
|   |-- sectores.html
|   |-- administracion.html
|   +-- contacto.html
|
+-- scripts/
    |-- login.js
    |-- sectores.js
    |-- administracion.js
    +-- i18n.js
```

## Requisitos previos

- [Docker Desktop](https://www.docker.com/products/docker-desktop/)
- [Node.js](https://nodejs.org/) y npm, solo si se compila Tailwind localmente

## Ejecucion con Docker

Desde la raiz del proyecto:

```bash
docker compose up --build
```

En ejecuciones posteriores, si no hay cambios en dependencias o Dockerfile:

```bash
docker compose up
```

Servicios disponibles:

| Servicio | URL |
|----------|-----|
| Frontend | http://localhost |
| Backend API | http://localhost:8000 |
| Documentacion API | http://localhost:8000/docs |
| PostgreSQL | localhost:5432 |

El backend ejecuta automaticamente al iniciar:

```bash
python create_admin.py
python seed_sectores.py
uvicorn app.main:app --host 0.0.0.0 --port 8000
```

Esto asegura que exista el usuario administrador y que existan los sectores/espacios base. El seed no reinicia estados de espacios ya existentes.

## Credenciales de desarrollo

Usuario administrador creado por defecto:

```text
Email: admin@estacionamientoucn.com
Password: estacionamiento202601
```

Estas credenciales son para desarrollo academico/local. No deberian usarse tal cual en produccion.

## Persistencia de datos

PostgreSQL usa un volumen Docker:

```yaml
postgres_data:/var/lib/postgresql/data
```

Por eso los datos no se pierden al apagar y volver a levantar los contenedores con `docker compose up`.

Los datos se eliminan si se borra el volumen, por ejemplo con:

```bash
docker compose down -v
```

## Desarrollo frontend

Para compilar Tailwind localmente:

```bash
npm install
npm run watch
```

Tambien se puede servir el frontend estatico fuera de Docker:

```bash
npx serve .
```

En ese caso el frontend se abre normalmente en `http://localhost:3000`, pero el backend debe seguir activo en `http://localhost:8000` para que funcionen login, sectores, metricas y cambios de estado.

## Scripts utiles

| Comando | Descripcion |
|---------|-------------|
| `npm run watch` | Compila Tailwind CSS y observa cambios |
| `npm run build` | Compila Tailwind CSS una vez |
| `docker compose exec backend python create_admin.py` | Crea o actualiza el admin |
| `docker compose exec backend python seed_sectores.py` | Crea sectores y espacios faltantes |
| `docker compose exec backend python simulate_parking.py` | Simula cambios aleatorios de espacios manualmente |

### Simular actividad de estacionamiento

El servicio `simulator` se levanta junto con Docker Compose y cambia espacios cada 5 segundos para simular actividad en vivo.

Para ver sus logs:

```bash
docker compose logs -f simulator
```

Para detener solo la simulacion:

```bash
docker compose stop simulator
```

Para generar movimiento manual adicional:

```bash
docker compose exec backend python simulate_parking.py
```

Tambien se puede indicar cantidad de cambios y espera entre cada cambio:

```bash
docker compose exec backend python simulate_parking.py --iterations 50 --delay 1
```

## Paginas del sistema

- **Inicio** (`index.html`) -- Login tradicional y Google Sign-In.
- **Sectores** (`pages/sectores.html`) -- Vista de sectores y grilla de espacios.
- **Administracion** (`pages/administracion.html`) -- Panel administrativo con metricas y gestion.
- **Usuarios** (`pages/usuarios.html`) -- Gestion de cuentas, roles y estado de acceso para administradores.
- **Contacto** (`pages/contacto.html`) -- Informacion de contacto y ubicacion.

## Notas

- El archivo `output.css` se genera automaticamente y no se versiona.
- La carpeta `node_modules/` no se versiona.
- El frontend consume la API en `http://localhost:8000/api`.
- Si el login admin falla, verificar que el backend haya arrancado correctamente y que `create_admin.py` se haya ejecutado dentro del contenedor.

## Licencia

Proyecto academico - Universidad Catolica del Norte, Coquimbo.
