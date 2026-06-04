window.ClientesModulo = function() {
    const app = window.CatalogosApp;
    let modoEdicion = false;
    let idActual = null;

    function renderCabeceras() {
        document.getElementById('tablaHead').innerHTML = `
            <tr>
                <th>ID</th>
                <th>Nombre</th>
                <th>Teléfono</th>
                <th>Estatus</th>
            </tr>
        `;
    }

    function renderForm() {
        document.getElementById('formCampos').innerHTML = `
            <div class="form-group">
                <label class="form-label">Nombre</label>
                <input type="text" id="f_nombre" placeholder="Nombre del cliente">
            </div>
            <div class="form-group">
                <label class="form-label">Dirección</label>
                <input type="text" id="f_direccion" placeholder="Dirección">
            </div>
            <div class="form-group">
                <label class="form-label">Teléfono</label>
                <input type="text" id="f_telefono" placeholder="Teléfono">
            </div>
            <div class="form-group">
                <label class="form-label">Estatus</label>
                <select id="f_estatus">
                    <option value="A">Activo</option>
                    <option value="C">Cancelado</option>
                </select>
            </div>
        `;
    }

    async function init() {
        renderCabeceras();
        renderForm();
        limpiar();
        await cargar();
    }

    async function cargar() {
        const res = await fetch(`${app.API}/ContClientesCat`, { headers: app.headers() });
        const lista = await res.json();
        app.setTablaCount(lista.length);

        if (lista.length === 0) { app.mostrarTabla(false); return; }
        app.mostrarTabla(true);

        const tbody = document.getElementById('tablaBody');
        tbody.innerHTML = '';
        lista.forEach(c => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td class="td-id">${c.id_Client}</td>
                <td>${c.nombre}</td>
                <td>${c.telefono ?? '—'}</td>
                <td>${app.badgeEstatus(c.estatus)}</td>
            `;
            tr.addEventListener('click', () => { cargarEnForm(c); app.highlightFila(tr); });
            tbody.appendChild(tr);
        });
    }

    function cargarEnForm(c) {
        modoEdicion = true;
        idActual = c.id_Client;
        app.setModoEdicion(c.id_Client);
        document.getElementById('f_nombre').value = c.nombre;
        document.getElementById('f_direccion').value = c.direccion ?? '';
        document.getElementById('f_telefono').value = c.telefono ?? '';
        document.getElementById('f_estatus').value = c.estatus;
    }

    async function guardar() {
        const nombre = document.getElementById('f_nombre').value.trim();
        if (!nombre) { app.setError('El nombre es requerido.'); return; }
        app.clearError();

        const obj = {
            nombre,
            direccion: document.getElementById('f_direccion').value.trim(),
            telefono: document.getElementById('f_telefono').value.trim(),
            estatus: document.getElementById('f_estatus').value
        };

        const url = modoEdicion ? `${app.API}/ContClientesCat/${idActual}` : `${app.API}/ContClientesCat`;
        const method = modoEdicion ? 'PUT' : 'POST';

        const res = await fetch(url, { method, headers: app.headers(), body: JSON.stringify(obj) });
        if (res.ok) { limpiar(); await cargar(); }
        else app.setError('Error al guardar.');
    }

    async function eliminar() {
        if (!idActual) return;
        if (!confirm(`¿Eliminar cliente ID ${idActual}?`)) return;
        const res = await fetch(`${app.API}/ContClientesCat/${idActual}`, { method: 'DELETE', headers: app.headers() });
        if (res.ok) { limpiar(); await cargar(); }
    }

    function limpiar() {
        modoEdicion = false;
        idActual = null;
        app.setModoNuevo();
        if (document.getElementById('f_nombre')) {
            document.getElementById('f_nombre').value = '';
            document.getElementById('f_direccion').value = '';
            document.getElementById('f_telefono').value = '';
            document.getElementById('f_estatus').value = 'A';
        }
        document.querySelectorAll('#tablaBody tr').forEach(r => r.classList.remove('selected'));
    }

    return { init, guardar, eliminar, limpiar };
};
