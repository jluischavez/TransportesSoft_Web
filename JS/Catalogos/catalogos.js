const API = 'https://localhost:7169';

// ── AUTH ──────────────────────────────────────────────────
function getToken() { return localStorage.getItem('token'); }

function verificarAuth() {
    if (!getToken()) window.location.href = 'index.html';
}

function headers() {
    return {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${getToken()}`
    };
}

// ── NAV ───────────────────────────────────────────────────
function initNav() {
    const usuario = localStorage.getItem('nombreUsuario');
    const empresa = localStorage.getItem('empresaNombre');
    document.getElementById('navUsuario').textContent =
        empresa ? `${usuario} — ${empresa}` : usuario;

    document.getElementById('btnLogout').addEventListener('click', () => {
        localStorage.clear();
        window.location.href = 'index.html';
    });
}

// ── SIDEBAR TOGGLE ────────────────────────────────────────
function initSidebar() {
    const sidebar = document.getElementById('sidebar');
    const main = document.getElementById('catalogosMain');
    const toggle = document.getElementById('sidebarToggle');

    toggle.addEventListener('click', () => {
        sidebar.classList.toggle('collapsed');
    });
}

// ── MODULO ACTIVO ─────────────────────────────────────────
let moduloActual = null;

const moduloConfig = {
    clientes: {
        titulo: 'Clientes',
        subtitulo: 'CATÁLOGO DE CLIENTES',
        modulo: () => window.ClientesModulo
    },
    operadores: {
        titulo: 'Operadores',
        subtitulo: 'CATÁLOGO DE OPERADORES',
        modulo: () => window.OperadoresModulo
    },
    unidades: {
        titulo: 'Unidades',
        subtitulo: 'CATÁLOGO DE UNIDADES',
        modulo: () => window.UnidadesModulo
    },
    remolques: {
        titulo: 'Remolques',
        subtitulo: 'CATÁLOGO DE REMOLQUES',
        modulo: () => window.RemolquesModulo
    }
};

function cargarModulo(nombre, btnEl) {
    const emptyHome = document.getElementById('catalogosEmptyHome');
    if (emptyHome) {
        emptyHome.style.display = 'none';
    }

    document.getElementById('catalogoLayout').style.display = 'grid';

    // actualizar nav items
    document.querySelectorAll('.sidebar-nav .nav-item').forEach(b => b.classList.remove('active'));
    if (btnEl) btnEl.classList.add('active');

    // actualizar header
    const config = moduloConfig[nombre];
    document.getElementById('mainTitle').textContent = config.titulo;
    document.getElementById('mainSubtitle').textContent = config.subtitulo;
    document.getElementById('tablaTitle').textContent = config.titulo;

    // limpiar estado
    limpiarFormGlobal();

    // cargar módulo
    moduloActual = nombre;
    const mod = config.modulo()();

    if (mod && typeof mod.init === 'function') {
        mod.init();
    }
}

function limpiarFormGlobal() {
    document.getElementById('tablaBody').innerHTML = '';
    document.getElementById('tablaHead').innerHTML = '';
    document.getElementById('formCampos').innerHTML = '';
    document.getElementById('displayId').textContent = '—';
    document.getElementById('modoLabel').textContent = 'NUEVO';
    document.getElementById('modoLabel').className = 'form-mode nuevo';
    document.getElementById('msgError').textContent = '';
    document.getElementById('btnEliminar').classList.remove('visible');
    document.getElementById('tablaCount').textContent = 'Cargando...';
    document.getElementById('loadingTabla').style.display = 'block';
    document.getElementById('tablaRegistros').style.display = 'none';
    document.getElementById('emptyState').style.display = 'none';
}

// ── HELPERS GLOBALES ──────────────────────────────────────
window.CatalogosApp = {
    API,
    getToken,
    headers,
    setModoEdicion(id) {
        document.getElementById('displayId').textContent = id;
        document.getElementById('modoLabel').textContent = 'EDICIÓN';
        document.getElementById('modoLabel').className = 'form-mode edicion';
        document.getElementById('btnEliminar').classList.add('visible');
    },
    setModoNuevo() {
        document.getElementById('displayId').textContent = '—';
        document.getElementById('modoLabel').textContent = 'NUEVO';
        document.getElementById('modoLabel').className = 'form-mode nuevo';
        document.getElementById('btnEliminar').classList.remove('visible');
        document.getElementById('msgError').textContent = '';
    },
    setTablaCount(n) {
        document.getElementById('tablaCount').textContent = `${n} registros`;
    },
    mostrarTabla(show) {
        document.getElementById('loadingTabla').style.display = 'none';
        document.getElementById('tablaRegistros').style.display = show ? 'table' : 'none';
        document.getElementById('emptyState').style.display = show ? 'none' : 'block';
    },
    setError(msg) {
        document.getElementById('msgError').textContent = msg;
    },
    clearError() {
        document.getElementById('msgError').textContent = '';
    },
    highlightFila(tr) {
        document.querySelectorAll('#tablaBody tr').forEach(r => r.classList.remove('selected'));
        tr.classList.add('selected');
    },
    badgeEstatus(estatus) {
        const clase = estatus === 'A' ? 'badge-a' : 'badge-c';
        const texto = estatus === 'A' ? 'Activo' : 'Cancelado';
        return `<span class="badge-estatus ${clase}">${texto}</span>`;
    },
    formatFecha(fecha) {
        if (!fecha) return '—';
        return new Date(fecha).toLocaleDateString('es-MX', { day:'2-digit', month:'2-digit', year:'numeric' });
    }
};

// ── BOTONES GLOBALES ──────────────────────────────────────
document.getElementById('btnGuardar').addEventListener('click', () => {
    if (!moduloActual) return;

    const mod = moduloConfig[moduloActual]?.modulo()();
    if (mod?.guardar) mod.guardar();
});

document.getElementById('btnEliminar').addEventListener('click', () => {
    if (!moduloActual) return;

    const mod = moduloConfig[moduloActual]?.modulo()();
    if (mod?.eliminar) mod.eliminar();
});

document.getElementById('btnNuevo').addEventListener('click', () => {
    if (!moduloActual) return;

    const mod = moduloConfig[moduloActual]?.modulo()();
    if (mod?.limpiar) mod.limpiar();
});

function mostrarInicioCatalogos() {
    moduloActual = null;

    document.querySelectorAll('.sidebar-nav .nav-item').forEach(b => {
        b.classList.remove('active');
    });

    document.getElementById('mainTitle').textContent = 'Catálogos';
    document.getElementById('mainSubtitle').textContent = 'Selecciona una opción del menú lateral';

    document.getElementById('catalogoLayout').style.display = 'none';

    const emptyHome = document.getElementById('catalogosEmptyHome');
    if (emptyHome) {
        emptyHome.style.display = 'flex';
    }
}

// ── INIT ──────────────────────────────────────────────────
verificarAuth();
initNav();
initSidebar();
mostrarInicioCatalogos();
