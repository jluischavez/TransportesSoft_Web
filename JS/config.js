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