window.OperadoresModulo = function() {
    const app = window.CatalogosApp;
    let modoEdicion = false;
    let idActual = null;

    function renderCabeceras() {
        document.getElementById('tablaHead').innerHTML = `
            <tr>
                <th>ID</th>
                <th>Nombre</th>
                <th>Fecha Ingreso</th>
                <th>Fecha Egreso</th>
                <th>Estatus</th>
            </tr>
        `;
    }

    function renderForm() {
        document.getElementById('formCampos').innerHTML = `
            <div class="form-group">
                <label class="form-label">Nombre</label>
                <input type="text" id="f_nombre" placeholder="Nombre del operador">
            </div>
            <div class="form-row-2">
                <div class="form-group">
                    <label class="form-label">Fecha Ingreso</label>
                    <input type="date" id="f_fechaIngreso">
                </div>
                <div class="form-group">
                    <label class="form-label">Fecha Egreso</label>
                    <input type="date" id="f_fechaEgreso">
                </div>
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
        const res = await fetch(`${app.API}/ContOperadoresCat`, { headers: app.headers() });
        const lista = await res.json();
        app.setTablaCount(lista.length);

        if (lista.length === 0) { app.mostrarTabla(false); return; }
        app.mostrarTabla(true);

        const tbody = document.getElementById('tablaBody');
        tbody.innerHTML = '';
        lista.forEach(o => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td class="td-id">${o.id_Operador}</td>
                <td>${o.nombre}</td>
                <td>${app.formatFecha(o.fechaIngreso)}</td>
                <td>${app.formatFecha(o.fechaEgreso)}</td>
                <td>${app.badgeEstatus(o.estatus)}</td>
            `;
            tr.addEventListener('click', () => { cargarEnForm(o); app.highlightFila(tr); });
            tbody.appendChild(tr);
        });
    }

    function cargarEnForm(o) {
        modoEdicion = true;
        idActual = o.id_Operador;
        app.setModoEdicion(o.id_Operador);
        document.getElementById('f_nombre').value = o.nombre;
        document.getElementById('f_fechaIngreso').value = o.fechaIngreso?.substring(0,10) ?? '';
        document.getElementById('f_fechaEgreso').value = o.fechaEgreso?.substring(0,10) ?? '';
        document.getElementById('f_estatus').value = o.estatus;
    }

    async function guardar() {
        const nombre = document.getElementById('f_nombre').value.trim();
        if (!nombre) { app.setError('El nombre es requerido.'); return; }
        app.clearError();

        const obj = {
            nombre,
            fechaIngreso: document.getElementById('f_fechaIngreso').value || null,
            fechaEgreso: document.getElementById('f_fechaEgreso').value || null,
            estatus: document.getElementById('f_estatus').value
        };

        const url = modoEdicion ? `${app.API}/ContOperadoresCat/${idActual}` : `${app.API}/ContOperadoresCat`;
        const method = modoEdicion ? 'PUT' : 'POST';

        const res = await fetch(url, { method, headers: app.headers(), body: JSON.stringify(obj) });
        if (res.ok) { limpiar(); await cargar(); }
        else app.setError('Error al guardar.');
    }

    async function eliminar() {
        if (!idActual) return;
        if (!confirm(`¿Eliminar operador ID ${idActual}?`)) return;
        const res = await fetch(`${app.API}/ContOperadoresCat/${idActual}`, { method: 'DELETE', headers: app.headers() });
        if (res.ok) { limpiar(); await cargar(); }
    }

    function limpiar() {
        modoEdicion = false;
        idActual = null;
        app.setModoNuevo();
        if (document.getElementById('f_nombre')) {
            document.getElementById('f_nombre').value = '';
            document.getElementById('f_fechaIngreso').value = '';
            document.getElementById('f_fechaEgreso').value = '';
            document.getElementById('f_estatus').value = 'A';
        }
        document.querySelectorAll('#tablaBody tr').forEach(r => r.classList.remove('selected'));
    }

    return { init, guardar, eliminar, limpiar };
};
