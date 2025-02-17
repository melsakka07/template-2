import { saveAs } from 'file-saver';
import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  HeadingLevel,
  Table,
  TableRow,
  TableCell,
  BorderStyle,
  AlignmentType,
  convertInchesToTwip,
  LevelFormat,
  PageBreak,
} from 'docx';

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

export async function generateDocx(data: BusinessCaseData): Promise<void> {
  const doc = new Document({
    numbering: {
      config: [
        {
          reference: "bullet-points",
          levels: [
            {
              level: 0,
              format: LevelFormat.BULLET,
              text: "•",
              alignment: AlignmentType.LEFT,
              style: {
                paragraph: {
                  indent: { left: convertInchesToTwip(0.5), hanging: convertInchesToTwip(0.25) },
                },
              },
            },
          ],
        },
      ],
    },
    styles: {
      paragraphStyles: [
        {
          id: "Normal",
          name: "Normal",
          run: {
            size: 24, // 12pt
            font: "Calibri",
          },
          paragraph: {
            spacing: { line: 360, before: 120, after: 120 },
          },
        },
        {
          id: "Heading1",
          name: "Heading 1",
          run: {
            size: 36, // 18pt
            bold: true,
            font: "Calibri",
          },
          paragraph: {
            spacing: { before: 480, after: 240 },
          },
        },
        {
          id: "Heading2",
          name: "Heading 2",
          run: {
            size: 30, // 15pt
            bold: true,
            font: "Calibri",
          },
          paragraph: {
            spacing: { before: 360, after: 240 },
          },
        },
      ],
    },
    sections: [
      {
        properties: {
          page: {
            margin: {
              top: convertInchesToTwip(1),
              right: convertInchesToTwip(1),
              bottom: convertInchesToTwip(1),
              left: convertInchesToTwip(1),
            },
          },
        },
        children: [
          // Cover Page
          new Paragraph({
            text: "Business Case Report",
            heading: HeadingLevel.TITLE,
            alignment: AlignmentType.CENTER,
            spacing: { before: 3000, after: 400 },
          }),
          new Paragraph({
            text: data.projectName,
            heading: HeadingLevel.HEADING_1,
            alignment: AlignmentType.CENTER,
            spacing: { before: 400, after: 240 },
          }),
          new Paragraph({
            text: data.company,
            alignment: AlignmentType.CENTER,
            spacing: { before: 240, after: 3000 },
          }),
          new Paragraph({
            children: [new TextRun({ text: "", break: 1 })],
          }),

          // Executive Summary
          new Paragraph({
            text: "Executive Summary",
            heading: HeadingLevel.HEADING_1,
          }),
          new Paragraph({
            text: data.executiveSummary,
            spacing: { after: 400 },
          }),
          new Paragraph({
            children: [new TextRun({ text: "", break: 1 })],
          }),

          // Financial Analysis
          new Paragraph({
            text: "Financial Analysis",
            heading: HeadingLevel.HEADING_1,
          }),
          new Table({
            width: {
              size: 100,
              type: "pct",
            },
            borders: {
              top: { style: BorderStyle.SINGLE, size: 1 },
              bottom: { style: BorderStyle.SINGLE, size: 1 },
              left: { style: BorderStyle.SINGLE, size: 1 },
              right: { style: BorderStyle.SINGLE, size: 1 },
              insideHorizontal: { style: BorderStyle.SINGLE, size: 1 },
              insideVertical: { style: BorderStyle.SINGLE, size: 1 },
            },
            rows: [
              new TableRow({
                children: [
                  new TableCell({
                    children: [new Paragraph({ children: [new TextRun({ text: "Metric", bold: true })] })],
                    shading: { fill: "F2F2F2" },
                  }),
                  new TableCell({
                    children: [new Paragraph({ children: [new TextRun({ text: "Value", bold: true })] })],
                    shading: { fill: "F2F2F2" },
                  }),
                ],
              }),
              new TableRow({
                children: [
                  new TableCell({ children: [new Paragraph("Net Present Value (NPV)")] }),
                  new TableCell({
                    children: [new Paragraph(formatCurrency(data.financialAnalysis.metrics.npv))],
                  }),
                ],
              }),
              new TableRow({
                children: [
                  new TableCell({ children: [new Paragraph("Internal Rate of Return (IRR)")] }),
                  new TableCell({
                    children: [new Paragraph(`${data.financialAnalysis.metrics.irr}%`)],
                  }),
                ],
              }),
              new TableRow({
                children: [
                  new TableCell({ children: [new Paragraph("Return on Investment (ROI)")] }),
                  new TableCell({
                    children: [new Paragraph(`${data.financialAnalysis.metrics.roi}%`)],
                  }),
                ],
              }),
              new TableRow({
                children: [
                  new TableCell({ children: [new Paragraph("Payback Period")] }),
                  new TableCell({
                    children: [
                      new Paragraph(`${data.financialAnalysis.metrics.paybackPeriod} years`),
                    ],
                  }),
                ],
              }),
            ],
          }),
          new Paragraph({
            text: "Financial Projections",
            heading: HeadingLevel.HEADING_2,
            spacing: { before: 400 },
          }),
          new Table({
            width: { size: 100, type: "pct" },
            borders: {
              top: { style: BorderStyle.SINGLE, size: 1 },
              bottom: { style: BorderStyle.SINGLE, size: 1 },
              left: { style: BorderStyle.SINGLE, size: 1 },
              right: { style: BorderStyle.SINGLE, size: 1 },
              insideHorizontal: { style: BorderStyle.SINGLE, size: 1 },
              insideVertical: { style: BorderStyle.SINGLE, size: 1 },
            },
            rows: [
              new TableRow({
                children: [
                  new TableCell({
                    children: [new Paragraph({ children: [new TextRun({ text: "Year", bold: true })] })],
                    shading: { fill: "F2F2F2" },
                  }),
                  new TableCell({
                    children: [new Paragraph({ children: [new TextRun({ text: "Revenue", bold: true })] })],
                    shading: { fill: "F2F2F2" },
                  }),
                  new TableCell({
                    children: [new Paragraph({ children: [new TextRun({ text: "Customers", bold: true })] })],
                    shading: { fill: "F2F2F2" },
                  }),
                  new TableCell({
                    children: [new Paragraph({ children: [new TextRun({ text: "OPEX", bold: true })] })],
                    shading: { fill: "F2F2F2" },
                  }),
                ],
              }),
              ...data.financialProjections.map(
                (proj) =>
                  new TableRow({
                    children: [
                      new TableCell({ children: [new Paragraph(proj.year.toString())] }),
                      new TableCell({
                        children: [new Paragraph(formatCurrency(proj.revenue))],
                      }),
                      new TableCell({
                        children: [new Paragraph(proj.customers.toLocaleString())],
                      }),
                      new TableCell({
                        children: [new Paragraph(formatCurrency(proj.opex))],
                      }),
                    ],
                  })
              ),
            ],
          }),

          // Financial Calculations
          new Paragraph({
            text: "Financial Calculations",
            heading: HeadingLevel.HEADING_2,
            spacing: { before: 400, after: 240 },
          }),
          new Paragraph({
            text: "The following formulas are used to calculate the financial metrics:",
            spacing: { after: 240 },
          }),
          new Table({
            width: { size: 100, type: "pct" },
            borders: {
              top: { style: BorderStyle.SINGLE, size: 1 },
              bottom: { style: BorderStyle.SINGLE, size: 1 },
              left: { style: BorderStyle.SINGLE, size: 1 },
              right: { style: BorderStyle.SINGLE, size: 1 },
              insideHorizontal: { style: BorderStyle.SINGLE, size: 1 },
              insideVertical: { style: BorderStyle.SINGLE, size: 1 },
            },
            rows: [
              new TableRow({
                children: [
                  new TableCell({
                    children: [new Paragraph({ children: [new TextRun({ text: "Metric", bold: true })] })],
                    shading: { fill: "F2F2F2" },
                  }),
                  new TableCell({
                    children: [new Paragraph({ children: [new TextRun({ text: "Formula", bold: true })] })],
                    shading: { fill: "F2F2F2" },
                  }),
                  new TableCell({
                    children: [new Paragraph({ children: [new TextRun({ text: "Description", bold: true })] })],
                    shading: { fill: "F2F2F2" },
                  }),
                ],
              }),
              new TableRow({
                children: [
                  new TableCell({ children: [new Paragraph("Annual Revenue")] }),
                  new TableCell({
                    children: [new Paragraph("Customers × ARPU × 12")],
                  }),
                  new TableCell({
                    children: [new Paragraph("Monthly ARPU converted to annual revenue")],
                  }),
                ],
              }),
              new TableRow({
                children: [
                  new TableCell({ children: [new Paragraph("Customer Growth")] }),
                  new TableCell({
                    children: [new Paragraph("Initial Count × (1 + Growth Rate)^Year")],
                  }),
                  new TableCell({
                    children: [new Paragraph("Compound annual growth rate applied to customer base")],
                  }),
                ],
              }),
              new TableRow({
                children: [
                  new TableCell({ children: [new Paragraph("OPEX Growth")] }),
                  new TableCell({
                    children: [new Paragraph("Initial OPEX × (1.1)^Year")],
                  }),
                  new TableCell({
                    children: [new Paragraph("10% annual increase in operating expenses")],
                  }),
                ],
              }),
              new TableRow({
                children: [
                  new TableCell({ children: [new Paragraph("Net Present Value (NPV)")] }),
                  new TableCell({
                    children: [new Paragraph("Σ (Cash Flow / (1 + r)^t) - Initial Investment")],
                  }),
                  new TableCell({
                    children: [new Paragraph("Sum of discounted cash flows minus initial investment, using 10% discount rate")],
                  }),
                ],
              }),
              new TableRow({
                children: [
                  new TableCell({ children: [new Paragraph("ROI")] }),
                  new TableCell({
                    children: [new Paragraph("((Total Revenue - Total Costs) / Total Investment) × 100")],
                  }),
                  new TableCell({
                    children: [new Paragraph("Percentage return on total investment")],
                  }),
                ],
              }),
              new TableRow({
                children: [
                  new TableCell({ children: [new Paragraph("IRR")] }),
                  new TableCell({
                    children: [new Paragraph("((Total Revenue - Total Costs) / (Investment × Years)) × 100")],
                  }),
                  new TableCell({
                    children: [new Paragraph("Simplified internal rate of return calculation")],
                  }),
                ],
              }),
              new TableRow({
                children: [
                  new TableCell({ children: [new Paragraph("Payback Period")] }),
                  new TableCell({
                    children: [new Paragraph("First year where Cumulative Cash Flow > 0")],
                  }),
                  new TableCell({
                    children: [new Paragraph("Time required to recover the initial investment")],
                  }),
                ],
              }),
            ],
          }),
          new Paragraph({
            children: [new TextRun({ text: "", break: 1 })],
          }),

          // Market Analysis
          new Paragraph({
            text: "Market Analysis",
            heading: HeadingLevel.HEADING_1,
          }),
          new Paragraph({
            text: "Market Size and Potential",
            heading: HeadingLevel.HEADING_2,
          }),
          new Paragraph({ text: data.marketAnalysis.marketSize }),
          new Paragraph({
            children: [new TextRun({ text: "", break: 1 })],
          }),
          new Paragraph({
            text: "Competitive Analysis",
            heading: HeadingLevel.HEADING_2,
          }),
          new Paragraph({ text: data.marketAnalysis.competitiveAnalysis }),
          new Paragraph({
            children: [new TextRun({ text: "", break: 1 })],
          }),
          new Paragraph({
            text: "Market Trends",
            heading: HeadingLevel.HEADING_2,
          }),
          new Paragraph({ text: data.marketAnalysis.marketTrends }),
          new Paragraph({
            children: [new TextRun({ text: "", break: 1 })],
          }),
          new Paragraph({
            text: "Growth Opportunities",
            heading: HeadingLevel.HEADING_2,
          }),
          new Paragraph({ text: data.marketAnalysis.growthOpportunities }),
          new Paragraph({
            children: [new TextRun({ text: "", break: 1 })],
          }),
          new Paragraph({
            text: "Entry Barriers",
            heading: HeadingLevel.HEADING_2,
          }),
          new Paragraph({ text: data.marketAnalysis.entryBarriers }),
          new Paragraph({
            children: [new TextRun({ text: "", break: 1 })],
          }),

          // Risk Assessment
          new Paragraph({
            text: "Risk Assessment",
            heading: HeadingLevel.HEADING_1,
          }),
          new Paragraph({
            text: "Identified Risks",
            heading: HeadingLevel.HEADING_2,
          }),
          ...data.riskAssessment.risks.split('\n').map(
            (risk) =>
              new Paragraph({
                text: risk,
                numbering: { reference: "bullet-points", level: 0 },
              })
          ),
          new Paragraph({
            children: [new TextRun({ text: "", break: 1 })],
          }),
          new Paragraph({
            text: "Impact Assessment",
            heading: HeadingLevel.HEADING_2,
          }),
          ...data.riskAssessment.impactAssessment.split('\n').map(
            (impact) =>
              new Paragraph({
                text: impact,
                numbering: { reference: "bullet-points", level: 0 },
              })
          ),
          new Paragraph({
            children: [new TextRun({ text: "", break: 1 })],
          }),

          // Implementation Timeline
          new Paragraph({
            text: "Implementation Timeline",
            heading: HeadingLevel.HEADING_1,
          }),
          ...data.implementationTimeline.phases.map((phase) => [
            new Paragraph({
              text: phase.phase,
              heading: HeadingLevel.HEADING_2,
            }),
            new Paragraph({
              children: [
                new TextRun({ text: "Duration: ", bold: true }),
                new TextRun(phase.duration),
              ],
            }),
            new Paragraph({
              children: [
                new TextRun({ text: "Key Activities: ", bold: true }),
                new TextRun(phase.keyActivities),
              ],
            }),
            new Paragraph({
              children: [
                new TextRun({ text: "Deliverables: ", bold: true }),
                new TextRun(phase.deliverables),
              ],
              spacing: { after: 240 },
            }),
          ]).flat(),
          new Paragraph({
            children: [new TextRun({ text: "", break: 1 })],
          }),

          // Recommendations
          new Paragraph({
            text: "Recommendations",
            heading: HeadingLevel.HEADING_1,
          }),
          new Paragraph({
            text: "Strategic Recommendations",
            heading: HeadingLevel.HEADING_2,
          }),
          new Paragraph({ text: data.recommendations.strategic }),
          new Paragraph({
            children: [new TextRun({ text: "", break: 1 })],
          }),
          new Paragraph({
            text: "Operational Recommendations",
            heading: HeadingLevel.HEADING_2,
          }),
          new Paragraph({ text: data.recommendations.operational }),
          new Paragraph({
            children: [new TextRun({ text: "", break: 1 })],
          }),
          new Paragraph({
            text: "Financial Recommendations",
            heading: HeadingLevel.HEADING_2,
          }),
          new Paragraph({ text: data.recommendations.financial }),
        ],
      },
    ],
  });

  const buffer = await Packer.toBlob(doc);
  saveAs(buffer, 'business-case-report.docx');
} 