document.getElementById("btnToggleReporteViajes").addEventListener("click", () => {
    const panel = document.getElementById("panelReporteViajes");
    panel.style.display = panel.style.display === "none" ? "grid" : "none";
});

document.getElementById("btnGenerarReporteViajes").addEventListener("click", generarReporteViajes);

async function generarReporteViajes() {
    const mensaje = document.getElementById("mensajeReporteViajes");
    mensaje.textContent = "";

    const tipoFecha = document.getElementById("reporteTipoFecha").value;
    const fechaInicio = document.getElementById("reporteFechaInicio").value;
    const fechaFin = document.getElementById("reporteFechaFin").value;
    const idUnidad = document.getElementById("reporteUnidad").value;

    if (!fechaInicio || !fechaFin) {
        mensaje.textContent = "Selecciona fecha inicio y fecha fin.";
        return;
    }

    try {
        const params = new URLSearchParams();

        params.append("fechaInicio", fechaInicio);
        params.append("fechaFin", fechaFin);
        params.append("tipoFecha", tipoFecha);

        if (idUnidad) {
            params.append("idUnidad", idUnidad);
        }

        const res = await fetch(`${API}/ContViajes/reporte?${params.toString()}`, {
            headers: headers()
        });

        if (!res.ok) {
            mensaje.textContent = "No se pudo generar el reporte.";
            return;
        }

        const viajes = await res.json();

        const doc = crearDocumentoBase(
            `Reporte de viajes del ${formatearFecha(fechaInicio)} al ${formatearFecha(fechaFin)}`,
            "landscape"
        );

        doc.autoTable({
            startY: 34,
            head: [[
                "Viaje", "Fecha", "Cliente", "Operador", "Unidad",
                "Remolque", "Origen", "Destino", "Factura", "#Transp."
            ]],
            body: viajes.map(v => [
                v.id_Viaje,
                formatearFecha(v.fechaViaje),
                v.nombreCliente ?? "-",
                v.operador ?? "-",
                v.unidad ?? "-",
                v.remolque ?? "-",
                v.origen ?? "-",
                v.destino ?? "-",
                v.factura ?? "-",
                v.numeroTransporte ?? "-"
            ]),
            styles: {
                fontSize: 6.5,
                cellPadding: 1.2,
                overflow: "linebreak"
            }
        });

        const totalMonto = sum(viajes, "monto");
        const totalIva = sum(viajes, "iva");
        const totalRet = sum(viajes, "retenciones");
        const totalManiobra = sum(viajes, "maniobra");
        const totalGeneral = sum(viajes, "total");

        doc.autoTable({
            startY: doc.lastAutoTable.finalY + 8,
            margin: { left: 14, right: 14 },
            tableWidth: "auto",
            head: [[
                "Viaje",
                "Monto",
                "IVA",
                "Ret.",
                "Maniobra",
                "Total",
                "Comentarios"
            ]],
            body: [
                ...viajes.map(v => [
                    v.id_Viaje,
                    formatoMoneda(v.monto),
                    formatoMoneda(v.iva),
                    formatoMoneda(v.retenciones),
                    formatoMoneda(v.maniobra),
                    formatoMoneda(v.total),
                    v.comentarios ?? "-"
                ]),
                [
                    "TOTAL",
                    formatoMoneda(totalMonto),
                    formatoMoneda(totalIva),
                    formatoMoneda(totalRet),
                    formatoMoneda(totalManiobra),
                    formatoMoneda(totalGeneral),
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
                0: { cellWidth: 18, halign: "left" },  // Viaje
                1: { cellWidth: 32, halign: "left" },  // Monto
                2: { cellWidth: 32, halign: "left" },  // IVA
                3: { cellWidth: 32, halign: "left" },  // Ret.
                4: { cellWidth: 36, halign: "left" },  // Maniobra
                5: { cellWidth: 36, halign: "left" },  // Total
                6: { cellWidth: 65, halign: "left" }   // Comentarios
            },
            didParseCell: function (data) {
                if (data.row.index === viajes.length) {
                    data.cell.styles.fontStyle = "bold";
                    data.cell.styles.fillColor = [240, 240, 240];
                }
            }
        });

        const y = doc.lastAutoTable.finalY + 10;

        const pdfBlob = doc.output("blob");
        const pdfUrl = URL.createObjectURL(pdfBlob);

        window.open(pdfUrl, "_blank");

    } catch (error) {
        console.error(error);
        mensaje.textContent = "Error al conectar con el servidor.";
    }
}

function sum(lista, campo) {
    return lista.reduce((total, item) => total + Number(item[campo] || 0), 0);
}

function formatearFecha(fecha) {
    if (!fecha) return "-";
    return new Date(fecha).toLocaleDateString("es-MX");
}

function formatoMoneda(valor) {
    return Number(valor || 0).toLocaleString("es-MX", {
        style: "currency",
        currency: "MXN"
    });
}