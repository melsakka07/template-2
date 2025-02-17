'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  ReferenceLine
} from 'recharts';
import { Download } from 'lucide-react';
import { curveMonotoneX } from 'd3-shape';
import { format } from 'date-fns';

interface ReportPreviewProps {
  data: {
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
    projectName: string;
    company: string;
  };
  onExport: (format: 'docx' | 'pdf') => Promise<void>;
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

function formatNumber(value: number): string {
  if (value >= 1000000) {
    return `${(value / 1000000).toFixed(1)}M`;
  } else if (value >= 1000) {
    return `${(value / 1000).toFixed(1)}K`;
  }
  return value.toString();
}

function formatCurrency(value: number): string {
  if (value >= 1000000) {
    return `$${(value / 1000000).toFixed(1)}M`;
  } else if (value >= 1000) {
    return `$${(value / 1000).toFixed(1)}K`;
  }
  return `$${value}`;
}

// Add custom tooltip component
const CustomTooltip = ({ active, payload, label, prefix = '' }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white p-4 border rounded-lg shadow-lg">
        <p className="font-medium text-sm">{`Year ${label}`}</p>
        {payload.map((entry: any, index: number) => (
          <p key={index} className="text-sm" style={{ color: entry.color }}>
            {`${entry.name}: ${prefix}${entry.value.toLocaleString()}`}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

// Update the downloadChart function
const downloadChart = (chartId: string, fileName: string) => {
  const chartSvg = document.querySelector(`#${chartId} svg`);
  if (chartSvg) {
    const svgData = new XMLSerializer().serializeToString(chartSvg);
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();
    
    img.onload = () => {
      if (ctx) {
        canvas.width = img.width;
        canvas.height = img.height;
        ctx.fillStyle = 'white';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0);
        const pngFile = canvas.toDataURL('image/png');
        const downloadLink = document.createElement('a');
        downloadLink.download = `${fileName}.png`;
        downloadLink.href = pngFile;
        downloadLink.click();
      }
    };
    
    img.src = 'data:image/svg+xml;base64,' + btoa(svgData);
  }
};

export function ReportPreview({ data, onExport }: ReportPreviewProps) {
  const handleExport = async (format: 'docx' | 'pdf') => {
    try {
      const response = await fetch(`/api/export/${format}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error(`Failed to generate ${format.toUpperCase()}`);
      }

      // Get the blob from the response
      const blob = await response.blob();
      
      // Create a download link and trigger the download
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `business-case-report.${format}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error(`Error exporting ${format}:`, error);
      // You might want to add a toast notification here
      alert(`Failed to export as ${format.toUpperCase()}`);
    }
  };

  // Calculate cumulative cash flow for the break-even chart
  const cumulativeCashFlow = data.financialProjections.reduce((acc: any[], projection: any) => {
    const previousValue = acc.length > 0 ? acc[acc.length - 1].cumulative : 0;
    const cashFlow = projection.revenue - projection.opex;
    return [...acc, {
      year: projection.year,
      cumulative: previousValue + cashFlow,
    }];
  }, []);

  // Prepare data for the cost breakdown pie chart
  const costBreakdown = [
    { name: 'CAPEX', value: data.financialProjections[0].opex },
    { name: 'Year 1 OPEX', value: data.financialProjections[0].opex },
    { name: 'Year 2 OPEX', value: data.financialProjections[1].opex },
    { name: 'Year 3 OPEX', value: data.financialProjections[2].opex },
    { name: 'Year 4 OPEX', value: data.financialProjections[3].opex },
    { name: 'Year 5 OPEX', value: data.financialProjections[4].opex },
  ];

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Executive Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-600">{data.executiveSummary}</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Financial Charts</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-8">
            {/* Revenue and Customer Growth Chart */}
            <div>
              <div className="flex justify-between items-center mb-4">
                <h4 className="font-medium text-sm">Revenue and Customer Growth</h4>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => downloadChart('revenue-chart', 'revenue-growth')}
                >
                  <Download className="w-4 h-4 mr-2" />
                  Download Chart
                </Button>
              </div>
              <div className="h-[400px] w-full" id="revenue-chart">
                <ResponsiveContainer>
                  <LineChart
                    data={data.financialProjections}
                    margin={{ top: 5, right: 30, left: 60, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                      dataKey="year"
                      tickFormatter={(value) => `Year ${value}`}
                    />
                    <YAxis 
                      yAxisId="left"
                      tickFormatter={(value) => formatCurrency(value)}
                      label={{ value: 'Revenue', angle: -90, position: 'insideLeft', offset: -45 }}
                    />
                    <YAxis 
                      yAxisId="right" 
                      orientation="right"
                      tickFormatter={(value) => formatNumber(value)}
                      label={{ value: 'Customers', angle: 90, position: 'insideRight', offset: -45 }}
                    />
                    <Tooltip content={<CustomTooltip prefix="$" />} />
                    <Legend />
                    <Line
                      yAxisId="left"
                      type="monotone"
                      dataKey="revenue"
                      stroke="#8884d8"
                      name="Revenue"
                      strokeWidth={2}
                      dot={{ r: 4 }}
                      activeDot={{ r: 8 }}
                      animationDuration={1500}
                    />
                    <Line
                      yAxisId="right"
                      type="monotone"
                      dataKey="customers"
                      stroke="#82ca9d"
                      name="Customers"
                      strokeWidth={2}
                      dot={{ r: 4 }}
                      activeDot={{ r: 8 }}
                      animationDuration={1500}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Break-even Analysis Chart */}
            <div>
              <div className="flex justify-between items-center mb-4">
                <h4 className="font-medium text-sm">Break-even Analysis</h4>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => downloadChart('breakeven-chart', 'breakeven-analysis')}
                >
                  <Download className="w-4 h-4 mr-2" />
                  Download Chart
                </Button>
              </div>
              <div className="h-[400px] w-full" id="breakeven-chart">
                <ResponsiveContainer>
                  <LineChart
                    data={cumulativeCashFlow}
                    margin={{ top: 5, right: 30, left: 60, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                      dataKey="year"
                      tickFormatter={(value) => `Year ${value}`}
                    />
                    <YAxis 
                      tickFormatter={(value) => formatCurrency(value)}
                      label={{ value: 'Cumulative Cash Flow', angle: -90, position: 'insideLeft', offset: -45 }}
                    />
                    <Tooltip content={<CustomTooltip prefix="$" />} />
                    <Legend />
                    <ReferenceLine y={0} stroke="red" strokeDasharray="3 3" />
                    <Line
                      type="monotone"
                      dataKey="cumulative"
                      stroke="#ff7300"
                      name="Cumulative Cash Flow"
                      strokeWidth={2}
                      dot={{ r: 4 }}
                      activeDot={{ r: 8 }}
                      animationDuration={1500}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Revenue vs OPEX Comparison */}
            <div>
              <div className="flex justify-between items-center mb-4">
                <h4 className="font-medium text-sm">Revenue vs Operating Expenses</h4>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => downloadChart('revenue-opex-chart', 'revenue-opex-comparison')}
                >
                  <Download className="w-4 h-4 mr-2" />
                  Download Chart
                </Button>
              </div>
              <div className="h-[400px] w-full" id="revenue-opex-chart">
                <ResponsiveContainer>
                  <BarChart
                    data={data.financialProjections}
                    margin={{ top: 5, right: 30, left: 60, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                      dataKey="year"
                      tickFormatter={(value) => `Year ${value}`}
                    />
                    <YAxis 
                      tickFormatter={(value) => formatCurrency(value)}
                      label={{ value: 'Amount', angle: -90, position: 'insideLeft', offset: -45 }}
                    />
                    <Tooltip content={<CustomTooltip prefix="$" />} />
                    <Legend />
                    <Bar 
                      dataKey="revenue" 
                      fill="#8884d8" 
                      name="Revenue"
                      animationDuration={1500}
                      radius={[4, 4, 0, 0]}
                    >
                      {data.financialProjections.map((entry, index) => (
                        <Cell key={`cell-${index}`} fillOpacity={0.8 + (index * 0.04)} />
                      ))}
                    </Bar>
                    <Bar 
                      dataKey="opex" 
                      fill="#82ca9d" 
                      name="OPEX"
                      animationDuration={1500}
                      radius={[4, 4, 0, 0]}
                    >
                      {data.financialProjections.map((entry, index) => (
                        <Cell key={`cell-${index}`} fillOpacity={0.8 + (index * 0.04)} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Cost Breakdown Pie Chart */}
            <div>
              <div className="flex justify-between items-center mb-4">
                <h4 className="font-medium text-sm">5-Year Cost Breakdown</h4>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => downloadChart('cost-breakdown-chart', 'cost-breakdown')}
                >
                  <Download className="w-4 h-4 mr-2" />
                  Download Chart
                </Button>
              </div>
              <div className="h-[400px] w-full" id="cost-breakdown-chart">
                <ResponsiveContainer>
                  <PieChart>
                    <Pie
                      data={costBreakdown}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, value, percent }) => 
                        `${name} (${formatCurrency(value)}, ${(percent * 100).toFixed(0)}%)`
                      }
                      outerRadius={150}
                      fill="#8884d8"
                      dataKey="value"
                      animationDuration={1500}
                    >
                      {costBreakdown.map((entry, index) => (
                        <Cell 
                          key={`cell-${index}`} 
                          fill={COLORS[index % COLORS.length]}
                          strokeWidth={2}
                          stroke="#fff"
                        />
                      ))}
                    </Pie>
                    <Tooltip 
                      content={<CustomTooltip prefix="$" />}
                      formatter={(value: number) => formatCurrency(value)}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Financial Projections</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead>
                <tr>
                  <th className="px-4 py-2 text-left text-sm font-medium text-gray-500">Year</th>
                  <th className="px-4 py-2 text-left text-sm font-medium text-gray-500">Revenue</th>
                  <th className="px-4 py-2 text-left text-sm font-medium text-gray-500">Customers</th>
                  <th className="px-4 py-2 text-left text-sm font-medium text-gray-500">OPEX</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {data.financialProjections.map((projection) => (
                  <tr key={projection.year}>
                    <td className="px-4 py-2 text-sm text-gray-900">{projection.year}</td>
                    <td className="px-4 py-2 text-sm text-gray-900">${projection.revenue.toLocaleString()}</td>
                    <td className="px-4 py-2 text-sm text-gray-900">{projection.customers.toLocaleString()}</td>
                    <td className="px-4 py-2 text-sm text-gray-900">${projection.opex.toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Financial Analysis</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <h4 className="font-medium text-sm">Net Present Value (NPV)</h4>
                <p className="text-sm text-gray-600">{data.financialAnalysis.metrics.npv.toLocaleString()}</p>
              </div>
              <div>
                <h4 className="font-medium text-sm">Internal Rate of Return (IRR)</h4>
                <p className="text-sm text-gray-600">{data.financialAnalysis.metrics.irr}%</p>
              </div>
              <div>
                <h4 className="font-medium text-sm">Return on Investment (ROI)</h4>
                <p className="text-sm text-gray-600">{data.financialAnalysis.metrics.roi}%</p>
              </div>
              <div>
                <h4 className="font-medium text-sm">Payback Period</h4>
                <p className="text-sm text-gray-600">{data.financialAnalysis.metrics.paybackPeriod} years</p>
              </div>
            </div>
            <div>
              <h4 className="font-medium text-sm mb-2">Analysis</h4>
              <p className="text-sm text-gray-600">{data.financialAnalysis.analysis}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Market Analysis</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <h4 className="font-medium text-sm">Market Size</h4>
              <p className="text-sm text-gray-600">{data.marketAnalysis.marketSize}</p>
            </div>
            <div>
              <h4 className="font-medium text-sm">Competitive Analysis</h4>
              <p className="text-sm text-gray-600">{data.marketAnalysis.competitiveAnalysis}</p>
            </div>
            <div>
              <h4 className="font-medium text-sm">Market Trends</h4>
              <p className="text-sm text-gray-600">{data.marketAnalysis.marketTrends}</p>
            </div>
            <div>
              <h4 className="font-medium text-sm">Growth Opportunities</h4>
              <p className="text-sm text-gray-600">{data.marketAnalysis.growthOpportunities}</p>
            </div>
            <div>
              <h4 className="font-medium text-sm">Entry Barriers</h4>
              <p className="text-sm text-gray-600">{data.marketAnalysis.entryBarriers}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Risk Assessment</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            <div>
              <h4 className="font-medium text-sm mb-2">Identified Risks</h4>
              <div className="text-sm text-gray-600 whitespace-pre-line">
                {data.riskAssessment.risks}
              </div>
            </div>
            <div>
              <h4 className="font-medium text-sm mb-2">Impact Assessment</h4>
              <div className="text-sm text-gray-600 whitespace-pre-line">
                {data.riskAssessment.impactAssessment}
              </div>
            </div>
            <div>
              <h4 className="font-medium text-sm mb-2">Mitigation Strategies</h4>
              <div className="text-sm text-gray-600 whitespace-pre-line">
                {data.riskAssessment.mitigationStrategies}
              </div>
            </div>
            <div>
              <h4 className="font-medium text-sm mb-2">Contingency Plans</h4>
              <div className="text-sm text-gray-600 whitespace-pre-line">
                {data.riskAssessment.contingencyPlans}
              </div>
            </div>
            <div>
              <h4 className="font-medium text-sm mb-2">Risk Monitoring Approach</h4>
              <div className="text-sm text-gray-600 whitespace-pre-line">
                {data.riskAssessment.riskMonitoringApproach}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Implementation Timeline</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <h4 className="font-medium text-sm mb-2">Phases</h4>
              {data.implementationTimeline.phases.map((phase, index) => (
                <div key={index} className="mb-4 pl-4 border-l-2 border-gray-200">
                  <h5 className="font-medium text-sm">{phase.phase}</h5>
                  <p className="text-sm text-gray-600">Duration: {phase.duration}</p>
                  <p className="text-sm text-gray-600">Activities: {phase.keyActivities}</p>
                  <p className="text-sm text-gray-600">Deliverables: {phase.deliverables}</p>
                </div>
              ))}
            </div>
            <div>
              <h4 className="font-medium text-sm">Critical Path</h4>
              <p className="text-sm text-gray-600">{data.implementationTimeline.criticalPath}</p>
            </div>
            <div>
              <h4 className="font-medium text-sm">Key Milestones</h4>
              <p className="text-sm text-gray-600">{data.implementationTimeline.keyMilestones}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Recommendations</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <h4 className="font-medium text-sm">Strategic Recommendations</h4>
              <p className="text-sm text-gray-600">{data.recommendations.strategic}</p>
            </div>
            <div>
              <h4 className="font-medium text-sm">Operational Recommendations</h4>
              <p className="text-sm text-gray-600">{data.recommendations.operational}</p>
            </div>
            <div>
              <h4 className="font-medium text-sm">Financial Recommendations</h4>
              <p className="text-sm text-gray-600">{data.recommendations.financial}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end space-x-4">
        <Button variant="outline" onClick={() => handleExport('docx')}>
          Export as DOCX
        </Button>
        <Button variant="outline" onClick={() => handleExport('pdf')}>
          Export as PDF
        </Button>
      </div>
    </div>
  );
} 