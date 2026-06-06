// ejecuta al cargar
verificarSesion();

function mostrarModoUnirseEmpresa() {
    document.getElementById("formUnirseEmpresa").style.display = "block";
    document.getElementById("formCrearEmpresa").style.display = "none";

    document.getElementById("btnMostrarUnirseEmpresa").style.display = "none";
    document.getElementById("btnMostrarCrearEmpresa").style.display = "block";

    document.getElementById("mensajeEmpresa").textContent = "";
    document.getElementById("mensajeCrearEmpresa").textContent = "";
}

function mostrarModoCrearEmpresa() {
    document.getElementById("formUnirseEmpresa").style.display = "none";
    document.getElementById("formCrearEmpresa").style.display = "block";

    document.getElementById("btnMostrarUnirseEmpresa").style.display = "block";
    document.getElementById("btnMostrarCrearEmpresa").style.display = "none";

    document.getElementById("mensajeEmpresa").textContent = "";
    document.getElementById("mensajeCrearEmpresa").textContent = "";
}

// revisa si ya hay sesión al cargar la página
function verificarSesion() {
    const token = localStorage.getItem("token");
    const usuario = localStorage.getItem("nombreUsuario");

    if (token && usuario) {
        mostrarSesionActiva(usuario);
    } else {
         document.getElementById("mainGrid").classList.add("auth-only");
    }
}

function mostrarSesionActiva(nombreUsuario) {
    document.getElementById("mainGrid").classList.remove("auth-only");
    document.getElementById("formLogin").style.display = "none";
    document.getElementById("infoUsuario").style.display = "block";
    document.getElementById("txtBienvenido").textContent = `👤 ${nombreUsuario}`;

    actualizarNav();
    verificarEmpresa();
}

function mostrarFormLogin() {
    document.getElementById("mainGrid").classList.add("auth-only");
    document.getElementById("formLogin").style.display = "block";
    document.getElementById("infoUsuario").style.display = "none";
    document.getElementById("mensajeLogin").textContent = "";
    document.getElementById("navbar").style.display = "none";
    document.getElementById("seccionEmpresa").style.display = "none"; //
}

// CARGAR EMPRESAS EN EL SELECT
async function cargarEmpresas() {
    const response = await fetch(apiUrl("/EmpresasCat"));

     if (!response.ok) {
        console.error("Error al cargar empresas");
        return;
    }

    const empresas = await response.json();
    const select = document.getElementById("selectEmpresa");

    select.innerHTML = "";

    empresas.forEach(empresa => {
        const option = document.createElement("option");
        option.value = empresa.id;
        option.textContent = empresa.nombreComercial;
        select.appendChild(option);
    });
}

// MOSTRAR MODAL SI NO TIENE EMPRESA
function verificarEmpresa() {
    const empresaNombre = localStorage.getItem("empresaNombre");

    const seccion = document.getElementById("seccionEmpresa");
    const navbar = document.getElementById("navbar");
    const navLinks = document.getElementById("navLinks");
    const menuContabilidad = document.getElementById("menuContabilidad");

    if (!empresaNombre) {
        navbar.style.display = "flex";
        navLinks.style.display = "none";
        if (menuContabilidad) {
            menuContabilidad.style.display = "none";
        }
        seccion.style.display = "block";
        mostrarModoUnirseEmpresa();
        cargarEmpresas();
        return;
    }

    navbar.style.display = "flex";
    navLinks.style.display = "flex";
    seccion.style.display = "none";
    document.getElementById("formUnirseEmpresa").style.display = "none";
    document.getElementById("formCrearEmpresa").style.display = "none";
    if (menuContabilidad) {
        menuContabilidad.style.display = "none";
    }
}

// ACTUALIZAR NAV CON USUARIO Y EMPRESA
function actualizarNav() {
    const usuario = localStorage.getItem("nombreUsuario");
    const empresa = localStorage.getItem("empresaNombre");
    const navUsuario = document.getElementById("navUsuario");

    if (empresa) {
        navUsuario.textContent = `${usuario} - ${empresa}`;
    } else {
        navUsuario.textContent = usuario;
    }
}

