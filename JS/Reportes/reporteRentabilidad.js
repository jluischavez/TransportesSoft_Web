document.addEventListener("DOMContentLoaded", async () => {
    if (typeof inicializarNavbar === "function") {
        inicializarNavbar();
    }

    inicializarFechasReporteRentabilidad();

    await Promise.all([
        cargarUnidadesReporteRentabilidad(),
        cargarClientesReporteRentabilidad()
    ]);

    const btnGenerar = document.getElementById("btnGenerarReporteRentabilidad");

    if (btnGenerar) {
        btnGenerar.addEventListener("click", generarReporteRentabilidad);
    }
});

function inicializarFechasReporteRentabilidad() {
    const fechaFin = new Date();
    const fechaInicio = new Date(fechaFin.getFullYear(), fechaFin.getMonth(), 1);

    document.getElementById("reporteRentabilidadFechaInicio").value =
        fechaInput(fechaInicio);

    document.getElementById("reporteRentabilidadFechaFin").value =
        fechaInput(fechaFin);
}

async function cargarUnidadesReporteRentabilidad() {
    const select = document.getElementById("reporteRentabilidadUnidad");

    try {
        const response = await fetch(apiUrl("/ContUnidadesCat"), {
            headers: crearHeadersReporte()
        });

        if (!response.ok) {
            return;
        }

        const unidades = await response.json();

        unidades
            .sort((a, b) => Number(a.id_Unidad) - Number(b.id_Unidad))
            .forEach(unidad => {
                const option = document.createElement("option");
                option.value = unidad.id_Unidad;
                option.textContent = `${unidad.id_Unidad} - ${unidad.marca ?? ""} | ${unidad.serie ?? ""}`;
                select.appendChild(option);
            });
    } catch (error) {
        console.error("No se pudieron cargar las unidades:", error);
    }
}

async function cargarClientesReporteRentabilidad() {
    const select = document.getElementById("reporteRentabilidadCliente");

    try {
        const response = await fetch(apiUrl("/ContClientesCat"), {
            headers: crearHeadersReporte()
        });

        if (!response.ok) {
            return;
        }

        const clientes = await response.json();

        clientes
            .sort((a, b) => (a.nombre ?? "").localeCompare(b.nombre ?? "", "es-MX"))
            .forEach(cliente => {
                const option = document.createElement("option");
                option.value = cliente.id_Client;
                option.textContent = cliente.nombre ?? `Cliente ${cliente.id_Client}`;
                select.appendChild(option);
            });
    } catch (error) {
        console.error("No se pudieron cargar los clientes:", error);
    }
}

async function generarReporteRentabilidad() {
    const mensaje = document.getElementById("mensajeReporteRentabilidad");
    const boton = document.getElementById("btnGenerarReporteRentabilidad");

    mensaje.textContent = "";

    const fechaInicio = document.getElementById("reporteRentabilidadFechaInicio").value;
    const fechaFin = document.getElementById("reporteRentabilidadFechaFin").value;
    const idUnidad = document.getElementById("reporteRentabilidadUnidad").value;
    const idCliente = document.getElementById("reporteRentabilidadCliente").value;
    const incluirDiesel = document.getElementById("reporteIncluirDiesel").checked;
    const incluirMantenimientos = document.getElementById("reporteIncluirMantenimientos").checked;

    if (!fechaInicio || !fechaFin) {
        mensaje.textContent = "Selecciona la fecha inicial y la fecha final.";
        return;
    }

    if (fechaInicio > fechaFin) {
        mensaje.textContent = "La fecha inicial no puede ser mayor que la fecha final.";
        return;
    }

    if (!incluirDiesel && !incluirMantenimientos) {
        mensaje.textContent = "Selecciona al menos un tipo de gasto.";
        return;
    }

    boton.disabled = true;
    boton.textContent = "Generando reporte...";
    mensaje.textContent = "Consultando información...";

    try {
        const params = new URLSearchParams({
            fechaInicio,
            fechaFin,
            incluirDiesel: String(incluirDiesel),
            incluirMantenimientos: String(incluirMantenimientos)
        });

        if (idUnidad) {
            params.append("idUnidad", idUnidad);
        }

        if (idCliente) {
            params.append("idCliente", idCliente);
        }

        const response = await fetch(
            apiUrl(`/Reportes/rentabilidad-operativa?${params.toString()}`),
            {
                headers: crearHeadersReporte()
            }
        );

        if (response.status === 401) {
            localStorage.clear();
            window.location.href = "index.html";
            return;
        }

        if (!response.ok) {
            const error = await obtenerMensajeErrorReporte(response);
            mensaje.textContent = error || "No se pudo generar el reporte.";
            return;
        }

        const data = await response.json();

        crearPdfRentabilidad(data);
        mensaje.textContent = "Reporte generado correctamente.";
    } catch (error) {
        console.error("Error al generar reporte de rentabilidad:", error);
        mensaje.textContent = "Error al conectar con el servidor.";
    } finally {
        boton.disabled = false;
        boton.textContent = "Generar reporte PDF";
    }
}

