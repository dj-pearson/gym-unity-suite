// Data Preview Step Component

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
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
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  ArrowRight,
  Check,
  AlertTriangle,
  X,
  Eye,
} from 'lucide-react';

import { ImportModuleConfig, ParsedCSVData, ImportValidationResult } from '@/lib/csv/types';
import { validateImport, transformRow } from '@/lib/csv/validation';

interface DataPreviewStepProps {
  config: ImportModuleConfig;
  parsedData: ParsedCSVData;
  columnMappings: Record<string, string | null>;
  organizationId: string;
  onValidationComplete: (result: ImportValidationResult) => void;
  onBack: () => void;
}

export default function DataPreviewStep({
  config,
  parsedData,
  columnMappings,
  organizationId,
  onValidationComplete,
  onBack,
}: DataPreviewStepProps) {
  const [isValidating, setIsValidating] = useState(false);
  const [validationResult, setValidationResult] = useState<ImportValidationResult | null>(null);
  const [previewRows, setPreviewRows] = useState<Record<string, any>[]>([]);

  // Transform data for preview on mount
  useEffect(() => {
    const transformed = parsedData.rows.map(row =>
      transformRow(row, columnMappings, config)
    );
    setPreviewRows(transformed);
  }, [parsedData, columnMappings, config]);

  const handleValidate = async () => {
    setIsValidating(true);

    try {
      const result = await validateImport(
        parsedData.rows,
        columnMappings,
        config,
        organizationId
      );
      setValidationResult(result);
    } catch (err: any) {
      console.error('Validation error:', err);
    } finally {
      setIsValidating(false);
    }
  };

  const handleContinue = () => {
    if (validationResult) {
      onValidationComplete(validationResult);
    }
  };

  // Get mapped field names for display
  const mappedFields = Object.entries(columnMappings)
    .filter(([_, target]) => target !== null)
    .map(([source, target]) => ({
      source,
      target: target!,
      field: config.fields.find(f => f.name === target),
    }));

  // Preview only first 10 rows
  const displayRows = previewRows.slice(0, 10);

  return (
    <div className="space-y-6">
      {/* Summary Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">{parsedData.totalRows}</div>
            <p className="text-sm text-muted-foreground">Total Rows</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">{mappedFields.length}</div>
            <p className="text-sm text-muted-foreground">Mapped Columns</p>
          </CardContent>
        </Card>
        {validationResult && (
          <>
            <Card>
              <CardContent className="pt-6">
                <div className="text-2xl font-bold text-green-600">
                  {validationResult.validRows.length}
                </div>
                <p className="text-sm text-muted-foreground">Valid Rows</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="text-2xl font-bold text-yellow-600">
                  {validationResult.duplicates.length}
                </div>
                <p className="text-sm text-muted-foreground">Duplicates Found</p>
              </CardContent>
            </Card>
          </>
        )}
      </div>

      {/* Data Preview Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Eye className="h-5 w-5" />
            Data Preview
          </CardTitle>
          <CardDescription>
            Preview of the first 10 rows after transformation
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[300px]">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[50px]">#</TableHead>
                  {mappedFields.map(({ target, field }) => (
                    <TableHead key={target}>
                      {field?.label || target}
                      {field?.required && <span className="text-destructive ml-1">*</span>}
                    </TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {displayRows.map((row, index) => (
                  <TableRow key={index}>
                    <TableCell className="text-muted-foreground">{index + 1}</TableCell>
                    {mappedFields.map(({ target }) => (
                      <TableCell key={target} className="max-w-[150px] truncate">
                        {row[target]?.toString() || '-'}
                      </TableCell>
                    ))}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </ScrollArea>
          {parsedData.totalRows > 10 && (
            <p className="text-sm text-muted-foreground mt-2 text-center">
              Showing 10 of {parsedData.totalRows} rows
            </p>
          )}
        </CardContent>
      </Card>

      {/* Validation Results */}
      {validationResult && (
        <>
          {/* Invalid Rows */}
          {validationResult.invalidRows.length > 0 && (
            <Card className="border-destructive/50">
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2 text-destructive">
                  <AlertTriangle className="h-5 w-5" />
                  Validation Errors ({validationResult.invalidRows.length} rows)
                </CardTitle>
                <CardDescription>
                  These rows have validation errors and will not be imported
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[200px]">
                  <div className="space-y-2">
                    {validationResult.invalidRows.slice(0, 10).map((invalid, index) => (
                      <div
                        key={index}
                        className="p-3 bg-destructive/10 rounded-lg text-sm"
                      >
                        <div className="font-medium">Row {invalid.rowIndex + 1}</div>
                        <ul className="mt-1 space-y-1">
                          {invalid.errors.map((error, errIndex) => (
                            <li key={errIndex} className="text-muted-foreground flex items-start gap-1">
                              <X className="h-3 w-3 mt-1 flex-shrink-0 text-destructive" />
                              {error}
                            </li>
                          ))}
                        </ul>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
                {validationResult.invalidRows.length > 10 && (
                  <p className="text-sm text-muted-foreground mt-2">
                    Showing first 10 of {validationResult.invalidRows.length} errors
                  </p>
                )}
              </CardContent>
            </Card>
          )}

          {/* Duplicates Preview */}
          {validationResult.duplicates.length > 0 && (
            <Card className="border-yellow-500/50">
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2 text-yellow-600">
                  <AlertTriangle className="h-5 w-5" />
                  Duplicates Found ({validationResult.duplicates.length})
                </CardTitle>
                <CardDescription>
                  Records that match existing data in your system. You'll decide how to handle these in the next step.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {validationResult.duplicates.slice(0, 5).map((dup, index) => (
                    <Badge key={index} variant="outline">
                      {dup.importData[config.duplicateDisplayField] || `Row ${dup.importRowIndex + 1}`}
                    </Badge>
                  ))}
                  {validationResult.duplicates.length > 5 && (
                    <Badge variant="secondary">
                      +{validationResult.duplicates.length - 5} more
                    </Badge>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* All Valid Message */}
          {validationResult.isValid && validationResult.duplicates.length === 0 && (
            <Card className="border-green-500/50">
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-green-500/10 flex items-center justify-center">
                    <Check className="h-5 w-5 text-green-500" />
                  </div>
                  <div>
                    <p className="font-medium text-green-600">All data is valid!</p>
                    <p className="text-sm text-muted-foreground">
                      {validationResult.validRows.length} rows are ready to import
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </>
      )}

      {/* Action Buttons */}
      <div className="flex justify-between">
        <Button variant="outline" onClick={onBack}>
          Back to Mapping
        </Button>
        <div className="flex gap-2">
          {!validationResult ? (
            <Button onClick={handleValidate} disabled={isValidating}>
              {isValidating ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Validating...
                </>
              ) : (
                <>
                  <Check className="h-4 w-4 mr-2" />
                  Validate Data
                </>
              )}
            </Button>
          ) : (
            <Button
              onClick={handleContinue}
              disabled={validationResult.validRows.length === 0}
            >
              {validationResult.duplicates.length > 0 ? (
                <>
                  Handle Duplicates
                  <ArrowRight className="h-4 w-4 ml-2" />
                </>
              ) : (
                <>
                  Start Import
                  <ArrowRight className="h-4 w-4 ml-2" />
                </>
              )}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
