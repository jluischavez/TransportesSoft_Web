(function validarAccesoSistema() {
    const token = localStorage.getItem("token");
    const empresaNombre = localStorage.getItem("empresaNombre");

    if (!token || !empresaNombre) {
        window.location.href = "index.html";
        return;
    }
})();