function crearPdfRentabilidad(data) {
    const doc = crearDocumentoBase("Reporte de rentabilidad operativa", "landscape");
    const resumen = data.resumen ?? {};
    const filtros = data.filtros ?? {};
    const periodo = data.periodo ?? {};

    const anchoPagina = doc.internal.pageSize.getWidth();
    const margen = 14;

    doc.setFontSize(8);
    doc.setTextColor(80, 88, 102);
    doc.text(
        `Periodo: ${formatearFechaReporte(periodo.fechaInicio)} al ${formatearFechaReporte(periodo.fechaFin)}`,
        margen,
        33
    );
    doc.text(`Unidad: ${filtros.unidad ?? "Todas"}`, margen, 38);
    doc.text(`Cliente: ${filtros.cliente ?? "Todos"}`, margen, 43);

    const gastosIncluidos = [
        filtros.incluirDiesel ? "Diésel" : null,
        filtros.incluirMantenimientos ? "Mantenimientos" : null
    ].filter(Boolean).join(" + ");

    doc.text(`Gastos incluidos: ${gastosIncluidos || "Ninguno"}`, margen, 48);

    dibujarIndicadoresRentabilidad(doc, resumen, 54, anchoPagina, margen);

    let siguienteY = 82;

    doc.autoTable({
        startY: siguienteY,
        margin: { left: margen, right: margen },
        head: [[
            "Viajes",
            "Unidades",
            "Clientes",
            "Ingreso promedio/viaje",
            "Utilidad promedio/viaje"
        ]],
        body: [[
            numeroReporte(resumen.viajesRealizados),
            numeroReporte(resumen.unidadesConMovimiento),
            numeroReporte(resumen.clientesAtendidos),
            monedaReporte(resumen.ingresoPromedioPorViaje),
            monedaReporte(resumen.utilidadPromedioPorViaje)
        ]],
        styles: { fontSize: 8, cellPadding: 2.2, halign: "center" },
        headStyles: { fillColor: [31, 43, 62] }
    });

    siguienteY = doc.lastAutoTable.finalY + 6;

    doc.autoTable({
        startY: siguienteY,
        margin: { left: margen, right: margen },
        head: [["Concepto", "Importe", "Participación"]],
        body: [
            ["Ingresos por viajes", monedaReporte(resumen.ingresos), "100.00%"],
            [
                "Diésel",
                monedaReporte(resumen.gastosDiesel),
                porcentajeReporte(calcularParticipacion(resumen.gastosDiesel, resumen.ingresos))
            ],
            [
                "Mantenimiento de unidades",
                monedaReporte(resumen.gastosMantenimientoUnidades),
                porcentajeReporte(calcularParticipacion(
                    resumen.gastosMantenimientoUnidades,
                    resumen.ingresos
                ))
            ],
            [
                "Mantenimiento de remolques",
                monedaReporte(resumen.gastosMantenimientoRemolques),
                porcentajeReporte(calcularParticipacion(
                    resumen.gastosMantenimientoRemolques,
                    resumen.ingresos
                ))
            ],
            [
                "Mantenimientos totales",
                monedaReporte(resumen.gastosMantenimiento),
                porcentajeReporte(calcularParticipacion(
                    resumen.gastosMantenimiento,
                    resumen.ingresos
                ))
            ],
            [
                "Gastos totales",
                monedaReporte(resumen.gastosTotales),
                porcentajeReporte(calcularParticipacion(resumen.gastosTotales, resumen.ingresos))
            ],
            [
                "Utilidad estimada",
                monedaReporte(resumen.utilidadEstimada),
                porcentajeReporte(resumen.margenUtilidadPorcentaje)
            ]
        ],
        headStyles: { fillColor: [232, 117, 34] },
        styles: {
            fontSize: 8,
            cellPadding: 2,
            halign: "left"
        },
        didParseCell: dataCell => {
            if (dataCell.section === "body" && dataCell.row.index === 6) {
                dataCell.cell.styles.fontStyle = "bold";
                dataCell.cell.styles.fillColor = [242, 246, 250];
            }
        }
    });

    
    const unidades = (data.rentabilidadPorUnidad ?? [])
    .filter(unidad => Number(unidad.idUnidad) > 0);

    const remolques = (data.mantenimientosPorRemolque ?? [])
        .filter(remolque => Number(remolque.idRemolque) > 0);

    agregarDestacadosRentabilidad(doc, {
        ...data,
        unidadMayorGasto:
            Number(data.unidadMayorGasto?.idUnidad) > 0
                ? data.unidadMayorGasto
                : null,
        remolqueMayorGasto:
            Number(data.remolqueMayorGasto?.idRemolque) > 0
                ? data.remolqueMayorGasto
                : null
    }, margen);

    agregarTablaUnidadesRentabilidad(doc, unidades, margen);
    agregarTablaRemolquesRentabilidad(doc, remolques, margen);
    agregarTablaClientesRentabilidad(
        doc,
        data.facturacionPorCliente ?? [],
        margen
    );

    agregarNotaRentabilidad(
    doc,
    data.notaCalculoGastos,
    margen,
    anchoPagina
    );

    agregarPaginacionReporte(doc);

    const nombreArchivo = `rentabilidad_${fechaArchivo(periodo.fechaInicio)}_${fechaArchivo(periodo.fechaFin)}.pdf`;
    const pdfBlob = doc.output("blob");
    const pdfUrl = URL.createObjectURL(pdfBlob);

    const ventana = window.open(pdfUrl, "_blank");

    if (!ventana) {
        doc.save(nombreArchivo);
    }

    setTimeout(() => URL.revokeObjectURL(pdfUrl), 60000);
}

