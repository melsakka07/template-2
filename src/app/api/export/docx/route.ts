import { NextResponse } from 'next/server';
import { Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell, BorderStyle, HeadingLevel } from 'docx';

export async function POST(req: Request) {
  try {
    const data = await req.json();

    // Create document
    const doc = new Document({
      sections: [{
        properties: {},
        children: [
          // Title
          new Paragraph({
            children: [new TextRun({ text: "Business Case Report", bold: true, size: 32 })],
            spacing: { after: 400 },
          }),

          // Executive Summary
          new Paragraph({
            text: "Executive Summary",
            heading: HeadingLevel.HEADING_1,
            spacing: { after: 200 },
          }),
          new Paragraph({
            text: data.executiveSummary,
            spacing: { after: 400 },
          }),

          // Financial Projections
          new Paragraph({
            text: "Financial Charts",
            heading: HeadingLevel.HEADING_1,
            spacing: { after: 200 },
          }),
          new Paragraph({
            children: [
              new TextRun({
                text: "Note: For detailed interactive charts, please refer to the online version of this report.",
                italics: true,
              }),
            ],
            spacing: { after: 200 },
          }),
          new Paragraph({
            text: "Key Financial Insights:",
            heading: HeadingLevel.HEADING_2,
            spacing: { after: 200 },
          }),
          new Paragraph({
            text: `• Revenue Growth: From $${data.financialProjections[0].revenue.toLocaleString()} to $${data.financialProjections[data.financialProjections.length-1].revenue.toLocaleString()}`,
            bullet: {
              level: 0
            },
          }),
          new Paragraph({
            text: `• Customer Growth: From ${data.financialProjections[0].customers.toLocaleString()} to ${data.financialProjections[data.financialProjections.length-1].customers.toLocaleString()} customers`,
            bullet: {
              level: 0
            },
          }),
          new Paragraph({
            text: `• Operating Expenses: From $${data.financialProjections[0].opex.toLocaleString()} to $${data.financialProjections[data.financialProjections.length-1].opex.toLocaleString()}`,
            bullet: {
              level: 0
            },
            spacing: { after: 200 },
          }),
          new Table({
            rows: [
              new TableRow({
                children: [
                  new TableCell({ children: [new Paragraph("Year")] }),
                  new TableCell({ children: [new Paragraph("Revenue")] }),
                  new TableCell({ children: [new Paragraph("Customers")] }),
                  new TableCell({ children: [new Paragraph("OPEX")] }),
                ],
              }),
              ...data.financialProjections.map((proj: { year: number; revenue: number; customers: number; opex: number }) => 
                new TableRow({
                  children: [
                    new TableCell({ children: [new Paragraph(proj.year.toString())] }),
                    new TableCell({ children: [new Paragraph(`$${proj.revenue.toLocaleString()}`)] }),
                    new TableCell({ children: [new Paragraph(proj.customers.toLocaleString())] }),
                    new TableCell({ children: [new Paragraph(`$${proj.opex.toLocaleString()}`)] }),
                  ],
                })
              ),
            ],
          }),

          // Market Analysis
          new Paragraph({
            text: "Market Analysis",
            heading: HeadingLevel.HEADING_1,
            spacing: { before: 400, after: 200 },
          }),
          new Paragraph({
            text: "Market Size",
            heading: HeadingLevel.HEADING_2,
            spacing: { after: 200 },
          }),
          new Paragraph({
            text: data.marketAnalysis.marketSize,
            spacing: { after: 200 },
          }),
          new Paragraph({
            text: "Competitive Analysis",
            heading: HeadingLevel.HEADING_2,
            spacing: { after: 200 },
          }),
          new Paragraph({
            text: data.marketAnalysis.competitiveAnalysis,
            spacing: { after: 200 },
          }),
          new Paragraph({
            text: "Market Trends",
            heading: HeadingLevel.HEADING_2,
            spacing: { after: 200 },
          }),
          new Paragraph({
            text: data.marketAnalysis.marketTrends,
            spacing: { after: 200 },
          }),

          // Financial Analysis
          new Paragraph({
            text: "Financial Analysis",
            heading: HeadingLevel.HEADING_1,
            spacing: { before: 400, after: 200 },
          }),
          new Table({
            rows: [
              new TableRow({
                children: [
                  new TableCell({ children: [new Paragraph("Metric")] }),
                  new TableCell({ children: [new Paragraph("Value")] }),
                ],
              }),
              new TableRow({
                children: [
                  new TableCell({ children: [new Paragraph("NPV")] }),
                  new TableCell({ children: [new Paragraph(`$${data.financialAnalysis.metrics.npv.toLocaleString()}`)] }),
                ],
              }),
              new TableRow({
                children: [
                  new TableCell({ children: [new Paragraph("IRR")] }),
                  new TableCell({ children: [new Paragraph(`${data.financialAnalysis.metrics.irr}%`)] }),
                ],
              }),
              new TableRow({
                children: [
                  new TableCell({ children: [new Paragraph("ROI")] }),
                  new TableCell({ children: [new Paragraph(`${data.financialAnalysis.metrics.roi}%`)] }),
                ],
              }),
            ],
          }),
          new Paragraph({
            text: data.financialAnalysis.analysis,
            spacing: { before: 200, after: 200 },
          }),

          // Risk Assessment
          new Paragraph({
            text: "Risk Assessment",
            heading: HeadingLevel.HEADING_1,
            spacing: { before: 400, after: 200 },
          }),
          new Paragraph({
            text: "Identified Risks",
            heading: HeadingLevel.HEADING_2,
          }),
          new Paragraph({
            text: data.riskAssessment.risks,
            spacing: { after: 200 },
          }),
          new Paragraph({
            text: "Impact Assessment",
            heading: HeadingLevel.HEADING_2,
          }),
          new Paragraph({
            text: data.riskAssessment.impactAssessment,
            spacing: { after: 200 },
          }),

          // Implementation Timeline
          new Paragraph({
            text: "Implementation Timeline",
            heading: HeadingLevel.HEADING_1,
            spacing: { before: 400, after: 200 },
          }),
          ...data.implementationTimeline.phases.map((phase: { phase: string; duration: string; keyActivities: string; deliverables: string }) => [
            new Paragraph({
              text: phase.phase,
              heading: HeadingLevel.HEADING_2,
            }),
            new Paragraph({
              text: `Duration: ${phase.duration}`,
            }),
            new Paragraph({
              text: `Key Activities: ${phase.keyActivities}`,
            }),
            new Paragraph({
              text: `Deliverables: ${phase.deliverables}`,
              spacing: { after: 200 },
            }),
          ]).flat(),

          // Recommendations
          new Paragraph({
            text: "Recommendations",
            heading: HeadingLevel.HEADING_1,
            spacing: { before: 400, after: 200 },
          }),
          new Paragraph({
            text: "Strategic Recommendations",
            heading: HeadingLevel.HEADING_2,
          }),
          new Paragraph({
            text: data.recommendations.strategic,
            spacing: { after: 200 },
          }),
          new Paragraph({
            text: "Operational Recommendations",
            heading: HeadingLevel.HEADING_2,
          }),
          new Paragraph({
            text: data.recommendations.operational,
            spacing: { after: 200 },
          }),
          new Paragraph({
            text: "Financial Recommendations",
            heading: HeadingLevel.HEADING_2,
          }),
          new Paragraph({
            text: data.recommendations.financial,
            spacing: { after: 200 },
          }),
        ],
      }],
    });

    // Generate the document buffer
    const buffer = await Packer.toBuffer(doc);

    // Return the document as a downloadable file
    return new NextResponse(buffer, {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'Content-Disposition': 'attachment; filename=business-case-report.docx',
      },
    });
  } catch (error) {
    console.error('Error generating DOCX:', error);
    return NextResponse.json({ error: 'Failed to generate DOCX' }, { status: 500 });
  }
} 