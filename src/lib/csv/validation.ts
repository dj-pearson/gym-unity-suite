// CSV Import Validation Utilities

import { ImportModuleConfig, ImportFieldConfig, ImportValidationResult, DuplicateRecord } from './types';
import { supabase } from '@/integrations/supabase/client';

// Field type validators
const validators = {
  string: (value: string) => typeof value === 'string',

  number: (value: string) => {
    if (!value || value.trim() === '') return true; // Allow empty
    const num = parseFloat(value.replace(/[,$]/g, ''));
    return !isNaN(num);
  },

  date: (value: string) => {
    if (!value || value.trim() === '') return true;
    // Accept various date formats
    const dateRegexes = [
      /^\d{4}-\d{2}-\d{2}$/, // YYYY-MM-DD
      /^\d{2}\/\d{2}\/\d{4}$/, // MM/DD/YYYY
      /^\d{2}-\d{2}-\d{4}$/, // MM-DD-YYYY
    ];
    const isValidFormat = dateRegexes.some(regex => regex.test(value));
    if (!isValidFormat) return false;
    const date = new Date(value);
    return !isNaN(date.getTime());
  },

  email: (value: string) => {
    if (!value || value.trim() === '') return true;
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(value);
  },

  phone: (value: string) => {
    if (!value || value.trim() === '') return true;
    // Accept various phone formats
    const cleaned = value.replace(/[\s\-\(\)\.\+]/g, '');
    return /^\d{7,15}$/.test(cleaned);
  },

  boolean: (value: string) => {
    if (!value || value.trim() === '') return true;
    const lower = value.toLowerCase();
    return ['true', 'false', 'yes', 'no', '1', '0', 'y', 'n'].includes(lower);
  },

  currency: (value: string) => {
    if (!value || value.trim() === '') return true;
    const cleaned = value.replace(/[$,\s]/g, '');
    const num = parseFloat(cleaned);
    return !isNaN(num) && num >= 0;
  },

  enum: (value: string, enumValues?: string[]) => {
    if (!value || value.trim() === '') return true;
    if (!enumValues) return true;
    return enumValues.includes(value.toLowerCase());
  },
};

// Transform values to proper types
export const transformers = {
  string: (value: string) => value?.trim() || null,

  number: (value: string) => {
    if (!value || value.trim() === '') return null;
    return parseFloat(value.replace(/[,$]/g, ''));
  },

  date: (value: string) => {
    if (!value || value.trim() === '') return null;
    // Try to parse and return ISO format
    const date = new Date(value);
    if (isNaN(date.getTime())) return null;
    return date.toISOString().split('T')[0];
  },

  email: (value: string) => value?.trim().toLowerCase() || null,

  phone: (value: string) => {
    if (!value || value.trim() === '') return null;
    // Normalize phone number - keep only digits and leading +
    return value.trim();
  },

  boolean: (value: string) => {
    if (!value || value.trim() === '') return null;
    const lower = value.toLowerCase();
    return ['true', 'yes', '1', 'y'].includes(lower);
  },

  currency: (value: string) => {
    if (!value || value.trim() === '') return null;
    const cleaned = value.replace(/[$,\s]/g, '');
    return parseFloat(cleaned);
  },

  enum: (value: string, enumValues?: string[]) => {
    if (!value || value.trim() === '') return null;
    const lower = value.toLowerCase();
    // Return the matching enum value in its proper case
    if (enumValues) {
      const match = enumValues.find(e => e.toLowerCase() === lower);
      return match || lower;
    }
    return lower;
  },
};

export function validateField(
  value: string,
  field: ImportFieldConfig
): { isValid: boolean; error?: string } {
  // Check required
  if (field.required && (!value || value.trim() === '')) {
    return { isValid: false, error: `${field.label} is required` };
  }

  // If empty and not required, it's valid
  if (!value || value.trim() === '') {
    return { isValid: true };
  }

  // Type validation
  const validator = validators[field.type];
  if (!validator) {
    return { isValid: true };
  }

  const isValid = field.type === 'enum'
    ? validators.enum(value, field.enumValues)
    : validator(value);

  if (!isValid) {
    if (field.type === 'enum' && field.enumValues) {
      return {
        isValid: false,
        error: `${field.label} must be one of: ${field.enumValues.join(', ')}`
      };
    }
    return { isValid: false, error: `${field.label} has invalid format` };
  }

  // Custom validator
  if (field.validator) {
    const customResult = field.validator(value);
    if (customResult !== true) {
      return {
        isValid: false,
        error: typeof customResult === 'string' ? customResult : `${field.label} validation failed`
      };
    }
  }

  return { isValid: true };
}

