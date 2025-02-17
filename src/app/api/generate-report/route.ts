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
    projectTimelineYears: z.number(),
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
  roi: number;
  paybackPeriod: number;
  breakEvenPoint: number;
  cac: number;
  clv: number;
  grossMargin: number[];
  operatingMargin: number[];
  ebitda: number[];
  workingCapital: number[];
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

function generateFinancialProjections(data: any) {
  const projections = [];
  const years = data.financials.projectTimelineYears;

  for (let year = 1; year <= years; year++) {
    const customers = Math.round(
      data.customers.initialCount * Math.pow(1 + data.customers.growthRate / 100, year - 1)
    );
    const revenue = customers * data.customers.arpu * 12;
    const opex = data.financials.opex * Math.pow(1.1, year - 1); // 10% increase per year

    projections.push({
      year,
      revenue,
      customers,
      opex,
    });
  }

  return projections;
}

function calculateFinancialMetrics(data: any, projections: any[]) {
  const initialInvestment = data.financials.capex;
  const discountRate = 0.1; // 10% discount rate
  
  // Calculate cash flows
  const cashFlows = projections.map(p => p.revenue - p.opex);
  
  // Calculate NPV
  const npv = cashFlows.reduce((acc, cf, index) => {
    return acc + (cf / Math.pow(1 + discountRate, index + 1));
  }, -initialInvestment);

  // Calculate ROI
  const totalRevenue = projections.reduce((sum, p) => sum + p.revenue, 0);
  const totalCosts = initialInvestment + projections.reduce((sum, p) => sum + p.opex, 0);
  const roi = ((totalRevenue - totalCosts) / totalCosts) * 100;

  // Calculate payback period
  let cumulativeCashFlow = -initialInvestment;
  let paybackPeriod = data.financials.projectTimelineYears;
  
  for (let i = 0; i < cashFlows.length; i++) {
    cumulativeCashFlow += cashFlows[i];
    if (cumulativeCashFlow >= 0) {
      paybackPeriod = i + 1;
      break;
    }
  }

  // Calculate break-even point
  const averageRevenuePerCustomer = data.customers.arpu * 12;
  const firstYearOpex = data.financials.opex;
  const breakEvenPoint = Math.ceil((firstYearOpex + initialInvestment) / averageRevenuePerCustomer);

  // Calculate CAC and CLV
  const marketingCost = firstYearOpex * 0.3; // Assume 30% of OPEX is marketing
  const firstYearCustomers = projections[0].customers;
  const cac = marketingCost / firstYearCustomers;
  const avgCustomerLifespan = 3; // Assume average customer stays for 3 years
  const clv = averageRevenuePerCustomer * avgCustomerLifespan;

  // Calculate margins
  const grossMargin = projections.map(p => ((p.revenue - (p.opex * 0.6)) / p.revenue) * 100);
  const operatingMargin = projections.map(p => ((p.revenue - p.opex) / p.revenue) * 100);
  const ebitda = projections.map(p => ((p.revenue - p.opex) / p.revenue) * 100);
  
  // Calculate working capital (20% of revenue)
  const workingCapital = projections.map(p => p.revenue * 0.2);

  return {
    npv,
    roi,
    paybackPeriod,
    breakEvenPoint,
    cac,
    clv,
    grossMargin,
    operatingMargin,
    ebitda,
    workingCapital
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
  const riskPrompt = `Analyze the risks and provide a comprehensive risk management plan for this business case:

Project Details:
- Project Name: ${data.projectName}
- Industry: ${data.industry}
- Country: ${data.country}
- Initial Investment (CAPEX): $${data.financials.capex}
- Operating Costs (OPEX): $${data.financials.opex}
- ROI: ${financialMetrics.roi}%
- Payback Period: ${financialMetrics.paybackPeriod} years
- Initial Customer Base: ${data.customers.initialCount}
- Target Growth Rate: ${data.customers.growthRate}%

Return a JSON object with the following structure. Keep all responses as plain text with bullet points:

{
  "risks": "• Market Risk: [description]\\n• Financial Risk: [description]\\n• Operational Risk: [description]\\n• Technical Risk: [description]\\n• Regulatory Risk: [description]",
  
  "impactAssessment": "• High Impact Risks:\\n[list with ratings]\\n\\n• Medium Impact Risks:\\n[list with ratings]\\n\\n• Low Impact Risks:\\n[list with ratings]",
  
  "mitigationStrategies": "• Strategy 1: [description]\\n• Strategy 2: [description]\\n• Strategy 3: [description]",
  
  "contingencyPlans": "• Plan 1: [description]\\n• Plan 2: [description]\\n• Plan 3: [description]",
  
  "riskMonitoringApproach": "• Monitoring Framework:\\n[description]\\n\\n• KRIs:\\n[list]\\n\\n• Review Process:\\n[description]"
}

Important: Ensure the response is a valid JSON object. Use \\n for line breaks. Do not include any markdown or special formatting.`;

  try {
    const riskResponse = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [
        {
          role: 'system',
          content: 'You are a risk management expert. Provide a detailed risk assessment in the exact JSON format specified. Use bullet points and line breaks (\\n) for formatting. Do not include any markdown or special characters.',
        },
        {
          role: 'user',
          content: riskPrompt,
        },
      ],
      temperature: 0.7,
    });

    const content = riskResponse.choices[0].message.content;
    if (!content) {
      throw new Error('Empty response from OpenAI');
    }

    try {
      const cleanedContent = cleanJsonResponse(content);
      const parsedResponse = JSON.parse(cleanedContent);

      // Validate the response structure
      const requiredFields = ['risks', 'impactAssessment', 'mitigationStrategies', 'contingencyPlans', 'riskMonitoringApproach'];
      for (const field of requiredFields) {
        if (!(field in parsedResponse)) {
          throw new Error(`Missing required field: ${field}`);
        }
      }

      // Ensure all fields are strings and replace any double escaped newlines
      return {
        risks: String(parsedResponse.risks).replace(/\\n/g, '\n'),
        impactAssessment: String(parsedResponse.impactAssessment).replace(/\\n/g, '\n'),
        mitigationStrategies: String(parsedResponse.mitigationStrategies).replace(/\\n/g, '\n'),
        contingencyPlans: String(parsedResponse.contingencyPlans).replace(/\\n/g, '\n'),
        riskMonitoringApproach: String(parsedResponse.riskMonitoringApproach).replace(/\\n/g, '\n')
      };
    } catch (parseError) {
      console.error('Failed to parse risk analysis response:', content);
      // Provide a fallback structured response
      return {
        risks: "• Market Risk: Potential market volatility\n• Financial Risk: Investment uncertainty\n• Operational Risk: Process inefficiencies\n• Technical Risk: Implementation challenges\n• Regulatory Risk: Compliance requirements",
        impactAssessment: "• High Impact Risks:\n- Market volatility (High)\n- Financial uncertainty (High)\n\n• Medium Impact Risks:\n- Operational inefficiencies (Medium)\n\n• Low Impact Risks:\n- Minor technical issues (Low)",
        mitigationStrategies: "• Diversification of market approach\n• Strong financial controls\n• Regular operational reviews\n• Technical redundancy measures\n• Compliance monitoring",
        contingencyPlans: "• Market backup strategies\n• Financial reserves allocation\n• Operational backup procedures\n• Technical fallback solutions\n• Regulatory compliance plans",
        riskMonitoringApproach: "• Weekly risk reviews\n• Monthly KPI monitoring\n• Quarterly assessments\n• Annual strategic review"
      };
    }
  } catch (error) {
    console.error('Error in risk analysis generation:', error);
    // Provide a basic fallback response
    return {
      risks: "• Market Risk\n• Financial Risk\n• Operational Risk\n• Technical Risk\n• Regulatory Risk",
      impactAssessment: "• High Impact Risks\n• Medium Impact Risks\n• Low Impact Risks",
      mitigationStrategies: "• Risk mitigation strategy 1\n• Risk mitigation strategy 2\n• Risk mitigation strategy 3",
      contingencyPlans: "• Contingency plan 1\n• Contingency plan 2\n• Contingency plan 3",
      riskMonitoringApproach: "• Regular monitoring\n• KPI tracking\n• Periodic reviews"
    };
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const validatedData = businessCaseSchema.parse(body);

    // Pre-calculate the financial projections
    const projections = generateFinancialProjections(validatedData);

    // Calculate financial metrics
    const financialMetrics = calculateFinancialMetrics(validatedData, projections);

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
- Total Cost of Ownership (TCO): $${validatedData.financials.projectTimelineYears}
- Capital Expenditure (CAPEX): $${validatedData.financials.capex}
- Operating Expenditure (OPEX): $${validatedData.financials.opex}

Customer Information:
- Initial Customer Count: ${validatedData.customers.initialCount}
- Growth Rate: ${validatedData.customers.growthRate}%
- Average Revenue Per User (ARPU): $${validatedData.customers.arpu}

Financial Metrics:
- Net Present Value (NPV): $${financialMetrics.npv}
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