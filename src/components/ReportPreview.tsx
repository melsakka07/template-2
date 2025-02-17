'use client';

import React, { useState, useCallback } from 'react';
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
  ReferenceLine,
  ComposedChart,
  Rectangle,
  Brush,
  ReferenceArea,
  Sector,
  ScatterChart,
  Scatter,
  ZAxis
} from 'recharts';
import { Download, RefreshCw, Maximize2, ChevronRight } from 'lucide-react';
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
        breakEvenPoint: number;
        cac: number;
        clv: number;
        grossMargin: number[];
        operatingMargin: number[];
        ebitda: number[];
        workingCapital: number[];
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

// Enhanced MetricCard with animation and hover effects
const MetricCard = ({ title, value, description, trend }: { 
  title: string; 
  value: string | number; 
  description?: string;
  trend?: { value: number; label: string; } 
}) => (
  <div className="bg-white rounded-lg p-4 shadow-sm border group hover:shadow-md transition-all duration-300 transform hover:-translate-y-1">
    <h3 className="text-sm font-medium text-gray-500 group-hover:text-primary transition-colors">{title}</h3>
    <div className="mt-2 flex items-baseline">
      <p className="text-2xl font-semibold group-hover:text-primary transition-colors">{value}</p>
      {trend && (
        <span className={`ml-2 text-sm font-medium ${trend.value >= 0 ? 'text-green-600' : 'text-red-600'} opacity-0 group-hover:opacity-100 transition-opacity duration-300`}>
          {trend.value >= 0 ? '↑' : '↓'} {Math.abs(trend.value)}%
          <span className="text-gray-500 ml-1">{trend.label}</span>
        </span>
      )}
    </div>
    {description && (
      <p className="mt-1 text-sm text-gray-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300">{description}</p>
    )}
  </div>
);

// Add a new component for risk assessment visualization
const RiskAssessmentMatrix = ({ risks }: { risks: string }) => {
  // Parse risks into structured data
  const riskItems = risks.split('\n').filter(Boolean).map(risk => {
    const isPriority = risk.toLowerCase().includes('high') || risk.toLowerCase().includes('critical');
    const isModerate = risk.toLowerCase().includes('medium') || risk.toLowerCase().includes('moderate');
    return {
      text: risk,
      priority: isPriority ? 'high' : isModerate ? 'medium' : 'low'
    };
  });

  return (
    <div className="mt-4 grid grid-cols-1 gap-2">
      {riskItems.map((risk, index) => (
        <div 
          key={index}
          className={`p-3 rounded-lg flex items-center space-x-3 ${
            risk.priority === 'high' 
              ? 'bg-red-50 border-red-200 border' 
              : risk.priority === 'medium'
                ? 'bg-yellow-50 border-yellow-200 border'
                : 'bg-green-50 border-green-200 border'
          }`}
        >
          <div className={`w-2 h-2 rounded-full ${
            risk.priority === 'high' 
              ? 'bg-red-500' 
              : risk.priority === 'medium'
                ? 'bg-yellow-500'
                : 'bg-green-500'
          }`} />
          <span className="text-sm">{risk.text}</span>
        </div>
      ))}
    </div>
  );
};

// Add a new component for implementation timeline visualization
const TimelineVisualization = ({ phases }: { phases: Array<{ phase: string; duration: string; keyActivities: string; deliverables: string; }> }) => (
  <div className="mt-4 relative">
    <div className="absolute left-8 top-0 bottom-0 w-0.5 bg-gray-200" />
    {phases.map((phase, index) => (
      <div key={index} className="relative pl-20 pb-8">
        <div className="absolute left-6 -translate-x-1/2 w-4 h-4 rounded-full bg-primary border-4 border-white" />
        <div className="bg-white rounded-lg p-4 shadow-sm border hover:shadow-md transition-shadow">
          <h4 className="font-medium">{phase.phase}</h4>
          <p className="text-sm text-gray-500 mt-1">Duration: {phase.duration}</p>
          <div className="mt-2 space-y-2">
            <div>
              <h5 className="text-sm font-medium">Key Activities</h5>
              <p className="text-sm text-gray-600">{phase.keyActivities}</p>
            </div>
            <div>
              <h5 className="text-sm font-medium">Deliverables</h5>
              <p className="text-sm text-gray-600">{phase.deliverables}</p>
            </div>
          </div>
        </div>
      </div>
    ))}
  </div>
);

