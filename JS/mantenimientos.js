const API = 'https://localhost:7169';

let modoEdicion = false;
let idMantActual = null;
let tipoActual = 'unidad'; // 'unidad' | 'remolque'
let renglones = []; // detalle local

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

// ── TIPO UNIDAD / REMOLQUE ────────────────────────────────
function setTipo(tipo) {
    tipoActual = tipo;

    document.getElementById('btnTipoUnidad').classList.toggle('active', tipo === 'unidad');
    document.getElementById('btnTipoRemolque').classList.toggle('active', tipo === 'remolque');

    const groupU = document.getElementById('groupUnidad');
    const groupR = document.getElementById('groupRemolque');

    if (tipo === 'unidad') {
        groupU.style.opacity = '1';
        groupU.style.pointerEvents = 'auto';
        groupR.style.opacity = '.4';
        groupR.style.pointerEvents = 'none';
        document.getElementById('selectRemolque').value = '';
    } else {
        groupR.style.opacity = '1';
        groupR.style.pointerEvents = 'auto';
        groupU.style.opacity = '.4';
        groupU.style.pointerEvents = 'none';
        document.getElementById('selectUnidad').value = '';
    }
}

// ── CARGAR CATÁLOGOS ──────────────────────────────────────
async function cargarCatalogos() {
    const [unidades, remolques] = await Promise.all([
        fetch(`${API}/ContUnidadesCat`, { headers: headers() }).then(r => r.json()),
        fetch(`${API}/ContRemolquesCat`, { headers: headers() }).then(r => r.json())
    ]);

    llenarSelect('selectUnidad', unidades, 'id_Unidad', u => `${u.marca} — ${u.serie}`);
    llenarSelect('selectRemolque', remolques, 'id_Remolque', r => `${r.marca} ${r.modelo} — ${r.placas}`);
}

function llenarSelect(id, lista, valKey, labelFn) {
    const sel = document.getElementById(id);
    sel.innerHTML = `<option value="">— Selecciona —</option>`;
    lista.forEach(item => {
        const opt = document.createElement('option');
        opt.value = item[valKey];
        opt.textContent = labelFn(item);
        sel.appendChild(opt);
    });
}

// ── CARGAR MANTENIMIENTOS ─────────────────────────────────
async function cargarMantenimientos() {
    document.getElementById('loadingTabla').style.display = 'block';
    document.getElementById('tablaMant').style.display = 'none';
    document.getElementById('emptyState').style.display = 'none';

    const res = await fetch(`${API}/ContMantenimientosCab`, { headers: headers() });
    const lista = await res.json();

    document.getElementById('loadingTabla').style.display = 'none';
    document.getElementById('contadorMant').textContent = `${lista.length} registros`;

    if (lista.length === 0) {
        document.getElementById('emptyState').style.display = 'block';
        return;
    }

    document.getElementById('tablaMant').style.display = 'table';
    const tbody = document.getElementById('bodyMant');
    tbody.innerHTML = '';

    lista.forEach(m => {
        const tr = document.createElement('tr');
        const tipo = m.id_Unidad > 0 ? `U-${m.id_Unidad}` : `R-${m.id_Remolque}`;
        tr.innerHTML = `
            <td class="td-id">${m.idMantenimiento}</td>
            <td>${formatFecha(m.fechaMantenimiento)}</td>
            <td>${tipo}</td>
            <td>${m.proveedor}</td>
            <td>${Number(m.kilometraje).toLocaleString('es-MX')}</td>
            <td class="td-monto">$${Number(m.costoTotal).toLocaleString('es-MX', {minimumFractionDigits:2})}</td>
        `;
        tr.addEventListener('click', () => cargarMantEnForm(m, tr));
        tbody.appendChild(tr);
    });
}

function formatFecha(fecha) {
    if (!fecha) return '—';
    return new Date(fecha).toLocaleDateString('es-MX', { day:'2-digit', month:'2-digit', year:'numeric' });
}

