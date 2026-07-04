import json
import sys
import time
import urllib.error
import urllib.parse
import urllib.request


BASE_URL = "http://localhost:8000"
ADMIN_EMAIL = "admin@estacionamientoucn.com"
ADMIN_PASSWORD = "estacionamiento202601"


class ApiTestError(Exception):
    pass


def request(method, path, *, token=None, headers=None, body=None, form=None):
    request_headers = headers.copy() if headers else {}
    data = None

    if form is not None:
        data = urllib.parse.urlencode(form).encode("utf-8")
        request_headers["Content-Type"] = "application/x-www-form-urlencoded"
    elif body is not None:
        data = json.dumps(body).encode("utf-8")
        request_headers["Content-Type"] = "application/json"

    if token:
        request_headers["Authorization"] = f"Bearer {token}"

    req = urllib.request.Request(
        f"{BASE_URL}{path}",
        data=data,
        headers=request_headers,
        method=method,
    )

    try:
        with urllib.request.urlopen(req, timeout=10) as response:
            raw = response.read().decode("utf-8")
            parsed = json.loads(raw) if raw else None
            return response.status, parsed
    except urllib.error.HTTPError as exc:
        raw = exc.read().decode("utf-8")
        parsed = json.loads(raw) if raw else None
        return exc.code, parsed


def assert_status(label, actual, expected):
    expected_values = expected if isinstance(expected, tuple) else (expected,)
    if actual not in expected_values:
        raise ApiTestError(f"{label}: expected {expected_values}, got {actual}")
    print(f"OK {label}: {actual}")


def main():
    timestamp = int(time.time())
    test_sector_id = "T"
    test_space_id = "T1"
    test_email = f"api-test-{timestamp}@example.com"
    token = None
    original_a1_state = None

    status, _ = request("GET", "/")
    assert_status("GET /", status, 200)

    status, _ = request("GET", "/api/dashboard/config")
    assert_status("GET /api/dashboard/config", status, 200)

    status, login_data = request(
        "POST",
        "/api/auth/login",
        body={"email": ADMIN_EMAIL, "password": ADMIN_PASSWORD},
    )
    assert_status("POST /api/auth/login", status, 200)
    token = login_data["access_token"]

    status, _ = request(
        "POST",
        "/api/auth/login/form",
        form={"username": ADMIN_EMAIL, "password": ADMIN_PASSWORD},
    )
    assert_status("POST /api/auth/login/form", status, 200)

    status, _ = request("POST", "/api/auth/google", body={"token": "invalid-test-token"})
    assert_status("POST /api/auth/google invalid token", status, (401, 500))

    status, me = request("GET", "/api/users/me", token=token)
    assert_status("GET /api/users/me", status, 200)

    status, users = request("GET", "/api/users/", token=token)
    assert_status("GET /api/users/", status, 200)

    status, created_user = request(
        "POST",
        "/api/users/",
        token=token,
        body={
            "nombre": "Usuario API Test",
            "email": test_email,
            "password": "test123456",
            "role": "user",
        },
    )
    assert_status("POST /api/users/", status, 201)
    test_user_id = created_user["id"]

    status, _ = request(
        "PUT",
        f"/api/users/{test_user_id}",
        token=token,
        body={"role": "staff", "activo": False},
    )
    assert_status("PUT /api/users/{user_id}", status, 200)

    status, sectores = request("GET", "/api/sectores")
    assert_status("GET /api/sectores", status, 200)
    if not sectores:
        raise ApiTestError("GET /api/sectores: expected at least one sector")

    status, sector_a = request("GET", "/api/sectores/A")
    assert_status("GET /api/sectores/A", status, 200)
    if sector_a.get("espacios"):
        original_a1 = next((e for e in sector_a["espacios"] if e["id"] == "A1"), None)
        if original_a1:
            original_a1_state = original_a1["estado"]

    status, _ = request(
        "PUT",
        "/api/espacios/A1/estado",
        headers={"X-Cambio-Por": "sistema"},
        body={"estado": "ocupado", "observaciones": "Prueba automatizada sistema"},
    )
    assert_status("PUT /api/espacios/A1/estado sistema", status, 200)

    status, _ = request(
        "PUT",
        "/api/espacios/A1/estado",
        token=token,
        body={"estado": "disponible", "observaciones": "Prueba automatizada admin"},
    )
    assert_status("PUT /api/espacios/A1/estado admin", status, 200)

    status, _ = request("GET", "/api/dashboard/metrics", token=token)
    assert_status("GET /api/dashboard/metrics", status, 200)

    status, _ = request("GET", "/api/dashboard/reportes", token=token)
    assert_status("GET /api/dashboard/reportes", status, 200)

    request("DELETE", f"/api/sectores/{test_sector_id}", token=token)
    status, created_sector = request(
        "POST",
        "/api/sectores",
        token=token,
        body={
            "id": test_sector_id,
            "nombre": "Sector Test API",
            "imagen": None,
            "latitud": -29.96,
            "longitud": -71.35,
        },
    )
    assert_status("POST /api/sectores", status, 201)
    if created_sector.get("latitud") != -29.96 or created_sector.get("longitud") != -71.35:
        raise ApiTestError("POST /api/sectores: expected latitude and longitude to be persisted")

    status, updated_sector = request(
        "PUT",
        f"/api/sectores/{test_sector_id}",
        token=token,
        body={
            "nombre": "Sector Test API Actualizado",
            "latitud": -29.97,
            "longitud": -71.36,
        },
    )
    assert_status("PUT /api/sectores/{sector_id}", status, 200)
    if updated_sector.get("latitud") != -29.97 or updated_sector.get("longitud") != -71.36:
        raise ApiTestError("PUT /api/sectores/{sector_id}: expected latitude and longitude to be updated")

    status, _ = request(
        "POST",
        "/api/espacios",
        token=token,
        body={"id": test_space_id, "estado": "disponible"},
    )
    assert_status("POST /api/espacios", status, 201)

    status, _ = request("DELETE", f"/api/sectores/{test_sector_id}", token=token)
    assert_status("DELETE /api/sectores/{sector_id}", status, 204)

    if original_a1_state:
        request(
            "PUT",
            "/api/espacios/A1/estado",
            headers={"X-Cambio-Por": "sistema"},
            body={"estado": original_a1_state, "observaciones": None},
        )

    print("\nTodos los endpoints testeables respondieron correctamente.")


if __name__ == "__main__":
    try:
        main()
    except Exception as exc:
        print(f"\nERROR: {exc}", file=sys.stderr)
        sys.exit(1)