// Add a custom waterfall chart component
const WaterfallChart = ({ data }: { data: any[] }) => {
  // Calculate cumulative values for the waterfall chart
  const waterfallData = data.reduce((acc: any[], curr, index) => {
    const previousEnd = index > 0 ? acc[index - 1].end : 0;
    const revenue = curr.revenue;
    const opex = curr.opex;
    const profit = revenue - opex;
    
    return [...acc, {
      name: `Year ${curr.year}`,
      start: previousEnd,
      revenue: revenue,
      opex: -opex,
      profit: profit,
      end: previousEnd + profit,
      fill: profit >= 0 ? '#82ca9d' : '#ff7373'
    }];
  }, []);

  const CustomBar = (props: any) => {
    const { x, y, width, height, fill } = props;
    return <Rectangle x={x} y={y} width={width} height={height} fill={fill} />;
  };

  return (
    <ResponsiveContainer width="100%" height={400}>
      <ComposedChart
        data={waterfallData}
        margin={{ top: 20, right: 30, left: 60, bottom: 5 }}
      >
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="name" />
        <YAxis 
          tickFormatter={(value) => formatCurrency(value)}
          label={{ value: 'Cumulative Profit', angle: -90, position: 'insideLeft', offset: -45 }}
        />
        <Tooltip 
          formatter={(value: number) => formatCurrency(value)}
          content={({ active, payload, label }) => {
            if (active && payload && payload.length) {
              return (
                <div className="bg-white p-4 border rounded-lg shadow-lg">
                  <p className="font-medium text-sm">{label}</p>
                  <p className="text-sm text-green-600">
                    Revenue: {formatCurrency(payload[0].payload.revenue)}
                  </p>
                  <p className="text-sm text-red-600">
                    OPEX: {formatCurrency(-payload[0].payload.opex)}
                  </p>
                  <p className="text-sm font-medium">
                    Profit: {formatCurrency(payload[0].payload.profit)}
                  </p>
                  <p className="text-sm text-gray-600">
                    Cumulative: {formatCurrency(payload[0].payload.end)}
                  </p>
                </div>
              );
            }
            return null;
          }}
        />
        <Bar
          dataKey="profit"
          fill="#82ca9d"
          shape={<CustomBar />}
          stackId="stack"
        />
        <ReferenceLine y={0} stroke="#666" />
      </ComposedChart>
    </ResponsiveContainer>
  );
};

// Add new component for active pie sector
const renderActiveShape = (props: any) => {
  const {
    cx, cy, innerRadius, outerRadius, startAngle, endAngle,
    fill, payload, percent, value
  } = props;

  return (
    <g>
      <text x={cx} y={cy} dy={-20} textAnchor="middle" fill={fill}>
        {payload.name}
      </text>
      <text x={cx} y={cy} dy={0} textAnchor="middle" fill="#999">
        {formatCurrency(value)}
      </text>
      <text x={cx} y={cy} dy={20} textAnchor="middle" fill="#999">
        {`(${(percent * 100).toFixed(2)}%)`}
      </text>
      <Sector
        cx={cx}
        cy={cy}
        innerRadius={innerRadius}
        outerRadius={outerRadius + 6}
        startAngle={startAngle}
        endAngle={endAngle}
        fill={fill}
      />
      <Sector
        cx={cx}
        cy={cy}
        startAngle={startAngle}
        endAngle={endAngle}
        innerRadius={outerRadius + 6}
        outerRadius={outerRadius + 10}
        fill={fill}
      />
    </g>
  );
};

interface ScatterShapeProps {
  cx: number;
  cy: number;
  fill: string;
}

