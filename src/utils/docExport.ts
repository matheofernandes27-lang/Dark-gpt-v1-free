import { jsPDF } from 'jspdf';
import * as XLSX from 'xlsx';

/**
 * Clean markdown symbols for plain-text presentation
 */
function cleanMarkdown(md: string): string {
  return md
    .replace(/```[\s\S]*?```/g, (match) => {
      // Keep code content without markdown backticks
      return match.replace(/```[a-z]*\n?/gi, '').replace(/```/g, '');
    })
    .replace(/\*\*(.*?)\*\*/g, '$1')
    .replace(/\*(.*?)\*/g, '$1')
    .replace(/#{1,6}\s?/g, '')
    .replace(/\[(.*?)\]\(.*?\)/g, '$1');
}

/**
 * Export text / response to a clean PDF document
 */
export function exportToPdf(filename: string, title: string, content: string) {
  try {
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    });

    const pageWidth = doc.internal.pageSize.getWidth();
    const margin = 15;
    const maxLineWidth = pageWidth - margin * 2;

    // Header Background
    doc.setFillColor(15, 15, 15);
    doc.rect(0, 0, pageWidth, 26, 'F');

    // Title
    doc.setTextColor(239, 68, 68); // Red-500
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(14);
    doc.text('[x_x] DARK-GPT // RAPPORT D\'ANALYSE', margin, 12);

    doc.setFontSize(9);
    doc.setTextColor(180, 180, 180);
    doc.setFont('helvetica', 'normal');
    doc.text(`Auteur: M4TH4CK3R  |  Date: ${new Date().toLocaleString()}  |  Fichier: ${filename}.pdf`, margin, 20);

    // Body content
    doc.setFont('courier', 'normal');
    doc.setFontSize(10);
    doc.setTextColor(30, 30, 30);

    const lines = doc.splitTextToSize(content, maxLineWidth);
    let cursorY = 36;
    const pageHeight = doc.internal.pageSize.getHeight();

    for (let i = 0; i < lines.length; i++) {
      if (cursorY > pageHeight - 15) {
        doc.addPage();
        cursorY = 20;
      }
      doc.text(lines[i], margin, cursorY);
      cursorY += 5.5;
    }

    // Save
    doc.save(`${filename.replace(/[^a-z0-9_-]/gi, '_')}.pdf`);
  } catch (err) {
    console.error('PDF export error:', err);
    alert('Erreur lors de la génération du fichier PDF.');
  }
}

/**
 * Export structured data / response to an Excel spreadsheet (.xlsx)
 */
export function exportToExcel(filename: string, title: string, content: string) {
  try {
    const rawLines = content.split('\n');
    const tableData: Array<{ Ligne: number; Type: string; Contenu: string }> = [];

    rawLines.forEach((line, index) => {
      const trimmed = line.trim();
      if (!trimmed) return;

      let type = 'Texte';
      if (trimmed.startsWith('#') || trimmed.startsWith('[x_x]')) type = 'En-tête';
      else if (trimmed.startsWith('-') || trimmed.startsWith('*') || /^\d+\./.test(trimmed)) type = 'Point clé';
      else if (trimmed.startsWith('```') || trimmed.startsWith('nmap') || trimmed.startsWith('bash')) type = 'Code / Commande';

      tableData.push({
        Ligne: index + 1,
        Type: type,
        Contenu: cleanMarkdown(trimmed)
      });
    });

    const worksheet = XLSX.utils.json_to_sheet(tableData);

    // Auto column widths
    worksheet['!cols'] = [
      { wch: 8 },  // Ligne
      { wch: 15 }, // Type
      { wch: 90 }  // Contenu
    ];

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Analyse DARK-GPT');

    XLSX.writeFile(workbook, `${filename.replace(/[^a-z0-9_-]/gi, '_')}.xlsx`);
  } catch (err) {
    console.error('Excel export error:', err);
    alert('Erreur lors de la génération du fichier Excel.');
  }
}

/**
 * Export to MS Word compatible document (.docx / .doc)
 */
export function exportToDocx(filename: string, title: string, content: string) {
  try {
    const escapedContent = content
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/\n/g, '<br/>');

    const htmlContent = `
      <!DOCTYPE html>
      <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
      <head>
        <meta charset="utf-8">
        <title>${title}</title>
        <style>
          body { font-family: 'Consolas', 'Courier New', monospace; font-size: 11pt; color: #111; line-height: 1.5; padding: 20px; }
          .header { background: #000; color: #ef4444; padding: 15px; border-radius: 4px; font-weight: bold; margin-bottom: 20px; }
          .meta { color: #666; font-size: 9pt; margin-top: 5px; }
          .content { white-space: pre-wrap; background: #fafafa; padding: 15px; border: 1px solid #ddd; }
        </style>
      </head>
      <body>
        <div class="header">
          <div style="font-size: 14pt;">[x_x] DARK-GPT // ${title}</div>
          <div class="meta">Créateur: M4TH4CK3R | Date: ${new Date().toLocaleString()}</div>
        </div>
        <div class="content">${escapedContent}</div>
      </body>
      </html>
    `;

    const blob = new Blob(['\ufeff', htmlContent], {
      type: 'application/msword;charset=utf-8'
    });

    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${filename.replace(/[^a-z0-9_-]/gi, '_')}.doc`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  } catch (err) {
    console.error('Word export error:', err);
    alert('Erreur lors de la génération du document Word.');
  }
}

/**
 * Direct file download for source code or scripts (.py, .sh, .js, .txt)
 */
export function exportSourceCode(filename: string, code: string, extension = 'py') {
  try {
    const blob = new Blob([code], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${filename.replace(/[^a-z0-9_-]/gi, '_')}.${extension}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  } catch (err) {
    console.error('Source code download error:', err);
  }
}
