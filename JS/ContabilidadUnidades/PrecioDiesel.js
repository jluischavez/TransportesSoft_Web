window.PrecioDieselModulo = function() {
    const app = window.ContabilidadUnidadesApp;
    let modoEdicion = false;
    let idActual = null;

    function renderCabeceras() {
        document.getElementById('tablaHead').innerHTML = `
            <tr>
                <th>Precio</th>
            </tr>
        `;
    }

    function renderForm() {
        document.getElementById('formCampos').innerHTML = `
            <div class="form-group">
                <label class="form-label">Precio</label>
                <input type="number" id="f_Precio" placeholder="Precio" step="0.01" min="0">
                <label class="form-label" id="f_guardado"></label>
            </div>
        `;
    }

    async function init() {
        // renderCabeceras();
        document.querySelector('.tabla-panel').style.display = 'none';
        renderForm();
        limpiar();
        await cargar();
    }

    function limpiar() {
        modoEdicion = false;
        idActual = null;
        app.setModoNuevo();
        if (document.getElementById('f_Precio')) {
            document.getElementById('f_Precio').value = '';
        }                                                        // ← faltaba cerrar el if
        document.querySelectorAll('#tablaBody tr').forEach(r => r.classList.remove('selected'));
    }

    async function cargar() {
        const res = await fetch(`${app.API}/ContPreciosDiesel/precio-actual`, { headers: app.headers() });
        if (res.status === 404) return;
        const c = await res.json();
        cargarEnForm(c);
    }                                                           

    function cargarEnForm(c) {
        modoEdicion = true;
        idActual = c.idPrecioDiesel;                            
        // app.setModoEdicion(c.idPrecioDiesel);
        document.getElementById('f_Precio').value = c.precio ?? '';
        document.getElementById('f_guardado').textContent = '';
    }

    async function guardar() {
        const precio = document.getElementById('f_Precio').value.trim();
        if (!precio) { app.setError('El precio es requerido.'); return; }
        app.clearError();

        const obj = { precio: parseFloat(precio) };             

        const res = await fetch(`${app.API}/ContPreciosDiesel`, {
            method: 'POST',
            headers: app.headers(),
            body: JSON.stringify(obj)
        });
        if (res.ok) { 
            limpiar(); 
            await cargar(); 
            const msg = document.getElementById('f_guardado');
            msg.textContent = '✓ Precio guardado correctamente.';
            msg.classList.add('msg-exito');
        }
        else app.setError('Error al guardar.');
    }

    return { init, guardar, limpiar };

};