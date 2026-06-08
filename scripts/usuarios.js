import { API_BASE } from "./config.js";

function getSession() {
    try {
        return JSON.parse(localStorage.getItem("ucn_session")) || null;
    } catch {
        return null;
    }
}

function getAuthHeaders() {
    const session = getSession();
    return {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${session.access_token}`
    };
}

function setMessage(text, type = "ok") {
    const msg = document.getElementById("user-form-msg");
    msg.textContent = text;
    msg.className = type === "error"
        ? "mt-3 text-sm text-red-600 dark:text-red-400"
        : "mt-3 text-sm text-green-600 dark:text-green-400";
}

async function fetchUsers() {
    const tbody = document.getElementById("users-tbody");
    tbody.innerHTML = `<tr><td colspan="5" class="p-4 text-center text-gray-500 dark:text-gray-400">Cargando usuarios...</td></tr>`;

    try {
        const res = await fetch(`${API_BASE}/users/`, {
            headers: getAuthHeaders()
        });

        if (!res.ok) {
            throw new Error("No se pudieron cargar usuarios");
        }

        const users = await res.json();
        renderUsers(users);
    } catch (error) {
        tbody.innerHTML = `<tr><td colspan="5" class="p-4 text-center text-red-600">Error al cargar usuarios</td></tr>`;
    }
}

function renderUsers(users) {
    const tbody = document.getElementById("users-tbody");
    const session = getSession();

    if (!users.length) {
        tbody.innerHTML = `<tr><td colspan="5" class="p-4 text-center text-gray-500 dark:text-gray-400">No hay usuarios registrados.</td></tr>`;
        return;
    }

    tbody.innerHTML = "";
    users.forEach(user => {
        const isSelf = session && session.email === user.email;
        const tr = document.createElement("tr");
        tr.className = "border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors";
        tr.innerHTML = `
            <td class="p-3 font-bold text-gray-800 dark:text-gray-100">${user.nombre}</td>
            <td class="p-3">${user.email}</td>
            <td class="p-3">
                <select class="user-role-select px-2 py-1 rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 dark:text-white text-sm" data-user-id="${user.id}" ${isSelf ? "disabled" : ""}>
                    <option value="user" ${user.role === "user" ? "selected" : ""}>Usuario</option>
                    <option value="staff" ${user.role === "staff" ? "selected" : ""}>Staff</option>
                    <option value="admin" ${user.role === "admin" ? "selected" : ""}>Admin</option>
                </select>
            </td>
            <td class="p-3">
                <span class="inline-block px-2 py-1 rounded-full text-xs font-bold ${user.activo ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}">
                    ${user.activo ? "Activo" : "Inactivo"}
                </span>
            </td>
            <td class="p-3 text-right">
                <button class="user-toggle-btn ${user.activo ? "bg-red-600 hover:bg-red-700" : "bg-green-600 hover:bg-green-700"} text-white text-xs font-bold px-3 py-1.5 rounded shadow transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed" data-user-id="${user.id}" data-active="${user.activo}" ${isSelf ? "disabled" : ""}>
                    ${user.activo ? "Desactivar" : "Reactivar"}
                </button>
            </td>
        `;
        tbody.appendChild(tr);
    });

    document.querySelectorAll(".user-role-select").forEach(select => {
        select.addEventListener("change", async () => {
            await updateUser(select.dataset.userId, { role: select.value });
        });
    });

    document.querySelectorAll(".user-toggle-btn").forEach(button => {
        button.addEventListener("click", async () => {
            const nextActive = button.dataset.active !== "true";
            await updateUser(button.dataset.userId, { activo: nextActive });
        });
    });
}

async function updateUser(userId, payload) {
    try {
        const res = await fetch(`${API_BASE}/users/${userId}`, {
            method: "PUT",
            headers: getAuthHeaders(),
            body: JSON.stringify(payload)
        });

        if (!res.ok) {
            const err = await res.json();
            alert(err.detail || "No se pudo actualizar el usuario");
            await fetchUsers();
            return;
        }

        await fetchUsers();
    } catch (error) {
        alert("Error de conexion con el servidor");
    }
}

async function createUser(event) {
    event.preventDefault();

    const payload = {
        nombre: document.getElementById("user-name").value.trim(),
        email: document.getElementById("user-email").value.trim(),
        password: document.getElementById("user-password").value,
        role: document.getElementById("user-role").value
    };

    try {
        const res = await fetch(`${API_BASE}/users/`, {
            method: "POST",
            headers: getAuthHeaders(),
            body: JSON.stringify(payload)
        });

        if (!res.ok) {
            const err = await res.json();
            setMessage(err.detail || "No se pudo crear el usuario", "error");
            return;
        }

        document.getElementById("user-create-form").reset();
        setMessage("Usuario creado correctamente");
        await fetchUsers();
    } catch (error) {
        setMessage("Error de conexion con el servidor", "error");
    }
}

document.addEventListener("DOMContentLoaded", () => {
    document.getElementById("btn-refresh-users").addEventListener("click", fetchUsers);
    document.getElementById("user-create-form").addEventListener("submit", createUser);
    fetchUsers();
});
