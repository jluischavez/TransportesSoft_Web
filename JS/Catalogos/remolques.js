window.RemolquesModulo = function() {
    const app = window.CatalogosApp;
    let modoEdicion = false;
    let idActual = null;

    function renderCabeceras() {
        document.getElementById('tablaHead').innerHTML = `
            <tr>
                <th>ID</th>
                <th>Marca</th>
                <th>Modelo</th>
                <th>Placas</th>
                <th>Año</th>
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
                    <label class="form-label">Modelo</label>
                    <input type="text" id="f_modelo" placeholder="Modelo">
                </div>
            </div>
            <div class="form-row-2">
                <div class="form-group">
                    <label class="form-label">Serie</label>
                    <input type="text" id="f_serie" placeholder="No. Serie">
                </div>
                <div class="form-group">
                    <label class="form-label">Año</label>
                    <input type="text" id="f_year" placeholder="Año">
                </div>
            </div>
            <div class="form-group">
                <label class="form-label">Placas</label>
                <input type="text" id="f_placas" placeholder="Placas" maxlength="6">
            </div>
            <div class="divider"></div>
            <div class="form-row-2">
                <div class="form-group">
                    <label class="form-label">Fecha Llantas</label>
                    <input type="date" id="f_fechaLlantas">
                </div>
                <div class="form-group">
                    <label class="form-label">Físico SCT</label>
                    <input type="date" id="f_fechaSCT">
                </div>
            </div>
            <div class="form-group">
                <label class="form-label">Impermeabilización</label>
                <input type="date" id="f_impermeabilizacion">
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
        const res = await fetch(`${app.API}/ContRemolquesCat`, { headers: app.headers() });
        const lista = await res.json();
        app.setTablaCount(lista.length);

        if (lista.length === 0) { app.mostrarTabla(false); return; }
        app.mostrarTabla(true);

        const tbody = document.getElementById('tablaBody');
        tbody.innerHTML = '';
        lista.forEach(r => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td class="td-id">${r.id_Remolque}</td>
                <td>${r.marca}</td>
                <td>${r.modelo}</td>
                <td>${r.placas}</td>
                <td>${r.year}</td>
            `;
            tr.addEventListener('click', () => { cargarEnForm(r); app.highlightFila(tr); });
            tbody.appendChild(tr);
        });
    }

    function cargarEnForm(r) {
        modoEdicion = true;
        idActual = r.id_Remolque;
        app.setModoEdicion(r.id_Remolque);
        document.getElementById('f_marca').value = r.marca;
        document.getElementById('f_modelo').value = r.modelo;
        document.getElementById('f_serie').value = r.serie;
        document.getElementById('f_year').value = r.year;
        document.getElementById('f_placas').value = r.placas;
        document.getElementById('f_fechaLlantas').value = r.fecha_Llantas?.substring(0,10) ?? '';
        document.getElementById('f_fechaSCT').value = r.fecha_Fisico_SCT?.substring(0,10) ?? '';
        document.getElementById('f_impermeabilizacion').value = r.impermeabilizacion?.substring(0,10) ?? '';
    }

    async function guardar() {
        const marca = document.getElementById('f_marca').value.trim();
        const modelo = document.getElementById('f_modelo').value.trim();
        const serie = document.getElementById('f_serie').value.trim();
        const year = parseInt(document.getElementById('f_year').value) || 0;
        const placas = document.getElementById('f_placas').value.trim().toUpperCase();

        if (!marca) { app.setError('La marca es requerida.'); return; }
        if (!modelo) { app.setError('El modelo es requerido.'); return; }
        if (!serie) { app.setError('La serie es requerida.'); return; }
        if (year === 0) { app.setError('El año es requerido.'); return; }
        if (!placas) { app.setError('Las placas son requeridas.'); return; }
        app.clearError();

        const obj = {
            marca,
            modelo,
            serie,
            year,
            placas,
            fecha_Llantas: document.getElementById('f_fechaLlantas').value || null,
            fecha_Fisico_SCT: document.getElementById('f_fechaSCT').value || null,
            impermeabilizacion: document.getElementById('f_impermeabilizacion').value || null
        };

        const url = modoEdicion ? `${app.API}/ContRemolquesCat/${idActual}` : `${app.API}/ContRemolquesCat`;
        const method = modoEdicion ? 'PUT' : 'POST';

        const res = await fetch(url, { method, headers: app.headers(), body: JSON.stringify(obj) });
        if (res.ok) { limpiar(); await cargar(); }
        else app.setError('Error al guardar.');
    }

    async function eliminar() {
        if (!idActual) return;
        if (!confirm(`¿Eliminar remolque ID ${idActual}?`)) return;
        const res = await fetch(`${app.API}/ContRemolquesCat/${idActual}`, { method: 'DELETE', headers: app.headers() });
        if (res.ok) { limpiar(); await cargar(); }
    }

    function limpiar() {
        modoEdicion = false;
        idActual = null;
        app.setModoNuevo();
        if (document.getElementById('f_marca')) {
            document.getElementById('f_marca').value = '';
            document.getElementById('f_modelo').value = '';
            document.getElementById('f_serie').value = '';
            document.getElementById('f_year').value = '';
            document.getElementById('f_placas').value = '';
            document.getElementById('f_fechaLlantas').value = '';
            document.getElementById('f_fechaSCT').value = '';
            document.getElementById('f_impermeabilizacion').value = '';
        }
        document.querySelectorAll('#tablaBody tr').forEach(r => r.classList.remove('selected'));
    }

    return { init, guardar, eliminar, limpiar };
};
