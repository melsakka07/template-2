'use client';

import { useState, useRef, useEffect } from 'react';
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
import { Download, Upload, Save, InfoIcon } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { LLMProvider } from '@/lib/llm/config';

const businessCaseSchema = z.object({
  projectName: z.string().min(3, 'Project name must be at least 3 characters'),
  company: z.string().min(2, 'Company name must be at least 2 characters'),
  country: z.string().min(2, 'Country must be at least 2 characters'),
  industry: z.string().min(2, 'Industry must be at least 2 characters'),
  llmProvider: z.enum(['gpt4', 'deepseek'] as const),
  financials: z.object({
    projectTimelineYears: z.number().min(1, 'Project timeline must be at least 1 year').max(10, 'Project timeline cannot exceed 10 years'),
    capex: z.number().min(0, 'CAPEX must be a positive number'),
    opex: z.number().min(0, 'OPEX must be a positive number'),
  }),
  customers: z.object({
    initialCount: z.number().min(1, 'Initial customer count must be at least 1'),
    growthRate: z.number().min(0, 'Growth rate must be a positive number').max(100, 'Growth rate cannot exceed 100%'),
    arpu: z.number().min(0, 'ARPU must be a positive number'),
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
}

export function BusinessCaseForm() {
  const [activeTab, setActiveTab] = useState('basic');
  const [isGenerating, setIsGenerating] = useState(false);
  const [reportData, setReportData] = useState<ReportData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [showTooltip, setShowTooltip] = useState<string | null>(null);
  const [tooltipContent, setTooltipContent] = useState<string | null>(null);
  const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 });
  const [autoSaveEnabled, setAutoSaveEnabled] = useState(true);
  const [formProgress, setFormProgress] = useState(0);
  
  const { register, handleSubmit, formState: { errors }, reset, getValues, setValue, watch } = useForm<BusinessCaseData>({
    resolver: zodResolver(businessCaseSchema),
    defaultValues: {
      llmProvider: 'gpt4',
      financials: { projectTimelineYears: 0, capex: 0, opex: 0 },
      customers: { initialCount: 0, growthRate: 0, arpu: 0 },
    },
    mode: 'onChange',
  });

  // Initialize autoSaveEnabled from localStorage on client-side
  useEffect(() => {
    const saved = localStorage.getItem('autoSaveEnabled');
    if (saved !== null) {
      setAutoSaveEnabled(JSON.parse(saved));
    }
  }, []);

  useEffect(() => {
    if (autoSaveEnabled) {
      const formData = getValues();
      localStorage.setItem('businessCaseFormData', JSON.stringify(formData));
    }
  }, [autoSaveEnabled, getValues]);

  useEffect(() => {
    const savedData = localStorage.getItem('businessCaseFormData');
    if (savedData) {
      try {
        const parsedData = JSON.parse(savedData);
        reset(parsedData);
      } catch (error) {
        console.error('Error loading saved form data:', error);
      }
    }
  }, [reset]);

  // Add helper function for checking filled fields
  const isFieldFilled = (value: unknown): boolean => {
    if (value === null || value === undefined) return false;
    if (typeof value === 'number') return value !== 0;
    if (typeof value === 'string') return value.trim() !== '';
    if (typeof value === 'object') {
      if (!value) return false;
      return Object.values(value).some(isFieldFilled);
    }
    return false;
  };

  // Update form progress whenever form values change
  useEffect(() => {
    const formData = getValues();
    let totalFields = 0;
    let filledFields = 0;

    // Count basic fields
    ['projectName', 'company', 'country', 'industry'].forEach(field => {
      totalFields++;
      if (isFieldFilled(formData[field as keyof BusinessCaseData])) {
        filledFields++;
      }
    });

    // Count financial fields
    ['projectTimelineYears', 'capex', 'opex'].forEach(field => {
      totalFields++;
      if (isFieldFilled(formData.financials[field as keyof typeof formData.financials])) {
        filledFields++;
      }
    });

    // Count customer fields
    ['initialCount', 'growthRate', 'arpu'].forEach(field => {
      totalFields++;
      if (isFieldFilled(formData.customers[field as keyof typeof formData.customers])) {
        filledFields++;
      }
    });

    setFormProgress(Math.round((filledFields / totalFields) * 100));
  }, [getValues, watch()]);

  const handleExportFormData = async () => {
    setIsSaving(true);
    try {
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
      setShowTooltip('Form data saved successfully!');
      setTimeout(() => setShowTooltip(null), 3000);
    } catch (error) {
      setShowTooltip('Error saving form data');
      setTimeout(() => setShowTooltip(null), 3000);
    } finally {
      setIsSaving(false);
    }
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

  // Format currency inputs
  const formatCurrency = (value: number): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  // Handle currency input changes
  const handleCurrencyChange = (e: React.ChangeEvent<HTMLInputElement>, field: string) => {
    const value = e.target.value.replace(/[^0-9]/g, '');
    setValue(field as any, Number(value), { shouldValidate: true });
  };

  const handleTooltip = (content: string, event: React.MouseEvent<HTMLLabelElement>) => {
    setTooltipContent(content);
    setTooltipPosition({ x: event.clientX, y: event.clientY });
  };

  const hideTooltip = () => {
    setTooltipContent(null);
  };

  // Format percentage inputs
  const formatPercentage = (value: number): string => {
    return `${value}%`;
  };

  // Handle percentage input changes
  const handlePercentageChange = (e: React.ChangeEvent<HTMLInputElement>, field: string) => {
    const value = e.target.value.replace(/[^0-9]/g, '');
    setValue(field as any, Number(value), { shouldValidate: true });
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <div className="mb-6 flex justify-between items-center">
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <Switch
              id="auto-save"
              checked={autoSaveEnabled}
              onCheckedChange={(checked) => {
                setAutoSaveEnabled(checked);
                localStorage.setItem('autoSaveEnabled', JSON.stringify(checked));
              }}
            />
            <Label htmlFor="auto-save">Auto-save form data</Label>
          </div>
          <div className="flex items-center space-x-2">
            <Label htmlFor="llm-provider">LLM Provider</Label>
            <Select
              value={watch('llmProvider')}
              onValueChange={(value: LLMProvider) => setValue('llmProvider', value)}
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Select LLM Provider" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="gpt4">GPT-4</SelectItem>
                <SelectItem value="deepseek">Deepseek</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="flex space-x-4">
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleImportFormData}
            accept=".json"
            className="hidden"
            aria-label="Import form data from JSON file"
            id="import-form-data"
          />
          <Button
            type="button"
            variant="outline"
            onClick={() => fileInputRef.current?.click()}
            aria-controls="import-form-data"
            className="relative"
            disabled={isSaving}
          >
            <Upload className="w-4 h-4 mr-2" />
            Import Form Data
            {showTooltip && (
              <div className="tooltip-position tooltip-content">
                {showTooltip}
              </div>
            )}
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={handleExportFormData}
            disabled={isSaving}
            className="relative"
          >
            {isSaving ? (
              <>
                <div className="loading-spinner" />
                Saving...
              </>
            ) : (
              <>
                <Save className="w-4 h-4 mr-2" />
                Save Form Data
              </>
            )}
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="basic">Basic Info</TabsTrigger>
          <TabsTrigger value="financials">Financials</TabsTrigger>
          <TabsTrigger value="customers">Customers</TabsTrigger>
          <TabsTrigger value="preview" disabled={!reportData}>Preview</TabsTrigger>
        </TabsList>

        <div className="mt-2 mb-4">
          <div className="flex justify-between text-sm text-muted-foreground mb-1">
            <span>Form Progress</span>
            <span>{formProgress}%</span>
          </div>
          <div className="h-2 w-full bg-gray-200 rounded-full">
            <div
              className="progress-bar progress-width"
              style={{ '--progress-width': `${formProgress}%` } as React.CSSProperties}
            />
          </div>
        </div>

        <TabsContent value="basic">
          <Card className="p-6">
            <div className="space-y-4">
              <div>
                <Label htmlFor="projectName">Project Name</Label>
                <Input
                  id="projectName"
                  {...register('projectName')}
                  className={`mt-1 ${errors.projectName ? 'border-red-500' : ''}`}
                  aria-describedby="projectName-help"
                />
                <p id="projectName-help" className="text-sm text-muted-foreground mt-1">
                  Enter a unique name for your business case project
                </p>
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
                <Label 
                  htmlFor="projectTimelineYears"
                  className="flex items-center gap-2"
                  onMouseEnter={(e) => handleTooltip('Number of years to analyze the business case', e)}
                  onMouseLeave={hideTooltip}
                >
                  Project Timeline (Years)
                  <InfoIcon className="w-4 h-4 text-muted-foreground" />
                </Label>
                <Input
                  id="projectTimelineYears"
                  type="number"
                  min="1"
                  max="10"
                  value={watch('financials.projectTimelineYears')}
                  onChange={(e) => setValue('financials.projectTimelineYears', Number(e.target.value), { shouldValidate: true })}
                  className={`mt-1 ${errors.financials?.projectTimelineYears ? 'border-red-500' : ''}`}
                />
                {errors.financials?.projectTimelineYears && (
                  <p className="text-red-500 text-sm mt-1">{errors.financials.projectTimelineYears?.message || 'Invalid value'}</p>
                )}
              </div>

              <div>
                <Label 
                  htmlFor="capex"
                  className="flex items-center gap-2"
                  onMouseEnter={(e) => handleTooltip('Capital Expenditure: One-time costs for long-term assets', e)}
                  onMouseLeave={hideTooltip}
                >
                  Capital Expenditure (CAPEX)
                  <InfoIcon className="w-4 h-4 text-muted-foreground" />
                </Label>
                <Input
                  id="capex"
                  value={formatCurrency(watch('financials.capex'))}
                  onChange={(e) => handleCurrencyChange(e, 'financials.capex')}
                  className={`mt-1 ${errors.financials?.capex ? 'border-red-500' : ''}`}
                />
                {errors.financials?.capex && (
                  <p className="text-red-500 text-sm mt-1">{errors.financials.capex?.message || 'Invalid value'}</p>
                )}
              </div>

              <div>
                <Label 
                  htmlFor="opex"
                  className="flex items-center gap-2"
                  onMouseEnter={(e) => handleTooltip('Operating Expenditure: Ongoing costs for running the business', e)}
                  onMouseLeave={hideTooltip}
                >
                  Operating Expenditure (OPEX)
                  <InfoIcon className="w-4 h-4 text-muted-foreground" />
                </Label>
                <Input
                  id="opex"
                  value={formatCurrency(watch('financials.opex'))}
                  onChange={(e) => handleCurrencyChange(e, 'financials.opex')}
                  className={`mt-1 ${errors.financials?.opex ? 'border-red-500' : ''}`}
                />
                {errors.financials?.opex && (
                  <p className="text-red-500 text-sm mt-1">{errors.financials.opex?.message || 'Invalid value'}</p>
                )}
              </div>
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="customers">
          <Card className="p-6">
            <div className="space-y-4">
              <div>
                <Label 
                  htmlFor="initialCount"
                  className="flex items-center gap-2"
                  onMouseEnter={(e) => handleTooltip('Starting number of customers for your business case', e)}
                  onMouseLeave={hideTooltip}
                >
                  Initial Customer Count
                  <InfoIcon className="w-4 h-4 text-muted-foreground" />
                </Label>
                <Input
                  id="initialCount"
                  type="number"
                  value={watch('customers.initialCount')}
                  onChange={(e) => setValue('customers.initialCount', Number(e.target.value), { shouldValidate: true })}
                  className={`mt-1 ${errors.customers?.initialCount ? 'border-red-500' : ''}`}
                  min="1"
                />
                {errors.customers?.initialCount && (
                  <p className="text-red-500 text-sm mt-1">{errors.customers.initialCount?.message || 'Invalid value'}</p>
                )}
                <p className="text-sm text-muted-foreground mt-1">
                  Enter the number of customers you expect to start with
                </p>
              </div>

              <div>
                <Label 
                  htmlFor="growthRate"
                  className="flex items-center gap-2"
                  onMouseEnter={(e) => handleTooltip('Expected annual growth rate of your customer base', e)}
                  onMouseLeave={hideTooltip}
                >
                  Growth Rate (%)
                  <InfoIcon className="w-4 h-4 text-muted-foreground" />
                </Label>
                <Input
                  id="growthRate"
                  value={formatPercentage(watch('customers.growthRate'))}
                  onChange={(e) => handlePercentageChange(e, 'customers.growthRate')}
                  className={`mt-1 ${errors.customers?.growthRate ? 'border-red-500' : ''}`}
                />
                {errors.customers?.growthRate && (
                  <p className="text-red-500 text-sm mt-1">{errors.customers.growthRate?.message || 'Invalid value'}</p>
                )}
                <p className="text-sm text-muted-foreground mt-1">
                  Enter the expected yearly growth rate (0-100%)
                </p>
              </div>

              <div>
                <Label 
                  htmlFor="arpu"
                  className="flex items-center gap-2"
                  onMouseEnter={(e) => handleTooltip('Average Revenue Per User: Expected revenue from each customer per month', e)}
                  onMouseLeave={hideTooltip}
                >
                  Average Revenue Per User (ARPU)
                  <InfoIcon className="w-4 h-4 text-muted-foreground" />
                </Label>
                <Input
                  id="arpu"
                  value={formatCurrency(watch('customers.arpu'))}
                  onChange={(e) => handleCurrencyChange(e, 'customers.arpu')}
                  className={`mt-1 ${errors.customers?.arpu ? 'border-red-500' : ''}`}
                />
                {errors.customers?.arpu && (
                  <p className="text-red-500 text-sm mt-1">{errors.customers.arpu?.message || 'Invalid value'}</p>
                )}
                <p className="text-sm text-muted-foreground mt-1">
                  Enter the average monthly revenue expected per customer
                </p>
              </div>

              <div className="mt-6 bg-muted p-4 rounded-lg">
                <h3 className="text-sm font-medium mb-2">Projected First Year Revenue</h3>
                <p className="text-2xl font-bold">
                  {formatCurrency(
                    watch('customers.initialCount') * 
                    watch('customers.arpu') * 
                    12
                  )}
                </p>
                <p className="text-sm text-muted-foreground mt-1">
                  Based on initial customers and ARPU (annually)
                </p>
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

      {tooltipContent && (
        <div
          className="tooltip-fixed dynamic-position"
          style={{
            '--tooltip-top': `${tooltipPosition.y + 10}px`,
            '--tooltip-left': `${tooltipPosition.x + 10}px`
          } as React.CSSProperties}
        >
          {tooltipContent}
        </div>
      )}

      <div className="mt-6 flex justify-end space-x-4">
        <Button
          type="button"
          variant="outline"
          onClick={() => {
            const newTab = activeTab === 'basic' ? 'basic' :
                          activeTab === 'financials' ? 'basic' :
                          activeTab === 'customers' ? 'financials' :
                          activeTab === 'preview' ? 'customers' :
                          'customers';
            setActiveTab(newTab);
          }}
          disabled={activeTab === 'basic'}
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
                <div className="loading-spinner" />
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