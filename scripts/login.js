// ===========================================================
// CONFIGURACIÓN — Se carga dinámicamente desde el backend
// ===========================================================
let GOOGLE_CLIENT_ID = null;
import { API_BASE } from "./config.js";

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
    const navUsers = document.getElementById("nav-users");

    if (session.role === "admin") {
        badge.textContent = "Administrador";
        badge.className = "inline-block mt-3 px-3 py-1 rounded-full text-xs font-bold bg-red-100 text-red-700";
        btnAdmin.classList.remove("hidden");
        navAdmin.classList.remove("hidden");
        navUsers.classList.remove("hidden");
    } else {
        badge.textContent = "Usuario";
        badge.className = "inline-block mt-3 px-3 py-1 rounded-full text-xs font-bold bg-blue-100 text-blue-700";
        btnAdmin.classList.add("hidden");
        navAdmin.classList.add("hidden");
        navUsers.classList.add("hidden");
    }
}

function renderLoggedOut() {
    document.getElementById("login-panel").classList.remove("hidden");
    document.getElementById("profile-panel").classList.add("hidden");

    document.getElementById("nav-admin").classList.add("hidden");
    document.getElementById("nav-users").classList.add("hidden");
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
// CALLBACK LOGIN TRADICIONAL
// ===========================================================

async function handleTraditionalLogin(e) {
    e.preventDefault();
    
    const email = document.getElementById("login-email").value;
    const password = document.getElementById("login-password").value;
    const btnSubmit = document.getElementById("login-submit-btn");
    const errorMsg = document.getElementById("login-error-msg");
    
    btnSubmit.disabled = true;
    btnSubmit.textContent = "Ingresando...";
    errorMsg.classList.add("hidden");

    try {
        const res = await fetch(`${API_BASE}/auth/login`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email, password })
        });

        if (!res.ok) {
            const err = await res.json();
            errorMsg.textContent = err.detail || "Credenciales incorrectas";
            errorMsg.classList.remove("hidden");
            btnSubmit.disabled = false;
            btnSubmit.textContent = "Ingresar";
            return;
        }

        const data = await res.json();
        const accessToken = data.access_token;

        // Obtener datos del usuario desde el backend usando el JWT
        const meRes = await fetch(`${API_BASE}/users/me`, {
            headers: { Authorization: `Bearer ${accessToken}` }
        });

        if (!meRes.ok) throw new Error("No se pudo cargar el perfil");
        const userData = await meRes.json();

        // Guardar sesión
        saveSession({
            access_token: accessToken,
            nombre: userData.nombre,
            email: userData.email,
            role: userData.role,
            picture: null
        });

        // Limpiar el formulario
        document.getElementById("traditional-login-form").reset();
        
        renderLoggedIn(getSession());

    } catch (error) {
        console.error("Error en login tradicional:", error);
        errorMsg.textContent = "Error de conexión con el servidor";
        errorMsg.classList.remove("hidden");
    } finally {
        btnSubmit.disabled = false;
        btnSubmit.textContent = "Ingresar";
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

    const loginForm = document.getElementById("traditional-login-form");
    if (loginForm) loginForm.addEventListener("submit", handleTraditionalLogin);

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
        const session = getSession();
        const roleBadgeText = session.role === "admin" ? `<span data-i18n="role_admin">Administrador</span>` : `<span data-i18n="role_usuario">Usuario</span>`;
        document.getElementById("user-role-badge").innerHTML = roleBadgeText;

        // Mostrar botón admin si es admin
        if (session.role === "admin") {
            const navAdmin = document.getElementById("nav-admin");
            if (navAdmin) navAdmin.classList.remove("hidden");
            const navUsers = document.getElementById("nav-users");
            if (navUsers) navUsers.classList.remove("hidden");
            const btnAdmin = document.getElementById("btn-admin");
            if (btnAdmin) btnAdmin.classList.remove("hidden");
        }

        const res = await fetch(`${API_BASE}/dashboard/metrics`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        if (!res.ok) return;
        const data = await res.json();

        const metricsDiv = document.getElementById("metrics-container");
        if (!metricsDiv) return;

        metricsDiv.innerHTML = `
            <div class="bg-white dark:bg-gray-700 p-3 rounded shadow-sm border border-blue-100 dark:border-gray-600 text-left mt-4 text-sm transition-colors duration-300">
                <p class="font-semibold text-gray-700 dark:text-gray-200"><span data-i18n="metric_disponibilidad">Disponibilidad total:</span> <span class="text-blue-600 dark:text-blue-400 font-bold">${data.disponibles} <span data-i18n="metric_espacios">espacios</span></span></p>
                <p class="font-semibold text-gray-700 dark:text-gray-200"><span data-i18n="metric_ocupacion">Ocupación actual:</span> <span class="text-orange-500 dark:text-orange-400 font-bold">${data.ocupacion_pct}%</span></p>
                ${data.sector_recomendado ? `<p class="font-semibold text-green-600 dark:text-green-400 mt-1"><span data-i18n="metric_recomendacion">Recomendación: Sector</span> ${data.sector_recomendado}</p>` : ''}
            </div>
        `;
        
        // Re-apply translations for dynamic content
        if (typeof applyTranslations === 'function') {
            applyTranslations();
        }
    } catch (e) {
        console.warn("No se pudieron cargar las métricas:", e);
    }
}window.addEventListener("i18n_changed", () => {
    const session = JSON.parse(localStorage.getItem("ucn_session"));
    if (session) {
        const badge = document.getElementById("user-role-badge");
        if (badge) {
             badge.innerHTML = session.role === "admin" ? `<span data-i18n="role_admin">Administrador</span>` : `<span data-i18n="role_usuario">Usuario</span>`;
        }
        if (typeof applyTranslations === "function") applyTranslations();
    }
});
