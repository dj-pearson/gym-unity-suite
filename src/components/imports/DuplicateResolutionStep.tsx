// Duplicate Resolution Step Component

import { useState } from 'react';
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
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  ArrowRight,
  AlertTriangle,
  Merge,
  Plus,
  SkipForward,
  Eye,
  CheckCircle,
} from 'lucide-react';

import { ImportModuleConfig, DuplicateRecord } from '@/lib/csv/types';

interface DuplicateResolutionStepProps {
  config: ImportModuleConfig;
  duplicates: DuplicateRecord[];
  onResolved: (duplicates: DuplicateRecord[]) => void;
  onBack: () => void;
}

type ResolutionAction = 'merge' | 'create' | 'skip';

export default function DuplicateResolutionStep({
  config,
  duplicates,
  onResolved,
  onBack,
}: DuplicateResolutionStepProps) {
  const [resolvedDuplicates, setResolvedDuplicates] = useState<DuplicateRecord[]>(
    duplicates.map(d => ({ ...d, resolution: undefined }))
  );
  const [bulkAction, setBulkAction] = useState<ResolutionAction | null>(null);

  const handleResolutionChange = (index: number, resolution: ResolutionAction) => {
    setResolvedDuplicates(prev => {
      const updated = [...prev];
      updated[index] = { ...updated[index], resolution };
      return updated;
    });
  };

  const handleBulkAction = (action: ResolutionAction) => {
    setBulkAction(action);
    setResolvedDuplicates(prev =>
      prev.map(d => ({ ...d, resolution: action }))
    );
  };

  const handleContinue = () => {
    // Ensure all have a resolution (default to skip if not set)
    const finalized = resolvedDuplicates.map(d => ({
      ...d,
      resolution: d.resolution || 'skip',
    }));
    onResolved(finalized);
  };

  // Count resolutions
  const mergeCount = resolvedDuplicates.filter(d => d.resolution === 'merge').length;
  const createCount = resolvedDuplicates.filter(d => d.resolution === 'create').length;
  const skipCount = resolvedDuplicates.filter(d => d.resolution === 'skip').length;
  const unresolvedCount = resolvedDuplicates.filter(d => !d.resolution).length;

  return (
    <div className="space-y-6">
      {/* Header Info */}
      <Card className="border-yellow-500/50">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-yellow-500" />
            {duplicates.length} Duplicate{duplicates.length !== 1 ? 's' : ''} Found
          </CardTitle>
          <CardDescription>
            These records match existing data based on{' '}
            <strong>{config.duplicateKeys.join(', ')}</strong>.
            Choose how to handle each one.
          </CardDescription>
        </CardHeader>
      </Card>

      {/* Bulk Actions */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Bulk Action</CardTitle>
          <CardDescription>Apply the same action to all duplicates</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            <Button
              variant={bulkAction === 'merge' ? 'default' : 'outline'}
              size="sm"
              onClick={() => handleBulkAction('merge')}
            >
              <Merge className="h-4 w-4 mr-2" />
              Merge All
            </Button>
            <Button
              variant={bulkAction === 'create' ? 'default' : 'outline'}
              size="sm"
              onClick={() => handleBulkAction('create')}
            >
              <Plus className="h-4 w-4 mr-2" />
              Create All New
            </Button>
            <Button
              variant={bulkAction === 'skip' ? 'default' : 'outline'}
              size="sm"
              onClick={() => handleBulkAction('skip')}
            >
              <SkipForward className="h-4 w-4 mr-2" />
              Skip All
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Resolution Summary */}
      <div className="grid grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6 text-center">
            <div className="text-2xl font-bold text-blue-600">{mergeCount}</div>
            <p className="text-sm text-muted-foreground">Will Merge</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6 text-center">
            <div className="text-2xl font-bold text-green-600">{createCount}</div>
            <p className="text-sm text-muted-foreground">Will Create</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6 text-center">
            <div className="text-2xl font-bold text-muted-foreground">{skipCount}</div>
            <p className="text-sm text-muted-foreground">Will Skip</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6 text-center">
            <div className="text-2xl font-bold text-yellow-600">{unresolvedCount}</div>
            <p className="text-sm text-muted-foreground">Unresolved</p>
          </CardContent>
        </Card>
      </div>

      {/* Individual Duplicate Resolution */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Individual Resolution</CardTitle>
          <CardDescription>
            Review and resolve each duplicate individually
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[400px]">
            <div className="space-y-4">
              {resolvedDuplicates.map((duplicate, index) => (
                <DuplicateItem
                  key={index}
                  config={config}
                  duplicate={duplicate}
                  index={index}
                  onResolutionChange={(resolution) => handleResolutionChange(index, resolution)}
                />
              ))}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>

      {/* Action Buttons */}
      <div className="flex justify-between">
        <Button variant="outline" onClick={onBack}>
          Back to Preview
        </Button>
        <Button onClick={handleContinue}>
          Continue with Import
          <ArrowRight className="h-4 w-4 ml-2" />
        </Button>
      </div>
    </div>
  );
}

// Individual duplicate item component
interface DuplicateItemProps {
  config: ImportModuleConfig;
  duplicate: DuplicateRecord;
  index: number;
  onResolutionChange: (resolution: ResolutionAction) => void;
}

function DuplicateItem({
  config,
  duplicate,
  index,
  onResolutionChange,
}: DuplicateItemProps) {
  const displayValue = duplicate.importData[config.duplicateDisplayField] || `Row ${duplicate.importRowIndex + 1}`;

  return (
    <div className={`
      p-4 border rounded-lg transition-colors
      ${duplicate.resolution === 'merge' ? 'border-blue-500/50 bg-blue-500/5' : ''}
      ${duplicate.resolution === 'create' ? 'border-green-500/50 bg-green-500/5' : ''}
      ${duplicate.resolution === 'skip' ? 'border-muted bg-muted/50' : ''}
      ${!duplicate.resolution ? 'border-yellow-500/50' : ''}
    `}>
      <div className="flex items-start justify-between gap-4">
        {/* Info */}
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <span className="font-medium">{displayValue}</span>
            {duplicate.resolution && (
              <Badge variant={
                duplicate.resolution === 'merge' ? 'default' :
                duplicate.resolution === 'create' ? 'secondary' :
                'outline'
              }>
                {duplicate.resolution === 'merge' && 'Will Merge'}
                {duplicate.resolution === 'create' && 'Will Create New'}
                {duplicate.resolution === 'skip' && 'Will Skip'}
              </Badge>
            )}
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            Matches on: {duplicate.matchedFields.join(', ')}
          </p>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          {/* Compare Dialog */}
          <CompareDialog config={config} duplicate={duplicate} />

          {/* Resolution Radio */}
          <RadioGroup
            value={duplicate.resolution || ''}
            onValueChange={(value) => onResolutionChange(value as ResolutionAction)}
            className="flex gap-2"
          >
            <div className="flex items-center space-x-1">
              <RadioGroupItem value="merge" id={`merge-${index}`} />
              <Label htmlFor={`merge-${index}`} className="text-sm cursor-pointer">
                <Merge className="h-4 w-4" />
              </Label>
            </div>
            <div className="flex items-center space-x-1">
              <RadioGroupItem value="create" id={`create-${index}`} />
              <Label htmlFor={`create-${index}`} className="text-sm cursor-pointer">
                <Plus className="h-4 w-4" />
              </Label>
            </div>
            <div className="flex items-center space-x-1">
              <RadioGroupItem value="skip" id={`skip-${index}`} />
              <Label htmlFor={`skip-${index}`} className="text-sm cursor-pointer">
                <SkipForward className="h-4 w-4" />
              </Label>
            </div>
          </RadioGroup>
        </div>
      </div>
    </div>
  );
}

// Compare dialog for viewing existing vs new data
interface CompareDialogProps {
  config: ImportModuleConfig;
  duplicate: DuplicateRecord;
}

function CompareDialog({ config, duplicate }: CompareDialogProps) {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm">
          <Eye className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Compare Records</DialogTitle>
          <DialogDescription>
            Compare the existing record with the new import data
          </DialogDescription>
        </DialogHeader>

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[150px]">Field</TableHead>
              <TableHead>Existing Value</TableHead>
              <TableHead>New Value</TableHead>
              <TableHead className="w-[100px]">Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {config.fields.map((field) => {
              const existingValue = duplicate.existingRecord[field.name];
              const newValue = duplicate.importData[field.name];
              const hasExisting = existingValue !== null && existingValue !== undefined && existingValue !== '';
              const hasNew = newValue !== null && newValue !== undefined && newValue !== '';
              const isDifferent = hasExisting && hasNew && existingValue !== newValue;
              const isNewData = !hasExisting && hasNew;

              return (
                <TableRow key={field.name}>
                  <TableCell className="font-medium">{field.label}</TableCell>
                  <TableCell className="text-sm">
                    {hasExisting ? String(existingValue) : <span className="text-muted-foreground">-</span>}
                  </TableCell>
                  <TableCell className="text-sm">
                    {hasNew ? (
                      <span className={isDifferent ? 'text-yellow-600 font-medium' : isNewData ? 'text-green-600' : ''}>
                        {String(newValue)}
                      </span>
                    ) : (
                      <span className="text-muted-foreground">-</span>
                    )}
                  </TableCell>
                  <TableCell>
                    {isDifferent && (
                      <Badge variant="outline" className="text-yellow-600">
                        Different
                      </Badge>
                    )}
                    {isNewData && (
                      <Badge variant="outline" className="text-green-600">
                        New
                      </Badge>
                    )}
                    {!isDifferent && !isNewData && hasExisting && (
                      <Badge variant="outline" className="text-muted-foreground">
                        Same
                      </Badge>
                    )}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>

        <div className="mt-4 p-4 bg-muted rounded-lg">
          <h4 className="font-medium mb-2">Resolution Options:</h4>
          <ul className="text-sm space-y-2 text-muted-foreground">
            <li className="flex items-start gap-2">
              <Merge className="h-4 w-4 mt-0.5 text-blue-600" />
              <span><strong>Merge:</strong> Update the existing record with new non-empty values. Existing data is preserved unless the new data has a value.</span>
            </li>
            <li className="flex items-start gap-2">
              <Plus className="h-4 w-4 mt-0.5 text-green-600" />
              <span><strong>Create New:</strong> Import as a completely new record, even though a similar one exists.</span>
            </li>
            <li className="flex items-start gap-2">
              <SkipForward className="h-4 w-4 mt-0.5" />
              <span><strong>Skip:</strong> Don't import this row at all.</span>
            </li>
          </ul>
        </div>
      </DialogContent>
    </Dialog>
  );
}
