import { PDFDocument, rgb, StandardFonts, PageSizes, PDFPage, PDFFont, RGB } from 'pdf-lib';
import { saveAs } from 'file-saver';

interface BusinessCaseData {
  projectName: string;
  company: string;
  executiveSummary: string;
  financialProjections: {
    year: number;
    revenue: number;
    customers: number;
    opex: number;
  }[];
  marketAnalysis: {
    marketSize: string;
    competitiveAnalysis: string;
    marketTrends: string;
    growthOpportunities: string;
    entryBarriers: string;
  };
  financialAnalysis: {
    metrics: {
      npv: number;
      irr: number;
      paybackPeriod: number;
      roi: number;
    };
    analysis: string;
  };
  riskAssessment: {
    risks: string;
    impactAssessment: string;
    mitigationStrategies: string;
    contingencyPlans: string;
    riskMonitoringApproach: string;
  };
  implementationTimeline: {
    phases: {
      phase: string;
      duration: string;
      keyActivities: string;
      deliverables: string;
    }[];
    criticalPath: string;
    keyMilestones: string;
  };
  recommendations: {
    strategic: string;
    operational: string;
    financial: string;
  };
}

function formatCurrency(value: number): string {
  return value >= 1000000
    ? `$${(value / 1000000).toFixed(1)}M`
    : `$${value.toLocaleString()}`;
}

