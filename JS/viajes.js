
    const API = 'https://localhost:7169';
    const IVA_PCT = 16;
    const RET_PCT = 4;

    let ivaEditado = false;
    let retencionEditado = false;
    let modoEdicion = false;
    let idViajeActual = null;
    let unidadActual = null;

    // ── AUTH ──────────────────────────────────────────────
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

    // ── NAV ───────────────────────────────────────────────
    function initNav() {
        const usuario = localStorage.getItem('nombreUsuario');
        const empresa = localStorage.getItem('empresaNombre');
        const nav = document.getElementById('navUsuario');
        nav.textContent = empresa ? `${usuario} — ${empresa}` : usuario;

        document.getElementById('btnLogout').addEventListener('click', () => {
            localStorage.clear();
            window.location.href = 'index.html';
        });
    }

    // ── CARGAR CATÁLOGOS ──────────────────────────────────
    async function cargarCatalogos() {
        const [clientes, operadores, municipios] = await Promise.all([
            fetch(`${API}/ContClientesCat`, { headers: headers() }).then(r => r.json()),
            fetch(`${API}/ContOperadoresCat`, { headers: headers() }).then(r => r.json()),
            fetch(`${API}/MunicipiosCat`, { headers: headers() }).then(r => r.json())
        ]);

        llenarSelect('selectCliente', clientes, 'id_Client', 'nombre', '— Selecciona cliente —');
        llenarSelect('selectOperador', operadores, 'id_Operador', 'nombre', '— Selecciona operador —');
        llenarSelect('selectOrigen', municipios, 'idMunicipio', 'nombre', '— Origen —');
        llenarSelect('selectDestino', municipios, 'idMunicipio', 'nombre', '— Destino —');
    }

    function llenarSelect(id, lista, valKey, txtKey, placeholder) {
        const sel = document.getElementById(id);
        sel.innerHTML = `<option value="">${placeholder}</option>`;
        lista.forEach(item => {
            const opt = document.createElement('option');
            opt.value = item[valKey];
            opt.textContent = item[txtKey];
            sel.appendChild(opt);
        });
    }

    // ── CARGAR VIAJES ─────────────────────────────────────
    async function cargarViajes() {
        document.getElementById('loadingTabla').style.display = 'block';
        document.getElementById('tablaViajes').style.display = 'none';
        document.getElementById('emptyState').style.display = 'none';

        const res = await fetch(`${API}/ContViajes`, { headers: headers() });
        const viajes = await res.json();

        document.getElementById('loadingTabla').style.display = 'none';
        document.getElementById('contadorViajes').textContent = `${viajes.length} registros`;

        if (viajes.length === 0) {
            document.getElementById('emptyState').style.display = 'block';
            return;
        }

        document.getElementById('tablaViajes').style.display = 'table';
        const tbody = document.getElementById('bodyViajes');
        tbody.innerHTML = '';

        viajes.forEach(v => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td class="td-id">${v.id_Viaje}</td>
                <td class="td-idTransporte">${v.numeroTransporte}</td>
                <td>${formatFecha(v.fechaViaje)}</td>
                <td>${v.nombreCliente}</td>
                <td>${v.origen}</td>
                <td>${v.destino}</td>
                <td>${v.factura}</td>
                <td class="td-monto">$${Number(v.total).toLocaleString('es-MX', {minimumFractionDigits:2})}</td>
            `;
            tr.addEventListener('click', () => cargarViajeEnForm(v));
            tbody.appendChild(tr);
        });
    }

    function formatFecha(fecha) {
        if (!fecha) return '—';
        return new Date(fecha).toLocaleDateString('es-MX', { day:'2-digit', month:'2-digit', year:'numeric' });
    }

    // ── CARGAR VIAJE EN FORM ──────────────────────────────
    async function cargarViajeEnForm(v) {
        modoEdicion = true;
        idViajeActual = v.id_Viaje;

        document.getElementById('displayId').textContent = v.id_Viaje;
        document.getElementById('modoLabel').textContent = 'EDICIÓN';
        document.getElementById('modoLabel').className = 'form-mode edicion';

        document.getElementById('fechaViaje').value = v.fechaViaje?.substring(0,10);
        document.getElementById('fechaFactura').value = v.fechaFactura?.substring(0,10);
        document.getElementById('selectCliente').value = v.id_Client;
        document.getElementById('folioFactura').value = v.factura;
        document.getElementById('numTransporte').value = v.numeroTransporte;
        document.getElementById('comentarios').value = v.comentarios;
        document.getElementById('monto').value = Number(v.monto).toFixed(2);
        document.getElementById('iva').value = Number(v.iva).toFixed(2);
        document.getElementById('retenciones').value = Number(v.retenciones).toFixed(2);
        document.getElementById('maniobra').value = Number(v.maniobra).toFixed(2);
        calcularTotal();

        // Seleccionar origen/destino por nombre
        seleccionarPorTexto('selectOrigen', v.origen);
        seleccionarPorTexto('selectDestino', v.destino);

        // Cargar operador y su unidad
        document.getElementById('selectOperador').value = v.id_Operador;
        await buscarUnidadPorOperador(v.id_Operador);

        document.getElementById('btnEliminar').classList.add('visible');
        document.getElementById('msgError').textContent = '';

        // Highlight fila seleccionada
        document.querySelectorAll('#bodyViajes tr').forEach(tr => tr.classList.remove('selected'));
        event.currentTarget.classList.add('selected');
    }

    function seleccionarPorTexto(selectId, texto) {
        const sel = document.getElementById(selectId);
        for (let opt of sel.options) {
            if (opt.textContent.trim() === texto) {
                sel.value = opt.value;
                break;
            }
        }
    }

    // ── BUSCAR UNIDAD POR OPERADOR ────────────────────────
    async function buscarUnidadPorOperador(idOperador) {
        if (!idOperador) {
            document.getElementById('unidadInfo').classList.remove('visible');
            unidadActual = null;
            return;
        }

        try {
            const res = await fetch(`${API}/ContUnidadesCat/operador/${idOperador}`, { headers: headers() });
            if (res.ok) {
                unidadActual = await res.json();
                document.getElementById('unidadInfoText').textContent =
                    `Unidad: ${unidadActual.marca} — Serie: ${unidadActual.serie} | Remolque ID: ${unidadActual.id_Remolque}`;
                document.getElementById('unidadInfo').classList.add('visible');
            } else {
                unidadActual = null;
                document.getElementById('unidadInfoText').textContent = '⚠ Operador sin unidad activa asignada';
                document.getElementById('unidadInfo').classList.add('visible');
            }
        } catch {
            unidadActual = null;
        }
    }

    // ── CÁLCULO DE TOTALES ────────────────────────────────
    function calcularTotal() {
        const monto = parseFloat(document.getElementById('monto').value) || 0;
        const iva   = parseFloat(document.getElementById('iva').value) || 0;
        const ret   = parseFloat(document.getElementById('retenciones').value) || 0;
        const man   = parseFloat(document.getElementById('maniobra').value) || 0;
        const total = monto + iva - ret - man;
        document.getElementById('totalDisplay').textContent =
            '$' + total.toLocaleString('es-MX', { minimumFractionDigits: 2 });
        return total;
    }

    function onMontoBlur() {
        const monto = parseFloat(document.getElementById('monto').value) || 0;
        document.getElementById('monto').value = monto.toFixed(2);

        if (!ivaEditado)
            document.getElementById('iva').value = (monto * IVA_PCT / 100).toFixed(2);
        if (!retencionEditado)
            document.getElementById('retenciones').value = (monto * RET_PCT / 100).toFixed(2);

        calcularTotal();
    }

    // ── GUARDAR ───────────────────────────────────────────
    async function guardarViaje() {
        const msg = document.getElementById('msgError');
        msg.textContent = '';

        // Validaciones básicas
        const idCliente = document.getElementById('selectCliente').value;
        const folio = document.getElementById('folioFactura').value.trim();
        const numTrans = document.getElementById('numTransporte').value.trim();
        const origen = document.getElementById('selectOrigen').value;
        const destino = document.getElementById('selectDestino').value;
        const monto = parseFloat(document.getElementById('monto').value) || 0;
        const total = calcularTotal();
        const idOperador = document.getElementById('selectOperador').value;

        if (!idCliente) { msg.textContent = 'Selecciona un cliente.'; return; }
        if (!folio) { msg.textContent = 'El folio de factura es requerido.'; return; }
        if (!numTrans) { msg.textContent = 'El número de transporte es requerido.'; return; }
        if (!origen) { msg.textContent = 'Selecciona el origen.'; return; }
        if (!destino) { msg.textContent = 'Selecciona el destino.'; return; }
        if (monto <= 0) { msg.textContent = 'El monto debe ser mayor a 0.'; return; }
        if (total <= 0) { msg.textContent = 'El total debe ser mayor a 0.'; return; }
        if (!idOperador) { msg.textContent = 'Selecciona un operador.'; return; }
        if (!unidadActual) { msg.textContent = 'El operador no tiene unidad activa asignada.'; return; }

        // Validar unicidad solo en modo nuevo
        if (!modoEdicion) {
            const [resFactura, resTrans] = await Promise.all([
                fetch(`${API}/ContViajes/validar-factura/${folio}`, { headers: headers() }).then(r => r.json()),
                fetch(`${API}/ContViajes/validar-transporte/${numTrans}`, { headers: headers() }).then(r => r.json())
            ]);

            if (!resFactura.disponible) { msg.textContent = `El folio "${folio}" ya está registrado.`; return; }
            if (!resTrans.disponible) { msg.textContent = `El No. Transporte "${numTrans}" ya está registrado.`; return; }
        }

        // Obtener nombre cliente
        const selCliente = document.getElementById('selectCliente');
        const nombreCliente = selCliente.options[selCliente.selectedIndex].textContent;

        // Obtener origen/destino texto
        const selOrigen = document.getElementById('selectOrigen');
        const selDestino = document.getElementById('selectDestino');
        const origenTexto = selOrigen.options[selOrigen.selectedIndex].textContent;
        const destinoTexto = selDestino.options[selDestino.selectedIndex].textContent;

        const viaje = {
            id_Client: parseInt(idCliente),
            nombreCliente,
            fechaViaje: document.getElementById('fechaViaje').value,
            fechaFactura: document.getElementById('fechaFactura').value,
            factura: folio,
            numeroTransporte: numTrans,
            origen: origenTexto,
            destino: destinoTexto,
            monto: parseFloat(document.getElementById('monto').value) || 0,
            iva: parseFloat(document.getElementById('iva').value) || 0,
            retenciones: parseFloat(document.getElementById('retenciones').value) || 0,
            maniobra: parseFloat(document.getElementById('maniobra').value) || 0,
            total,
            comentarios: document.getElementById('comentarios').value,
            id_Operador: parseInt(idOperador),
            id_Unidad: unidadActual.id_Unidad,
            id_Remolque: unidadActual.id_Remolque
        };

        const url = modoEdicion ? `${API}/ContViajes/${idViajeActual}` : `${API}/ContViajes`;
        const method = modoEdicion ? 'PUT' : 'POST';

        const res = await fetch(url, {
            method,
            headers: headers(),
            body: JSON.stringify(viaje)
        });

        if (res.ok) {
            limpiarForm();
            await cargarViajes();
        } else {
            msg.textContent = 'Error al guardar. Verifica los datos.';
        }
    }

    // ── ELIMINAR ──────────────────────────────────────────
    async function eliminarViaje() {
        if (!idViajeActual) return;
        if (!confirm(`¿Eliminar el viaje ID ${idViajeActual}?`)) return;

        const res = await fetch(`${API}/ContViajes/${idViajeActual}`, {
            method: 'DELETE',
            headers: headers()
        });

        if (res.ok) {
            limpiarForm();
            await cargarViajes();
        }
    }

    // ── LIMPIAR FORM ──────────────────────────────────────
    function limpiarForm() {
        modoEdicion = false;
        idViajeActual = null;
        unidadActual = null;
        ivaEditado = false;
        retencionEditado = false;

        document.getElementById('displayId').textContent = '—';
        document.getElementById('modoLabel').textContent = 'NUEVO';
        document.getElementById('modoLabel').className = 'form-mode nuevo';

        const hoy = new Date().toISOString().substring(0,10);
        document.getElementById('fechaViaje').value = hoy;
        document.getElementById('fechaFactura').value = hoy;
        document.getElementById('selectCliente').value = '';
        document.getElementById('folioFactura').value = '';
        document.getElementById('numTransporte').value = '';
        document.getElementById('selectOrigen').value = '';
        document.getElementById('selectDestino').value = '';
        document.getElementById('selectOperador').value = '';
        document.getElementById('monto').value = '';
        document.getElementById('iva').value = '';
        document.getElementById('retenciones').value = '';
        document.getElementById('maniobra').value = '';
        document.getElementById('comentarios').value = '';
        document.getElementById('totalDisplay').textContent = '$0.00';
        document.getElementById('unidadInfo').classList.remove('visible');
        document.getElementById('btnEliminar').classList.remove('visible');
        document.getElementById('msgError').textContent = '';

        document.querySelectorAll('#bodyViajes tr').forEach(tr => tr.classList.remove('selected'));
    }

    // ── EVENTOS ───────────────────────────────────────────
    document.getElementById('monto').addEventListener('blur', onMontoBlur);
    document.getElementById('maniobra').addEventListener('blur', () => {
        const v = parseFloat(document.getElementById('maniobra').value) || 0;
        document.getElementById('maniobra').value = v.toFixed(2);
        calcularTotal();
    });
    document.getElementById('iva').addEventListener('input', () => { ivaEditado = true; calcularTotal(); });
    document.getElementById('retenciones').addEventListener('input', () => { retencionEditado = true; calcularTotal(); });
    document.getElementById('iva').addEventListener('blur', () => {
        const v = parseFloat(document.getElementById('iva').value) || 0;
        document.getElementById('iva').value = v.toFixed(2);
    });
    document.getElementById('retenciones').addEventListener('blur', () => {
        const v = parseFloat(document.getElementById('retenciones').value) || 0;
        document.getElementById('retenciones').value = v.toFixed(2);
    });

    document.getElementById('selectOperador').addEventListener('change', async (e) => {
        await buscarUnidadPorOperador(e.target.value);
    });

    document.getElementById('btnGuardar').addEventListener('click', guardarViaje);
    document.getElementById('btnEliminar').addEventListener('click', eliminarViaje);
    document.getElementById('btnNuevo').addEventListener('click', limpiarForm);

    // ── INIT ──────────────────────────────────────────────
    verificarAuth();
    initNav();
    cargarCatalogos().then(() => cargarViajes());
    limpiarForm();