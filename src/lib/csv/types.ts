// CSV Import System Types

export type ImportModule =
  | 'members'
  | 'classes'
  | 'staff'
  | 'equipment'
  | 'memberships'
  | 'expenses'
  | 'leads';

export interface FieldMapping {
  sourceColumn: string;
  targetField: string;
  transform?: (value: string) => any;
  required?: boolean;
}

export interface ImportFieldConfig {
  name: string;
  label: string;
  type: 'string' | 'number' | 'date' | 'boolean' | 'email' | 'phone' | 'currency' | 'enum';
  required?: boolean;
  description?: string;
  examples?: string[];
  enumValues?: string[];
  defaultValue?: any;
  validator?: (value: any) => boolean | string;
}

export interface ImportModuleConfig {
  module: ImportModule;
  displayName: string;
  description: string;
  tableName: string;
  fields: ImportFieldConfig[];
  duplicateKeys: string[]; // Fields used to detect duplicates
  duplicateDisplayField: string; // Field to show in duplicate dialog
  templateFileName: string;
}

export interface ParsedCSVData {
  headers: string[];
  rows: Record<string, string>[];
  errors: CSVParseError[];
  totalRows: number;
}

export interface CSVParseError {
  row: number;
  column?: string;
  message: string;
  type: 'parse' | 'validation' | 'missing_required' | 'format';
}

export interface ColumnMapping {
  sourceColumn: string;
  targetField: string | null;
  confidence: number; // 0-1, used for AI suggestions
  autoMapped: boolean;
}

export interface DuplicateRecord {
  importRowIndex: number;
  importData: Record<string, any>;
  existingRecord: Record<string, any>;
  matchedFields: string[];
  resolution?: 'merge' | 'create' | 'skip';
}

export interface ImportValidationResult {
  isValid: boolean;
  validRows: Record<string, any>[];
  invalidRows: {
    rowIndex: number;
    data: Record<string, any>;
    errors: string[];
  }[];
  duplicates: DuplicateRecord[];
}

export interface ImportResult {
  success: boolean;
  imported: number;
  merged: number;
  skipped: number;
  failed: number;
  errors: {
    rowIndex: number;
    error: string;
  }[];
}

export interface AIFieldSuggestion {
  sourceColumn: string;
  suggestedTarget: string;
  confidence: number;
  reasoning: string;
}

export interface AIDataTransform {
  field: string;
  originalValue: string;
  transformedValue: any;
  explanation: string;
}

export interface ImportProgress {
  stage: 'uploading' | 'parsing' | 'validating' | 'checking_duplicates' | 'importing' | 'complete' | 'error';
  progress: number; // 0-100
  message: string;
  currentRow?: number;
  totalRows?: number;
}
