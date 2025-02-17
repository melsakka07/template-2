'use client';

import { useState, useRef } from 'react';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ReportPreview } from '@/components/ReportPreview';
import { generateDocx } from '@/lib/export/docxConverter';
import { generatePdf } from '@/lib/export/pdfConverter';
import { Download, Upload, Save } from 'lucide-react';

const businessCaseSchema = z.object({
  projectName: z.string().min(3, 'Project name must be at least 3 characters'),
  company: z.string().min(2, 'Company name must be at least 2 characters'),
  country: z.string().min(2, 'Country must be at least 2 characters'),
  industry: z.string().min(2, 'Industry must be at least 2 characters'),
  financials: z.object({
    totalCost: z.number().min(0),
    capex: z.number().min(0),
    opex: z.number().min(0),
  }),
  customers: z.object({
    initialCount: z.number().min(0),
    growthRate: z.number().min(0),
    arpu: z.number().min(0),
  }),
});

type BusinessCaseData = z.infer<typeof businessCaseSchema>;

interface ReportData {
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

export function BusinessCaseForm() {
  const [activeTab, setActiveTab] = useState('basic');
  const [isGenerating, setIsGenerating] = useState(false);
  const [reportData, setReportData] = useState<ReportData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const { register, handleSubmit, formState: { errors }, reset, getValues } = useForm<BusinessCaseData>({
    resolver: zodResolver(businessCaseSchema),
    defaultValues: {
      financials: { totalCost: 0, capex: 0, opex: 0 },
      customers: { initialCount: 0, growthRate: 0, arpu: 0 },
    },
  });

  const handleExportFormData = () => {
    const formData = getValues();
    const blob = new Blob([JSON.stringify(formData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${formData.projectName || 'business-case'}-form-data.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleImportFormData = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const content = e.target?.result as string;
        const importedData = JSON.parse(content);
        const validatedData = businessCaseSchema.parse(importedData);
        reset(validatedData);
        setActiveTab('basic');
        setError(null);
      } catch (error) {
        setError('Invalid form data file. Please check the file format.');
      }
    };
    reader.readAsText(file);
    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const onSubmit = async (data: BusinessCaseData) => {
    setIsGenerating(true);
    setError(null);
    try {
      const response = await fetch('/api/generate-report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.details || 'Failed to generate report');
      }

      const result = await response.json();
      setReportData(result);
      setActiveTab('preview');
    } catch (error) {
      console.error('Error generating report:', error);
      setError(error instanceof Error ? error.message : 'An unexpected error occurred');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleExport = async (format: 'docx' | 'pdf') => {
    if (!reportData) return;

    try {
      if (format === 'docx') {
        await generateDocx(reportData);
      } else {
        await generatePdf(reportData);
      }
    } catch (error) {
      console.error(`Error exporting as ${format}:`, error);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <div className="mb-6 flex justify-end space-x-4">
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleImportFormData}
          accept=".json"
          className="hidden"
        />
        <Button
          type="button"
          variant="outline"
          onClick={() => fileInputRef.current?.click()}
        >
          <Upload className="w-4 h-4 mr-2" />
          Import Form Data
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={handleExportFormData}
        >
          <Save className="w-4 h-4 mr-2" />
          Save Form Data
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="basic">Basic Info</TabsTrigger>
          <TabsTrigger value="financials">Financials</TabsTrigger>
          <TabsTrigger value="customers">Customers</TabsTrigger>
          <TabsTrigger value="preview" disabled={!reportData}>Preview</TabsTrigger>
        </TabsList>

        <TabsContent value="basic">
          <Card className="p-6">
            <div className="space-y-4">
              <div>
                <Label htmlFor="projectName">Project Name</Label>
                <Input
                  id="projectName"
                  {...register('projectName')}
                  className="mt-1"
                />
                {errors.projectName && (
                  <p className="text-red-500 text-sm mt-1">{errors.projectName.message}</p>
                )}
              </div>

              <div>
                <Label htmlFor="company">Company</Label>
                <Input
                  id="company"
                  {...register('company')}
                  className="mt-1"
                />
                {errors.company && (
                  <p className="text-red-500 text-sm mt-1">{errors.company.message}</p>
                )}
              </div>

              <div>
                <Label htmlFor="country">Country</Label>
                <Input
                  id="country"
                  {...register('country')}
                  className="mt-1"
                />
                {errors.country && (
                  <p className="text-red-500 text-sm mt-1">{errors.country.message}</p>
                )}
              </div>

              <div>
                <Label htmlFor="industry">Industry</Label>
                <Input
                  id="industry"
                  {...register('industry')}
                  className="mt-1"
                />
                {errors.industry && (
                  <p className="text-red-500 text-sm mt-1">{errors.industry.message}</p>
                )}
              </div>
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="financials">
          <Card className="p-6">
            <div className="space-y-4">
              <div>
                <Label htmlFor="totalCost">Total Cost of Ownership (TCO)</Label>
                <Input
                  id="totalCost"
                  type="number"
                  {...register('financials.totalCost', { valueAsNumber: true })}
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="capex">Capital Expenditure (CAPEX)</Label>
                <Input
                  id="capex"
                  type="number"
                  {...register('financials.capex', { valueAsNumber: true })}
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="opex">Operating Expenditure (OPEX)</Label>
                <Input
                  id="opex"
                  type="number"
                  {...register('financials.opex', { valueAsNumber: true })}
                  className="mt-1"
                />
              </div>
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="customers">
          <Card className="p-6">
            <div className="space-y-4">
              <div>
                <Label htmlFor="initialCount">Initial Customer Count</Label>
                <Input
                  id="initialCount"
                  type="number"
                  {...register('customers.initialCount', { valueAsNumber: true })}
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="growthRate">Growth Rate (%)</Label>
                <Input
                  id="growthRate"
                  type="number"
                  {...register('customers.growthRate', { valueAsNumber: true })}
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="arpu">Average Revenue Per User (ARPU)</Label>
                <Input
                  id="arpu"
                  type="number"
                  {...register('customers.arpu', { valueAsNumber: true })}
                  className="mt-1"
                />
              </div>
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="preview">
          {error && (
            <div className="mb-4 p-4 bg-destructive/10 text-destructive rounded-md">
              {error}
            </div>
          )}
          {reportData && (
            <ReportPreview
              data={reportData}
              onExport={handleExport}
            />
          )}
        </TabsContent>
      </Tabs>

      <div className="mt-6 flex justify-end space-x-4">
        <Button
          type="button"
          variant="outline"
          onClick={() => {
            const newTab = activeTab === 'basic' ? 'basic' :
                          activeTab === 'financials' ? 'basic' :
                          activeTab === 'customers' ? 'financials' :
                          'customers';
            setActiveTab(newTab);
          }}
          disabled={activeTab === 'basic' || activeTab === 'preview'}
        >
          Previous
        </Button>
        
        {activeTab !== 'preview' && (
          <Button
            type="button"
            onClick={() => {
              const newTab = activeTab === 'basic' ? 'financials' :
                            activeTab === 'financials' ? 'customers' :
                            'preview';
              setActiveTab(newTab);
            }}
            disabled={activeTab === 'preview'}
          >
            Next
          </Button>
        )}

        {activeTab === 'customers' && (
          <Button type="submit" disabled={isGenerating}>
            {isGenerating ? (
              <>
                <span className="mr-2">Generating...</span>
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
              </>
            ) : (
              'Generate Report'
            )}
          </Button>
        )}
      </div>
    </form>
  );
} 