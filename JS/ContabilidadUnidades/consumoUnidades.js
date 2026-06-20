window.ConsumoUnidadesModulo = function() {
    const app = window.ContabilidadUnidadesApp;
    let modoEdicion = false;
    let idActual = null;

    function renderCabeceras() {
        document.getElementById('tablaHead').innerHTML = `
            <tr>
                <th>Unidad</th>
                <th>Fecha</th>
                <th>Consumo en Litros</th>
                <th>Consumo en Pesos</th>
                <th>Comentarios</th>
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
                <label class="form-label">Fecha</label>
                <input type="date" id="f_Fecha" placeholder="Fecha">
            </div>
            <div class="form-group">
                <label class="form-label">Consumo en Litros</label>
                <input type="number" id="f_consumoLitros" placeholder="Consumo en Litros">
            </div>
            <div class="form-group">
                <label class="form-label">Consumo en Pesos</label>
                <input type="number" id="f_ConsumoPesos" placeholder="Consumo en Pesos">
            </div>
            <div class="form-group">
                <label class="form-label">Comentarios</label>
                <input type="text" id="f_Comentarios" placeholder="Comentarios">
            </div>
        `;
    }

    async function init() {
        renderCabeceras();
        
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
            document.getElementById('f_Fecha').value = '';
            document.getElementById('f_consumoLitros').value = '';
            document.getElementById('f_ConsumoPesos').value = '';
            document.getElementById('f_Comentarios').value = '';
        }
        document.querySelectorAll('#tablaBody tr').forEach(r => r.classList.remove('selected'));
    }

    async function cargar() {
        const res = await fetch(`${app.API}/ContConsumoUnidades/GetAllPorUnidad`, { headers: app.headers() });
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
            <td>${formatFecha(c.fecha)}</td>
            <td>${c.consumoLitros ?? '—'}</td>
            <td>${c.consumoPesos ?? '—'}</td>
            <td>${c.comentarios ?? '—'}</td>
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
        document.getElementById('f_Fecha').value = c.fecha ? c.fecha.split('T')[0] : ''; 
        document.getElementById('f_consumoLitros').value = c.consumoLitros ?? '';
        document.getElementById('f_ConsumoPesos').value = c.consumoPesos ?? '';
        document.getElementById('f_Comentarios').value = c.comentarios ?? '';
    }

    async function guardar() {
        const id_unidad = document.getElementById('f_id_Unidad').value.trim();
        const fecha = document.getElementById('f_Fecha').value.trim();
        const consumoLitros = document.getElementById('f_consumoLitros').value.trim();
        const consumoPesos = document.getElementById('f_ConsumoPesos').value.trim();
        const comentarios = document.getElementById('f_Comentarios').value.trim();

        if (!id_unidad)     { app.setError('La unidad es requerida.');              return; }
        if (!fecha)         { app.setError('La fecha es requerida.');               return; }
        if (!consumoLitros) { app.setError('El consumo en litros es requerido.');   return; }
        if (!consumoPesos)  { app.setError('El consumo en pesos es requerido.');    return; }
        app.clearError();

        const obj = {
            id_Unidad: id_unidad,
            fecha: document.getElementById('f_Fecha').value.trim(),
            consumoLitros: document.getElementById('f_consumoLitros').value.trim(),
            consumoPesos: document.getElementById('f_ConsumoPesos').value.trim(),
            comentarios: document.getElementById('f_Comentarios').value.trim()
        };

        const url = `${app.API}/ContConsumoUnidades`;
        const method = 'POST';

        const res = await fetch(url, { method, headers: app.headers(), body: JSON.stringify(obj) });
        if (res.ok) { limpiar(); await cargar(); }
        else app.setError('Error al guardar.');
    }
    

    return { init, guardar, limpiar };


};