inicializarControlSesion();
inicializarExpiracionIndex();
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

    if (token && sesionExpirada()) {
        cerrarSesionLocal();
        mostrarFormLogin();
        return;
    }

    if (token && usuario) {
        mostrarSesionActiva(usuario);
    } else {
        mostrarFormLogin();
    }
}

function mostrarSesionActiva(nombreUsuario) {
    ocultarLandingPublica();

    document.getElementById("mainGrid").classList.remove("auth-only");

    document.getElementById("seccionAuth").style.display = "block";
    document.getElementById("formLogin").style.display = "none";
    document.getElementById("formRegistro").style.display = "none";
    document.getElementById("infoUsuario").style.display = "block";

    document.getElementById("txtBienvenido").textContent = `👤 ${nombreUsuario}`;

    actualizarNav();
    verificarEmpresa();
}

function mostrarFormLogin() {
    mostrarLandingPublica();

    document.getElementById("mainGrid").classList.add("auth-only");

    document.getElementById("seccionAuth").style.display = "block";
    document.getElementById("formLogin").style.display = "block";
    document.getElementById("formRegistro").style.display = "none";
    document.getElementById("infoUsuario").style.display = "none";

    document.getElementById("mensajeLogin").textContent = "";
    document.getElementById("navbar").style.display = "none";
    document.getElementById("seccionEmpresa").style.display = "none";

    document.getElementById("formUnirseEmpresa").style.display = "none";
    document.getElementById("formCrearEmpresa").style.display = "none";

    ocultarMantenimientosInicio();
    ocultarDashboardInicio();
}

function inicializarExpiracionIndex() {
    function revisar() {
        const token = localStorage.getItem("token");

        if (!token) return;

        if (sesionExpirada()) {
            cerrarSesionLocal();
            mostrarFormLogin();
        }
    }

    setInterval(revisar, 5000);

    window.addEventListener("focus", revisar);

    document.addEventListener("visibilitychange", () => {
        if (!document.hidden) {
            revisar();
        }
    });
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

    ocultarMantenimientosInicio();
    ocultarDashboardInicio();

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

        cargarMantenimientosInicio();
        cargarDashboardInicio();
    } else {
        navUsuario.textContent = usuario;

        ocultarDashboardInicio();
    }
}

// ── SECTION DE MANTENIMIENTOS PENDIENTES─────────────────────────────────────────
async function cargarMantenimientosInicio() {
    const panel = document.getElementById("panelMantenimientosInicio");
    const lista = document.getElementById("listaMantenimientosInicio");

    if (!panel || !lista) return;

    const token = localStorage.getItem("token");
    const empresaNombre = localStorage.getItem("empresaNombre");

    if (!token || !empresaNombre) {
        ocultarMantenimientosInicio();
        return;
    }

    panel.style.display = "block";
    lista.innerHTML = `<div class="loading">Consultando unidades...</div>`;

    limpiarContadoresMantenimientosInicio();

    try {
        const res = await fetch(apiUrl("/ContMantenimientosCab/estado-mantenimiento-unidades"), {
            headers: {
                "Authorization": `Bearer ${token}`
            }
        });

        if (!res.ok) {
            lista.innerHTML = `
                <div class="empty-state">
                    No se pudo consultar el estado de mantenimientos.
                </div>
            `;
            return;
        }

        const unidades = await res.json();

        pintarMantenimientosInicio(unidades);

    } catch (error) {
        console.error("Error al consultar mantenimientos de inicio:", error);

        lista.innerHTML = `
            <div class="empty-state">
                Error al consultar mantenimientos.
            </div>
        `;
    }
}

function ocultarMantenimientosInicio() {
    const panel = document.getElementById("panelMantenimientosInicio");
    const lista = document.getElementById("listaMantenimientosInicio");

    if (panel) {
        panel.style.display = "none";
    }

    if (lista) {
        lista.innerHTML = "";
    }

    limpiarContadoresMantenimientosInicio();
}

