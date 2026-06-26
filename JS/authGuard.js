(function validarAccesoSistema() {
    inicializarControlSesion();

    const token = localStorage.getItem("token");
    const empresaNombre = localStorage.getItem("empresaNombre");

    if (!token || !empresaNombre || sesionExpirada()) {
        limpiarSesionLocal();
        window.location.href = "index.html";
        return;
    }

    registrarActividadSesion();
})();