export function transformRow(
  row: Record<string, string>,
  mapping: Record<string, string | null>,
  config: ImportModuleConfig
): Record<string, any> {
  const result: Record<string, any> = {};

  Object.entries(mapping).forEach(([sourceCol, targetField]) => {
    if (!targetField) return;

    const value = row[sourceCol];
    const fieldConfig = config.fields.find(f => f.name === targetField);

    if (fieldConfig) {
      const transformer = transformers[fieldConfig.type];
      if (transformer) {
        result[targetField] = fieldConfig.type === 'enum'
          ? transformers.enum(value, fieldConfig.enumValues)
          : transformer(value);
      } else {
        result[targetField] = value?.trim() || null;
      }
    } else {
      result[targetField] = value?.trim() || null;
    }
  });

  // Apply default values for missing fields
  config.fields.forEach(field => {
    if (field.defaultValue !== undefined &&
        (result[field.name] === null || result[field.name] === undefined)) {
      result[field.name] = field.defaultValue;
    }
  });

  return result;
}

export function validateRow(
  row: Record<string, any>,
  config: ImportModuleConfig
): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];

  config.fields.forEach(field => {
    const value = row[field.name];
    const stringValue = value?.toString() || '';
    const result = validateField(stringValue, field);
    if (!result.isValid && result.error) {
      errors.push(result.error);
    }
  });

  return { isValid: errors.length === 0, errors };
}

export async function checkForDuplicates(
  rows: Record<string, any>[],
  config: ImportModuleConfig,
  organizationId: string
): Promise<DuplicateRecord[]> {
  const duplicates: DuplicateRecord[] = [];

  // Build query for all duplicate key values
  const duplicateKeyValues = rows.map(row => {
    return config.duplicateKeys.reduce((acc, key) => {
      acc[key] = row[key];
      return acc;
    }, {} as Record<string, any>);
  });

  // For each duplicate key combination, check if exists
  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    const keyValues = duplicateKeyValues[i];

    // Skip if any key value is empty
    const hasAllKeys = config.duplicateKeys.every(key => keyValues[key]);
    if (!hasAllKeys) continue;

    try {
      let query = supabase
        .from(config.tableName)
        .select('*')
        .eq('organization_id', organizationId);

      // Add filters for each duplicate key
      config.duplicateKeys.forEach(key => {
        if (keyValues[key]) {
          query = query.eq(key, keyValues[key]);
        }
      });

      const { data: existing, error } = await query.maybeSingle();

      if (error) {
        console.error('Error checking duplicates:', error);
        continue;
      }

      if (existing) {
        duplicates.push({
          importRowIndex: i,
          importData: row,
          existingRecord: existing,
          matchedFields: config.duplicateKeys,
        });
      }
    } catch (err) {
      console.error('Error in duplicate check:', err);
    }
  }

  return duplicates;
}

export async function validateImport(
  rows: Record<string, string>[],
  mapping: Record<string, string | null>,
  config: ImportModuleConfig,
  organizationId: string
): Promise<ImportValidationResult> {
  const validRows: Record<string, any>[] = [];
  const invalidRows: { rowIndex: number; data: Record<string, any>; errors: string[] }[] = [];

  // Transform and validate each row
  rows.forEach((row, index) => {
    const transformedRow = transformRow(row, mapping, config);
    const validation = validateRow(transformedRow, config);

    if (validation.isValid) {
      validRows.push(transformedRow);
    } else {
      invalidRows.push({
        rowIndex: index,
        data: transformedRow,
        errors: validation.errors,
      });
    }
  });

  // Check for duplicates only on valid rows
  const duplicates = await checkForDuplicates(validRows, config, organizationId);

  return {
    isValid: invalidRows.length === 0,
    validRows,
    invalidRows,
    duplicates,
  };
}

// Merge records - combine existing with new data
export function mergeRecords(
  existing: Record<string, any>,
  newData: Record<string, any>,
  config: ImportModuleConfig
): Record<string, any> {
  const merged = { ...existing };

  // Only overwrite existing fields if new data has non-null values
  Object.entries(newData).forEach(([key, value]) => {
    if (value !== null && value !== undefined && value !== '') {
      // Don't overwrite ID fields
      if (key !== 'id' && key !== 'organization_id' && key !== 'created_at') {
        merged[key] = value;
      }
    }
  });

  merged.updated_at = new Date().toISOString();

  return merged;
}