function pintarMantenimientosInicio(unidades) {
    const lista = document.getElementById("listaMantenimientosInicio");

    if (!lista) return;

    limpiarContadoresMantenimientosInicio();

    if (!unidades || unidades.length === 0) {
        lista.innerHTML = `
            <div class="empty-state">
                No hay unidades registradas.
            </div>
        `;
        return;
    }

    const prioridad = {
        rojo: 1,
        amarillo: 2,
        gris: 3,
        verde: 4
    };

    unidades.sort((a, b) => {
        const prioridadA = prioridad[a.color] ?? 99;
        const prioridadB = prioridad[b.color] ?? 99;

        if (prioridadA !== prioridadB) {
            return prioridadA - prioridadB;
        }

        const restanteA = a.kmRestantes ?? 999999999;
        const restanteB = b.kmRestantes ?? 999999999;

        return restanteA - restanteB;
    });

    actualizarContadoresMantenimientosInicio(unidades);

    lista.innerHTML = "";

    unidades.forEach(u => {
        const item = document.createElement("div");

        const color = u.color ?? "gris";

        item.className = `mantenimiento-inicio-item mantenimiento-inicio-${color}`;

        const unidadTexto = `${u.id_Unidad} — ${u.marca ?? ""} ${u.serie ? "| " + u.serie : ""}`;

        const ultimoManttoKm = formatearNumeroInicio(u.ultimoMantenimientoKm);
        const kilometrajeActual = formatearNumeroInicio(u.kilometrajeActual);
        const kmRecorridos = formatearNumeroInicio(u.kmRecorridos);

        let kmRestantesTexto = "—";

        if (u.kmRestantes !== null && u.kmRestantes !== undefined) {
            if (u.kmRestantes < 0) {
                kmRestantesTexto = `${Math.abs(u.kmRestantes).toLocaleString("es-MX")} km vencidos`;
            } else {
                kmRestantesTexto = `${u.kmRestantes.toLocaleString("es-MX")} km restantes`;
            }
        }

        item.innerHTML = `
            <div class="mantenimiento-inicio-info">
                <div class="mantenimiento-inicio-unidad">
                    ${unidadTexto}
                </div>

                <div class="mantenimiento-inicio-detalle">
                    <span>Último mantto: ${ultimoManttoKm} km</span>
                    <span>Actual: ${kilometrajeActual} km</span>
                    <span>Recorridos: ${kmRecorridos} km</span>
                </div>
            </div>

            <div class="mantenimiento-inicio-estado">
                <span>${u.estado ?? "Sin estado"}</span>
                <strong>${kmRestantesTexto}</strong>
            </div>
        `;

        lista.appendChild(item);
    });
}

function actualizarContadoresMantenimientosInicio(unidades) {
    const vencidas = unidades.filter(u => u.color === "rojo").length;
    const proximas = unidades.filter(u => u.color === "amarillo").length;
    const correctas = unidades.filter(u => u.color === "verde").length;
    const sinDatos = unidades.filter(u => u.color === "gris").length;

    const contadorVencidas = document.getElementById("contadorMantVencidas");
    const contadorProximas = document.getElementById("contadorMantProximas");
    const contadorCorrectas = document.getElementById("contadorMantCorrectas");
    const contadorSinDatos = document.getElementById("contadorMantSinDatos");

    if (contadorVencidas) contadorVencidas.textContent = vencidas;
    if (contadorProximas) contadorProximas.textContent = proximas;
    if (contadorCorrectas) contadorCorrectas.textContent = correctas;
    if (contadorSinDatos) contadorSinDatos.textContent = sinDatos;
}

function limpiarContadoresMantenimientosInicio() {
    const contadorVencidas = document.getElementById("contadorMantVencidas");
    const contadorProximas = document.getElementById("contadorMantProximas");
    const contadorCorrectas = document.getElementById("contadorMantCorrectas");
    const contadorSinDatos = document.getElementById("contadorMantSinDatos");

    if (contadorVencidas) contadorVencidas.textContent = "0";
    if (contadorProximas) contadorProximas.textContent = "0";
    if (contadorCorrectas) contadorCorrectas.textContent = "0";
    if (contadorSinDatos) contadorSinDatos.textContent = "0";
}

