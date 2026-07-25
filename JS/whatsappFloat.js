document.addEventListener("DOMContentLoaded", () => {
    crearBotonGuia();
    crearBotonWhatsApp();
});

function crearBotonGuia() {
    if (document.querySelector(".guia-float")) {
        return;
    }

    const botonGuia = document.createElement("a");

    botonGuia.href = "guia.html";
    botonGuia.className = "guia-float";
    botonGuia.setAttribute(
        "aria-label",
        "Abrir guía de uso de TransportesSoft"
    );

    botonGuia.innerHTML = `
        <span
            class="guia-float-icon"
            aria-hidden="true"
        >
            ▶
        </span>

        <span class="guia-float-text">
            ¿Necesitas una guía?
        </span>
    `;

    document.body.appendChild(botonGuia);
}

function crearBotonWhatsApp() {
    if (document.querySelector(".whatsapp-float")) {
        return;
    }

    const botonWhatsApp = document.createElement("a");

    botonWhatsApp.href =
        "https://wa.me/526621816151" +
        "?text=Hola,%20necesito%20ayuda%20con%20TransportesSoft";

    botonWhatsApp.target = "_blank";
    botonWhatsApp.rel = "noopener noreferrer";
    botonWhatsApp.className = "whatsapp-float";

    botonWhatsApp.setAttribute(
        "aria-label",
        "Contactar por WhatsApp"
    );

    botonWhatsApp.innerHTML = `
        <span
            class="whatsapp-float-icon"
            aria-hidden="true"
        >
            ☎
        </span>

        <span class="whatsapp-float-text">
            WhatsApp
        </span>
    `;

    document.body.appendChild(botonWhatsApp);
}