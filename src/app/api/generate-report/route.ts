import OpenAI from 'openai';
import { z } from 'zod';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const businessCaseSchema = z.object({
  projectName: z.string(),
  company: z.string(),
  country: z.string(),
  industry: z.string(),
  financials: z.object({
    totalCost: z.number(),
    capex: z.number(),
    opex: z.number(),
  }),
  customers: z.object({
    initialCount: z.number(),
    growthRate: z.number(),
    arpu: z.number(),
  }),
});

interface FinancialMetrics {
  npv: number;
  irr: number;
  paybackPeriod: number;
  roi: number;
}

function cleanJsonResponse(text: string): string {
  // Remove any text before the first {
  const startIndex = text.indexOf('{');
  const endIndex = text.lastIndexOf('}');
  if (startIndex === -1 || endIndex === -1) {
    throw new Error('No valid JSON object found in response');
  }
  return text.slice(startIndex, endIndex + 1);
}

function calculateFinancialProjections(data: {
  initialCount: number;
  growthRate: number;
  arpu: number;
  opex: number;
}) {
  const projections = [];
  let customers = data.initialCount;
  let opex = data.opex;

  for (let year = 1; year <= 5; year++) {
    const revenue = customers * data.arpu * 12;
    projections.push({
      year,
      revenue: Math.round(revenue),
      customers: Math.round(customers),
      opex: Math.round(opex),
    });
    customers *= (1 + data.growthRate);
    opex *= 1.1; // 10% increase in OPEX each year
  }

  return projections;
}

function calculateFinancialMetrics(projections: any[], capex: number): FinancialMetrics {
  const discountRate = 0.1; // 10% discount rate
  
  // Calculate cash flows
  const cashFlows = projections.map(p => p.revenue - p.opex);
  cashFlows.unshift(-capex); // Add initial investment as negative cash flow

  // Calculate NPV
  const npv = cashFlows.reduce((acc, cf, i) => 
    acc + cf / Math.pow(1 + discountRate, i), 0);

  // Calculate ROI
  const totalRevenue = projections.reduce((acc, p) => acc + p.revenue, 0);
  const totalOpex = projections.reduce((acc, p) => acc + p.opex, 0);
  const roi = ((totalRevenue - totalOpex - capex) / capex) * 100;

  // Simplified IRR (approximation)
  const irr = (totalRevenue - totalOpex - capex) / (capex * 5) * 100;

  // Calculate Payback Period
  let cumulativeCashFlow = -capex;
  let paybackPeriod = 0;
  for (let i = 0; i < projections.length; i++) {
    cumulativeCashFlow += projections[i].revenue - projections[i].opex;
    if (cumulativeCashFlow > 0 && paybackPeriod === 0) {
      paybackPeriod = i + 1;
      break;
    }
  }

  return {
    npv: Math.round(npv),
    irr: Math.round(irr),
    paybackPeriod,
    roi: Math.round(roi),
  };
}

async function generateMarketAnalysis(data: any) {
  const marketPrompt = `Analyze the market potential and competitive landscape for this project:

Industry: ${data.industry}
Country: ${data.country}
Initial Customer Base: ${data.customers.initialCount}
Growth Rate: ${data.customers.growthRate}%

Provide a JSON response with:
1. Market size and potential
2. Competitive analysis
3. Market trends
4. Growth opportunities
5. Entry barriers

Format:
{
  "marketSize": "analysis of total addressable market",
  "competitiveAnalysis": "detailed competitor analysis",
  "marketTrends": "key industry trends",
  "growthOpportunities": "specific growth areas",
  "entryBarriers": "main barriers to entry"
}`;

  const marketResponse = await openai.chat.completions.create({
    model: 'gpt-4',
    messages: [
      {
        role: 'system',
        content: 'You are a market research analyst. Provide detailed market insights in JSON format.',
      },
      {
        role: 'user',
        content: marketPrompt,
      },
    ],
    temperature: 0.7,
  });

  return JSON.parse(cleanJsonResponse(marketResponse.choices[0].message.content || '{}'));
}

