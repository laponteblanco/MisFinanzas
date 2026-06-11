import * as XLSX from 'xlsx';

// Definir evento de recepción en el worker
self.addEventListener('message', (event) => {
    try {
        const { data } = event.data;
        
        // 1. Convertir JSON a hoja
        const worksheet = XLSX.utils.json_to_sheet(data);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Balance");
        
        // 2. Generar ArrayBuffer (no podemos usar writeFile porque no hay DOM)
        const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
        
        // 3. Enviar buffer de vuelta al hilo principal
        self.postMessage({ success: true, buffer: excelBuffer });
    } catch (error: any) {
        self.postMessage({ success: false, error: error.message || 'Error en exportación' });
    }
});
