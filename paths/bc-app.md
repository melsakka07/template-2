# Business Case Generation AI App
You are an expert in TypeScript, Next.js App Router, React, and Tailwind. Follow @Next.js docs for Data Fetching, Rendering, and Routing. Use Vercel AI SDK for handling AI interactions and streaming responses.
Business Case Generation AI App is A Next.js application that generates comprehensive business case reports through AI-powered chat interactions. Users provide project details and financial metrics, then collaborate with AI to create professional reports with visualizations and export capabilities.

## Key Features

1. **Structured Data Collection**
   - Chat-guided input for:
     - Project Name, Company, Country, Industry
     - Financial Metrics (TCO, CAPEX, OPEX)
     - Customer Projections (Initial Count, Growth %, ARPU)
   - Form validation and data type checking

2. **Multi-Model AI Analysis**
   - OpenAI GPT-4o and Anthropic Claude 3.5 Sonnet integration
   - Comparative analysis using both models
   - Model consensus highlighting for critical metrics

3. **Dynamic Report Generation**
   - Real-time HTML report preview with:
     - Executive Summary
     - Financial Projections (5-year outlook)
     - ROI Analysis
     - Risk Assessment
     - Implementation Timeline
   - Interactive financial charts:
     - Column charts for CAPEX/OPEX breakdown
     - Line charts for customer growth projections
     - Waterfall charts for cash flow analysis

4. **Collaborative Editing**
   - In-chart suggestions for metric adjustments
   - AI-powered "What-if" scenario modeling
   - Version history of report modifications

5. **Export & Sharing**
   - One-click DOCX conversion with proper formatting
   - PDF export option
   - Email sharing with customizable templates
   - Cloud storage integration (Google Drive, OneDrive)

## Technology Stack

- **Framework**: Next.js (App Router)
- **AI Integration**: Vercel AI SDK, OpenAI API, Anthropic API
- **UI**: React, Shadcn/ui, Tailwind CSS
- **Visualization**: Recharts, Chart.js
- **Document Generation**: html-docx-js, pdf-lib
- **Email**: Resend, Nodemailer
- **State Management**: Zustand
- **Validation**: Zod

## Core Components

1. **Data Collection**
   - `BusinessCaseForm`: Guided input form with validation
   - `FinancialInputWizard`: Step-by-step financial metric collection
   - `ProjectionAssistant`: AI-powered suggestion engine

2. **Report Generation**
   - `ReportGenerator`: Main report composition engine
   - `FinancialCharts`: Interactive D3.js/Recharts visualizations
   - `ScenarioBuilder`: What-if analysis interface

3. **Export System**
   - `DocxExporter`: HTML-to-Word converter with style preservation
   - `EmailSharing`: SMTP integration with template editor
   - `VersionControl`: Report snapshot system

4. **AI Integration**
   - `AnalysisOrchestrator`: Manages multi-model interactions
   - `ConsensusEngine`: Combines AI model outputs
   - `ValidationAgent`: Fact-checking and data verification

## Implementation Details

### API Routes
```typescript
// app/api/generate-report/route.ts
export async function POST(req: Request) {
  const { messages, model, businessData } = await req.json();
  
  // Validate business metrics
  const validatedData = validateBusinessCase(businessData);

  // Generate analysis prompt
  const systemPrompt = createSystemPrompt(validatedData);

  // Route to appropriate AI
  const aiResponse = model === 'openai' 
    ? await openai.chat.completions.create({
        model: 'gpt-4o',
        messages: [{ role: 'system', content: systemPrompt }, ...messages],
        stream: true
      })
    : await anthropic.messages.create({
        model: 'claude-3-5-sonnet',
        system: systemPrompt,
        messages,
        stream: true
      });

  return new StreamingTextResponse(aiResponse);
}
// components/FinancialChart.tsx
interface ChartData {
  year: number;
  revenue: number;
  customers: number;
  opex: number;
}

export function FinancialChart({ data }: { data: ChartData[] }) {
  return (
    <ResponsiveContainer width="100%" height={400}>
      <ComposedChart data={data}>
        <Bar dataKey="revenue" fill="#8884d8" />
        <Line dataKey="customers" stroke="#ff7300" />
        <Area dataKey="opex" fill="#82ca9d" />
        <XAxis dataKey="year" />
        <YAxis />
        <Tooltip />
      </ComposedChart>
    </ResponsiveContainer>
  );
}
// lib/export/docxConverter.ts
export async function generateDocx(html: string): Promise<Blob> {
  const styles = {
    paragraphStyles: [{
      heading1: { fontSize: 24, bold: true, color: '#2d3748' }
    }]
  };

  return HTMLtoDOCX(html, null, {
    table: { row: { cantSplit: true }},
    footer: true,
    pageNumber: true,
    styles
  });
}
```

Setup Instructions
Install dependencies: