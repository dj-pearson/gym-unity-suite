// File Upload Step Component

import { useState, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Upload,
  FileText,
  Download,
  Sparkles,
  CheckCircle,
  AlertCircle,
} from 'lucide-react';

import { ImportModuleConfig, ParsedCSVData } from '@/lib/csv/types';
import { parseCSVFile, generateTemplateCSV } from '@/lib/csv/parser';

interface FileUploadStepProps {
  config: ImportModuleConfig;
  useAI: boolean;
  onUseAIChange: (useAI: boolean) => void;
  onFileUploaded: (data: ParsedCSVData) => void;
  onError: (error: string) => void;
}

export default function FileUploadStep({
  config,
  useAI,
  onUseAIChange,
  onFileUploaded,
  onError,
}: FileUploadStepProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const file = e.dataTransfer.files[0];
    if (file && file.name.endsWith('.csv')) {
      processFile(file);
    } else {
      onError('Please upload a CSV file');
    }
  }, []);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  const processFile = async (file: File) => {
    setSelectedFile(file);
    setIsProcessing(true);

    try {
      const data = await parseCSVFile(file);

      if (data.rows.length === 0) {
        onError('The CSV file appears to be empty');
        setIsProcessing(false);
        return;
      }

      if (data.errors.length > 0) {
        console.warn('Parse warnings:', data.errors);
      }

      onFileUploaded(data);
    } catch (err: any) {
      onError(err.message || 'Failed to parse CSV file');
    } finally {
      setIsProcessing(false);
    }
  };

  const downloadTemplate = () => {
    const headers = config.fields.map(f => f.name);

    // Generate example rows
    const exampleRows = [
      config.fields.reduce((acc, f) => {
        acc[f.name] = f.examples?.[0] || '';
        return acc;
      }, {} as Record<string, string>),
      config.fields.reduce((acc, f) => {
        acc[f.name] = f.examples?.[1] || f.examples?.[0] || '';
        return acc;
      }, {} as Record<string, string>),
    ];

    const csv = generateTemplateCSV(headers, exampleRows);
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = config.templateFileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* AI Import Toggle */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              <CardTitle className="text-base">AI-Powered Import</CardTitle>
            </div>
            <Switch
              checked={useAI}
              onCheckedChange={onUseAIChange}
              aria-label="Enable AI Import"
            />
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          <CardDescription>
            {useAI ? (
              <>
                AI will automatically analyze your data and suggest column mappings.
                It can also help transform data to match the required format.
              </>
            ) : (
              <>
                Enable AI to automatically map columns and clean data.
                Your data will be processed locally with AI assistance.
              </>
            )}
          </CardDescription>
        </CardContent>
      </Card>

      {/* File Upload Area */}
      <div
        className={`
          border-2 border-dashed rounded-lg p-12 text-center transition-colors
          ${isDragging ? 'border-primary bg-primary/5' : 'border-muted-foreground/25'}
          ${isProcessing ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
        `}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".csv"
          onChange={handleFileSelect}
          className="hidden"
        />

        <div className="flex flex-col items-center gap-4">
          {isProcessing ? (
            <>
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
              <p className="text-lg font-medium">Processing file...</p>
            </>
          ) : selectedFile ? (
            <>
              <CheckCircle className="h-12 w-12 text-green-500" />
              <div>
                <p className="text-lg font-medium">{selectedFile.name}</p>
                <p className="text-sm text-muted-foreground">
                  {(selectedFile.size / 1024).toFixed(1)} KB
                </p>
              </div>
            </>
          ) : (
            <>
              <Upload className="h-12 w-12 text-muted-foreground" />
              <div>
                <p className="text-lg font-medium">
                  Drop your CSV file here or click to browse
                </p>
                <p className="text-sm text-muted-foreground mt-1">
                  Supports .csv files up to 10MB
                </p>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Template Download */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Need a template?
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0 space-y-4">
          <CardDescription>
            Download our template with the correct column headers and example data.
            Fill in your data and upload the completed file.
          </CardDescription>
          <Button variant="outline" onClick={downloadTemplate}>
            <Download className="h-4 w-4 mr-2" />
            Download Template
          </Button>
        </CardContent>
      </Card>

      {/* Field Reference */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Expected Fields</CardTitle>
          <CardDescription>
            These are the fields you can include in your CSV import
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {config.fields.map((field) => (
              <div
                key={field.name}
                className="flex items-center gap-2 text-sm"
              >
                <span
                  className={`h-2 w-2 rounded-full ${
                    field.required ? 'bg-destructive' : 'bg-muted-foreground/50'
                  }`}
                />
                <span className={field.required ? 'font-medium' : ''}>
                  {field.label}
                </span>
              </div>
            ))}
          </div>
          <p className="text-xs text-muted-foreground mt-3">
            <span className="inline-flex items-center gap-1">
              <span className="h-2 w-2 rounded-full bg-destructive" />
              Required fields
            </span>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