// Add a new component for the scatter plot matrix
const ScatterPlotMatrix = ({ data }: { data: any[] }) => (
  <div className="h-[400px] w-full overflow-x-auto">
    <ResponsiveContainer>
      <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 60 }}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis 
          type="number"
          dataKey="revenue"
          name="Revenue"
          tickFormatter={(value) => formatCurrency(value)}
          label={{ value: 'Revenue', position: 'bottom' }}
        />
        <YAxis 
          type="number"
          dataKey="customers"
          name="Customers"
          tickFormatter={(value) => formatNumber(value)}
          label={{ value: 'Customers', angle: -90, position: 'left' }}
        />
        <ZAxis 
          type="number"
          dataKey="opex"
          name="OPEX"
          range={[100, 1000]}
        />
        <Tooltip 
          cursor={{ strokeDasharray: '3 3' }}
          content={({ active, payload }) => {
            if (active && payload && payload.length) {
              const data = payload[0].payload;
              return (
                <div className="bg-white p-4 border rounded-lg shadow-lg">
                  <p className="font-medium text-sm">Year {data.year}</p>
                  <p className="text-sm text-primary">Revenue: {formatCurrency(data.revenue)}</p>
                  <p className="text-sm text-secondary">Customers: {formatNumber(data.customers)}</p>
                  <p className="text-sm text-destructive">OPEX: {formatCurrency(data.opex)}</p>
                </div>
              );
            }
            return null;
          }}
        />
        <Scatter
          name="Business Metrics"
          data={data}
          fill="#8884d8"
          shape={(props: any) => (
            <circle
              cx={props.cx}
              cy={props.cy}
              r={8}
              fill={props.fill}
              className="transition-all duration-300 hover:r-12 hover:fill-opacity-80"
            />
          )}
        />
      </ScatterChart>
    </ResponsiveContainer>
  </div>
);

// Add a new component for expandable sections
const ExpandableSection = ({ title, children }: { title: string; children: React.ReactNode }) => {
  const [isExpanded, setIsExpanded] = useState(true);
  
  return (
    <div className="border rounded-lg overflow-hidden">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full px-4 py-2 flex items-center justify-between bg-gray-50 hover:bg-gray-100 transition-colors"
      >
        <span className="font-medium text-sm">{title}</span>
        <ChevronRight className={`w-4 h-4 transition-transform duration-300 ${isExpanded ? 'rotate-90' : ''}`} />
      </button>
      <div className={`transition-all duration-300 ${isExpanded ? 'max-h-[500px] opacity-100' : 'max-h-0 opacity-0'} overflow-hidden`}>
        <div className="p-4">
          {children}
        </div>
      </div>
    </div>
  );
};