/* BOTON LOGIN */
document.getElementById("btnLogin").addEventListener("click", async () => {
    const usuario = document.getElementById("txtUsuario").value.trim();
    const password = document.getElementById("txtPassword").value.trim();
    const mensaje = document.getElementById("mensajeLogin");

    if (!usuario || !password) {
        mensaje.textContent = "Completa todos los campos.";
        return;
    }

    try {
        const response = await fetch(apiUrl("/UsuariosCat/login"), {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ nombreUsuario: usuario, contrasena: password })
        });

        const data = response.ok ? await response.json() : null;

        if (response.ok) {
            localStorage.setItem("token", data.token);
            localStorage.setItem("nombreUsuario", data.nombreUsuario);
            localStorage.setItem("usuarioId", data.id); 

            // Limpia empresa anterior por si antes entró otro usuario en el mismo navegador
            localStorage.removeItem("empresaNombre");
            localStorage.removeItem("empresaRFC");
            localStorage.removeItem("empresaTelefono");

            if (data.empresaNombre) {
                localStorage.setItem("empresaNombre", data.empresaNombre);
                localStorage.setItem("empresaRFC", data.empresaRFC ?? "");
                localStorage.setItem("empresaTelefono", data.empresaTelefono ?? "");
            }

            mostrarSesionActiva(data.nombreUsuario);
        } else {
            mensaje.textContent = "Usuario o contraseña incorrectos.";
        }

    } catch (error) {
        mensaje.textContent = "Error al conectar con el servidor.";
        console.error(error);
    }
});

// mostrar registro
document.getElementById("btnMostrarRegistro").addEventListener("click", () => {
    document.getElementById("formLogin").style.display = "none";
    document.getElementById("formRegistro").style.display = "block";
    document.getElementById("mensajeLogin").textContent = "";
});

// mostrar login
document.getElementById("btnMostrarLogin").addEventListener("click", () => {
    document.getElementById("formRegistro").style.display = "none";
    document.getElementById("formLogin").style.display = "block";
    document.getElementById("mensajeRegistro").textContent = "";
});

// logout
document.getElementById("btnLogout").addEventListener("click", () => {
    cerrarSesionLocal();
    mostrarFormLogin();
});

/* BOTON REGISTRO */
document.getElementById("btnRegistro").addEventListener("click", async () => {
    const usuario = document.getElementById("txtUsuarioReg").value.trim();
    const password = document.getElementById("txtPasswordReg").value.trim();
    const mensaje = document.getElementById("mensajeRegistro");

    if (!usuario || !password) {
        mensaje.textContent = "Completa todos los campos.";
        return;
    }

    try {
        const response = await fetch(apiUrl("/UsuariosCat/registro"), {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                nombreUsuario: usuario,
                contrasena: password
            })
        });

        if (response.ok) {
            mensaje.textContent = "Usuario registrado correctamente.";
        } else {
            const error = await response.text();
            mensaje.textContent = error;
        }

    } catch (error) {
        mensaje.textContent = "Error al conectar con el servidor.";
        console.error(error);
    }
});

