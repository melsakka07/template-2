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

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const validatedData = businessCaseSchema.parse(body);

    // Pre-calculate the financial projections
    const projections = calculateFinancialProjections({
      initialCount: validatedData.customers.initialCount,
      growthRate: validatedData.customers.growthRate / 100, // Convert percentage to decimal
      arpu: validatedData.customers.arpu,
      opex: validatedData.financials.opex,
    });

    const prompt = `Generate a comprehensive business case report for the following project. Your response must be a valid JSON object with no additional text before or after. Use the exact numbers provided for financial projections.

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

Use these exact financial projections in your response:
${JSON.stringify(projections, null, 2)}

Your response must be a JSON object with this structure:
{
  "executiveSummary": "2-3 paragraphs summarizing the business case",
  "financialProjections": ${JSON.stringify(projections, null, 2)},
  "roiAnalysis": "detailed analysis of return on investment",
  "riskAssessment": "key risks and mitigation strategies",
  "implementationTimeline": "high-level timeline for implementation"
}

Requirements:
1. Response must be valid JSON with no additional text
2. Use the EXACT financial projection numbers provided above
3. Do not perform any calculations - use the numbers exactly as provided
4. Focus on analysis and insights in the text sections`;

    const response = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [
        {
          role: 'system',
          content: 'You are a business analyst expert. Respond only with a valid JSON object containing the business case report. Do not perform any calculations - use the exact numbers provided. Do not include any additional text, markdown formatting, or explanations outside the JSON structure.',
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
      // Clean and parse the response
      const cleanedResult = cleanJsonResponse(result);
      const parsedResult = JSON.parse(cleanedResult);

      // Validate the structure of the parsed result
      if (!parsedResult.executiveSummary || !Array.isArray(parsedResult.financialProjections)) {
        throw new Error('Invalid report structure');
      }

      // Ensure we use our pre-calculated projections
      parsedResult.financialProjections = projections;

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