function dibujarIndicadoresRentabilidad(doc, resumen, y, anchoPagina, margen) {
    const gap = 4;
    const cantidad = 5;
    const anchoDisponible = anchoPagina - margen * 2;
    const anchoTarjeta = (anchoDisponible - gap * (cantidad - 1)) / cantidad;

    const indicadores = [
        ["INGRESOS", monedaReporte(resumen.ingresos)],
        ["GASTOS", monedaReporte(resumen.gastosTotales)],
        ["UTILIDAD", monedaReporte(resumen.utilidadEstimada)],
        ["MARGEN", porcentajeReporte(resumen.margenUtilidadPorcentaje)],
        ["VIAJES", numeroReporte(resumen.viajesRealizados)]
    ];

    indicadores.forEach((indicador, indice) => {
        const x = margen + indice * (anchoTarjeta + gap);

        doc.setFillColor(247, 249, 252);
        doc.setDrawColor(224, 229, 237);
        doc.roundedRect(x, y, anchoTarjeta, 21, 2, 2, "FD");

        doc.setTextColor(104, 113, 130);
        doc.setFontSize(7);
        doc.text(indicador[0], x + 4, y + 6);

        doc.setTextColor(31, 43, 62);
        doc.setFontSize(11);
        doc.setFont(undefined, "bold");
        doc.text(indicador[1], x + 4, y + 15);
        doc.setFont(undefined, "normal");
    });
}

