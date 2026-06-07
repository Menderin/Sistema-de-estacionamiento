const translations = {
    es: {
        header_title: "Estacionamientos UCN sede Coquimbo",
        nav_inicio: "Inicio",
        nav_sectores: "Sectores",
        nav_admin: "Administración",
        nav_contacto: "Contacto y ubicación",
        lbl_disponible: "Disponible",
        lbl_reservado: "Reservado",
        lbl_ocupado: "Ocupado/Inhabilitado",
        btn_lang: "EN",
        hero_title: "Bienvenido al sistema de estacionamiento de la UCN sede Coquimbo",
        hero_desc: "Nuestro objetivo es aprovechar al máximo los espacios y facilitar el acceso de manera rápida y eficaz. ¡Disfruta su uso!",
        login_title: "Iniciar sesión",
        login_desc: "Usa tu cuenta de Google para acceder",
        login_btn: "Ingresar",
        google_btn: "Iniciar sesión con Google",
        google_desc: "Puedes usar cualquier cuenta de Google.<br>Si tu correo es institucional (@ucn.cl), también es bienvenido.",
        metric_disponibilidad: "Disponibilidad total:",
        metric_espacios: "espacios",
        metric_ocupacion: "Ocupación actual:",
        metric_recomendacion: "Recomendación: Sector",
        btn_ver_sectores: "Ver Sectores",
        btn_panel_admin: "Panel de Administración",
        btn_cerrar_sesion: "Cerrar sesión",
        role_usuario: "Usuario",
        role_admin: "Administrador",
        
        // Sectores page
        sec_title: "Sectores",
        sec_desc: "Aquí puedes ver los sectores de estacionamiento disponibles",
        sec_btn_ver: "Ver espacios",
        sec_btn_volver: "← Volver a Sectores",
        sec_mapa_titulo: "Mapa: Sector",
        btn_solicitar: "Solicitar",
        btn_reportar: "Reportar",
        btn_ocupar: "Ocupar",
        btn_inhabilitar: "Inhabilitar",
        btn_liberar: "Liberar",
        alert_login: "Debes iniciar sesión para realizar acciones sobre un espacio.",
        
        // Administracion page
        adm_title: "Panel de Administración",
        adm_desc: "Métricas y estado general en tiempo real",
        adm_btn_update: "Actualizar Datos",
        adm_card_libres: "Espacios Libres Totales",
        adm_card_uso: "Uso Actual (Ocupación)",
        adm_card_llenos: "Sectores Llenos",
        adm_de: "de",
        adm_lleno: "Lleno",
        adm_desglose: "Desglose por Sector",
        adm_th_sector: "Sector",
        adm_th_capacidad: "Capacidad Total",
        adm_th_ocupados: "Ocupados",
        adm_th_disponibles: "Disponibles",
        adm_th_estado: "Estado",
        adm_loading: "Cargando datos desde el backend...",
        adm_rep_title: "Reportes de Espacios",
        adm_th_espacio: "Espacio",
        adm_th_mensaje: "Mensaje",
        adm_th_acciones: "Acciones",
        adm_rep_loading: "Cargando reportes...",
        adm_rep_empty: "No hay reportes o solicitudes activas.",
        adm_btn_resuelto: "Marcar Resuelto",
        adm_confirm: "¿Confirmar?",
        adm_btn_si: "Sí, resolver",
        adm_btn_no: "Cancelar",
        adm_sin_espacios: "Sin espacios",
        adm_resolviendo: "Resolviendo...",

        // Contacto page
        con_title: "Contacto y Ubicación",
        con_desc: "Mapa del recinto e información",
        con_dir_title: "Dirección",
        con_dir_val: "Larrondo 1281,<br>Coquimbo, Chile",
        con_tel_title: "Teléfono",
        con_email_title: "Correo electrónico",
        con_horario_title: "Horario de atención",
        con_horario_val: "Lunes a Viernes: 8:00 a 18:00<br>Sábado: 8:00 a 14:00"
    },
    en: {
        header_title: "UCN Coquimbo Parking",
        nav_inicio: "Home",
        nav_sectores: "Sectors",
        nav_admin: "Administration",
        nav_contacto: "Contact & Location",
        lbl_disponible: "Available",
        lbl_reservado: "Reserved",
        lbl_ocupado: "Occupied/Disabled",
        btn_lang: "ES",
        hero_title: "Welcome to the UCN Coquimbo parking system",
        hero_desc: "Our goal is to maximize spaces and facilitate quick and efficient access. Enjoy using it!",
        login_title: "Login",
        login_desc: "Use your Google account to access",
        login_btn: "Enter",
        google_btn: "Sign in with Google",
        google_desc: "You can use any Google account.<br>If your email is institutional (@ucn.cl), it's also welcome.",
        metric_disponibilidad: "Total Availability:",
        metric_espacios: "spaces",
        metric_ocupacion: "Current Occupancy:",
        metric_recomendacion: "Recommendation: Sector",
        btn_ver_sectores: "View Sectors",
        btn_panel_admin: "Admin Panel",
        btn_cerrar_sesion: "Sign Out",
        role_usuario: "User",
        role_admin: "Administrator",

        // Sectors page
        sec_title: "Sectors",
        sec_desc: "Here you can see the available parking sectors",
        sec_btn_ver: "View spaces",
        sec_btn_volver: "← Back to Sectors",
        sec_mapa_titulo: "Map: Sector",
        btn_solicitar: "Request",
        btn_reportar: "Report",
        btn_ocupar: "Occupy",
        btn_inhabilitar: "Disable",
        btn_liberar: "Release",
        alert_login: "You must sign in to perform actions on a parking space.",
        
        // Admin page
        adm_title: "Administration Panel",
        adm_desc: "Real-time general metrics and status",
        adm_btn_update: "Update Data",
        adm_card_libres: "Total Free Spaces",
        adm_card_uso: "Current Use (Occupancy)",
        adm_card_llenos: "Full Sectors",
        adm_de: "of",
        adm_lleno: "Full",
        adm_desglose: "Breakdown by Sector",
        adm_th_sector: "Sector",
        adm_th_capacidad: "Total Capacity",
        adm_th_ocupados: "Occupied",
        adm_th_disponibles: "Available",
        adm_th_estado: "Status",
        adm_loading: "Loading data from backend...",
        adm_rep_title: "Space Reports",
        adm_th_espacio: "Space",
        adm_th_mensaje: "Message",
        adm_th_acciones: "Actions",
        adm_rep_loading: "Loading reports...",
        adm_rep_empty: "There are no active reports or requests.",
        adm_btn_resuelto: "Mark Resolved",
        adm_confirm: "Confirm?",
        adm_btn_si: "Yes, resolve",
        adm_btn_no: "Cancel",
        adm_sin_espacios: "No spaces",
        adm_resolviendo: "Resolving...",

        // Contact page
        con_title: "Contact & Location",
        con_desc: "Campus map and information",
        con_dir_title: "Address",
        con_dir_val: "Larrondo 1281,<br>Coquimbo, Chile",
        con_tel_title: "Phone",
        con_email_title: "Email",
        con_horario_title: "Office Hours",
        con_horario_val: "Monday to Friday: 8:00 to 18:00<br>Saturday: 8:00 to 14:00"
    }
};

