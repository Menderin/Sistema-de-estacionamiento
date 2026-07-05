// scripts/notifications.js
// Manejo de notificaciones nativas con Capacitor

// Intentar importar el plugin de Capacitor. Si falla (estamos en web pura), usamos un fallback.
let LocalNotifications = null;
async function initNotificationsPlugin() {
    try {
        // En un entorno Capacitor real, esto se cargaría desde la ventana global o vía import
        if (window.Capacitor && window.Capacitor.Plugins.LocalNotifications) {
            LocalNotifications = window.Capacitor.Plugins.LocalNotifications;
            const permission = await LocalNotifications.requestPermissions();
            console.log("Permisos de notificación:", permission.display);
        }
    } catch (e) {
        console.warn("Plugins de Capacitor no disponibles, operando en modo web.");
    }
}

// Función para enviar una notificación local
export async function sendLocalNotification(title, body) {
    console.log(`[NOTIF] ${title}: ${body}`);

    if (LocalNotifications) {
        await LocalNotifications.schedule({
            notifications: [
                {
                    title: title,
                    body: body,
                    id: Math.floor(Math.random() * 10000),
                    schedule: { at: new Date(Date.now() + 1000) }, // 1 segundo después
                    sound: null,
                    attachments: null,
                    actionTypeId: "",
                    extra: null
                }
            ]
        });
    } else {
        // Fallback: Notificación del navegador o simplemente log
        if ("Notification" in window && Notification.permission === "granted") {
            new Notification(title, { body });
        }
    }
}

// Inicializar al cargar el script
initNotificationsPlugin();
