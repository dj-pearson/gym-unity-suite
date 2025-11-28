// Column Mapping Step Component

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import {
  ArrowRight,
  Sparkles,
  Check,
  X,
  AlertCircle,
  RefreshCw,
} from 'lucide-react';

import { ImportModuleConfig, ParsedCSVData, AIFieldSuggestion } from '@/lib/csv/types';
import { autoMapColumns } from '@/lib/csv/parser';
import { getAIColumnMapping } from '@/lib/csv/aiImport';

interface ColumnMappingStepProps {
  config: ImportModuleConfig;
  parsedData: ParsedCSVData;
  useAI: boolean;
  onMappingComplete: (mappings: Record<string, string | null>) => void;
  onBack: () => void;
}

export default function ColumnMappingStep({
  config,
  parsedData,
  useAI,
  onMappingComplete,
  onBack,
}: ColumnMappingStepProps) {
  const [mappings, setMappings] = useState<Record<string, string | null>>({});
  const [aiSuggestions, setAiSuggestions] = useState<AIFieldSuggestion[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);

  // Initialize mappings on mount
  useEffect(() => {
    initializeMappings();
  }, []);

  const initializeMappings = async () => {
    setIsLoading(true);

    // First, try auto-mapping based on column names
    const targetFields = config.fields.map(f => ({ name: f.name, label: f.label }));
    const autoMapped = autoMapColumns(parsedData.headers, targetFields);
    setMappings(autoMapped);

    // If AI is enabled, get AI suggestions
    if (useAI) {
      try {
        const suggestions = await getAIColumnMapping(
          parsedData.headers,
          parsedData.rows,
          config
        );
        setAiSuggestions(suggestions);

        // Apply AI suggestions where they have high confidence and no existing mapping
        const enhancedMappings = { ...autoMapped };
        suggestions.forEach(suggestion => {
          if (suggestion.confidence >= 0.7 && suggestion.suggestedTarget) {
            // Only apply if no existing mapping or AI is more confident
            if (!enhancedMappings[suggestion.sourceColumn]) {
              enhancedMappings[suggestion.sourceColumn] = suggestion.suggestedTarget;
            }
          }
        });
        setMappings(enhancedMappings);
      } catch (err: any) {
        console.error('AI mapping error:', err);
        setAiError('AI suggestions unavailable. Using automatic matching.');
      }
    }

    setIsLoading(false);
  };

  const handleMappingChange = (sourceColumn: string, targetField: string | null) => {
    setMappings(prev => ({
      ...prev,
      [sourceColumn]: targetField === 'none' ? null : targetField,
    }));
  };

  const getAISuggestion = (sourceColumn: string): AIFieldSuggestion | undefined => {
    return aiSuggestions.find(s => s.sourceColumn === sourceColumn);
  };

  const handleContinue = () => {
    onMappingComplete(mappings);
  };

  // Check if all required fields are mapped
  const requiredFields = config.fields.filter(f => f.required).map(f => f.name);
  const mappedFields = new Set(Object.values(mappings).filter(Boolean));
  const missingRequired = requiredFields.filter(f => !mappedFields.has(f));

  // Get sample data for preview
  const sampleRows = parsedData.rows.slice(0, 3);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-12 space-y-4">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary"></div>
        <p className="text-muted-foreground">
          {useAI ? 'AI is analyzing your columns...' : 'Analyzing columns...'}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* AI Status */}
      {useAI && (
        <Card className={aiError ? 'border-yellow-500/50' : 'border-primary/50'}>
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              <CardTitle className="text-base">AI Column Mapping</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            <CardDescription>
              {aiError ? (
                <span className="text-yellow-600">{aiError}</span>
              ) : (
                <>
                  AI has analyzed your data and suggested mappings.
                  Columns with high confidence ({'>'}70%) have been auto-mapped.
                  Review and adjust as needed.
                </>
              )}
            </CardDescription>
          </CardContent>
        </Card>
      )}

      {/* Missing Required Fields Warning */}
      {missingRequired.length > 0 && (
        <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-lg flex items-start gap-2">
          <AlertCircle className="h-5 w-5 text-destructive flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-medium text-destructive">Missing Required Mappings</p>
            <p className="text-sm text-muted-foreground">
              The following required fields are not mapped:{' '}
              {missingRequired.map(f => {
                const field = config.fields.find(cf => cf.name === f);
                return field?.label || f;
              }).join(', ')}
            </p>
          </div>
        </div>
      )}

      {/* Column Mapping Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Column Mappings</CardTitle>
          <CardDescription>
            Match your CSV columns to the appropriate fields
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[200px]">Your Column</TableHead>
                <TableHead className="w-[50px]"></TableHead>
                <TableHead className="w-[200px]">Maps To</TableHead>
                <TableHead>Sample Data</TableHead>
                {useAI && <TableHead className="w-[100px]">AI Confidence</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {parsedData.headers.map((header) => {
                const aiSuggestion = getAISuggestion(header);
                const currentMapping = mappings[header];
                const targetField = config.fields.find(f => f.name === currentMapping);

                return (
                  <TableRow key={header}>
                    <TableCell className="font-medium">{header}</TableCell>
                    <TableCell>
                      <ArrowRight className="h-4 w-4 text-muted-foreground" />
                    </TableCell>
                    <TableCell>
                      <Select
                        value={currentMapping || 'none'}
                        onValueChange={(value) => handleMappingChange(header, value)}
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Select field" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">
                            <span className="text-muted-foreground">-- Don't import --</span>
                          </SelectItem>
                          {config.fields.map((field) => (
                            <SelectItem key={field.name} value={field.name}>
                              <span className="flex items-center gap-2">
                                {field.label}
                                {field.required && (
                                  <span className="text-destructive">*</span>
                                )}
                              </span>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground max-w-[200px] truncate">
                      {sampleRows.map(row => row[header]).filter(Boolean).slice(0, 2).join(', ')}
                    </TableCell>
                    {useAI && (
                      <TableCell>
                        {aiSuggestion && aiSuggestion.suggestedTarget && (
                          <Badge
                            variant={
                              aiSuggestion.confidence >= 0.8
                                ? 'default'
                                : aiSuggestion.confidence >= 0.6
                                ? 'secondary'
                                : 'outline'
                            }
                          >
                            {Math.round(aiSuggestion.confidence * 100)}%
                          </Badge>
                        )}
                      </TableCell>
                    )}
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Mapping Summary */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Mapping Summary</CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="flex flex-wrap gap-2">
            {config.fields.map((field) => {
              const isMapped = Object.values(mappings).includes(field.name);
              return (
                <Badge
                  key={field.name}
                  variant={isMapped ? 'default' : field.required ? 'destructive' : 'outline'}
                >
                  {isMapped ? (
                    <Check className="h-3 w-3 mr-1" />
                  ) : (
                    <X className="h-3 w-3 mr-1" />
                  )}
                  {field.label}
                </Badge>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Action Buttons */}
      <div className="flex justify-end gap-2">
        <Button
          variant="outline"
          onClick={initializeMappings}
          disabled={isLoading}
        >
          <RefreshCw className="h-4 w-4 mr-2" />
          Reset Mappings
        </Button>
        <Button
          onClick={handleContinue}
          disabled={missingRequired.length > 0}
        >
          Continue to Preview
          <ArrowRight className="h-4 w-4 ml-2" />
        </Button>
      </div>
    </div>
  );
}
