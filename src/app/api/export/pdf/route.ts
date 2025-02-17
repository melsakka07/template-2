import { NextResponse } from 'next/server';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

export async function POST(req: Request) {
  try {
    const data = await req.json();

    // Create PDF document
    const doc = new jsPDF();
    let yPos = 20;
    const pageWidth = doc.internal.pageSize.width;
    const margin = 20;
    const contentWidth = pageWidth - 2 * margin;

    // Helper function to add text with proper wrapping and spacing
    const addText = (text: string, fontSize: number, isBold: boolean = false, spacing: number = 10) => {
      doc.setFontSize(fontSize);
      if (isBold) doc.setFont("helvetica", 'bold');
      else doc.setFont("helvetica", 'normal');

      const lines = doc.splitTextToSize(text, contentWidth);
      
      // Check if we need a new page
      if (yPos + (lines.length * fontSize / 72 * 25.4) > doc.internal.pageSize.height - margin) {
        doc.addPage();
        yPos = margin;
      }

      doc.text(lines, margin, yPos);
      yPos += (lines.length * fontSize / 72 * 25.4) + spacing;
    };

    // Helper function to draw a simple bar chart
    const drawBarChart = (title: string, data: { label: string; value: number }[], maxValue: number) => {
      const chartWidth = contentWidth;
      const chartHeight = 60;
      const barSpacing = chartWidth / (data.length * 2);
      const barWidth = barSpacing * 0.8;

      // Add title
      addText(title, 12, true);
      yPos += 10;

      // Draw axes
      doc.setDrawColor(0);
      doc.setLineWidth(0.5);
      doc.line(margin, yPos, margin, yPos + chartHeight); // Y-axis
      doc.line(margin, yPos + chartHeight, margin + chartWidth, yPos + chartHeight); // X-axis

      // Draw bars
      data.forEach((item, index) => {
        const barHeight = (item.value / maxValue) * chartHeight;
        const x = margin + (index * barSpacing * 2) + barSpacing;
        const y = yPos + chartHeight - barHeight;

        // Draw bar
        doc.setFillColor(135, 206, 235); // Light blue
        doc.rect(x, y, barWidth, barHeight, 'F');

        // Add label
        doc.setFontSize(8);
        doc.text(item.label, x, yPos + chartHeight + 10, { align: 'center' });
        
        // Add value on top of bar
        const valueText = item.value.toLocaleString();
        doc.text(valueText, x + (barWidth/2), y - 2, { align: 'center' });
      });

      yPos += chartHeight + 30;
    };

    // Title
    addText('Business Case Report', 24, true, 15);

    // Executive Summary
    addText('Executive Summary', 16, true);
    addText(data.executiveSummary, 12, false, 15);

    // Financial Charts
    addText('Financial Charts', 16, true);
    addText('Note: For detailed interactive charts, please refer to the online version of this report.', 10, false, 15);

    // Revenue Chart
    const revenueData = data.financialProjections.map((proj: { year: number; revenue: number }) => ({
      label: `Year ${proj.year}`,
      value: proj.revenue
    }));
    const maxRevenue = Math.max(...revenueData.map((d: { value: number }) => d.value));
    drawBarChart('Revenue Growth', revenueData, maxRevenue);

    // Customer Growth Chart
    const customerData = data.financialProjections.map((proj: { year: number; customers: number }) => ({
      label: `Year ${proj.year}`,
      value: proj.customers
    }));
    const maxCustomers = Math.max(...customerData.map((d: { value: number }) => d.value));
    drawBarChart('Customer Growth', customerData, maxCustomers);

    // OPEX Chart
    const opexData = data.financialProjections.map((proj: { year: number; opex: number }) => ({
      label: `Year ${proj.year}`,
      value: proj.opex
    }));
    const maxOpex = Math.max(...opexData.map((d: { value: number }) => d.value));
    drawBarChart('Operating Expenses', opexData, maxOpex);

    // Add a new page after charts
    doc.addPage();
    yPos = margin;

    // Financial Projections
    addText('Financial Projections', 16, true);
    
    // Create table for financial projections
    (doc as any).autoTable({
      startY: yPos,
      head: [['Year', 'Revenue', 'Customers', 'OPEX']],
      body: data.financialProjections.map((proj: any) => [
        proj.year,
        `$${proj.revenue.toLocaleString()}`,
        proj.customers.toLocaleString(),
        `$${proj.opex.toLocaleString()}`
      ]),
      margin: { left: margin },
    });
    yPos = (doc as any).lastAutoTable.finalY + 15;

    // Market Analysis
    addText('Market Analysis', 16, true);
    addText('Market Size', 14, true);
    addText(data.marketAnalysis.marketSize, 12);
    addText('Competitive Analysis', 14, true);
    addText(data.marketAnalysis.competitiveAnalysis, 12);
    addText('Market Trends', 14, true);
    addText(data.marketAnalysis.marketTrends, 12);

    // Financial Analysis
    addText('Financial Analysis', 16, true);
    
    // Create table for financial metrics
    (doc as any).autoTable({
      startY: yPos,
      head: [['Metric', 'Value']],
      body: [
        ['NPV', `$${data.financialAnalysis.metrics.npv.toLocaleString()}`],
        ['IRR', `${data.financialAnalysis.metrics.irr}%`],
        ['ROI', `${data.financialAnalysis.metrics.roi}%`],
        ['Payback Period', `${data.financialAnalysis.metrics.paybackPeriod} years`]
      ],
      margin: { left: margin },
    });
    yPos = (doc as any).lastAutoTable.finalY + 10;
    
    addText(data.financialAnalysis.analysis, 12, false, 15);

    // Risk Assessment
    addText('Risk Assessment', 16, true);
    addText('Identified Risks', 14, true);
    addText(data.riskAssessment.risks, 12);
    addText('Impact Assessment', 14, true);
    addText(data.riskAssessment.impactAssessment, 12);
    addText('Mitigation Strategies', 14, true);
    addText(data.riskAssessment.mitigationStrategies, 12);

    // Implementation Timeline
    addText('Implementation Timeline', 16, true);
    
    // Add each phase
    data.implementationTimeline.phases.forEach((phase: any) => {
      addText(phase.phase, 14, true);
      addText(`Duration: ${phase.duration}`, 12);
      addText(`Key Activities: ${phase.keyActivities}`, 12);
      addText(`Deliverables: ${phase.deliverables}`, 12, false, 15);
    });

    addText('Critical Path', 14, true);
    addText(data.implementationTimeline.criticalPath, 12);
    addText('Key Milestones', 14, true);
    addText(data.implementationTimeline.keyMilestones, 12);

    // Recommendations
    addText('Recommendations', 16, true);
    addText('Strategic Recommendations', 14, true);
    addText(data.recommendations.strategic, 12);
    addText('Operational Recommendations', 14, true);
    addText(data.recommendations.operational, 12);
    addText('Financial Recommendations', 14, true);
    addText(data.recommendations.financial, 12);

    // Generate the PDF buffer
    const pdfBuffer = doc.output('arraybuffer');

    // Return the PDF as a downloadable file
    return new NextResponse(pdfBuffer, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': 'attachment; filename=business-case-report.pdf',
      },
    });
  } catch (error) {
    console.error('Error generating PDF:', error);
    return NextResponse.json({ error: 'Failed to generate PDF' }, { status: 500 });
  }
} 