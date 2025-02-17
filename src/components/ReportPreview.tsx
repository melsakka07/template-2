'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

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
  };
  onExport: (format: 'docx' | 'pdf') => void;
}

export function ReportPreview({ data, onExport }: ReportPreviewProps) {
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
          <div className="space-y-4">
            <div>
              <h4 className="font-medium text-sm">Identified Risks</h4>
              <p className="text-sm text-gray-600">{data.riskAssessment.risks}</p>
            </div>
            <div>
              <h4 className="font-medium text-sm">Impact Assessment</h4>
              <p className="text-sm text-gray-600">{data.riskAssessment.impactAssessment}</p>
            </div>
            <div>
              <h4 className="font-medium text-sm">Mitigation Strategies</h4>
              <p className="text-sm text-gray-600">{data.riskAssessment.mitigationStrategies}</p>
            </div>
            <div>
              <h4 className="font-medium text-sm">Contingency Plans</h4>
              <p className="text-sm text-gray-600">{data.riskAssessment.contingencyPlans}</p>
            </div>
            <div>
              <h4 className="font-medium text-sm">Risk Monitoring Approach</h4>
              <p className="text-sm text-gray-600">{data.riskAssessment.riskMonitoringApproach}</p>
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
        <Button variant="outline" onClick={() => onExport('docx')}>
          Export as DOCX
        </Button>
        <Button variant="outline" onClick={() => onExport('pdf')}>
          Export as PDF
        </Button>
      </div>
    </div>
  );
} 