// ── CARGAR MANTENIMIENTO EN FORM ──────────────────────────
async function cargarMantEnForm(m, tr) {
    modoEdicion = true;
    idMantActual = m.idMantenimiento;

    document.getElementById('displayId').textContent = m.idMantenimiento;
    document.getElementById('modoLabel').textContent = 'EDICIÓN';
    document.getElementById('modoLabel').className = 'form-mode edicion';

    document.getElementById('fechaMant').value = m.fechaMantenimiento?.substring(0,10);
    document.getElementById('kilometraje').value = m.kilometraje;
    document.getElementById('proveedor').value = m.proveedor;

    // tipo
    if (m.id_Unidad > 0) {
        setTipo('unidad');
        document.getElementById('selectUnidad').value = m.id_Unidad;
    } else {
        setTipo('remolque');
        document.getElementById('selectRemolque').value = m.id_Remolque;
    }

    // cargar detalle
    const resD = await fetch(`${API}/ContMantenimientosCab/${m.idMantenimiento}/detalle`, { headers: headers() });
    const detalle = await resD.json();
    renglones = detalle.map(d => ({
        refaccion: d.refaccion,
        precio: d.precioRefaccion,
        comentarios: d.comentarios
    }));
    renderRenglones();

    document.getElementById('btnEliminar').classList.add('visible');
    document.getElementById('msgError').textContent = '';

    document.querySelectorAll('#bodyMant tr').forEach(r => r.classList.remove('selected'));
    tr.classList.add('selected');
}

// ── RENGLONES ─────────────────────────────────────────────
function renderRenglones() {
    const lista = document.getElementById('renglonesLista');
    const empty = document.getElementById('renglonesEmpty');

    // limpiar items anteriores pero dejar el empty
    lista.querySelectorAll('.renglon-item').forEach(el => el.remove());

    if (renglones.length === 0) {
        empty.style.display = 'block';
        actualizarCostoTotal();
        return;
    }

    empty.style.display = 'none';

    renglones.forEach((r, idx) => {
        const div = document.createElement('div');
        div.className = 'renglon-item';
        div.innerHTML = `
            <span class="renglon-nombre" title="${r.comentarios || ''}">${r.refaccion}</span>
            <span class="renglon-precio">$${Number(r.precio).toLocaleString('es-MX', {minimumFractionDigits:2})}</span>
            <button class="btn-del-renglon" onclick="eliminarRenglon(${idx})">✕</button>
        `;
        lista.appendChild(div);
    });

    actualizarCostoTotal();
}

function eliminarRenglon(idx) {
    renglones.splice(idx, 1);
    renderRenglones();
}

function actualizarCostoTotal() {
    const total = renglones.reduce((sum, r) => sum + Number(r.precio), 0);
    document.getElementById('costoTotalDisplay').textContent =
        '$' + total.toLocaleString('es-MX', { minimumFractionDigits: 2 });
}

// toggle form renglon
document.getElementById('btnAddRenglon').addEventListener('click', () => {
    const form = document.getElementById('renglonForm');
    form.classList.toggle('visible');
    if (form.classList.contains('visible')) {
        document.getElementById('inputRefaccion').focus();
    }
});

// confirmar renglon
document.getElementById('btnConfirmRenglon').addEventListener('click', () => {
    const refaccion = document.getElementById('inputRefaccion').value.trim().toUpperCase();
    const precio = parseFloat(document.getElementById('inputPrecio').value) || 0;
    const comentarios = document.getElementById('inputComentarios').value.trim().toUpperCase();

    const msg = document.getElementById('msgError');

    if (!refaccion) { msg.textContent = 'La refacción no puede estar vacía.'; return; }
    if (precio <= 0) { msg.textContent = 'El precio debe ser mayor a 0.'; return; }

    msg.textContent = '';
    renglones.push({ refaccion, precio, comentarios });
    renderRenglones();

    // limpiar campos
    document.getElementById('inputRefaccion').value = '';
    document.getElementById('inputPrecio').value = '';
    document.getElementById('inputComentarios').value = '';
    document.getElementById('renglonForm').classList.remove('visible');
});

// ── VALIDAR ───────────────────────────────────────────────
function validar() {
    const msg = document.getElementById('msgError');
    msg.textContent = '';

    const km = parseInt(document.getElementById('kilometraje').value) || 0;
    const proveedor = document.getElementById('proveedor').value.trim();

    if (tipoActual === 'unidad' && !document.getElementById('selectUnidad').value) {
        msg.textContent = 'Selecciona una unidad.'; return false;
    }
    if (tipoActual === 'remolque' && !document.getElementById('selectRemolque').value) {
        msg.textContent = 'Selecciona un remolque.'; return false;
    }
    if (km === 0 && tipoActual === 'unidad') { msg.textContent = 'El kilometraje no puede ser 0.'; return false; }
    if (!proveedor) { msg.textContent = 'El proveedor es requerido.'; return false; }
    if (renglones.length === 0) { msg.textContent = 'Agrega al menos una refacción o servicio.'; return false; }

    return true;
}

