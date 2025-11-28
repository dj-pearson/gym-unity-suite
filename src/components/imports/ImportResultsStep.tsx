// Import Results Step Component

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import {
  CheckCircle,
  XCircle,
  AlertTriangle,
  Download,
  Sparkles,
  FileText,
} from 'lucide-react';

import { ImportModuleConfig, ImportResult } from '@/lib/csv/types';
import { generateImportSummary } from '@/lib/csv/aiImport';

interface ImportResultsStepProps {
  config: ImportModuleConfig;
  result: ImportResult;
  onClose: () => void;
}

export default function ImportResultsStep({
  config,
  result,
  onClose,
}: ImportResultsStepProps) {
  const [aiSummary, setAiSummary] = useState<string | null>(null);

  useEffect(() => {
    generateSummary();
  }, []);

  const generateSummary = async () => {
    try {
      const summary = await generateImportSummary(
        result.imported,
        result.merged,
        result.skipped,
        result.errors,
        config
      );
      setAiSummary(summary);
    } catch (err) {
      console.error('Failed to generate summary:', err);
    }
  };

  const downloadErrorReport = () => {
    if (result.errors.length === 0) return;

    const csv = [
      'Row,Error',
      ...result.errors.map(e => `${e.rowIndex + 1},"${e.error.replace(/"/g, '""')}"`)
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${config.module}_import_errors.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const totalProcessed = result.imported + result.merged + result.skipped + result.failed;
  const successRate = totalProcessed > 0
    ? Math.round(((result.imported + result.merged) / totalProcessed) * 100)
    : 0;

  return (
    <div className="space-y-6">
      {/* Overall Result */}
      <Card className={result.success ? 'border-green-500/50' : 'border-destructive/50'}>
        <CardContent className="pt-6">
          <div className="flex items-center gap-4">
            <div className={`
              h-16 w-16 rounded-full flex items-center justify-center
              ${result.success ? 'bg-green-500/10' : 'bg-destructive/10'}
            `}>
              {result.success ? (
                <CheckCircle className="h-8 w-8 text-green-500" />
              ) : (
                <XCircle className="h-8 w-8 text-destructive" />
              )}
            </div>
            <div>
              <h3 className="text-xl font-semibold">
                {result.success ? 'Import Completed!' : 'Import Completed with Errors'}
              </h3>
              <p className="text-muted-foreground">
                {successRate}% success rate ({result.imported + result.merged} of {totalProcessed} records)
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* AI Summary */}
      {aiSummary && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              Summary
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <p className="text-muted-foreground">{aiSummary}</p>
          </CardContent>
        </Card>
      )}

      {/* Statistics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6 text-center">
            <div className="text-3xl font-bold text-green-600">{result.imported}</div>
            <p className="text-sm text-muted-foreground mt-1">New Records Created</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6 text-center">
            <div className="text-3xl font-bold text-blue-600">{result.merged}</div>
            <p className="text-sm text-muted-foreground mt-1">Records Merged</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6 text-center">
            <div className="text-3xl font-bold text-muted-foreground">{result.skipped}</div>
            <p className="text-sm text-muted-foreground mt-1">Skipped</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6 text-center">
            <div className="text-3xl font-bold text-destructive">{result.failed}</div>
            <p className="text-sm text-muted-foreground mt-1">Failed</p>
          </CardContent>
        </Card>
      </div>

      {/* Errors List */}
      {result.errors.length > 0 && (
        <Card className="border-destructive/50">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-base flex items-center gap-2 text-destructive">
                <AlertTriangle className="h-5 w-5" />
                Failed Records ({result.errors.length})
              </CardTitle>
              <Button variant="outline" size="sm" onClick={downloadErrorReport}>
                <Download className="h-4 w-4 mr-2" />
                Download Error Report
              </Button>
            </div>
            <CardDescription>
              These records failed to import. Download the error report for details.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[200px]">
              <div className="space-y-2">
                {result.errors.slice(0, 20).map((error, index) => (
                  <div
                    key={index}
                    className="p-3 bg-destructive/5 rounded-lg flex items-start gap-3"
                  >
                    <Badge variant="outline" className="text-destructive">
                      Row {error.rowIndex + 1}
                    </Badge>
                    <span className="text-sm text-muted-foreground">{error.error}</span>
                  </div>
                ))}
              </div>
            </ScrollArea>
            {result.errors.length > 20 && (
              <p className="text-sm text-muted-foreground mt-2 text-center">
                Showing first 20 of {result.errors.length} errors. Download the report for full details.
              </p>
            )}
          </CardContent>
        </Card>
      )}

      {/* What's Next */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <FileText className="h-5 w-5" />
            What's Next?
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <ul className="space-y-2 text-sm text-muted-foreground">
            {result.imported > 0 && (
              <li className="flex items-start gap-2">
                <CheckCircle className="h-4 w-4 mt-0.5 text-green-500" />
                <span>
                  {result.imported} new {config.displayName.toLowerCase()} have been added to your system
                </span>
              </li>
            )}
            {result.merged > 0 && (
              <li className="flex items-start gap-2">
                <CheckCircle className="h-4 w-4 mt-0.5 text-blue-500" />
                <span>
                  {result.merged} existing records have been updated with new information
                </span>
              </li>
            )}
            {result.failed > 0 && (
              <li className="flex items-start gap-2">
                <AlertTriangle className="h-4 w-4 mt-0.5 text-yellow-500" />
                <span>
                  Review the failed records and correct any issues before re-importing
                </span>
              </li>
            )}
            <li className="flex items-start gap-2">
              <CheckCircle className="h-4 w-4 mt-0.5" />
              <span>
                Visit the {config.displayName} section to view and manage your imported data
              </span>
            </li>
          </ul>
        </CardContent>
      </Card>

      {/* Close Button */}
      <div className="flex justify-center">
        <Button onClick={onClose} size="lg">
          <CheckCircle className="h-5 w-5 mr-2" />
          Done
        </Button>
      </div>
    </div>
  );
}
