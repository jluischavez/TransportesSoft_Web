function inicializarNavbar() {
    const usuario = localStorage.getItem("nombreUsuario");
    const empresa = localStorage.getItem("empresaNombre");

    const navbar = document.getElementById("navbar");
    const navUsuario = document.getElementById("navUsuario");
    const btnLogout = document.getElementById("btnLogout");
    const btnContabilidad = document.getElementById("btnContabilidad");
    const menuContabilidad = document.getElementById("menuContabilidad");

    if (navbar) {
        navbar.style.display = "flex";
    }

    if (navUsuario) {
        navUsuario.textContent = empresa
            ? `${usuario} — ${empresa}`
            : usuario;
    }

    if (btnLogout) {
        btnLogout.addEventListener("click", () => {
            if (typeof limpiarSesionLocal === "function") {
                limpiarSesionLocal();
            } else {
                localStorage.clear();
            }

            window.location.href = "index.html";
        });
    }

    if (btnContabilidad && menuContabilidad) {
        btnContabilidad.addEventListener("click", (e) => {
            e.stopPropagation();

            menuContabilidad.style.display =
                menuContabilidad.style.display === "none" || menuContabilidad.style.display === ""
                    ? "block"
                    : "none";
        });
    }

    document.addEventListener("click", () => {
        if (menuContabilidad && menuContabilidad.style.display === "block") {
            menuContabilidad.style.display = "none";
        }
    });
}