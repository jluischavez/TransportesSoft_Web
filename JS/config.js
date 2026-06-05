const APP_CONFIG = {
    API_URL: window.location.hostname === "localhost"
        ? "https://localhost:7169"
        : "https://transportessoftwebapi.azurewebsites.net"
};

function apiUrl(endpoint) {
    return `${APP_CONFIG.API_URL}${endpoint.startsWith("/") ? endpoint : "/" + endpoint}`;
}