export function ReportPreview({ data, onExport }: ReportPreviewProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [zoomDomain, setZoomDomain] = useState<{ refAreaLeft: number | null; refAreaRight: number | null }>({
    refAreaLeft: null,
    refAreaRight: null
  });
  const [isZoomed, setIsZoomed] = useState(false);
  const [expandedCard, setExpandedCard] = useState<string | null>(null);

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

  const handleCardExpand = useCallback((cardId: string) => {
    setExpandedCard(expandedCard === cardId ? null : cardId);
  }, [expandedCard]);

  return (
    <div className="space-y-6 max-w-[1400px] mx-auto px-4 sm:px-6">
      {/* Executive Summary Card */}
      <Card className="transform transition-all duration-300 hover:shadow-lg">
        <CardHeader className="cursor-pointer" onClick={() => handleCardExpand('summary')}>
          <div className="flex items-center justify-between">
            <CardTitle>Executive Summary</CardTitle>
            <Maximize2 className={`w-4 h-4 transition-transform duration-300 ${expandedCard === 'summary' ? 'rotate-180' : ''}`} />
          </div>
        </CardHeader>
        <CardContent className={`transition-all duration-300 ${expandedCard === 'summary' ? 'max-h-[1000px]' : 'max-h-40'} overflow-hidden`}>
          <p className="text-sm text-gray-600">{data.executiveSummary}</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Key Metrics</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <MetricCard
              title="Net Present Value"
              value={formatCurrency(data.financialAnalysis.metrics.npv)}
              trend={{
                value: data.financialAnalysis.metrics.roi,
                label: "ROI"
              }}
            />
            <MetricCard
              title="Internal Rate of Return"
              value={`${data.financialAnalysis.metrics.irr}%`}
              description="Expected rate of return"
            />
            <MetricCard
              title="Payback Period"
              value={`${data.financialAnalysis.metrics.paybackPeriod} years`}
              description="Time to recover investment"
            />
            <MetricCard
              title="5-Year Revenue"
              value={formatCurrency(
                data.financialProjections.reduce((sum, proj) => sum + proj.revenue, 0)
              )}
              trend={{
                value: Math.round(
                  ((data.financialProjections[4].revenue - data.financialProjections[0].revenue) /
                    data.financialProjections[0].revenue) * 100
                ),
                label: "Growth"
              }}
            />
          </div>
        </CardContent>
      </Card>

      {/* Financial Charts Section */}
      <Card className="transform transition-all duration-300 hover:shadow-lg">
        <CardHeader>
          <CardTitle>Financial Analysis Dashboard</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-8">
            {/* Add Scatter Plot Matrix */}
            <ExpandableSection title="Metrics Correlation Analysis">
              <ScatterPlotMatrix data={data.financialProjections} />
              <p className="text-sm text-gray-500 mt-2">
                This chart shows the relationship between Revenue, Customers, and OPEX (bubble size).
              </p>
            </ExpandableSection>

            {/* Existing Charts with Enhanced Responsiveness */}
            <ExpandableSection title="Revenue and Customer Growth">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-2">
                <h4 className="font-medium text-sm">Revenue and Customer Growth</h4>
                <div className="flex gap-2">
                  {isZoomed && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setIsZoomed(false);
                        setZoomDomain({ refAreaLeft: null, refAreaRight: null });
                      }}
                    >
                      <RefreshCw className="w-4 h-4 mr-2" />
                      Reset Zoom
                    </Button>
                  )}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => downloadChart('revenue-chart', 'revenue-growth')}
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Download Chart
                  </Button>
                </div>
              </div>
              <div className="h-[400px] w-full overflow-x-auto" id="revenue-chart">
                <ResponsiveContainer>
                  <LineChart
                    data={data.financialProjections}
                    margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                    onMouseDown={(e) => {
                      if (e?.activeLabel) {
                        const year = Number(e.activeLabel);
                        if (!isNaN(year)) {
                          setZoomDomain({ ...zoomDomain, refAreaLeft: year });
                        }
                      }
                    }}
                    onMouseMove={(e) => {
                      if (e?.activeLabel && zoomDomain.refAreaLeft) {
                        const year = Number(e.activeLabel);
                        if (!isNaN(year)) {
                          setZoomDomain({ ...zoomDomain, refAreaRight: year });
                        }
                      }
                    }}
                    onMouseUp={() => {
                      if (zoomDomain.refAreaLeft && zoomDomain.refAreaRight) {
                        setIsZoomed(true);
                      }
                      setZoomDomain({ refAreaLeft: null, refAreaRight: null });
                    }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                      dataKey="year"
                      tickFormatter={(value) => `Year ${value}`}
                      padding={{ left: 30, right: 30 }}
                    />
                    <YAxis 
                      yAxisId="left"
                      tickFormatter={(value) => formatCurrency(value)}
                      label={{ value: 'Revenue', angle: -90, position: 'insideLeft', offset: 0 }}
                    />
                    <YAxis 
                      yAxisId="right" 
                      orientation="right"
                      tickFormatter={(value) => formatNumber(value)}
                      label={{ value: 'Customers', angle: 90, position: 'insideRight', offset: 0 }}
                    />
                    <Tooltip content={<CustomTooltip prefix="$" />} />
                    <Legend verticalAlign="bottom" height={36} />
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
                    <Brush 
                      dataKey="year"
                      height={30}
                      stroke="#8884d8"
                      tickFormatter={(value) => `Year ${value}`}
                    />
                    {zoomDomain.refAreaLeft && zoomDomain.refAreaRight && (
                      <ReferenceArea
                        yAxisId="left"
                        x1={zoomDomain.refAreaLeft}
                        x2={zoomDomain.refAreaRight}
                        strokeOpacity={0.3}
                      />
                    )}
                  </LineChart>
                </ResponsiveContainer>
              </div>
              <p className="text-sm text-gray-500 mt-2 hidden sm:block">
                Tip: Click and drag to zoom into a specific time period. Double-click to reset zoom.
              </p>
            </ExpandableSection>

            <ExpandableSection title="Break-even Analysis">
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
            </ExpandableSection>

            <ExpandableSection title="Revenue vs Operating Expenses">
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
            </ExpandableSection>

            <ExpandableSection title="Cost Breakdown">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-2">
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
              <div className="h-[400px] w-full overflow-x-auto" id="cost-breakdown-chart">
                <ResponsiveContainer>
                  <PieChart>
                    <Pie
                      activeIndex={activeIndex}
                      activeShape={renderActiveShape}
                      data={costBreakdown}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                      onMouseEnter={(_, index) => setActiveIndex(index)}
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
              <p className="text-sm text-gray-500 mt-2 hidden sm:block">
                Hover over segments to see detailed cost breakdown information.
              </p>
            </ExpandableSection>

            <ExpandableSection title="Profit Waterfall Analysis">
              <div className="flex justify-between items-center mb-4">
                <h4 className="font-medium text-sm">Profit Waterfall Analysis</h4>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => downloadChart('waterfall-chart', 'profit-waterfall')}
                >
                  <Download className="w-4 h-4 mr-2" />
                  Download Chart
                </Button>
              </div>
              <div className="h-[400px] w-full" id="waterfall-chart">
                <WaterfallChart data={data.financialProjections} />
              </div>
              <p className="text-sm text-gray-500 mt-2">
                This chart shows the cumulative profit progression over the years, breaking down revenue and operating expenses.
              </p>
            </ExpandableSection>

            <ExpandableSection title="Detailed Financial Metrics">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <MetricCard
                  title="Break-even Point"
                  value={data.financialAnalysis.metrics.breakEvenPoint ? 
                    `${data.financialAnalysis.metrics.breakEvenPoint.toLocaleString()} customers` :
                    'N/A'}
                  description="Number of customers needed to cover all costs"
                />
                <MetricCard
                  title="Customer Acquisition Cost"
                  value={data.financialAnalysis.metrics.cac ? 
                    formatCurrency(data.financialAnalysis.metrics.cac) :
                    'N/A'}
                  description="Average cost to acquire a new customer"
                />
                <MetricCard
                  title="Customer Lifetime Value"
                  value={data.financialAnalysis.metrics.clv ? 
                    formatCurrency(data.financialAnalysis.metrics.clv) :
                    'N/A'}
                  description="Expected revenue from a customer over time"
                />
              </div>

              {data.financialAnalysis.metrics.grossMargin && data.financialAnalysis.metrics.operatingMargin && (
                <div className="mt-6">
                  <h4 className="font-medium text-sm mb-4">Margin Analysis</h4>
                  <div className="h-[400px] w-full" id="margins-chart">
                    <ResponsiveContainer>
                      <LineChart
                        data={data.financialProjections.map((proj, index) => ({
                          year: proj.year,
                          grossMargin: data.financialAnalysis.metrics.grossMargin?.[index] ?? 0,
                          operatingMargin: data.financialAnalysis.metrics.operatingMargin?.[index] ?? 0,
                          ebitda: data.financialAnalysis.metrics.ebitda?.[index] ?? 0,
                        }))}
                        margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis 
                          dataKey="year"
                          tickFormatter={(value) => `Year ${value}`}
                        />
                        <YAxis 
                          tickFormatter={(value) => `${value}%`}
                          label={{ value: 'Percentage', angle: -90, position: 'insideLeft' }}
                        />
                        <Tooltip 
                          formatter={(value: number) => `${value.toFixed(1)}%`}
                          content={({ active, payload, label }) => {
                            if (active && payload && payload.length) {
                              return (
                                <div className="bg-white p-4 border rounded-lg shadow-lg">
                                  <p className="font-medium text-sm">{`Year ${label}`}</p>
                                  {payload.map((entry: any, index: number) => (
                                    <p key={index} className="text-sm" style={{ color: entry.color }}>
                                      {`${entry.name}: ${entry.value.toFixed(1)}%`}
                                    </p>
                                  ))}
                                </div>
                              );
                            }
                            return null;
                          }}
                        />
                        <Legend />
                        <Line
                          type="monotone"
                          dataKey="grossMargin"
                          stroke="#8884d8"
                          name="Gross Margin"
                          strokeWidth={2}
                          dot={{ r: 4 }}
                          activeDot={{ r: 8 }}
                        />
                        <Line
                          type="monotone"
                          dataKey="operatingMargin"
                          stroke="#82ca9d"
                          name="Operating Margin"
                          strokeWidth={2}
                          dot={{ r: 4 }}
                          activeDot={{ r: 8 }}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              )}

              {data.financialAnalysis.metrics.workingCapital && (
                <div className="mt-6">
                  <h4 className="font-medium text-sm mb-4">Working Capital Requirements</h4>
                  <div className="h-[300px] w-full" id="working-capital-chart">
                    <ResponsiveContainer>
                      <BarChart
                        data={data.financialProjections.map((proj, index) => ({
                          year: proj.year,
                          workingCapital: data.financialAnalysis.metrics.workingCapital?.[index] ?? 0,
                        }))}
                        margin={{ top: 5, right: 30, left: 60, bottom: 5 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis 
                          dataKey="year"
                          tickFormatter={(value) => `Year ${value}`}
                        />
                        <YAxis 
                          tickFormatter={(value) => formatCurrency(value)}
                          label={{ value: 'Working Capital', angle: -90, position: 'insideLeft', offset: -45 }}
                        />
                        <Tooltip 
                          formatter={(value: number) => formatCurrency(value)}
                          content={({ active, payload, label }) => {
                            if (active && payload && payload.length) {
                              return (
                                <div className="bg-white p-4 border rounded-lg shadow-lg">
                                  <p className="font-medium text-sm">{`Year ${label}`}</p>
                                  <p className="text-sm text-primary">
                                    Working Capital: {formatCurrency(payload[0].value)}
                                  </p>
                                </div>
                              );
                            }
                            return null;
                          }}
                        />
                        <Bar 
                          dataKey="workingCapital" 
                          fill="#8884d8"
                          radius={[4, 4, 0, 0]}
                        >
                          {data.financialProjections.map((_, index) => (
                            <Cell key={`cell-${index}`} fillOpacity={0.8 + (index * 0.04)} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                  <p className="text-sm text-gray-500 mt-2">
                    Working capital requirements are estimated at 20% of annual revenue to maintain operations.
                  </p>
                </div>
              )}
            </ExpandableSection>

            <ExpandableSection title="Risk Analysis and Mitigation">
              <div className="space-y-6">
                {/* Risk Matrix */}
                <div>
                  <h4 className="font-medium text-sm mb-4">Risk Assessment Matrix</h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                      <h5 className="font-medium text-red-700 mb-2">High Impact Risks</h5>
                      <div className="text-sm text-red-600 space-y-1">
                        {data.riskAssessment.impactAssessment
                          .split('\n')
                          .filter(risk => risk.toLowerCase().includes('high'))
                          .map((risk, index) => (
                            <p key={index} className="flex items-start">
                              <span className="mr-2">•</span>
                              <span>{risk}</span>
                            </p>
                          ))}
                      </div>
                    </div>
                    <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                      <h5 className="font-medium text-yellow-700 mb-2">Medium Impact Risks</h5>
                      <div className="text-sm text-yellow-600 space-y-1">
                        {data.riskAssessment.impactAssessment
                          .split('\n')
                          .filter(risk => risk.toLowerCase().includes('medium'))
                          .map((risk, index) => (
                            <p key={index} className="flex items-start">
                              <span className="mr-2">•</span>
                              <span>{risk}</span>
                            </p>
                          ))}
                      </div>
                    </div>
                    <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                      <h5 className="font-medium text-green-700 mb-2">Low Impact Risks</h5>
                      <div className="text-sm text-green-600 space-y-1">
                        {data.riskAssessment.impactAssessment
                          .split('\n')
                          .filter(risk => risk.toLowerCase().includes('low'))
                          .map((risk, index) => (
                            <p key={index} className="flex items-start">
                              <span className="mr-2">•</span>
                              <span>{risk}</span>
                            </p>
                          ))}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Mitigation Strategies */}
                <div>
                  <h4 className="font-medium text-sm mb-4">Risk Mitigation Strategies</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="p-4 bg-white border rounded-lg shadow-sm">
                      <h5 className="font-medium mb-2">Preventive Measures</h5>
                      <div className="text-sm text-gray-600">
                        {data.riskAssessment.mitigationStrategies
                          .split('\n')
                          .map((strategy, index) => (
                            <p key={index} className="flex items-start mb-1">
                              <span className="mr-2">•</span>
                              <span>{strategy}</span>
                            </p>
                          ))}
                      </div>
                    </div>
                    <div className="p-4 bg-white border rounded-lg shadow-sm">
                      <h5 className="font-medium mb-2">Contingency Plans</h5>
                      <div className="text-sm text-gray-600">
                        {data.riskAssessment.contingencyPlans
                          .split('\n')
                          .map((plan, index) => (
                            <p key={index} className="flex items-start mb-1">
                              <span className="mr-2">•</span>
                              <span>{plan}</span>
                            </p>
                          ))}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Risk Monitoring */}
                <div>
                  <h4 className="font-medium text-sm mb-4">Risk Monitoring Approach</h4>
                  <div className="p-4 bg-white border rounded-lg shadow-sm">
                    <div className="text-sm text-gray-600">
                      {data.riskAssessment.riskMonitoringApproach
                        .split('\n')
                        .map((approach, index) => (
                          <p key={index} className="mb-2">{approach}</p>
                        ))}
                    </div>
                  </div>
                </div>

                {/* Financial Risk Indicators */}
                <div>
                  <h4 className="font-medium text-sm mb-4">Financial Risk Indicators</h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <MetricCard
                      title="Break-even Risk"
                      value={data.financialAnalysis.metrics.breakEvenPoint ? 
                        `${Math.round((data.financialAnalysis.metrics.breakEvenPoint / data.financialProjections[0].customers) * 100)}%` :
                        'N/A'}
                      description="Percentage of Year 1 target customers needed to break even"
                    />
                    <MetricCard
                      title="CAC to LTV Ratio"
                      value={data.financialAnalysis.metrics.cac && data.financialAnalysis.metrics.clv ? 
                        `${((data.financialAnalysis.metrics.clv / data.financialAnalysis.metrics.cac)).toFixed(2)}x` :
                        'N/A'}
                      description="Customer lifetime value to acquisition cost ratio"
                    />
                    <MetricCard
                      title="Working Capital Ratio"
                      value={data.financialAnalysis.metrics.workingCapital?.[0] ? 
                        `${((data.financialAnalysis.metrics.workingCapital[0] / data.financialProjections[0].revenue) * 100).toFixed(1)}%` :
                        'N/A'}
                      description="Working capital as percentage of revenue"
                    />
                  </div>
                </div>
              </div>
            </ExpandableSection>

            <ExpandableSection title="Market and Competition Analysis">
              <div className="space-y-6">
                {/* SWOT Analysis */}
                <div>
                  <h4 className="font-medium text-sm mb-4">SWOT Analysis</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                      <h5 className="font-medium text-green-700 mb-2">Strengths</h5>
                      <ul className="list-disc list-inside text-sm text-green-600 space-y-1">
                        <li>Strong financial metrics (ROI: {data.financialAnalysis.metrics.roi}%)</li>
                        <li>High customer lifetime value (${data.financialAnalysis.metrics.clv?.toLocaleString()})</li>
                        <li>Efficient customer acquisition (CAC: ${data.financialAnalysis.metrics.cac?.toLocaleString()})</li>
                      </ul>
                    </div>
                    <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                      <h5 className="font-medium text-yellow-700 mb-2">Weaknesses</h5>
                      <ul className="list-disc list-inside text-sm text-yellow-600 space-y-1">
                        <li>Initial capital requirements</li>
                        <li>Market entry costs</li>
                        <li>Operational setup time</li>
                      </ul>
                    </div>
                    <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                      <h5 className="font-medium text-blue-700 mb-2">Opportunities</h5>
                      <div className="text-sm text-blue-600 space-y-1">
                        {data.marketAnalysis.growthOpportunities.split('\n').map((opportunity, index) => (
                          <p key={index} className="flex items-start">
                            <span className="mr-2">•</span>
                            <span>{opportunity}</span>
                          </p>
                        ))}
                      </div>
                    </div>
                    <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                      <h5 className="font-medium text-red-700 mb-2">Threats</h5>
                      <div className="text-sm text-red-600 space-y-1">
                        {data.riskAssessment.risks.split('\n').map((risk, index) => (
                          <p key={index} className="flex items-start">
                            <span className="mr-2">•</span>
                            <span>{risk}</span>
                          </p>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Porter's Five Forces */}
                <div>
                  <h4 className="font-medium text-sm mb-4">Porter's Five Forces Analysis</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    <div className="p-4 bg-white border rounded-lg shadow-sm">
                      <h5 className="font-medium mb-2">Competitive Rivalry</h5>
                      <div className="text-sm text-gray-600">
                        {data.marketAnalysis.competitiveAnalysis.split('\n').map((point, index) => (
                          <p key={index} className="flex items-start mb-1">
                            <span className="mr-2">•</span>
                            <span>{point}</span>
                          </p>
                        ))}
                      </div>
                    </div>
                    <div className="p-4 bg-white border rounded-lg shadow-sm">
                      <h5 className="font-medium mb-2">Barriers to Entry</h5>
                      <div className="text-sm text-gray-600">
                        {data.marketAnalysis.entryBarriers.split('\n').map((barrier, index) => (
                          <p key={index} className="flex items-start mb-1">
                            <span className="mr-2">•</span>
                            <span>{barrier}</span>
                          </p>
                        ))}
                      </div>
                    </div>
                    <div className="p-4 bg-white border rounded-lg shadow-sm">
                      <h5 className="font-medium mb-2">Market Trends</h5>
                      <div className="text-sm text-gray-600">
                        {data.marketAnalysis.marketTrends.split('\n').map((trend, index) => (
                          <p key={index} className="flex items-start mb-1">
                            <span className="mr-2">•</span>
                            <span>{trend}</span>
                          </p>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Market Size and Growth */}
                <div>
                  <h4 className="font-medium text-sm mb-4">Market Size and Growth Potential</h4>
                  <div className="p-4 bg-white border rounded-lg shadow-sm">
                    <div className="text-sm text-gray-600">
                      {data.marketAnalysis.marketSize.split('\n').map((paragraph, index) => (
                        <p key={index} className="mb-2">{paragraph}</p>
                      ))}
                    </div>
                    <div className="mt-4">
                      <h5 className="font-medium text-sm mb-2">Projected Market Share</h5>
                      <div className="h-[300px]">
                        <ResponsiveContainer>
                          <LineChart
                            data={data.financialProjections.map(proj => ({
                              year: proj.year,
                              marketShare: (proj.customers / (1000000)) * 100, // Assuming total market size of 1M customers
                            }))}
                            margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                          >
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis
                              dataKey="year"
                              tickFormatter={(value) => `Year ${value}`}
                            />
                            <YAxis
                              tickFormatter={(value) => `${value.toFixed(1)}%`}
                              label={{ value: 'Market Share', angle: -90, position: 'insideLeft' }}
                            />
                            <Tooltip
                              formatter={(value: number) => [`${value.toFixed(2)}%`, 'Market Share']}
                              labelFormatter={(label) => `Year ${label}`}
                            />
                            <Line
                              type="monotone"
                              dataKey="marketShare"
                              stroke="#8884d8"
                              strokeWidth={2}
                              dot={{ r: 4 }}
                              activeDot={{ r: 8 }}
                            />
                          </LineChart>
                        </ResponsiveContainer>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </ExpandableSection>
          </div>
        </CardContent>
      </Card>

      {/* Financial Projections Table */}
      <Card className="transform transition-all duration-300 hover:shadow-lg overflow-hidden">
        <CardHeader>
          <CardTitle>Financial Projections</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto -mx-4 sm:-mx-6">
            <div className="inline-block min-w-full align-middle">
              <div className="overflow-hidden border rounded-lg">
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
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Market Analysis Section */}
      <Card className="transform transition-all duration-300 hover:shadow-lg">
        <CardHeader>
          <CardTitle>Market Analysis</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <ExpandableSection title="Market Size & Potential">
              <p className="text-sm text-gray-600">{data.marketAnalysis.marketSize}</p>
            </ExpandableSection>
            
            <ExpandableSection title="Competitive Analysis">
              <p className="text-sm text-gray-600">{data.marketAnalysis.competitiveAnalysis}</p>
            </ExpandableSection>
            
            <ExpandableSection title="Market Trends">
              <p className="text-sm text-gray-600">{data.marketAnalysis.marketTrends}</p>
            </ExpandableSection>
            
            <ExpandableSection title="Growth Opportunities">
              <p className="text-sm text-gray-600">{data.marketAnalysis.growthOpportunities}</p>
            </ExpandableSection>
            
            <ExpandableSection title="Entry Barriers">
              <p className="text-sm text-gray-600">{data.marketAnalysis.entryBarriers}</p>
            </ExpandableSection>
          </div>
        </CardContent>
      </Card>

      {/* Export Buttons */}
      <div className="sticky bottom-4 flex flex-col sm:flex-row justify-end gap-4 bg-white/80 backdrop-blur-sm p-4 rounded-lg shadow-lg">
        <Button 
          variant="outline" 
          onClick={() => handleExport('docx')} 
          className="w-full sm:w-auto hover:bg-primary hover:text-white transition-colors"
        >
          <Download className="w-4 h-4 mr-2" />
          Export as DOCX
        </Button>
        <Button 
          variant="outline" 
          onClick={() => handleExport('pdf')} 
          className="w-full sm:w-auto hover:bg-primary hover:text-white transition-colors"
        >
          <Download className="w-4 h-4 mr-2" />
          Export as PDF
        </Button>
      </div>
    </div>
  );
} 