# Documentación Complementaria de la API - Sistema de Estacionamiento

Esta documentación expande y complementa la documentación autogenerada de FastAPI (disponible en el endpoint `/docs` o `/redoc` de la aplicación en ejecución). Sirve como guía rápida para comprender las convenciones y el uso de los endpoints principales.

---

## 1. Credenciales de Desarrollo por Defecto

Para facilitar el entorno de pruebas y desarrollo, el sistema incluye por defecto un usuario administrador inicial con las siguientes credenciales:

- **Email**: `admin@estacionamientoucn.com`
- **Password**: `estacionamiento20261`

Este usuario posee el rol `admin` y tiene permisos totales para administrar usuarios, sectores, espacios, y realizar cambios manuales de estado.

---

## 2. Identificadores de Sectores (IDs)

El sistema utiliza identificadores de un solo carácter (letras mayúsculas) para representar los diferentes sectores de estacionamiento en el campus. La correspondencia actual definida por defecto es la siguiente:

- **Sector A** = Sector Guacolda
- **Sector B** = Sector G5
- **Sector C** = Sector Vicerrectoría
- **Sector D** = Sector G6

Los identificadores de los espacios individuales se construyen anteponiendo el ID del sector al número del espacio. Por ejemplo: `A1`, `A2`, `B10`, `C5`, etc.

---

## 3. Endpoints Principales

A continuación se detallan los endpoints más relevantes para la integración e interacción con el sistema.

### 3.1. Autenticación (Login)

**`POST /api/auth/login`**

Permite a los usuarios y administradores autenticarse para obtener un token JWT (Bearer Token).

- **Parámetros Obligatorios (Body JSON)**:
  - `email` (string, formato de correo válido)
  - `password` (string)
- **Parámetros Opcionales**: Ninguno

**Ejemplo de Request**:
```json
{
  "email": "admin@estacionamientoucn.com",
  "password": "estacionamiento20261"
}
```

**Ejemplo de Response (200 OK)**:
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "token_type": "bearer"
}
```

### 3.2. Listado de Sectores y Espacios

**`GET /api/sectores`**

Endpoint de acceso público que retorna la lista completa de sectores junto con el estado de todos sus espacios asociados. Ideal para mostrar el mapa en tiempo real a los conductores.

- **Parámetros Obligatorios**: Ninguno
- **Parámetros Opcionales**: Ninguno
- **Headers Requeridos**: Ninguno (Público)

**Ejemplo de Request**: `GET /api/sectores`

**Ejemplo de Response (200 OK)**:
```json
[
  {
    "id": "A",
    "nombre": "Sector Guacolda",
    "imagen": null,
    "creado_en": "2026-06-08T10:00:00.000000",
    "actualizado_en": "2026-06-08T10:00:00.000000",
    "espacios": [
      {
        "id": "A1",
        "estado": "disponible",
        "actualizado_por": "sistema",
        "actualizado_en": "2026-06-08T10:05:00.000000"
      }
    ]
  }
]
```

### 3.3. Cambio de Estado de Espacios

**`PUT /api/espacios/{espacio_id}/estado`**

Permite actualizar el estado de un espacio de estacionamiento de forma automatizada (sensores IoT) o manual (administradores o usuarios).

- **Parámetros de Ruta (Obligatorio)**:
  - `espacio_id`: El ID alfanumérico del espacio a modificar (ej. `A1`).
- **Headers Requeridos** (Se necesita al menos uno dependiendo de la modalidad):
  - `Authorization`: `Bearer <token>` (Requerido para cambios manuales).
  - `X-Cambio-Por`: `sistema` (Requerido para cambios automatizados reportados por sensores sin token).
- **Parámetros Obligatorios (Body JSON)**:
  - `estado`: El nuevo estado (`disponible`, `ocupado`, `solicitado`, `inhabilitado`).
- **Parámetros Opcionales (Body JSON)**:
  - `observaciones`: Texto adicional (string). (ej. "Sensor desconectado").

**Ejemplo de Request (Sensor IoT actualizando a ocupado)**:
- **Headers**: `X-Cambio-Por: sistema`
- **Body**:
```json
{
  "estado": "ocupado",
  "observaciones": null
}
```

**Ejemplo de Response (200 OK)**:
```json
{
  "id": "A1",
  "estado": "ocupado",
  "actualizado_por": "sistema",
  "actualizado_en": "2026-06-08T10:10:00.000000"
}
```

### 3.4. Métricas del Dashboard

**`GET /api/dashboard/metrics`**

Proporciona estadísticas generales y porcentajes de ocupación en tiempo real para el panel de administración o vistas analíticas.

- **Headers Requeridos**: `Authorization: Bearer <token>`
- **Parámetros Obligatorios / Opcionales**: Ninguno

**Ejemplo de Request**: `GET /api/dashboard/metrics`

**Ejemplo de Response (200 OK)**:
```json
{
  "total_sectores": 4,
  "total_espacios": 160,
  "ocupados": 45,
  "disponibles": 115,
  "ocupacion_pct": 28.12,
  "sectores": [
    {
      "id": "A",
      "nombre": "Sector Guacolda",
      "total": 40,
      "disponibles": 30,
      "ocupados": 10
    }
  ],
  "sector_recomendado": "Sector Guacolda"
}
```
