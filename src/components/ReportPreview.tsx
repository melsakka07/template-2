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
    roiAnalysis: string;
    riskAssessment: string;
    implementationTimeline: string;
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
          <CardTitle>ROI Analysis</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-600">{data.roiAnalysis}</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Risk Assessment</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-600">{data.riskAssessment}</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Implementation Timeline</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-600">{data.implementationTimeline}</p>
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