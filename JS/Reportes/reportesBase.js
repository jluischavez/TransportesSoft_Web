function crearDocumentoBase(titulo, orientacion = "portrait") {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF({
        orientation: orientacion,
        unit: "mm",
        format: "letter"
    });

    const empresa = localStorage.getItem("empresaNombre") || "TransportesSoft";
    const fecha = new Date().toLocaleDateString("es-MX");

    doc.setFontSize(14);
    doc.text(empresa, 14, 14);

    doc.setFontSize(10);
    doc.text(titulo, 14, 21);
    doc.text(`Generado: ${fecha}`, 14, 27);

    return doc;
}