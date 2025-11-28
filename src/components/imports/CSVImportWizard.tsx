// CSV Import Wizard - Main Component

import { useState, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import {
  FileUp,
  CheckCircle,
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  X,
  Sparkles,
} from 'lucide-react';

import {
  ImportModule,
  ImportModuleConfig,
  ParsedCSVData,
  ColumnMapping,
  DuplicateRecord,
  ImportValidationResult,
  ImportResult,
  ImportProgress,
} from '@/lib/csv/types';
import { getModuleConfig } from '@/lib/csv/moduleConfigs';

import FileUploadStep from './FileUploadStep';
import ColumnMappingStep from './ColumnMappingStep';
import DataPreviewStep from './DataPreviewStep';
import DuplicateResolutionStep from './DuplicateResolutionStep';
import ImportResultsStep from './ImportResultsStep';

interface CSVImportWizardProps {
  module: ImportModule;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onImportComplete?: (result: ImportResult) => void;
}

type WizardStep = 'upload' | 'mapping' | 'preview' | 'duplicates' | 'importing' | 'results';

const STEP_TITLES: Record<WizardStep, string> = {
  upload: 'Upload CSV File',
  mapping: 'Map Columns',
  preview: 'Preview & Validate',
  duplicates: 'Handle Duplicates',
  importing: 'Importing...',
  results: 'Import Complete',
};

const STEP_ORDER: WizardStep[] = ['upload', 'mapping', 'preview', 'duplicates', 'importing', 'results'];

export default function CSVImportWizard({
  module,
  open,
  onOpenChange,
  onImportComplete,
}: CSVImportWizardProps) {
  const { user } = useAuth();
  const config = getModuleConfig(module);

  // Wizard state
  const [currentStep, setCurrentStep] = useState<WizardStep>('upload');
  const [useAI, setUseAI] = useState(false);

  // Data state
  const [parsedData, setParsedData] = useState<ParsedCSVData | null>(null);
  const [columnMappings, setColumnMappings] = useState<Record<string, string | null>>({});
  const [validationResult, setValidationResult] = useState<ImportValidationResult | null>(null);
  const [duplicates, setDuplicates] = useState<DuplicateRecord[]>([]);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const [progress, setProgress] = useState<ImportProgress>({
    stage: 'uploading',
    progress: 0,
    message: 'Ready to import',
  });

  // Error state
  const [error, setError] = useState<string | null>(null);

  if (!config) {
    return null;
  }

  const currentStepIndex = STEP_ORDER.indexOf(currentStep);
  const progressPercent = ((currentStepIndex + 1) / STEP_ORDER.length) * 100;

  const handleClose = () => {
    // Reset state
    setCurrentStep('upload');
    setParsedData(null);
    setColumnMappings({});
    setValidationResult(null);
    setDuplicates([]);
    setImportResult(null);
    setError(null);
    setUseAI(false);
    onOpenChange(false);
  };

  const handleFileUploaded = (data: ParsedCSVData) => {
    setParsedData(data);
    setError(null);
    setCurrentStep('mapping');
  };

  const handleMappingComplete = (mappings: Record<string, string | null>) => {
    setColumnMappings(mappings);
    setCurrentStep('preview');
  };

  const handleValidationComplete = (result: ImportValidationResult) => {
    setValidationResult(result);
    if (result.duplicates.length > 0) {
      setDuplicates(result.duplicates);
      setCurrentStep('duplicates');
    } else {
      setCurrentStep('importing');
    }
  };

  const handleDuplicatesResolved = (resolvedDuplicates: DuplicateRecord[]) => {
    setDuplicates(resolvedDuplicates);
    setCurrentStep('importing');
  };

  const handleImportComplete = (result: ImportResult) => {
    setImportResult(result);
    setCurrentStep('results');
    onImportComplete?.(result);
  };

  const goBack = () => {
    const prevIndex = currentStepIndex - 1;
    if (prevIndex >= 0) {
      setCurrentStep(STEP_ORDER[prevIndex]);
    }
  };

  const canGoBack = currentStepIndex > 0 && currentStep !== 'importing' && currentStep !== 'results';

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="flex items-center gap-2">
              <FileUp className="h-5 w-5" />
              Import {config.displayName}
            </DialogTitle>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              Step {currentStepIndex + 1} of {STEP_ORDER.length}: {STEP_TITLES[currentStep]}
            </div>
          </div>
          <Progress value={progressPercent} className="h-2 mt-2" />
        </DialogHeader>

        {/* Step Content */}
        <div className="flex-1 overflow-y-auto py-4">
          {error && (
            <div className="mb-4 p-4 bg-destructive/10 border border-destructive/20 rounded-lg flex items-start gap-2">
              <AlertTriangle className="h-5 w-5 text-destructive flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-medium text-destructive">Error</p>
                <p className="text-sm text-muted-foreground">{error}</p>
              </div>
            </div>
          )}

          {currentStep === 'upload' && (
            <FileUploadStep
              config={config}
              useAI={useAI}
              onUseAIChange={setUseAI}
              onFileUploaded={handleFileUploaded}
              onError={setError}
            />
          )}

          {currentStep === 'mapping' && parsedData && (
            <ColumnMappingStep
              config={config}
              parsedData={parsedData}
              useAI={useAI}
              onMappingComplete={handleMappingComplete}
              onBack={goBack}
            />
          )}

          {currentStep === 'preview' && parsedData && (
            <DataPreviewStep
              config={config}
              parsedData={parsedData}
              columnMappings={columnMappings}
              organizationId={user?.organization_id || ''}
              onValidationComplete={handleValidationComplete}
              onBack={goBack}
            />
          )}

          {currentStep === 'duplicates' && validationResult && (
            <DuplicateResolutionStep
              config={config}
              duplicates={duplicates}
              onResolved={handleDuplicatesResolved}
              onBack={goBack}
            />
          )}

          {currentStep === 'importing' && validationResult && (
            <ImportingStep
              config={config}
              validationResult={validationResult}
              duplicates={duplicates}
              organizationId={user?.organization_id || ''}
              onComplete={handleImportComplete}
              onError={setError}
            />
          )}

          {currentStep === 'results' && importResult && (
            <ImportResultsStep
              config={config}
              result={importResult}
              onClose={handleClose}
            />
          )}
        </div>

        {/* Footer with navigation */}
        {currentStep !== 'importing' && currentStep !== 'results' && (
          <div className="flex justify-between items-center pt-4 border-t">
            <div>
              {canGoBack && (
                <Button variant="outline" onClick={goBack}>
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back
                </Button>
              )}
            </div>
            <Button variant="ghost" onClick={handleClose}>
              Cancel
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

// Importing Step - Shows progress while importing
interface ImportingStepProps {
  config: ImportModuleConfig;
  validationResult: ImportValidationResult;
  duplicates: DuplicateRecord[];
  organizationId: string;
  onComplete: (result: ImportResult) => void;
  onError: (error: string) => void;
}

function ImportingStep({
  config,
  validationResult,
  duplicates,
  organizationId,
  onComplete,
  onError,
}: ImportingStepProps) {
  const [progress, setProgress] = useState({ current: 0, total: 0, message: 'Starting import...' });

  // Import effect
  useState(() => {
    performImport();
  });

  async function performImport() {
    const { supabase } = await import('@/integrations/supabase/client');
    const { mergeRecords } = await import('@/lib/csv/validation');

    const result: ImportResult = {
      success: true,
      imported: 0,
      merged: 0,
      skipped: 0,
      failed: 0,
      errors: [],
    };

    const rowsToImport = validationResult.validRows;
    const duplicateMap = new Map(
      duplicates.map(d => [d.importRowIndex, d])
    );

    setProgress({ current: 0, total: rowsToImport.length, message: 'Importing records...' });

    for (let i = 0; i < rowsToImport.length; i++) {
      const row = rowsToImport[i];
      const duplicate = duplicateMap.get(i);

      try {
        if (duplicate) {
          if (duplicate.resolution === 'skip') {
            result.skipped++;
          } else if (duplicate.resolution === 'merge') {
            // Merge with existing record
            const mergedData = mergeRecords(duplicate.existingRecord, row, config);
            const { error } = await (supabase as any)
              .from(config.tableName)
              .update(mergedData)
              .eq('id', duplicate.existingRecord.id);

            if (error) throw error;
            result.merged++;
          } else {
            // Create new record
            const { error } = await (supabase as any)
              .from(config.tableName)
              .insert({
                ...row,
                organization_id: organizationId,
              });

            if (error) throw error;
            result.imported++;
          }
        } else {
          // New record
          const { error } = await (supabase as any)
            .from(config.tableName)
            .insert({
              ...row,
              organization_id: organizationId,
            });

          if (error) throw error;
          result.imported++;
        }
      } catch (err: any) {
        result.failed++;
        result.errors.push({
          rowIndex: i,
          error: err.message || 'Unknown error',
        });
      }

      setProgress({
        current: i + 1,
        total: rowsToImport.length,
        message: `Importing record ${i + 1} of ${rowsToImport.length}...`,
      });
    }

    result.success = result.failed === 0 || result.failed < rowsToImport.length;
    onComplete(result);
  }

  const percentComplete = progress.total > 0 ? (progress.current / progress.total) * 100 : 0;

  return (
    <div className="flex flex-col items-center justify-center py-12 space-y-6">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      <div className="text-center space-y-2">
        <h3 className="text-lg font-medium">Importing {config.displayName}</h3>
        <p className="text-sm text-muted-foreground">{progress.message}</p>
      </div>
      <div className="w-full max-w-md">
        <Progress value={percentComplete} className="h-2" />
        <p className="text-center text-sm text-muted-foreground mt-2">
          {progress.current} of {progress.total} records
        </p>
      </div>
    </div>
  );
}