async function generateRiskAnalysis(data: any, financialMetrics: FinancialMetrics) {
  const riskPrompt = `Analyze the risks and mitigation strategies for this project:

Project: ${data.projectName}
Industry: ${data.industry}
CAPEX: $${data.financials.capex}
ROI: ${financialMetrics.roi}%
Payback Period: ${financialMetrics.paybackPeriod} years

Provide a JSON response with:
1. Risk categories and specific risks
2. Impact assessment
3. Mitigation strategies
4. Contingency plans
5. Risk monitoring approach

Format:
{
  "operationalRisks": "analysis of operational risks",
  "financialRisks": "analysis of financial risks",
  "marketRisks": "analysis of market risks",
  "technicalRisks": "analysis of technical risks",
  "mitigationStrategies": "detailed mitigation approaches"
}`;

  const riskResponse = await openai.chat.completions.create({
    model: 'gpt-4',
    messages: [
      {
        role: 'system',
        content: 'You are a risk management expert. Provide detailed risk analysis in JSON format.',
      },
      {
        role: 'user',
        content: riskPrompt,
      },
    ],
    temperature: 0.7,
  });

  return JSON.parse(cleanJsonResponse(riskResponse.choices[0].message.content || '{}'));
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const validatedData = businessCaseSchema.parse(body);

    // Pre-calculate the financial projections
    const projections = calculateFinancialProjections({
      initialCount: validatedData.customers.initialCount,
      growthRate: validatedData.customers.growthRate / 100,
      arpu: validatedData.customers.arpu,
      opex: validatedData.financials.opex,
    });

    // Calculate financial metrics
    const financialMetrics = calculateFinancialMetrics(projections, validatedData.financials.capex);

    // Generate additional analyses
    const [marketAnalysis, riskAnalysis] = await Promise.all([
      generateMarketAnalysis(validatedData),
      generateRiskAnalysis(validatedData, financialMetrics),
    ]);

    const prompt = `Generate a comprehensive business case report for the following project. Include all provided analyses in your response.

Project Name: ${validatedData.projectName}
Company: ${validatedData.company}
Country: ${validatedData.country}
Industry: ${validatedData.industry}

Financial Information:
- Total Cost of Ownership (TCO): $${validatedData.financials.totalCost}
- Capital Expenditure (CAPEX): $${validatedData.financials.capex}
- Operating Expenditure (OPEX): $${validatedData.financials.opex}

Customer Information:
- Initial Customer Count: ${validatedData.customers.initialCount}
- Growth Rate: ${validatedData.customers.growthRate}%
- Average Revenue Per User (ARPU): $${validatedData.customers.arpu}

Financial Metrics:
- Net Present Value (NPV): $${financialMetrics.npv}
- Internal Rate of Return (IRR): ${financialMetrics.irr}%
- Return on Investment (ROI): ${financialMetrics.roi}%
- Payback Period: ${financialMetrics.paybackPeriod} years

Market Analysis: ${JSON.stringify(marketAnalysis, null, 2)}
Risk Analysis: ${JSON.stringify(riskAnalysis, null, 2)}

Your response must be a JSON object with this structure:
{
  "executiveSummary": "comprehensive summary including key metrics and insights",
  "financialProjections": ${JSON.stringify(projections, null, 2)},
  "marketAnalysis": ${JSON.stringify(marketAnalysis, null, 2)},
  "financialAnalysis": {
    "metrics": ${JSON.stringify(financialMetrics, null, 2)},
    "analysis": "detailed financial analysis and insights"
  },
  "riskAssessment": ${JSON.stringify(riskAnalysis, null, 2)},
  "implementationTimeline": {
    "phases": [
      {
        "phase": "string",
        "duration": "string",
        "keyActivities": "string",
        "deliverables": "string"
      }
    ],
    "criticalPath": "string",
    "keyMilestones": "string"
  },
  "recommendations": {
    "strategic": "string",
    "operational": "string",
    "financial": "string"
  }
}`;

    const response = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [
        {
          role: 'system',
          content: 'You are a business analyst expert. Create a comprehensive business case report incorporating all provided analyses. Maintain the exact structure and use the provided data.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      temperature: 0.7,
    });

    const result = response.choices[0].message.content;
    if (!result) {
      throw new Error('No response from OpenAI');
    }

    try {
      const cleanedResult = cleanJsonResponse(result);
      const parsedResult = JSON.parse(cleanedResult);

      // Validate and ensure consistent data
      if (!parsedResult.executiveSummary || !Array.isArray(parsedResult.financialProjections)) {
        throw new Error('Invalid report structure');
      }

      // Ensure we use our pre-calculated values
      parsedResult.financialProjections = projections;
      parsedResult.financialAnalysis.metrics = financialMetrics;
      parsedResult.marketAnalysis = marketAnalysis;
      parsedResult.riskAssessment = riskAnalysis;

      return new Response(JSON.stringify(parsedResult), {
        headers: { 'Content-Type': 'application/json' },
      });
    } catch (parseError: unknown) {
      console.error('Parse error:', parseError, '\nResponse:', result);
      throw new Error(
        `Failed to parse OpenAI response as JSON. Error: ${parseError instanceof Error ? parseError.message : 'Unknown parsing error'}`
      );
    }
  } catch (error) {
    console.error('Error generating report:', error);
    return new Response(
      JSON.stringify({
        error: 'Failed to generate report',
        details: error instanceof Error ? error.message : 'Unknown error',
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
} 