function formatearNumeroInicio(valor) {
    if (valor === null || valor === undefined) {
        return "—";
    }

    return Number(valor).toLocaleString("es-MX");
}

document.addEventListener("DOMContentLoaded", () => {
    const btnRecargarMantenimientos =
        document.getElementById(
            "btnRecargarMantenimientosInicio"
        );

    const btnRecargarDashboard =
        document.getElementById(
            "btnRecargarDashboard"
        );

    if (btnRecargarMantenimientos) {
        btnRecargarMantenimientos.addEventListener(
            "click",
            cargarMantenimientosInicio
        );
    }

    if (btnRecargarDashboard) {
        btnRecargarDashboard.addEventListener(
            "click",
            cargarDashboardInicio
        );
    }
});

function mostrarLandingPublica() {
    const landing = document.getElementById("landingPublica");

    if (landing) {
        landing.style.display = "block";
    }
}

function ocultarLandingPublica() {
    const landing = document.getElementById("landingPublica");

    if (landing) {
        landing.style.display = "none";
    }
}

/* BOTON LOGIN */
document.getElementById("btnLogin").addEventListener("click", async () => {
    const usuario = document.getElementById("txtUsuario").value.trim();
    const password = document.getElementById("txtPassword").value.trim();
    const mensaje = document.getElementById("mensajeLogin");
    const btnLogin = document.getElementById("btnLogin");

    mensaje.textContent = "";

    if (!usuario || !password) {
        mensaje.textContent = "Completa todos los campos.";
        return;
    }

    btnLogin.disabled = true;
    btnLogin.textContent = "Ingresando...";
    mensaje.textContent = "Validando credenciales...";

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
            localStorage.setItem("ultimaActividad", Date.now().toString());

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
        mensaje.textContent = "Error al conectar con el servidor. Es probable que el servidor tenga intermitencia. Sigue intentando cada 30 segundos.";
        console.error(error);
    } finally {
        btnLogin.disabled = false;
        btnLogin.textContent = "Iniciar sesión";
    }
});


// ── DASHBOARD DE INICIO ───────────────────────────────────────
async function cargarDashboardInicio() {
    const panel = document.getElementById("panelDashboardInicio");
    const mensaje = document.getElementById("mensajeDashboard");

    const token = localStorage.getItem("token");
    const empresaNombre = localStorage.getItem("empresaNombre");

    if (!panel) return;

    if (!token || !empresaNombre) {
        ocultarDashboardInicio();
        return;
    }

    panel.style.display = "block";

    limpiarDashboardInicio();

    if (mensaje) {
        mensaje.textContent = "Consultando resumen financiero...";
    }

    try {
        const response = await fetch(
            apiUrl("/Dashboard/resumen-mensual"),
            {
                headers: {
                    "Authorization": `Bearer ${token}`
                }
            }
        );

        if (response.status === 401) {
            cerrarSesionLocal();
            mostrarFormLogin();
            return;
        }

        if (!response.ok) {
            const error = await obtenerErrorApi(response);

            throw new Error(
                error || "No se pudo consultar el dashboard."
            );
        }

        const data = await response.json();

        pintarDashboardInicio(data);

        if (mensaje) {
            mensaje.textContent = "";
        }

    } catch (error) {
        console.error("Error al cargar dashboard:", error);

        if (mensaje) {
            mensaje.textContent =
                error.message ||
                "No se pudo cargar el resumen financiero.";
        }

        pintarTablasDashboardVacias();
    }
}

function pintarDashboardInicio(data) {
    const resumen = data?.resumen ?? {};
    const periodo = data?.periodo ?? {};
    const cliente = data?.clienteMayorFacturacion;

    establecerTexto(
        "dashboardIngresos",
        formatearMonedaDashboard(resumen.ingresosMes)
    );

    establecerTexto(
        "dashboardGastos",
        formatearMonedaDashboard(resumen.gastosMes)
    );

    establecerTexto(
        "dashboardGastoDiesel",
        formatearMonedaDashboard(resumen.gastosDiesel)
    );

    establecerTexto(
        "dashboardGastoMantenimiento",
        formatearMonedaDashboard(resumen.gastosMantenimiento)
    );

    establecerTexto(
        "dashboardUtilidad",
        formatearMonedaDashboard(resumen.utilidadEstimada)
    );

    establecerTexto(
        "dashboardViajes",
        Number(resumen.viajesRealizados ?? 0)
            .toLocaleString("es-MX")
    );

    pintarColorUtilidad(resumen.utilidadEstimada);

    pintarPeriodoDashboard(periodo);
    pintarClientePrincipalDashboard(cliente);

    pintarRentabilidadUnidades(
        data?.rentabilidadPorUnidad ?? []
    );

    pintarUnidadesMayorGasto(
        data?.unidadesMayorGasto ?? []
    );
}

