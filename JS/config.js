const APP_CONFIG = {
    API_URL:
        window.location.hostname === "localhost" ||
        window.location.hostname === "127.0.0.1"
            ? "https://localhost:7169"
            : "https://transportessoftwebapi.azurewebsites.net"
};

function apiUrl(endpoint) {
    return `${APP_CONFIG.API_URL}${endpoint.startsWith("/") ? endpoint : "/" + endpoint}`;
}



// ── SESIÓN / EXPIRACIÓN ──────────────────────────────────
// 1 minuto de inactividad = 1 * 1 * 1 * 60 * 1000 ms
const TIEMPO_SESION_MS = 60 * 1000 * 60;

function registrarActividadSesion() {
    const token = localStorage.getItem("token");

    if (!token) return;

    localStorage.setItem("ultimaActividad", Date.now().toString());
}

function sesionExpirada() {
    const token = localStorage.getItem("token");
    const ultimaActividad = localStorage.getItem("ultimaActividad");

    if (!token) return true;

    if (!ultimaActividad) return true;

    const ahora = Date.now();
    const diferencia = ahora - Number(ultimaActividad);

    return diferencia > TIEMPO_SESION_MS;
}

function limpiarSesionLocal() {
    localStorage.removeItem("token");
    localStorage.removeItem("nombreUsuario");
    localStorage.removeItem("usuarioId");
    localStorage.removeItem("empresaNombre");
    localStorage.removeItem("empresaRFC");
    localStorage.removeItem("empresaTelefono");
    localStorage.removeItem("ultimaActividad");
}

function cerrarSesionYRedirigir() {
    limpiarSesionLocal();

    if (!window.location.pathname.toLowerCase().endsWith("index.html")) {
        window.location.href = "index.html";
    } else {
        window.location.reload();
    }
}

function validarSesionPorTiempo() {
    const token = localStorage.getItem("token");

    if (!token) return false;

    if (sesionExpirada()) {
        limpiarSesionLocal();

        if (typeof mostrarFormLogin === "function") {
            mostrarFormLogin();
        } else {
            window.location.href = "index.html";
        }

        return false;
    }

    registrarActividadSesion();
    return true;
}

function inicializarControlSesion() {

    ["click", "keydown", "touchstart"].forEach(evento => {
        console.log("Control de sesión inicializado. Tiempo de expiración: " + TIEMPO_SESION_MS + " ms");
        document.addEventListener(evento, () => {
            if (!validarSesionPorTiempo()) return;

            registrarActividadSesion();
        });
    });

    console.log("Control de sesión inicializado. Tiempo de expiración: " + TIEMPO_SESION_MS + " ms");

    document.addEventListener("visibilitychange", () => {
        if (!document.hidden) {
            validarSesionPorTiempo();
        }
    });

    window.addEventListener("focus", () => {
        validarSesionPorTiempo();
    });

    setInterval(() => {
        validarSesionPorTiempo();
    }, 10 * 1000);
}