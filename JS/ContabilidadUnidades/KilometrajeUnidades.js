window.KilometrajeUnidadesModulo = function() {
    const app = window.ContabilidadUnidadesApp;
    let modoEdicion = false;
    let idActual = null;

    function renderCabeceras() {
        document.getElementById('tablaHead').innerHTML = `
            <tr>
                <th>id_Unidad</th>
                <th>Fecha Registro</th>
                <th>Kilometraje Actual</th>
            </tr>
        `;
    }

    function renderForm(unidades) {
        document.getElementById('formCampos').innerHTML = `
        <div class="form-group">
                <label class="form-label">Unidad</label>
                 <select id="f_id_Unidad">
                <option value="">— Selecciona unidad —</option>
                ${unidades.map(u => `
                    <option value="${u.id_Unidad}">
                        ${u.id_Unidad} — ${u.marca} | ${u.serie}
                    </option>
                `).join('')}
            </select>
            </div>
            <div class="form-group">
                <label class="form-label">Fecha Registro</label>
                <input type="date" id="f_FechaRegistro" placeholder="FechaRegistro">
            </div>
            <div class="form-group">
                <label class="form-label">Kilometraje Actual</label>
                <input type="number" id="f_KilometrajeActual" placeholder="Kilometraje Actual">
            </div>
        `;
    }

    async function init() {
        renderCabeceras();
      //Se obtiene el catálogo de unidades para llenar el select del formulario aunque sea de kilometraje.
        const res = await fetch(`${app.API}/ContUnidadesCat`, { headers: app.headers() });
        const unidades = await res.json();
     
        renderForm(unidades);
        limpiar();
        await cargar();
    }

    function limpiar() {
        modoEdicion = false;
        idActual = null;
        app.setModoNuevo();
        if (document.getElementById('f_id_Unidad')) {
            document.getElementById('f_id_Unidad').value = '';
            document.getElementById('f_FechaRegistro').value = '';
            document.getElementById('f_KilometrajeActual').value = '';
        }
        document.querySelectorAll('#tablaBody tr').forEach(r => r.classList.remove('selected'));
    }

    async function cargar() {
        const res = await fetch(`${app.API}/ContKilometrajeUnidad/GetAllPorUnidad`, { headers: app.headers() });
        const lista = await res.json();
        app.setTablaCount(lista.length);

        if (lista.length === 0) { app.mostrarTabla(false); return; }
        app.mostrarTabla(true);

        const tbody = document.getElementById('tablaBody');
        tbody.innerHTML = '';
        lista.forEach(c => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
            <td class="td-id">${c.id_Unidad}</td>
            <td>${formatFecha(c.fechaRegistro)}</td>
            <td>${c.kilometrajeActual ?? '—'}</td>
             `;
            tr.addEventListener('click', () => { cargarEnForm(c); app.highlightFila(tr); });
            tbody.appendChild(tr);
        });
    }

    function formatFecha(fecha) {
        if (!fecha) return '—';
        return new Date(fecha).toLocaleDateString('es-MX', { day:'2-digit', month:'2-digit', year:'numeric' });
    }

    function cargarEnForm(c) {
        modoEdicion = true;
        idActual = c.id_Unidad;
        app.setModoEdicion(c.id_Unidad);
        document.getElementById('f_id_Unidad').value = c.id_Unidad;
        document.getElementById('f_FechaRegistro').value = c.fechaRegistro ? c.fechaRegistro.split('T')[0] : ''; 
        document.getElementById('f_KilometrajeActual').value = c.kilometrajeActual ?? '';
    }

    async function guardar() {
        const id_unidad = document.getElementById('f_id_Unidad').value.trim();
        const fecha = document.getElementById('f_FechaRegistro').value.trim();
        const kilometrajeActual = document.getElementById('f_KilometrajeActual').value.trim();

        if (!id_unidad)     { app.setError('La unidad es requerida.');              return; }
        if (!fecha)         { app.setError('La fecha es requerida.');               return; }
        if (!kilometrajeActual) { app.setError('El kilometraje actual es requerido.');   return; }
        app.clearError();

        const obj = {
            id_Unidad: id_unidad,
            fechaRegistro: document.getElementById('f_FechaRegistro').value.trim(),
            kilometrajeActual: document.getElementById('f_KilometrajeActual').value.trim()
        };

        const url = `${app.API}/ContKilometrajeUnidad`;
        const method = 'POST';

        const res = await fetch(url, { method, headers: app.headers(), body: JSON.stringify(obj) });
        if (res.ok) { limpiar(); await cargar(); }
        else app.setError('Error al guardar.');
    }
    

    return { init, guardar, limpiar };


};