function agregarDestacadosRentabilidad(doc, data, margen) {
    const cliente = data.clienteMayorFacturacion;
    const unidad = data.unidadMayorGasto;
    const remolque = data.remolqueMayorGasto;

    if (!cliente && !unidad && !remolque) {
        return;
    }

    const body = [];

    if (cliente) {
        body.push([
            "Cliente con mayor facturación",
            cliente.nombreCliente ?? "-",
            `${numeroReporte(cliente.viajes)} viajes`,
            monedaReporte(cliente.totalFacturado)
        ]);
    }

    if (unidad && Number(unidad.idUnidad) > 0) {
    body.push([
        "Unidad con mayor gasto",
        unidad.unidad ?? `Unidad ${unidad.idUnidad}`,
        `Diésel ${monedaReporte(unidad.gastoDiesel)} | `
            + `Mantto. unidad ${monedaReporte(
                unidad.gastoMantenimientoUnidad
            )}`,
        monedaReporte(unidad.gastoTotal)
    ]);
    }

    if (remolque) {
        body.push([
            "Remolque con mayor mantenimiento",
            remolque.remolque ?? `Remolque ${remolque.idRemolque}`,
            "Mantenimiento registrado en el periodo",
            monedaReporte(remolque.gastoMantenimiento)
        ]);
    }

    doc.autoTable({
        startY: doc.lastAutoTable.finalY + 6,
        margin: { left: margen, right: margen },
        head: [["Indicador", "Elemento", "Detalle", "Total"]],
        body,
        styles: { fontSize: 8, cellPadding: 2 },
        headStyles: { fillColor: [31, 43, 62] },
        styles: {
            fontSize: 8,
            cellPadding: 2,
            halign: "left"
        }
    });
}

function agregarTablaUnidadesRentabilidad(doc, unidades, margen) {
    const unidadesValidas = (unidades ?? [])
        .filter(unidad => Number(unidad.idUnidad) > 0);

    doc.autoTable({
        startY: doc.lastAutoTable.finalY + 7,
        margin: { left: margen, right: margen },

        head: [[
            "Unidad",
            "Viajes",
            "Ingresos",
            "Diésel",
            "Mantto. unidad",
            "Gasto total",
            "Utilidad",
            "Margen"
        ]],

        body: unidadesValidas.length > 0
            ? unidadesValidas.map(unidad => [
                unidad.unidad
                    ?? `Unidad ${unidad.idUnidad}`,

                numeroReporte(unidad.viajes),
                monedaReporte(unidad.ingreso),
                monedaReporte(unidad.gastoDiesel),

                monedaReporte(
                    unidad.gastoMantenimientoUnidad
                ),

                monedaReporte(unidad.gastoTotal),
                monedaReporte(unidad.utilidad),

                porcentajeReporte(
                    unidad.margenUtilidadPorcentaje
                )
            ])
            : [[
                "Sin movimientos",
                "",
                "",
                "",
                "",
                "",
                "",
                ""
            ]],

        styles: {
            fontSize: 7,
            cellPadding: 1.6,
            overflow: "linebreak",
            halign: "left"
        },

        headStyles: {
            fillColor: [232, 117, 34],
            halign: "left"
        }
    });
}

function agregarTablaRemolquesRentabilidad(doc, remolques, margen) {
    const remolquesValidos = (remolques ?? [])
        .filter(remolque => Number(remolque.idRemolque) > 0);

    doc.autoTable({
        startY: doc.lastAutoTable.finalY + 7,
        margin: { left: margen, right: margen },

        head: [[
            "Remolque",
            "Mantenimiento del periodo"
        ]],

        body: remolquesValidos.length > 0
            ? remolquesValidos.map(remolque => [
                remolque.remolque
                    ?? `Remolque ${remolque.idRemolque}`,

                monedaReporte(
                    remolque.gastoMantenimiento
                )
            ])
            : [[
                "Sin mantenimientos de remolques",
                ""
            ]],

        styles: {
            fontSize: 7.5,
            cellPadding: 1.8,
            halign: "left"
        },

        headStyles: {
            fillColor: [67, 83, 111],
            halign: "left"
        }
    });
}

