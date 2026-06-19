document.addEventListener("DOMContentLoaded", () => {
    const btnToggle = document.getElementById("btnToggleReporteMantenimientos");
    const btnCerrar = document.getElementById("btnCerrarReporteMantenimientos");
    const btnGenerar = document.getElementById("btnGenerarReporteMantenimientos");
    const panel = document.getElementById("panelReporteMantenimientos");

    if (btnToggle && panel) {
        btnToggle.addEventListener("click", () => {
            const estaAbierto = panel.style.display !== "none";
            panel.style.display = estaAbierto ? "none" : "block";
        });
    }

    if (btnCerrar && panel) {
        btnCerrar.addEventListener("click", () => {
            panel.style.display = "none";
        });
    }

    if (btnGenerar) {
        btnGenerar.addEventListener("click", generarReporteMantenimientos);
    }
});

async function generarReporteMantenimientos() {
    const mensaje = document.getElementById("mensajeReporteMantenimientos");

    mensaje.textContent = "";

    const fechaInicio = document.getElementById("reporteMantenimientoFechaInicio").value;
    const fechaFin = document.getElementById("reporteMantenimientoFechaFin").value;
    const equipoValue = document.getElementById("reporteMantenimientoEquipo").value;

    let tipoEquipo = "";
    let idEquipo = "";

    if (equipoValue) {
        const partes = equipoValue.split(":");

        tipoEquipo = partes[0]; // unidad o remolque
        idEquipo = partes[1];   // id numérico
    }

    if (!fechaInicio || !fechaFin) {
        mensaje.textContent = "Selecciona fecha inicial y fecha final.";
        return;
    }

    if (fechaInicio > fechaFin) {
        mensaje.textContent = "La fecha inicial no puede ser mayor que la fecha final.";
        return;
    }

    const params = new URLSearchParams();

    params.append("fechaInicio", fechaInicio);
    params.append("fechaFin", fechaFin);

    if (tipoEquipo && idEquipo) {
        params.append("tipoEquipo", tipoEquipo);
        params.append("idEquipo", idEquipo);
    }

    const res = await fetch(apiUrl(`/ContMantenimientosCab/reporte?${params.toString()}`), {
        headers: {
            "Authorization": `Bearer ${localStorage.getItem("token")}`
        }
    });

    if (!res.ok) {
        mensaje.textContent = "Error al generar el reporte.";
        return;
    }

    const data = await res.json();

    const cabeceras = data.cabeceras ?? [];
    const detalles = data.detalles ?? [];

    if (cabeceras.length === 0) {
        mensaje.textContent = "No se encontraron mantenimientos con esos filtros.";
        return;
    }

    crearPdfMantenimientos(cabeceras, detalles, fechaInicio, fechaFin, equipoValue);
}

function formatoMoneda(valor) {
    return Number(valor || 0).toLocaleString("es-MX", {
        style: "currency",
        currency: "MXN"
    });
}

function crearPdfMantenimientos(cabeceras, detalles, fechaInicio, fechaFin, equipoValue) {
    const selectEquipo = document.getElementById("reporteMantenimientoEquipo");
    const textoEquipo = selectEquipo.options[selectEquipo.selectedIndex].textContent;

    const tituloEquipo = equipoValue ? textoEquipo : "Todos los equipos";

    const doc = crearDocumentoBase(
        `Reporte de mantenimientos del ${formatFecha(fechaInicio)} al ${formatFecha(fechaFin)} - ${tituloEquipo}`,
        "landscape"
    );

    const totalMantenimientos = cabeceras.reduce((acc, c) => {
        return acc + Number(c.costoTotal ?? 0);
    }, 0);

    const totalRefacciones = detalles.reduce((acc, d) => {
        return acc + Number(d.precioRefaccion ?? 0);
    }, 0);

    // TABLA 1: CABECERAS / RESUMEN
    doc.autoTable({
        startY: 34,
        margin: { left: 14, right: 14 },
        head: [[
            "Mantto",
            "Fecha",
            "Unidad",
            "Remolque",
            "Km",
            "Proveedor",
            "Costo Total"
        ]],
        body: [
            ...cabeceras.map(c => [
                c.idMantenimiento,
                formatFecha(c.fechaMantenimiento),
                c.unidad ?? c.id_Unidad ?? "-",
                c.remolque ?? c.id_Remolque ?? "-",
                Number(c.kilometraje ?? 0).toLocaleString("es-MX"),
                c.proveedor ?? "-",
                formatoMoneda(c.costoTotal ?? 0)
            ]),
            [
                "TOTAL",
                "",
                "",
                "",
                "",
                "",
                formatoMoneda(totalMantenimientos)
            ]
        ],
        styles: {
            fontSize: 7,
            cellPadding: 1.5,
            overflow: "linebreak",
            halign: "left"
        },
        headStyles: {
            halign: "left"
        },
        columnStyles: {
            0: { cellWidth: 18 },
            1: { cellWidth: 24 },
            2: { cellWidth: 65 },
            3: { cellWidth: 65 },
            4: { cellWidth: 25 },
            5: { cellWidth: 31 },
            6: { cellWidth: 35 }
        },
        didParseCell: function (data) {
            if (data.row.index === cabeceras.length) {
                data.cell.styles.fontStyle = "bold";
                data.cell.styles.fillColor = [240, 240, 240];
            }
        }
    });

    // TABLA 2: DETALLE
    doc.autoTable({
        startY: doc.lastAutoTable.finalY + 8,
        margin: { left: 14, right: 14 },
        head: [[
            "Mantto",
            "Renglón",
            "Refacción",
            "Proveedor",
            "Precio",
            "Comentarios"
        ]],
        body: [
            ...detalles.map(d => [
                d.idMantenimiento,
                d.renglon,
                d.refaccion ?? "-",
                d.proveedor ?? "-",
                formatoMoneda(d.precioRefaccion ?? 0),
                d.comentarios ?? "-"
            ]),
            [
                "TOTAL",
                "",
                "",
                "",
                formatoMoneda(totalRefacciones),
                ""
            ]
        ],
        styles: {
            fontSize: 7,
            cellPadding: 1.5,
            overflow: "linebreak",
            halign: "left"
        },
        headStyles: {
            halign: "left"
        },
        columnStyles: {
            0: { cellWidth: 18 },
            1: { cellWidth: 20 },
            2: { cellWidth: 75 },
            3: { cellWidth: 55 },
            4: { cellWidth: 30 },
            5: { cellWidth: 65 }
        },
        didParseCell: function (data) {
            if (data.row.index === detalles.length) {
                data.cell.styles.fontStyle = "bold";
                data.cell.styles.fillColor = [240, 240, 240];
            }
        }
    });

    const pdfBlob = doc.output("blob");
    const pdfUrl = URL.createObjectURL(pdfBlob);

    window.open(pdfUrl, "_blank");
}