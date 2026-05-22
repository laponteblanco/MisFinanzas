import jsPDF from "jspdf";
import html2canvas from "html2canvas";

/**
 * Export Service - Executive Reporting
 * Generates professional PDF summaries for Pro users.
 */
export const ExportService = {
  /**
   * Generate a PDF report from the dashboard state/view
   */
  async generateExecutivePDF(title: string = "Reporte Ejecutivo MisFinanzas") {
    try {
      const element = document.getElementById("dashboard-main-content");
      if (!element) throw new Error("No se encontró el contenido del dashboard.");

      // 1. Capture the element (using a high scale for quality)
      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: "#0a0a0a", // Match dashboard bg
        windowWidth: 1200 // Ensure consistent width
      });

      const imgData = canvas.toDataURL("image/png");
      
      // 2. Setup jsPDF
      const pdf = new jsPDF({
        orientation: "portrait",
        unit: "pt",
        format: "a4"
      });

      const imgProps = pdf.getImageProperties(imgData);
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;

      // 3. Add PDF Header
      pdf.setFontSize(22);
      pdf.setTextColor(255, 255, 255);
      // Note: Header should be on top of a dark rect if we want it professional
      
      // 4. Add the Dashboard Image
      pdf.addImage(imgData, "PNG", 0, 0, pdfWidth, pdfHeight);

      // 5. Download
      const fileName = `${title.replace(/\s+/g, "_")}_${new Date().toISOString().split('T')[0]}.pdf`;
      pdf.save(fileName);

      return true;
    } catch (err) {
      console.error("PDF Export Error:", err);
      throw err;
    }
  }
};