function pintarPeriodoDashboard(periodo) {
    const titulo = document.getElementById("tituloPeriodoDashboard");

    if (!titulo) return;

    const anio = periodo?.anio;
    const mes = periodo?.mes;

    if (!anio || !mes) {
        titulo.textContent = "Dashboard del mes";
        return;
    }

    const fecha = new Date(anio, mes - 1, 1);

    const nombrePeriodo = fecha.toLocaleDateString("es-MX", {
        month: "long",
        year: "numeric"
    });

    titulo.textContent =
        `Dashboard de ${capitalizarTexto(nombrePeriodo)}`;
}

function pintarClientePrincipalDashboard(cliente) {
    if (!cliente) {
        establecerTexto(
            "dashboardClientePrincipal",
            "Sin viajes registrados"
        );

        establecerTexto(
            "dashboardClienteViajes",
            "0 viajes"
        );

        establecerTexto(
            "dashboardClienteTotal",
            "$0.00"
        );

        return;
    }

    establecerTexto(
        "dashboardClientePrincipal",
        cliente.nombreCliente || "Cliente sin nombre"
    );

    const cantidadViajes = Number(cliente.viajes ?? 0);

    establecerTexto(
        "dashboardClienteViajes",
        `${cantidadViajes} ${
            cantidadViajes === 1 ? "viaje" : "viajes"
        }`
    );

    establecerTexto(
        "dashboardClienteTotal",
        formatearMonedaDashboard(cliente.totalFacturado)
    );
}

function pintarRentabilidadUnidades(unidades) {
    const tbody = document.getElementById(
        "tablaRentabilidadUnidades"
    );

    if (!tbody) return;

    tbody.innerHTML = "";

    if (!Array.isArray(unidades) || unidades.length === 0) {
        const fila = document.createElement("tr");
        const celda = document.createElement("td");

        celda.colSpan = 4;
        celda.className = "dashboard-sin-datos";
        celda.textContent =
            "No hay movimientos de unidades durante este mes.";

        fila.appendChild(celda);
        tbody.appendChild(fila);

        return;
    }

    unidades.forEach(unidad => {
        const fila = document.createElement("tr");

        const celdaUnidad = document.createElement("td");
        const celdaIngreso = document.createElement("td");
        const celdaGasto = document.createElement("td");
        const celdaUtilidad = document.createElement("td");

        celdaUnidad.textContent =
            unidad.unidad ?? `Unidad ${unidad.idUnidad}`;

        celdaIngreso.textContent =
            formatearMonedaDashboard(unidad.ingreso);

        celdaGasto.textContent =
            formatearMonedaDashboard(unidad.gastoTotal);

        celdaUtilidad.textContent =
            formatearMonedaDashboard(unidad.utilidad);

        const utilidad = Number(unidad.utilidad ?? 0);

        celdaUtilidad.className =
            utilidad >= 0
                ? "dashboard-utilidad-positiva"
                : "dashboard-utilidad-negativa";

        fila.appendChild(celdaUnidad);
        fila.appendChild(celdaIngreso);
        fila.appendChild(celdaGasto);
        fila.appendChild(celdaUtilidad);

        tbody.appendChild(fila);
    });
}