// ── GUARDAR ───────────────────────────────────────────────
async function guardarMantenimiento() {
    if (!validar()) return;

    const proveedor = document.getElementById('proveedor').value.trim().toUpperCase();
    const costoTotal = renglones.reduce((sum, r) => sum + Number(r.precio), 0);

    const cab = {
        fechaMantenimiento: document.getElementById('fechaMant').value,
        kilometraje: parseInt(document.getElementById('kilometraje').value) || 0,
        proveedor,
        costoTotal,
        id_Unidad: tipoActual === 'unidad' ? parseInt(document.getElementById('selectUnidad').value) : 0,
        id_Remolque: tipoActual === 'remolque' ? parseInt(document.getElementById('selectRemolque').value) : 0
    };

    const url = modoEdicion ? `${API}/ContMantenimientosCab/${idMantActual}` : `${API}/ContMantenimientosCab`;
    const method = modoEdicion ? 'PUT' : 'POST';

    const resCab = await fetch(url, {
        method,
        headers: headers(),
        body: JSON.stringify(cab)
    });

    if (!resCab.ok) {
        document.getElementById('msgError').textContent = 'Error al guardar el mantenimiento.';
        return;
    }

    const cabGuardado = await resCab.json();
    const idMant = modoEdicion ? idMantActual : cabGuardado.idMantenimiento;

    // si es edición, borrar detalle existente y reescribir
    if (modoEdicion) {
        // el endpoint DELETE del cab ya borra el detalle, pero acá solo actualizamos cab
        // así que borramos renglones uno a uno vía el controller det
        const detExistente = await fetch(`${API}/ContMantenimientosCab/${idMant}/detalle`, { headers: headers() }).then(r => r.json());
        for (const d of detExistente) {
            await fetch(`${API}/ContMantenimientosDet/${idMant}/${d.renglon}`, {
                method: 'DELETE',
                headers: headers()
            });
        }
    }

    // guardar renglones
    for (let i = 0; i < renglones.length; i++) {
        const r = renglones[i];
        await fetch(`${API}/ContMantenimientosDet`, {
            method: 'POST',
            headers: headers(),
            body: JSON.stringify({
                idMantenimiento: idMant,
                refaccion: r.refaccion,
                proveedor,
                precioRefaccion: r.precio,
                comentarios: r.comentarios || '',
                renglon: i + 1
            })
        });
    }

    limpiarForm();
    await cargarMantenimientos();
}

// ── ELIMINAR ──────────────────────────────────────────────
async function eliminarMantenimiento() {
    if (!idMantActual) return;
    if (!confirm(`¿Eliminar el mantenimiento ID ${idMantActual}? Se eliminarán también sus renglones.`)) return;

    const res = await fetch(`${API}/ContMantenimientosCab/${idMantActual}`, {
        method: 'DELETE',
        headers: headers()
    });

    if (res.ok) {
        limpiarForm();
        await cargarMantenimientos();
    }
}

// ── LIMPIAR ───────────────────────────────────────────────
function limpiarForm() {
    modoEdicion = false;
    idMantActual = null;
    renglones = [];
    tipoActual = 'unidad';

    document.getElementById('displayId').textContent = '—';
    document.getElementById('modoLabel').textContent = 'NUEVO';
    document.getElementById('modoLabel').className = 'form-mode nuevo';

    const hoy = new Date().toISOString().substring(0,10);
    document.getElementById('fechaMant').value = hoy;
    document.getElementById('kilometraje').value = '';
    document.getElementById('proveedor').value = '';
    document.getElementById('selectUnidad').value = '';
    document.getElementById('selectRemolque').value = '';
    document.getElementById('costoTotalDisplay').textContent = '$0.00';
    document.getElementById('msgError').textContent = '';
    document.getElementById('btnEliminar').classList.remove('visible');
    document.getElementById('renglonForm').classList.remove('visible');
    document.getElementById('inputRefaccion').value = '';
    document.getElementById('inputPrecio').value = '';
    document.getElementById('inputComentarios').value = '';

    setTipo('unidad');
    renderRenglones();

    document.querySelectorAll('#bodyMant tr').forEach(r => r.classList.remove('selected'));
}

// ── EVENTOS ───────────────────────────────────────────────
document.getElementById('btnGuardar').addEventListener('click', guardarMantenimiento);
document.getElementById('btnEliminar').addEventListener('click', eliminarMantenimiento);
document.getElementById('btnNuevo').addEventListener('click', limpiarForm);

// solo números en kilometraje
document.getElementById('kilometraje').addEventListener('keypress', (e) => {
    if (!/[0-9]/.test(e.key)) e.preventDefault();
});

// solo números en precio renglon
document.getElementById('inputPrecio').addEventListener('keypress', (e) => {
    if (!/[0-9.]/.test(e.key)) e.preventDefault();
});

// ── INIT ──────────────────────────────────────────────────
verificarAuth();
initNav();
cargarCatalogos().then(() => cargarMantenimientos());
limpiarForm();
