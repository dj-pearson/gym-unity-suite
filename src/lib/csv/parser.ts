// CSV Parser utility using PapaParse

import Papa from 'papaparse';
import { ParsedCSVData, CSVParseError } from './types';

export interface ParseOptions {
  hasHeader?: boolean;
  skipEmptyLines?: boolean;
  trimFields?: boolean;
  delimiter?: string;
}

const defaultOptions: ParseOptions = {
  hasHeader: true,
  skipEmptyLines: true,
  trimFields: true,
};

export function parseCSVFile(file: File, options?: ParseOptions): Promise<ParsedCSVData> {
  return new Promise((resolve, reject) => {
    const mergedOptions = { ...defaultOptions, ...options };
    const errors: CSVParseError[] = [];
    const rows: Record<string, string>[] = [];
    let headers: string[] = [];

    Papa.parse(file, {
      header: mergedOptions.hasHeader,
      skipEmptyLines: mergedOptions.skipEmptyLines ? 'greedy' : false,
      delimiter: mergedOptions.delimiter || '',
      transformHeader: (header: string) => {
        return mergedOptions.trimFields ? header.trim() : header;
      },
      transform: (value: string) => {
        return mergedOptions.trimFields ? value.trim() : value;
      },
      complete: (results) => {
        if (results.errors && results.errors.length > 0) {
          results.errors.forEach((error) => {
            errors.push({
              row: error.row ?? 0,
              message: error.message,
              type: 'parse',
            });
          });
        }

        if (results.meta.fields) {
          headers = results.meta.fields;
        }

        // Type assertion for the parsed data
        const data = results.data as Record<string, string>[];

        // Filter out completely empty rows
        data.forEach((row, index) => {
          const hasAnyValue = Object.values(row).some(val => val && val.toString().trim() !== '');
          if (hasAnyValue) {
            rows.push(row);
          }
        });

        resolve({
          headers,
          rows,
          errors,
          totalRows: rows.length,
        });
      },
      error: (error) => {
        reject(new Error(`CSV parsing failed: ${error.message}`));
      },
    });
  });
}

export function parseCSVString(csvString: string, options?: ParseOptions): ParsedCSVData {
  const mergedOptions = { ...defaultOptions, ...options };
  const errors: CSVParseError[] = [];
  const rows: Record<string, string>[] = [];
  let headers: string[] = [];

  const results = Papa.parse(csvString, {
    header: mergedOptions.hasHeader,
    skipEmptyLines: mergedOptions.skipEmptyLines ? 'greedy' : false,
    delimiter: mergedOptions.delimiter || '',
    transformHeader: (header: string) => {
      return mergedOptions.trimFields ? header.trim() : header;
    },
    transform: (value: string) => {
      return mergedOptions.trimFields ? value.trim() : value;
    },
  });

  if (results.errors && results.errors.length > 0) {
    results.errors.forEach((error) => {
      errors.push({
        row: error.row ?? 0,
        message: error.message,
        type: 'parse',
      });
    });
  }

  if (results.meta.fields) {
    headers = results.meta.fields;
  }

  const data = results.data as Record<string, string>[];
  data.forEach((row) => {
    const hasAnyValue = Object.values(row).some(val => val && val.toString().trim() !== '');
    if (hasAnyValue) {
      rows.push(row);
    }
  });

  return {
    headers,
    rows,
    errors,
    totalRows: rows.length,
  };
}

export function generateCSV(
  headers: string[],
  rows: Record<string, any>[],
  options?: { includeExamples?: boolean }
): string {
  const data = rows.map((row) => {
    const rowData: Record<string, any> = {};
    headers.forEach((header) => {
      rowData[header] = row[header] ?? '';
    });
    return rowData;
  });

  return Papa.unparse({
    fields: headers,
    data,
  });
}

export function generateTemplateCSV(
  headers: string[],
  exampleRows?: Record<string, string>[]
): string {
  const data = exampleRows || [];

  return Papa.unparse({
    fields: headers,
    data,
  });
}

// Utility to detect delimiter from file content
export function detectDelimiter(sample: string): string {
  const delimiters = [',', ';', '\t', '|'];
  const counts: Record<string, number> = {};

  delimiters.forEach((d) => {
    const lines = sample.split('\n').slice(0, 5);
    const avgCount = lines.reduce((sum, line) => {
      return sum + (line.split(d).length - 1);
    }, 0) / lines.length;
    counts[d] = avgCount;
  });

  // Return delimiter with highest average count
  return Object.entries(counts).reduce((a, b) =>
    a[1] > b[1] ? a : b
  )[0];
}

// Utility to normalize column names for matching
export function normalizeColumnName(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '')
    .replace(/\s+/g, '');
}

// Auto-map columns based on name similarity
export function autoMapColumns(
  sourceColumns: string[],
  targetFields: { name: string; label: string }[]
): Record<string, string | null> {
  const mapping: Record<string, string | null> = {};

  sourceColumns.forEach((source) => {
    const normalizedSource = normalizeColumnName(source);
    let bestMatch: { field: string; score: number } | null = null;

    targetFields.forEach((target) => {
      const normalizedName = normalizeColumnName(target.name);
      const normalizedLabel = normalizeColumnName(target.label);

      // Exact match on name or label
      if (normalizedSource === normalizedName || normalizedSource === normalizedLabel) {
        bestMatch = { field: target.name, score: 1 };
        return;
      }

      // Contains match
      if (normalizedSource.includes(normalizedName) || normalizedName.includes(normalizedSource)) {
        const score = Math.min(normalizedSource.length, normalizedName.length) /
                     Math.max(normalizedSource.length, normalizedName.length);
        if (!bestMatch || score > bestMatch.score) {
          bestMatch = { field: target.name, score: score * 0.8 };
        }
      }

      if (normalizedSource.includes(normalizedLabel) || normalizedLabel.includes(normalizedSource)) {
        const score = Math.min(normalizedSource.length, normalizedLabel.length) /
                     Math.max(normalizedSource.length, normalizedLabel.length);
        if (!bestMatch || score > bestMatch.score) {
          bestMatch = { field: target.name, score: score * 0.8 };
        }
      }
    });

    mapping[source] = bestMatch && bestMatch.score >= 0.5 ? bestMatch.field : null;
  });

  return mapping;
}
