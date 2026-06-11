import * as XLSX from 'xlsx';

/**
 * Utilidad de Exportación a Excel y CSV asíncrona
 * Usa Web Workers para no bloquear la interfaz.
 * 
 * @param data Arreglo de objetos normalizados para las columnas
 * @param filename Nombre del archivo sin extensión
 * @returns Promesa que se resuelve cuando la descarga finaliza o inicia
 */
export const downloadExcel = (data: any[], filename: string): Promise<void> => {
    return new Promise((resolve) => {
        try {
            // Verificar si soportamos Workers y estamos en el cliente
            if (typeof window !== 'undefined' && window.Worker) {
                // Instanciar el Web Worker nativo de Next.js
                const worker = new Worker(new URL('../workers/excel.worker.ts', import.meta.url));

                worker.onmessage = (e) => {
                    if (e.data.success) {
                        // Crear un Blob a partir del ArrayBuffer
                        const blob = new Blob([e.data.buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
                        const url = URL.createObjectURL(blob);
                        
                        // Crear enlace temporal para descargar
                        const link = document.createElement("a");
                        link.href = url;
                        link.download = `${filename}.xlsx`;
                        document.body.appendChild(link);
                        link.click();
                        
                        // Limpieza
                        document.body.removeChild(link);
                        URL.revokeObjectURL(url);
                        worker.terminate();
                        resolve();
                    } else {
                        console.warn("Worker error:", e.data.error);
                        fallback(data, filename, worker);
                        resolve();
                    }
                };

                worker.onerror = (err) => {
                    console.warn("Worker execution error:", err);
                    fallback(data, filename, worker);
                    resolve();
                };

                // Iniciar el procesamiento en segundo plano
                worker.postMessage({ data });
            } else {
                // Fallback directo si no hay workers
                fallbackDirect(data, filename);
                resolve();
            }
        } catch (error) {
            console.warn("Fallo general al crear worker:", error);
            fallbackDirect(data, filename);
            resolve();
        }
    });
};

const fallback = (data: any[], filename: string, worker: Worker) => {
    worker.terminate();
    fallbackDirect(data, filename);
};

const fallbackDirect = (data: any[], filename: string) => {
    try {
        // Intento bloqueante clásico
        const worksheet = XLSX.utils.json_to_sheet(data);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Balance");
        XLSX.writeFile(workbook, `${filename}.xlsx`);
    } catch (e) {
        console.warn("Fallo exportación clásica, usando CSV", e);
        downloadCSVFallback(data, filename);
    }
}

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
