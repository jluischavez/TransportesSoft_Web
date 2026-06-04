window.UnidadesModulo = function() {
    const app = window.CatalogosApp;
    let modoEdicion = false;
    let idActual = null;
    let operadores = [];
    let remolques = [];

    function renderCabeceras() {
        document.getElementById('tablaHead').innerHTML = `
            <tr>
                <th>ID</th>
                <th>Marca</th>
                <th>Serie</th>
                <th>Operador</th>
                <th>Estatus</th>
            </tr>
        `;
    }

    function renderForm() {
        document.getElementById('formCampos').innerHTML = `
            <div class="form-row-2">
                <div class="form-group">
                    <label class="form-label">Marca</label>
                    <input type="text" id="f_marca" placeholder="Marca">
                </div>
                <div class="form-group">
                    <label class="form-label">Serie</label>
                    <input type="text" id="f_serie" placeholder="No. Serie">
                </div>
            </div>
            <div class="form-group">
                <label class="form-label">Operador</label>
                <select id="f_operador">
                    <option value="">— Selecciona operador —</option>
                </select>
            </div>
            <div class="form-group">
                <label class="form-label">Remolque</label>
                <select id="f_remolque">
                    <option value="">— Selecciona remolque —</option>
                </select>
            </div>
            <div class="form-group">
                <label class="form-label">Estatus</label>
                <select id="f_estatus">
                    <option value="A">Activo</option>
                    <option value="C">Cancelado</option>
                </select>
            </div>
        `;

        // llenar selects con datos ya cargados
        llenarSelectOperadores();
        llenarSelectRemolques();
    }

    function llenarSelectOperadores() {
        const sel = document.getElementById('f_operador');
        if (!sel) return;
        sel.innerHTML = '<option value="">— Selecciona operador —</option>';
        operadores.forEach(o => {
            const opt = document.createElement('option');
            opt.value = o.id_Operador;
            opt.textContent = o.nombre;
            sel.appendChild(opt);
        });
    }

    function llenarSelectRemolques() {
        const sel = document.getElementById('f_remolque');
        if (!sel) return;
        sel.innerHTML = '<option value="">— Selecciona remolque —</option>';
        remolques.forEach(r => {
            const opt = document.createElement('option');
            opt.value = r.id_Remolque;
            opt.textContent = `${r.marca} ${r.modelo} — ${r.placas}`;
            sel.appendChild(opt);
        });
    }

    async function init() {
        renderCabeceras();

        // cargar catálogos primero
        const [resOp, resRem] = await Promise.all([
            fetch(`${app.API}/ContOperadoresCat`, { headers: app.headers() }),
            fetch(`${app.API}/ContRemolquesCat`, { headers: app.headers() })
        ]);
        operadores = await resOp.json();
        remolques = await resRem.json();

        renderForm();
        limpiar();
        await cargar();
    }

    async function cargar() {
        const res = await fetch(`${app.API}/ContUnidadesCat`, { headers: app.headers() });
        const lista = await res.json();
        app.setTablaCount(lista.length);

        if (lista.length === 0) { app.mostrarTabla(false); return; }
        app.mostrarTabla(true);

        const tbody = document.getElementById('tablaBody');
        tbody.innerHTML = '';
        lista.forEach(u => {
            const operador = operadores.find(o => o.id_Operador === u.id_Operador);
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td class="td-id">${u.id_Unidad}</td>
                <td>${u.marca}</td>
                <td>${u.serie}</td>
                <td>${operador?.nombre ?? u.id_Operador}</td>
                <td>${app.badgeEstatus(u.estatus)}</td>
            `;
            tr.addEventListener('click', () => { cargarEnForm(u); app.highlightFila(tr); });
            tbody.appendChild(tr);
        });
    }

    function cargarEnForm(u) {
        modoEdicion = true;
        idActual = u.id_Unidad;
        app.setModoEdicion(u.id_Unidad);
        document.getElementById('f_marca').value = u.marca;
        document.getElementById('f_serie').value = u.serie;
        document.getElementById('f_operador').value = u.id_Operador;
        document.getElementById('f_remolque').value = u.id_Remolque;
        document.getElementById('f_estatus').value = u.estatus;
    }

    async function guardar() {
        const marca = document.getElementById('f_marca').value.trim();
        const serie = document.getElementById('f_serie').value.trim();
        const idOperador = document.getElementById('f_operador').value;
        const idRemolque = document.getElementById('f_remolque').value;

        if (!marca) { app.setError('La marca es requerida.'); return; }
        if (!serie) { app.setError('La serie es requerida.'); return; }
        if (!idOperador) { app.setError('Selecciona un operador.'); return; }
        if (!idRemolque) { app.setError('Selecciona un remolque.'); return; }
        app.clearError();

        const obj = {
            marca,
            serie,
            id_Operador: parseInt(idOperador),
            id_Remolque: parseInt(idRemolque),
            estatus: document.getElementById('f_estatus').value,
            fechaActualizacion: new Date().toISOString()
        };

        const url = modoEdicion ? `${app.API}/ContUnidadesCat/${idActual}` : `${app.API}/ContUnidadesCat`;
        const method = modoEdicion ? 'PUT' : 'POST';

        const res = await fetch(url, { method, headers: app.headers(), body: JSON.stringify(obj) });
        if (res.ok) { limpiar(); await cargar(); }
        else app.setError('Error al guardar.');
    }

    async function eliminar() {
        if (!idActual) return;
        if (!confirm(`¿Eliminar unidad ID ${idActual}?`)) return;
        const res = await fetch(`${app.API}/ContUnidadesCat/${idActual}`, { method: 'DELETE', headers: app.headers() });
        if (res.ok) { limpiar(); await cargar(); }
    }

    function limpiar() {
        modoEdicion = false;
        idActual = null;
        app.setModoNuevo();
        if (document.getElementById('f_marca')) {
            document.getElementById('f_marca').value = '';
            document.getElementById('f_serie').value = '';
            document.getElementById('f_operador').value = '';
            document.getElementById('f_remolque').value = '';
            document.getElementById('f_estatus').value = 'A';
        }
        document.querySelectorAll('#tablaBody tr').forEach(r => r.classList.remove('selected'));
    }

    return { init, guardar, eliminar, limpiar };
};
