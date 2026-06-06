// ===========================================================
// CONFIGURACIÓN — Se carga dinámicamente desde el backend
// ===========================================================
let GOOGLE_CLIENT_ID = null;
const API_BASE = "http://localhost:8000/api";

async function loadConfig() {
    const res = await fetch(`${API_BASE}/dashboard/config`);
    const config = await res.json();
    GOOGLE_CLIENT_ID = config.google_client_id;
}

// ===========================================================
// GESTIÓN DE SESIÓN (localStorage)
// ===========================================================

function getSession() {
    try {
        return JSON.parse(localStorage.getItem("ucn_session")) || null;
    } catch {
        return null;
    }
}

function saveSession(data) {
    localStorage.setItem("ucn_session", JSON.stringify(data));
}

function clearSession() {
    localStorage.removeItem("ucn_session");
}

// ===========================================================
// ACTUALIZAR UI SEGÚN ESTADO DE SESIÓN
// ===========================================================

function renderLoggedIn(session) {
    // Ocultar panel de login, mostrar perfil
    document.getElementById("login-panel").classList.add("hidden");
    document.getElementById("profile-panel").classList.remove("hidden");

    // Datos del usuario
    document.getElementById("user-name").textContent = session.nombre || "Usuario";
    document.getElementById("user-email").textContent = session.email || "";

    // Avatar desde Google (si se guardó)
    const avatar = document.getElementById("user-avatar");

    console.log("session.picture:", session.picture);


    if (session.picture) {
        avatar.src = session.picture;
        avatar.classList.remove("hidden");
    } else {
        // Iniciales como fallback
        avatar.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(session.nombre || "U")}&background=1d4ed8&color=fff`;
    }
    loadMetrics(session.access_token);
    // Badge y botones según rol
    const badge = document.getElementById("user-role-badge");
    const btnAdmin = document.getElementById("btn-admin");
    const navAdmin = document.getElementById("nav-admin");
    const navSectores = document.getElementById("nav-sectores");

    if (session.role === "admin") {
        badge.textContent = "Administrador";
        badge.className = "inline-block mt-3 px-3 py-1 rounded-full text-xs font-bold bg-red-100 text-red-700";
        btnAdmin.classList.remove("hidden");
        navAdmin.classList.remove("hidden");
    } else {
        badge.textContent = "Usuario";
        badge.className = "inline-block mt-3 px-3 py-1 rounded-full text-xs font-bold bg-blue-100 text-blue-700";
        btnAdmin.classList.add("hidden");
        navAdmin.classList.add("hidden");
    }

    navSectores.classList.remove("hidden");
}

function renderLoggedOut() {
    document.getElementById("login-panel").classList.remove("hidden");
    document.getElementById("profile-panel").classList.add("hidden");

    document.getElementById("nav-sectores").classList.add("hidden");
    document.getElementById("nav-admin").classList.add("hidden");
}

// ===========================================================
// CALLBACK DE GOOGLE — Se llama cuando el usuario elige cuenta
// ===========================================================

async function handleGoogleCredential(response) {
    const idToken = response.credential;

    // Decodificar el JWT de Google para obtener la foto (solo info pública, no verificación)
    const payload = JSON.parse(atob(idToken.split('.')[1]));
    const picture = payload.picture || null;

    console.log("picture URL:", picture);  

    try {
        const res = await fetch(`${API_BASE}/auth/google`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ token: idToken })
        });

        if (!res.ok) {
            const err = await res.json();
            alert("Error al iniciar sesión: " + (err.detail || "Intenta de nuevo"));
            return;
        }

        const data = await res.json();
        const accessToken = data.access_token;

        // Obtener datos del usuario desde el backend usando el JWT
        const meRes = await fetch(`${API_BASE}/users/me`, {
            headers: { Authorization: `Bearer ${accessToken}` }
        });

        let userData = {};
        if (meRes.ok) {
            userData = await meRes.json();
        } else {
            // Fallback: usar datos del token de Google
            userData = {
                nombre: payload.name || "Usuario",
                email: payload.email,
                role: "user"
            };
        }

        // Guardar sesión
        saveSession({
            access_token: accessToken,
            nombre: userData.nombre || payload.name,
            email: userData.email || payload.email,
            role: userData.role || "user",
            picture: picture
        });

        renderLoggedIn(getSession());

    } catch (error) {
        console.error("Error en login con Google:", error);
        alert("Error de red. Asegúrate de que el backend está activo en " + API_BASE);
    }
}

// ===========================================================
// LOGOUT
// ===========================================================

function logout() {
    clearSession();

    // Revocar sesión de Google también
    if (typeof google !== "undefined" && google.accounts) {
        google.accounts.id.disableAutoSelect();
    }

    renderLoggedOut();
}

// ===========================================================
// INICIALIZACIÓN AL CARGAR LA PÁGINA
// ===========================================================

function waitForGoogleSDK() {
    return new Promise((resolve, reject) => {
        if (typeof google !== "undefined" && google.accounts) {
            resolve();
            return;
        }
        let attempts = 0;
        const interval = setInterval(() => {
            attempts++;
            if (typeof google !== "undefined" && google.accounts) {
                clearInterval(interval);
                resolve();
            } else if (attempts > 20) {
                clearInterval(interval);
                reject(new Error("Google SDK no cargó después de 6 segundos"));
            }
        }, 300);
    });
}

window.addEventListener("load", async () => {
    const btnLogout = document.getElementById("btn-logout");
    if (btnLogout) btnLogout.addEventListener("click", logout);

    const session = getSession();
    if (session && session.access_token) {
        renderLoggedIn(session);
    } else {
        renderLoggedOut();
    }

    // Esperar AMBAS cosas antes de inicializar Google
    try {
        await Promise.all([
            loadConfig(),
            waitForGoogleSDK()
        ]);
        initGoogleSignIn();
    } catch (e) {
        console.warn("No se pudo inicializar Google Sign-In:", e);
    }
});

function initGoogleSignIn() {
    if (!GOOGLE_CLIENT_ID) {
        console.warn("Google Client ID no disponible.");
        return;
    }
    google.accounts.id.initialize({
        client_id: GOOGLE_CLIENT_ID,
        callback: handleGoogleCredential,
        auto_select: false
    });

    // Renderizar el botón oficial de Google
    google.accounts.id.renderButton(
        document.getElementById("google-signin-btn"),
        {
            theme: "outline",
            size: "large",
            width: 280,
            text: "signin_with",
            logo_alignment: "left"
        }
    );

    // Ocultar el botón de respaldo una vez que el SDK está listo
    const fallback = document.getElementById("google-fallback-btn");
    if (fallback) fallback.classList.add("hidden");
}

// Función para el botón de respaldo: abre el popup de Google manualmente
function triggerGoogleLogin() {
    if (typeof google !== "undefined" && google.accounts && GOOGLE_CLIENT_ID) {
        google.accounts.id.prompt();
    } else if (!GOOGLE_CLIENT_ID) {
        alert("No se pudo conectar con el servidor. Verifica que el backend esté activo.");
    } else {
        alert("El servicio de Google aún está cargando. Intenta en un momento.");
    }
}

async function loadMetrics(token) {
    try {
        const res = await fetch(`${API_BASE}/dashboard/metrics`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        if (!res.ok) return;
        const data = await res.json();

        const container = document.getElementById("metrics-container");
        if (!container) return;

        container.innerHTML = `
            <div class="mt-6 grid grid-cols-2 gap-3 text-center">
                <div class="bg-white rounded-lg p-3 shadow-sm border border-blue-100">
                    <p class="text-2xl font-bold text-blue-600">${data.disponibles}</p>
                    <p class="text-xs text-gray-500 mt-1">Espacios libres</p>
                </div>
                <div class="bg-white rounded-lg p-3 shadow-sm border border-blue-100">
                    <p class="text-2xl font-bold text-blue-600">${data.ocupacion_pct}%</p>
                    <p class="text-xs text-gray-500 mt-1">Ocupación</p>
                </div>
            </div>
            ${data.sector_recomendado ? `
            <div class="mt-3 bg-green-50 border border-green-200 rounded-lg p-3 text-center">
                <p class="text-xs text-green-600 font-medium">Sector recomendado</p>
                <p class="text-lg font-bold text-green-700 mt-1">📍 ${data.sector_recomendado}</p>
                <p class="text-xs text-green-500">Mayor disponibilidad ahora</p>
            </div>` : ""}
        `;
    } catch (e) {
        console.warn("No se pudieron cargar las métricas:", e);
    }
}