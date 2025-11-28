// Reusable Import Button Component

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Upload, FileDown, Sparkles, ChevronDown } from 'lucide-react';

import { ImportModule, ImportResult } from '@/lib/csv/types';
import { getModuleConfig, generateTemplateCSV } from '@/lib/csv';
import CSVImportWizard from './CSVImportWizard';

interface ImportButtonProps {
  module: ImportModule;
  onImportComplete?: (result: ImportResult) => void;
  variant?: 'default' | 'outline' | 'ghost';
  size?: 'default' | 'sm' | 'lg';
  showDropdown?: boolean;
}

export default function ImportButton({
  module,
  onImportComplete,
  variant = 'outline',
  size = 'default',
  showDropdown = true,
}: ImportButtonProps) {
  const [wizardOpen, setWizardOpen] = useState(false);
  const config = getModuleConfig(module);

  if (!config) {
    return null;
  }

  const downloadTemplate = () => {
    const { generateTemplateCSV } = require('@/lib/csv/parser');
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

  const handleImportComplete = (result: ImportResult) => {
    onImportComplete?.(result);
  };

  if (!showDropdown) {
    return (
      <>
        <Button variant={variant} size={size} onClick={() => setWizardOpen(true)}>
          <Upload className="h-4 w-4 mr-2" />
          Import CSV
        </Button>
        <CSVImportWizard
          module={module}
          open={wizardOpen}
          onOpenChange={setWizardOpen}
          onImportComplete={handleImportComplete}
        />
      </>
    );
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant={variant} size={size}>
            <Upload className="h-4 w-4 mr-2" />
            Import
            <ChevronDown className="h-4 w-4 ml-2" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuLabel>Import Options</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => setWizardOpen(true)}>
            <Upload className="h-4 w-4 mr-2" />
            Import from CSV
          </DropdownMenuItem>
          <DropdownMenuItem onClick={downloadTemplate}>
            <FileDown className="h-4 w-4 mr-2" />
            Download Template
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onClick={() => setWizardOpen(true)}
            className="text-primary"
          >
            <Sparkles className="h-4 w-4 mr-2" />
            AI-Powered Import
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <CSVImportWizard
        module={module}
        open={wizardOpen}
        onOpenChange={setWizardOpen}
        onImportComplete={handleImportComplete}
      />
    </>
  );
}