let currentLang = localStorage.getItem("ucn_lang") || "es";
let isDark = localStorage.getItem("ucn_theme") === "dark";

function applyTranslations() {
    document.querySelectorAll("[data-i18n]").forEach(el => {
        const key = el.getAttribute("data-i18n");
        if (translations[currentLang][key]) {
            el.innerHTML = translations[currentLang][key];
        }
    });
    const btn = document.getElementById("btn-lang");
    if (btn) btn.textContent = currentLang === "es" ? "EN" : "ES";

    // Disparar evento para que otros scripts que generan HTML dinámicamente sepan que cambió
    window.dispatchEvent(new Event("i18n_changed"));
}

function toggleLang() {
    currentLang = currentLang === "es" ? "en" : "es";
    localStorage.setItem("ucn_lang", currentLang);
    applyTranslations();
}

function applyTheme() {
    if (isDark) {
        document.documentElement.classList.add("dark");
    } else {
        document.documentElement.classList.remove("dark");
    }
    const icon = document.getElementById("theme-icon");
    if (icon) icon.textContent = isDark ? "☀️" : "🌙";
}

function toggleTheme() {
    isDark = !isDark;
    localStorage.setItem("ucn_theme", isDark ? "dark" : "light");
    applyTheme();
}

document.addEventListener("DOMContentLoaded", () => {
    applyTranslations();
    applyTheme();
});