function agregarTablaClientesRentabilidad(doc, clientes, margen) {
    doc.autoTable({
        startY: doc.lastAutoTable.finalY + 7,
        margin: { left: margen, right: margen },
        head: [["Cliente", "Viajes", "Facturación", "Participación"]],
        body: clientes.length > 0
            ? clientes.map(c => [
                c.nombreCliente ?? `Cliente ${c.idCliente}`,
                numeroReporte(c.viajes),
                monedaReporte(c.totalFacturado),
                porcentajeReporte(c.participacionPorcentaje)
            ])
            : [["Sin viajes", "", "", ""]],
        styles: {
            fontSize: 7.5,
            cellPadding: 1.8,
            halign: "left"
        },
        headStyles: {
            fillColor: [31, 43, 62],
            halign: "left"
        }
        
    });
}

function agregarNotaRentabilidad(doc, nota, margen, anchoPagina) {
    if (!nota) {
        return;
    }

    let y = doc.lastAutoTable.finalY + 8;
    const lineas = doc.splitTextToSize(nota, anchoPagina - margen * 2);
    const altura = lineas.length * 4 + 8;
    const altoPagina = doc.internal.pageSize.getHeight();

    if (y + altura > altoPagina - 14) {
        doc.addPage();
        y = 18;
    }

    doc.setFillColor(255, 248, 242);
    doc.setDrawColor(232, 117, 34);
    doc.roundedRect(margen, y, anchoPagina - margen * 2, altura, 2, 2, "FD");

    doc.setFontSize(7.5);
    doc.setTextColor(109, 70, 42);
    doc.text(lineas, margen + 4, y + 6);
}

function agregarPaginacionReporte(doc) {
    const paginas = doc.internal.getNumberOfPages();

    for (let pagina = 1; pagina <= paginas; pagina++) {
        doc.setPage(pagina);
        const ancho = doc.internal.pageSize.getWidth();
        const alto = doc.internal.pageSize.getHeight();

        doc.setFontSize(7);
        doc.setTextColor(120, 128, 142);
        doc.text("TransportesSoft", 14, alto - 7);
        doc.text(`Página ${pagina} de ${paginas}`, ancho - 14, alto - 7, {
            align: "right"
        });
    }
}

function crearHeadersReporte() {
    return {
        "Authorization": `Bearer ${localStorage.getItem("token")}`
    };
}

async function obtenerMensajeErrorReporte(response) {
    try {
        const data = await response.json();
        return data.mensaje ?? null;
    } catch {
        return null;
    }
}

function fechaInput(fecha) {
    const anio = fecha.getFullYear();
    const mes = String(fecha.getMonth() + 1).padStart(2, "0");
    const dia = String(fecha.getDate()).padStart(2, "0");
    return `${anio}-${mes}-${dia}`;
}

function formatearFechaReporte(fecha) {
    if (!fecha) return "-";

    return new Date(`${fecha.substring(0, 10)}T00:00:00`)
        .toLocaleDateString("es-MX");
}

function fechaArchivo(fecha) {
    return fecha?.substring(0, 10) ?? "sin_fecha";
}

function monedaReporte(valor) {
    return Number(valor ?? 0).toLocaleString("es-MX", {
        style: "currency",
        currency: "MXN",
        minimumFractionDigits: 2
    });
}

function porcentajeReporte(valor) {
    return `${Number(valor ?? 0).toLocaleString("es-MX", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    })}%`;
}

function numeroReporte(valor) {
    return Number(valor ?? 0).toLocaleString("es-MX");
}

function calcularParticipacion(valor, total) {
    const totalNumero = Number(total ?? 0);

    if (totalNumero === 0) {
        return 0;
    }

    return Number(valor ?? 0) / totalNumero * 100;
}
