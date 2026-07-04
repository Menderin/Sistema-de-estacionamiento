# Sistema de Estacionamiento - UCN CQBO

Sistema híbrido (Web y Android) para la gestión y visualización de los estacionamientos de la Universidad Católica del Norte, sede Coquimbo.

Integrantes: Daniel Trigo, Victor Jopia, Julian Gallardo, Kevin Silva

Link al repositorio: https://github.com/Menderin/Sistema-de-estacionamiento

## Descripción

Aplicación para consultar sectores de estacionamiento, revisar disponibilidad de espacios en tiempo real, solicitar reservas con ruta GPS y administrar estados desde un panel protegido.

El sistema trabaja con 4 sectores principales:

| Sector | Nombre          | Ubicación |
|--------|-----------------|-----------|
| A      | Guacolda        | Acceso Principal |
| B      | G5              | Zona Central |
| C      | Vicerrectoría   | Parte Alta |
| D      | G6              | Zona Deportiva |

## Funcionalidades Destacadas

- **Mapa Interactivo**: Uso de Leaflet con marcadores para localizar sectores en el campus.
- **Ruta GPS**: Cálculo automático de ruta vehicular desde la ubicación del usuario hasta el estacionamiento reservado.
- **Gestión de Reservas**: Restricción de una sola reserva activa por usuario para garantizar equidad.
- **Multiplataforma**: Funciona en Navegador Web y como App Nativa en Android gracias a Capacitor.

## Stack Tecnológico

- **Frontend**: HTML5, Tailwind CSS v3.4, JavaScript (ES6+), Leaflet.js.
- **Móvil**: Capacitor.js (Acceso a Cámara y GPS nativo).
- **Backend**: FastAPI (Python), SQLAlchemy.
- **Base de Datos**: PostgreSQL / SQLite (Desarrollo).
- **Despliegue**: Docker Compose & Railway.

## Ejecución en Dispositivos Móviles (Android)

Para desplegar los cambios en un celular o emulador:

1. **Sincronizar archivos web**:
   ```bash
   npm run build
   # Copiar archivos a la carpeta www y sincronizar
   cp -Recurse scripts,pages,assets,index.html www/
   npx cap sync android
   ```
2. **Abrir en Android Studio**:
   ```bash
   npx cap open android
   ```
3. Presionar **Run** (triángulo verde) en Android Studio.

## Credenciales de Prueba

| Rol | Email | Password |
|-----|-------|----------|
| **Admin** | `admin@estacionamientoucn.com` | `estacionamiento202601` |
| **User** | `user@estacionamientoucn.com` | `user123` |

## Estructura del Proyecto

```text
Sistema-de-estacionamiento/
|-- www/                # Carpeta de distribución para Capacitor
|-- android/            # Proyecto nativo de Android
|-- assets/             # Estilos y recursos visuales
|-- backend/            # API FastAPI y scripts de DB
|-- pages/              # Vistas HTML (Sectores, Admin, Contacto)
|-- scripts/            # Lógica JS (Login, Mapas, GPS)
|-- capacitor.config.json
+-- docker-compose.yml
```

## Scripts Útiles

| Comando | Descripción |
|---------|-------------|
| `npm run watch` | Observa cambios en Tailwind CSS |
| `python backend/create_admin.py` | Crea el usuario administrador base |
| `python backend/create_test_user.py` | Crea un usuario estándar para pruebas |
| `npx cap sync` | Sincroniza cambios web con la app nativa |

## Páginas del Sistema

- **Inicio**: Login y métricas generales.
- **Sectores**: Mapa interactivo y grilla de espacios en tiempo real.
- **Administración**: Panel de control para gestionar reportes y estados.
- **Contacto**: Información de soporte y ubicación de la sede.

## Licencia

Proyecto académico - Universidad Católica del Norte, Coquimbo.