export async function generatePdf(data: BusinessCaseData): Promise<void> {
  const pdfDoc = await PDFDocument.create();
  const helveticaFont = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const helveticaBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  // Helper function to create a new page
  const createPage = () => {
    const page = pdfDoc.addPage(PageSizes.A4);
    const { width, height } = page.getSize();
    return { page, width, height };
  };

  // Helper function to add text with proper wrapping and spacing
  const addText = (page: PDFPage, text: string, { 
    x, 
    y, 
    size = 12,
    font = helveticaFont,
    color = rgb(0, 0, 0),
    maxWidth = page.getSize().width - 100,
    lineHeight = 1.5
  }: {
    x: number;
    y: number;
    size?: number;
    font?: PDFFont;
    color?: RGB;
    maxWidth?: number;
    lineHeight?: number;
  }) => {
    const words = text.split(' ');
    let currentLine = '';
    let yOffset = y;
    
    for (const word of words) {
      const testLine = currentLine + (currentLine ? ' ' : '') + word;
      const lineWidth = font.widthOfTextAtSize(testLine, size);

      if (lineWidth > maxWidth) {
        page.drawText(currentLine, { x, y: yOffset, size, font, color });
        yOffset -= size * lineHeight;
        currentLine = word;
      } else {
        currentLine = testLine;
      }
    }
    
    if (currentLine) {
      page.drawText(currentLine, { x, y: yOffset, size, font, color });
      yOffset -= size * lineHeight;
    }

    return yOffset;
  };

  // Helper function to add a section title
  const addSectionTitle = (page: any, text: string, y: number) => {
    page.drawText(text, {
      x: 50,
      y,
      size: 18,
      font: helveticaBold,
      color: rgb(0, 0, 0),
    });
    return y - 30;
  };

  // Helper function to add a subsection title
  const addSubsectionTitle = (page: any, text: string, y: number) => {
    page.drawText(text, {
      x: 50,
      y,
      size: 14,
      font: helveticaBold,
      color: rgb(0, 0, 0),
    });
    return y - 25;
  };

  // Cover Page
  let { page, height } = createPage();
  let y = height - 150;

  page.drawText('Business Case Report', {
    x: 50,
    y: y,
    size: 24,
    font: helveticaBold,
    color: rgb(0, 0, 0),
  });

  y -= 50;
  page.drawText(data.projectName, {
    x: 50,
    y,
    size: 18,
    font: helveticaBold,
    color: rgb(0, 0, 0),
  });

  y -= 30;
  page.drawText(data.company, {
    x: 50,
    y,
    size: 14,
    font: helveticaFont,
    color: rgb(0, 0, 0),
  });

  // Executive Summary
  ({ page, height } = createPage());
  y = height - 50;
  
  y = addSectionTitle(page, 'Executive Summary', y);
  y = addText(page, data.executiveSummary, { x: 50, y: y - 20 });

  // Financial Analysis
  ({ page, height } = createPage());
  y = height - 50;
  
  y = addSectionTitle(page, 'Financial Analysis', y);
  y -= 40;

  // Financial Metrics Table
  const metrics = [
    ['Metric', 'Value'],
    ['Net Present Value (NPV)', formatCurrency(data.financialAnalysis.metrics.npv)],
    ['Internal Rate of Return (IRR)', `${data.financialAnalysis.metrics.irr}%`],
    ['Return on Investment (ROI)', `${data.financialAnalysis.metrics.roi}%`],
    ['Payback Period', `${data.financialAnalysis.metrics.paybackPeriod} years`],
  ];

  const columnWidth = 200;
  metrics.forEach((row, index) => {
    const isHeader = index === 0;
    const font = isHeader ? helveticaBold : helveticaFont;
    page.drawText(row[0], { x: 50, y, size: 12, font });
    page.drawText(row[1], { x: 50 + columnWidth, y, size: 12, font });
    y -= 25;
  });

  y -= 20;
  y = addSubsectionTitle(page, 'Financial Projections', y);
  y -= 20;

  // Financial Projections Table
  const tableHeaders = ['Year', 'Revenue', 'Customers', 'OPEX'];
  const columnWidths = [80, 120, 120, 120];
  let xOffset = 50;

  // Draw headers
  tableHeaders.forEach((header, index) => {
    page.drawText(header, {
      x: xOffset,
      y,
      size: 12,
      font: helveticaBold,
    });
    xOffset += columnWidths[index];
  });

  y -= 20;

  // Draw data rows
  data.financialProjections.forEach((proj) => {
    xOffset = 50;
    page.drawText(proj.year.toString(), {
      x: xOffset,
      y,
      size: 12,
      font: helveticaFont,
    });
    xOffset += columnWidths[0];

    page.drawText(formatCurrency(proj.revenue), {
      x: xOffset,
      y,
      size: 12,
      font: helveticaFont,
    });
    xOffset += columnWidths[1];

    page.drawText(proj.customers.toLocaleString(), {
      x: xOffset,
      y,
      size: 12,
      font: helveticaFont,
    });
    xOffset += columnWidths[2];

    page.drawText(formatCurrency(proj.opex), {
      x: xOffset,
      y,
      size: 12,
      font: helveticaFont,
    });

    y -= 20;
  });

  // Financial Calculations
  ({ page, height } = createPage());
  y = height - 50;
  
  y = addSectionTitle(page, 'Financial Calculations', y);
  y -= 40;

  const calculations = [
    {
      metric: 'Annual Revenue',
      formula: 'Customers × ARPU × 12',
      description: 'Monthly ARPU converted to annual revenue'
    },
    {
      metric: 'Customer Growth',
      formula: 'Initial Count × (1 + Growth Rate)^Year',
      description: 'Compound annual growth rate applied to customer base'
    },
    {
      metric: 'OPEX Growth',
      formula: 'Initial OPEX × (1.1)^Year',
      description: '10% annual increase in operating expenses'
    },
    {
      metric: 'Net Present Value (NPV)',
      formula: 'Σ (Cash Flow / (1 + r)^t) - Initial Investment',
      description: 'Sum of discounted cash flows minus initial investment, using 10% discount rate'
    },
    {
      metric: 'ROI',
      formula: '((Total Revenue - Total Costs) / Total Investment) × 100',
      description: 'Percentage return on total investment'
    },
    {
      metric: 'IRR',
      formula: '((Total Revenue - Total Costs) / (Investment × Years)) × 100',
      description: 'Simplified internal rate of return calculation'
    },
    {
      metric: 'Payback Period',
      formula: 'First year where Cumulative Cash Flow > 0',
      description: 'Time required to recover the initial investment'
    }
  ];

  // Draw table headers
  const calcHeaders = ['Metric', 'Formula', 'Description'];
  const calcColumnWidths = [150, 200, 200];
  xOffset = 50;

  calcHeaders.forEach((header, index) => {
    page.drawText(header, {
      x: xOffset,
      y,
      size: 12,
      font: helveticaBold,
    });
    xOffset += calcColumnWidths[index];
  });

  y -= 20;

  // Draw calculation rows
  calculations.forEach((calc) => {
    // Check if we need a new page
    if (y < 100) {
      ({ page, height } = createPage());
      y = height - 50;
      
      // Redraw headers on new page
      xOffset = 50;
      calcHeaders.forEach((header, index) => {
        page.drawText(header, {
          x: xOffset,
          y,
          size: 12,
          font: helveticaBold,
        });
        xOffset += calcColumnWidths[index];
      });
      y -= 20;
    }

    xOffset = 50;
    
    // Metric
    page.drawText(calc.metric, {
      x: xOffset,
      y,
      size: 12,
      font: helveticaFont,
    });
    xOffset += calcColumnWidths[0];

    // Formula
    page.drawText(calc.formula, {
      x: xOffset,
      y,
      size: 12,
      font: helveticaFont,
    });
    xOffset += calcColumnWidths[1];

    // Description
    y = addText(page, calc.description, { 
      x: xOffset, 
      y, 
      size: 12,
      maxWidth: calcColumnWidths[2] - 20 
    });

    y -= 30; // Extra spacing between rows
  });

  // Market Analysis
  ({ page, height } = createPage());
  y = height - 50;
  
  y = addSectionTitle(page, 'Market Analysis', y);
  
  y = addSubsectionTitle(page, 'Market Size and Potential', y - 20);
  y = addText(page, data.marketAnalysis.marketSize, { x: 50, y: y - 20 });
  
  y = addSubsectionTitle(page, 'Competitive Analysis', y - 20);
  y = addText(page, data.marketAnalysis.competitiveAnalysis, { x: 50, y: y - 20 });
  
  y = addSubsectionTitle(page, 'Market Trends', y - 20);
  y = addText(page, data.marketAnalysis.marketTrends, { x: 50, y: y - 20 });

  // Risk Assessment
  ({ page, height } = createPage());
  y = height - 50;
  
  y = addSectionTitle(page, 'Risk Assessment', y);
  
  y = addSubsectionTitle(page, 'Identified Risks', y - 20);
  y = addText(page, data.riskAssessment.risks, { x: 50, y: y - 20 });
  
  y = addSubsectionTitle(page, 'Impact Assessment', y - 20);
  y = addText(page, data.riskAssessment.impactAssessment, { x: 50, y: y - 20 });

  // Implementation Timeline
  ({ page, height } = createPage());
  y = height - 50;
  
  y = addSectionTitle(page, 'Implementation Timeline', y);
  y -= 40;

  data.implementationTimeline.phases.forEach((phase) => {
    y = addSubsectionTitle(page, phase.phase, y);
    y -= 20;
    
    page.drawText(`Duration: ${phase.duration}`, {
      x: 70,
      y,
      size: 12,
      font: helveticaFont,
    });
    y -= 20;
    
    y = addText(page, `Key Activities: ${phase.keyActivities}`, { x: 70, y });
    y -= 20;
    
    y = addText(page, `Deliverables: ${phase.deliverables}`, { x: 70, y });
    y -= 30;
  });

  // Recommendations
  ({ page, height } = createPage());
  y = height - 50;
  
  y = addSectionTitle(page, 'Recommendations', y);
  
  y = addSubsectionTitle(page, 'Strategic Recommendations', y - 20);
  y = addText(page, data.recommendations.strategic, { x: 50, y: y - 20 });
  
  y = addSubsectionTitle(page, 'Operational Recommendations', y - 20);
  y = addText(page, data.recommendations.operational, { x: 50, y: y - 20 });
  
  y = addSubsectionTitle(page, 'Financial Recommendations', y - 20);
  y = addText(page, data.recommendations.financial, { x: 50, y: y - 20 });

  // Generate and save the PDF
  const pdfBytes = await pdfDoc.save();
  const blob = new Blob([pdfBytes], { type: 'application/pdf' });
  saveAs(blob, 'business-case-report.pdf');
} 