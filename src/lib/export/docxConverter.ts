import { saveAs } from 'file-saver';
import { Document, Packer, Paragraph, TextRun } from 'docx';

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

export async function generateDocx(data: BusinessCaseData): Promise<void> {
  const doc = new Document({
    sections: [
      {
        properties: {},
        children: [
          new Paragraph({
            text: 'Business Case Report',
            heading: 'Title',
          }),
          new Paragraph({
            text: 'Executive Summary',
            heading: 'Heading1',
          }),
          new Paragraph({
            children: [new TextRun(data.executiveSummary)],
          }),
          new Paragraph({
            text: 'Financial Projections',
            heading: 'Heading1',
          }),
          ...data.financialProjections.map(
            (projection) =>
              new Paragraph({
                children: [
                  new TextRun(
                    `Year ${projection.year}: Revenue $${projection.revenue.toLocaleString()}, ` +
                      `Customers: ${projection.customers.toLocaleString()}, ` +
                      `OPEX: $${projection.opex.toLocaleString()}`
                  ),
                ],
              })
          ),
          new Paragraph({
            text: 'ROI Analysis',
            heading: 'Heading1',
          }),
          new Paragraph({
            children: [new TextRun(data.roiAnalysis)],
          }),
          new Paragraph({
            text: 'Risk Assessment',
            heading: 'Heading1',
          }),
          new Paragraph({
            children: [new TextRun(data.riskAssessment)],
          }),
          new Paragraph({
            text: 'Implementation Timeline',
            heading: 'Heading1',
          }),
          new Paragraph({
            children: [new TextRun(data.implementationTimeline)],
          }),
        ],
      },
    ],
  });

  const buffer = await Packer.toBlob(doc);
  saveAs(buffer, 'business-case-report.docx');
} 