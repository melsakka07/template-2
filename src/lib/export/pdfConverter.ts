import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import { saveAs } from 'file-saver';

interface BusinessCaseData {
  executiveSummary: string;
  financialProjections: {
    year: number;
    revenue: number;
    customers: number;
    opex: number;
  }[];
  roiAnalysis: string;
  riskAssessment: string;
  implementationTimeline: string;
}

export async function generatePdf(data: BusinessCaseData): Promise<void> {
  const pdfDoc = await PDFDocument.create();
  const timesRomanFont = await pdfDoc.embedFont(StandardFonts.TimesRoman);
  const page = pdfDoc.addPage();
  const { width, height } = page.getSize();
  const fontSize = 12;
  const margin = 50;
  let y = height - margin;

  // Helper function to add text with line wrapping
  const addText = async (text: string, isTitle = false) => {
    const lines = [];
    let currentLine = '';
    const words = text.split(' ');
    const maxWidth = width - 2 * margin;

    for (const word of words) {
      const testLine = currentLine + (currentLine ? ' ' : '') + word;
      const lineWidth = timesRomanFont.widthOfTextAtSize(testLine, fontSize);

      if (lineWidth > maxWidth) {
        lines.push(currentLine);
        currentLine = word;
      } else {
        currentLine = testLine;
      }
    }
    if (currentLine) {
      lines.push(currentLine);
    }

    for (const line of lines) {
      if (y < margin + fontSize) {
        y = height - margin;
        page.addPage();
      }
      page.drawText(line, {
        x: margin,
        y,
        size: isTitle ? fontSize * 1.5 : fontSize,
        font: timesRomanFont,
        color: rgb(0, 0, 0),
      });
      y -= fontSize * 1.5;
    }
    y -= fontSize; // Add extra space after paragraph
  };

  // Title
  await addText('Business Case Report', true);
  y -= fontSize;

  // Executive Summary
  await addText('Executive Summary', true);
  await addText(data.executiveSummary);
  y -= fontSize;

  // Financial Projections
  await addText('Financial Projections', true);
  for (const projection of data.financialProjections) {
    await addText(
      `Year ${projection.year}: Revenue $${projection.revenue.toLocaleString()}, ` +
        `Customers: ${projection.customers.toLocaleString()}, ` +
        `OPEX: $${projection.opex.toLocaleString()}`
    );
  }
  y -= fontSize;

  // ROI Analysis
  await addText('ROI Analysis', true);
  await addText(data.roiAnalysis);
  y -= fontSize;

  // Risk Assessment
  await addText('Risk Assessment', true);
  await addText(data.riskAssessment);
  y -= fontSize;

  // Implementation Timeline
  await addText('Implementation Timeline', true);
  await addText(data.implementationTimeline);

  const pdfBytes = await pdfDoc.save();
  const blob = new Blob([pdfBytes], { type: 'application/pdf' });
  saveAs(blob, 'business-case-report.pdf');
} 