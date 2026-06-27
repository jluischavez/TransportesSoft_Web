(function crearBotonWhatsApp() {
    const telefono = "526621816151"; 
    const mensaje = encodeURIComponent("Hola, tengo una duda sobre TransportesSoft.");

    const link = document.createElement("a");
    link.href = `https://wa.me/${telefono}?text=${mensaje}`;
    link.target = "_blank";
    link.rel = "noopener noreferrer";
    link.className = "whatsapp-float";
    link.innerHTML = `
        <span class="whatsapp-float-icon">💬</span>
        <span class="whatsapp-float-text">¿Dudas? envía un whats!</span>
    `;

    document.body.appendChild(link);
})();