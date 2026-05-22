import * as XLSX from 'xlsx';

/**
 * Utilidad de Exportación a Excel y CSV
 * @param data Arreglo de objetos normalizados para las columnas
 * @param filename Nombre del archivo sin extensión
 */
export const downloadExcel = (data: any[], filename: string) => {
    try {
        // 1. Intentar exportar a Excel usando XLSX (SheetJS)
        const worksheet = XLSX.utils.json_to_sheet(data);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Balance");
        
        // Escribir y descargar
        XLSX.writeFile(workbook, `${filename}.xlsx`);
    } catch (error) {
        console.warn("Fallo la exportación a Excel, iniciando fallback a CSV:", error);
        downloadCSVFallback(data, filename);
    }
};

/**
 * Fallback a CSV en caso de que falle la librería o el entorno
 */
const downloadCSVFallback = (data: any[], filename: string) => {
    if (!data.length) return;

    // Obtener headers
    const headers = Object.keys(data[0]);
    const csvRows = [];

    // Header row
    csvRows.push(headers.join(','));

    // Data rows
    for (const row of data) {
        const values = headers.map(header => {
            const val = row[header];
            const escaped = ('' + val).replace(/"/g, '""');
            return `"${escaped}"`;
        });
        csvRows.push(values.join(','));
    }

    const csvContent = "data:text/csv;charset=utf-8," + csvRows.join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `${filename}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
};