// ASIGNAR EMPRESA
document.getElementById("btnAsignarEmpresa").addEventListener("click", async () => {
    const empresaId = document.getElementById("selectEmpresa").value;
    const clave = document.getElementById("txtClaveEmpresa").value.trim();
    const mensaje = document.getElementById("mensajeEmpresa");

    mensaje.textContent = "";

    if (!empresaId) {
        mensaje.textContent = "Selecciona una empresa.";
        return;
    }

    if (!clave) {
        mensaje.textContent = "Escribe la clave de acceso.";
        return;
    }

    const token = localStorage.getItem("token");

    try {
        const response = await fetch(apiUrl("/EmpresasCat/asignar"), {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}`
            },
            body: JSON.stringify({
                empresaId: parseInt(empresaId),
                claveAcceso: clave
            })
        });

        if (response.ok) {
            cerrarSesionLocal();

            alert("Empresa asignada correctamente. Inicia sesión nuevamente.");
            mostrarFormLogin();
        } else {
            const error = await obtenerErrorApi(response);
            mensaje.textContent = error || "Clave incorrecta o empresa inválida.";
        }

    } catch (error) {
        mensaje.textContent = "Error al conectar con el servidor.";
        console.error(error);
    }
});

// document.getElementById("btnGenerarReporte").addEventListener("click", async () => {
//     const token = localStorage.getItem("token");

//     try {
//         const response = await fetch(apiUrl("/ContClientesCat"), {
//             headers: { "Authorization": `Bearer ${token}` }
//         });

//         if (response.status === 401) {
//             alert("Sesión expirada.");
//             return;
//         }

//         const clientes = await response.json();

//         // datos empresa
//         const empresa = localStorage.getItem("empresaNombre");
//         // const rfc = localStorage.getItem("empresaRFC");
//         const telefono = localStorage.getItem("empresaTelefono");
//         const fecha = new Date().toLocaleDateString("es-MX", {
//             year: "numeric", month: "long", day: "numeric"
//         });

//         // crear PDF
//         const { jsPDF } = window.jspdf;
//         const doc = new jsPDF();

//         // header empresa
//         doc.setFontSize(16);
//         doc.setTextColor(0, 229, 160);
//         doc.text(empresa, 14, 20);

//         doc.setFontSize(9);
//         doc.setTextColor(150, 150, 150);
//         // doc.text(`RFC: ${rfc}`, 14, 28);
//         doc.text(`Tel: ${telefono}`, 14, 34);
//         doc.text(`Fecha: ${fecha}`, 14, 40);

//         // línea separadora
//         doc.setDrawColor(30, 37, 53);
//         doc.line(14, 44, 196, 44);

//         // título reporte
//         doc.setFontSize(11);
//         doc.setTextColor(30, 30, 30);
//         doc.text("Catálogo de Clientes", 14, 52);

//         // tabla
//         doc.autoTable({
//             startY: 57,
//             head: [["ID", "Nombre", "Dirección", "Teléfono", "Estatus"]],
//             body: clientes.map(c => [
//                 c.id_Client,
//                 c.nombre,
//                 c.direccion ?? "-",
//                 c.telefono ?? "-",
//                 c.estatus ?? "-"
//             ]),
//             styles: {
//                 font: "helvetica",
//                 fontSize: 8,
//                 textColor: [232, 234, 242],
//                 fillColor: [17, 21, 32],
//             },
//             headStyles: {
//                 fillColor: [0, 50, 40],
//                 textColor: [0, 229, 160],
//                 fontStyle: "bold"
//             },
//             alternateRowStyles: {
//                 fillColor: [20, 25, 38]
//             },
//             tableLineColor: [30, 37, 53],
//             tableLineWidth: 0.1
//         });

//         // descargar
//         doc.save(`Clientes_${empresa}_${fecha}.pdf`);

//     } catch (error) {
//         console.error("Error:", error);
//     }
// });

document.getElementById('btnContabilidad').addEventListener('click', (e) => {
    e.stopPropagation();
    const menu = document.getElementById('menuContabilidad');
    menu.style.display = menu.style.display === 'none' ? 'block' : 'none';
});

document.addEventListener('click', (e) => {
    const menu = document.getElementById('menuContabilidad');
    if (menu.style.display === 'block' && !menu.contains(e.target)) {
        menu.style.display = 'none';
    }
});

document.getElementById("btnMostrarUnirseEmpresa").addEventListener("click", () => {
    mostrarModoUnirseEmpresa();
});

document.getElementById("btnMostrarCrearEmpresa").addEventListener("click", () => {
    mostrarModoCrearEmpresa();
});

// CREAR EMPRESA
document.getElementById("btnCrearEmpresa").addEventListener("click", async () => {
    const mensaje = document.getElementById("mensajeCrearEmpresa");
    mensaje.textContent = "";

    const nombreComercial = document.getElementById("txtNombreComercialEmpresa").value.trim();
    const razonSocial = document.getElementById("txtRazonSocialEmpresa").value.trim();
    const rfc = document.getElementById("txtRFCEmpresa").value.trim().toUpperCase();
    const email = document.getElementById("txtEmailEmpresa").value.trim().toLowerCase();
    const telefono = document.getElementById("txtTelefonoEmpresa").value.trim();
    const claveAcceso = document.getElementById("txtClaveNuevaEmpresa").value.trim();

    if (!nombreComercial) {
        mensaje.textContent = "El nombre comercial es obligatorio.";
        return;
    }

    if (!razonSocial) {
        mensaje.textContent = "La razón social es obligatoria.";
        return;
    }

    if (!rfc) {
        mensaje.textContent = "El RFC es obligatorio.";
        return;
    }

    if (!email) {
        mensaje.textContent = "El email es obligatorio.";
        return;
    }

    if (!claveAcceso) {
        mensaje.textContent = "La clave de acceso es obligatoria.";
        return;
    }

    if (claveAcceso.length < 6) {
        mensaje.textContent = "La clave de acceso debe tener al menos 6 caracteres.";
        return;
    }

    const token = localStorage.getItem("token");

    try {
        const response = await fetch(apiUrl("/EmpresasCat/crear"), {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}`
            },
            body: JSON.stringify({
                nombreComercial,
                razonSocial,
                rfc,
                email,
                telefono,
                claveAcceso
            })
        });

        if (response.ok) {
            cerrarSesionLocal();

            alert("Empresa creada correctamente. Inicia sesión nuevamente.");
            mostrarFormLogin();
        } else {
            const error = await obtenerErrorApi(response);
            mensaje.textContent = error || "No se pudo crear la empresa.";
        }

    } catch (error) {
        mensaje.textContent = "Error al conectar con el servidor.";
        console.error(error);
    }
});

//HELPERS
function cerrarSesionLocal() {
    localStorage.removeItem("token");
    localStorage.removeItem("nombreUsuario");
    localStorage.removeItem("usuarioId");
    localStorage.removeItem("empresaNombre");
    localStorage.removeItem("empresaRFC");
    localStorage.removeItem("empresaTelefono");
}

async function obtenerErrorApi(response) {
    try {
        const data = await response.json();
        return data.mensaje || null;
    } catch {
        try {
            return await response.text();
        } catch {
            return null;
        }
    }
}