function pintarUnidadesMayorGasto(unidades) {
    const lista = document.getElementById(
        "listaUnidadesMayorGasto"
    );

    if (!lista) return;

    lista.innerHTML = "";

    if (!Array.isArray(unidades) || unidades.length === 0) {
        const vacio = document.createElement("div");

        vacio.className = "dashboard-sin-datos";
        vacio.textContent =
            "No hay gastos registrados durante este mes.";

        lista.appendChild(vacio);
        return;
    }

    unidades.forEach((unidad, indice) => {
        const item = document.createElement("div");
        const posicion = document.createElement("span");
        const informacion = document.createElement("div");
        const nombre = document.createElement("strong");
        const detalle = document.createElement("small");
        const total = document.createElement("b");

        item.className = "dashboard-gasto-item";
        posicion.className = "dashboard-gasto-posicion";
        informacion.className = "dashboard-gasto-info";
        total.className = "dashboard-gasto-total";

        posicion.textContent = indice + 1;

        nombre.textContent =
            unidad.unidad ?? `Unidad ${unidad.idUnidad}`;

        detalle.textContent =
            `Diésel: ${formatearMonedaDashboard(unidad.gastoDiesel)}`
            + ` · Mantenimiento: ${formatearMonedaDashboard(
                unidad.gastoMantenimiento
            )}`;

        total.textContent =
            formatearMonedaDashboard(unidad.gastoTotal);

        informacion.appendChild(nombre);
        informacion.appendChild(detalle);

        item.appendChild(posicion);
        item.appendChild(informacion);
        item.appendChild(total);

        lista.appendChild(item);
    });
}

function limpiarDashboardInicio() {
    establecerTexto("dashboardIngresos", "$0.00");
    establecerTexto("dashboardGastos", "$0.00");
    establecerTexto("dashboardGastoDiesel", "$0.00");
    establecerTexto("dashboardGastoMantenimiento", "$0.00");
    establecerTexto("dashboardUtilidad", "$0.00");
    establecerTexto("dashboardViajes", "0");

    establecerTexto(
        "dashboardClientePrincipal",
        "Consultando..."
    );

    establecerTexto("dashboardClienteViajes", "0 viajes");
    establecerTexto("dashboardClienteTotal", "$0.00");

    pintarTablasDashboardVacias();
}

function pintarTablasDashboardVacias() {
    const tbody = document.getElementById(
        "tablaRentabilidadUnidades"
    );

    if (tbody) {
        tbody.innerHTML = `
            <tr>
                <td colspan="4" class="dashboard-sin-datos">
                    No hay información disponible.
                </td>
            </tr>
        `;
    }

    const lista = document.getElementById(
        "listaUnidadesMayorGasto"
    );

    if (lista) {
        lista.innerHTML = `
            <div class="dashboard-sin-datos">
                No hay información disponible.
            </div>
        `;
    }
}

function ocultarDashboardInicio() {
    const panel = document.getElementById(
        "panelDashboardInicio"
    );

    const mensaje = document.getElementById(
        "mensajeDashboard"
    );

    if (panel) {
        panel.style.display = "none";
    }

    if (mensaje) {
        mensaje.textContent = "";
    }

    limpiarDashboardInicio();
}

function formatearMonedaDashboard(valor) {
    return Number(valor ?? 0).toLocaleString("es-MX", {
        style: "currency",
        currency: "MXN",
        minimumFractionDigits: 2
    });
}

function establecerTexto(idElemento, texto) {
    const elemento = document.getElementById(idElemento);

    if (elemento) {
        elemento.textContent = texto;
    }
}

function pintarColorUtilidad(valor) {
    const elemento = document.getElementById(
        "dashboardUtilidad"
    );

    if (!elemento) return;

    const utilidad = Number(valor ?? 0);

    elemento.classList.remove(
        "dashboard-utilidad-positiva",
        "dashboard-utilidad-negativa"
    );

    elemento.classList.add(
        utilidad >= 0
            ? "dashboard-utilidad-positiva"
            : "dashboard-utilidad-negativa"
    );
}

function capitalizarTexto(texto) {
    if (!texto) return "";

    return texto.charAt(0).toUpperCase() + texto.slice(1);
}

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
    limpiarSesionLocal();

    if (typeof ocultarMantenimientosInicio === "function") {
        ocultarMantenimientosInicio();
    }
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
