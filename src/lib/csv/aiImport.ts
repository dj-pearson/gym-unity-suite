// AI-Powered Import Assistant

import { AIService } from '@/lib/ai/aiService';
import { ImportModuleConfig, AIFieldSuggestion, AIDataTransform } from './types';

const aiService = AIService.getInstance();

export async function getAIColumnMapping(
  sourceColumns: string[],
  sampleData: Record<string, string>[],
  config: ImportModuleConfig
): Promise<AIFieldSuggestion[]> {
  const targetFields = config.fields.map(f => ({
    name: f.name,
    label: f.label,
    type: f.type,
    description: f.description,
    examples: f.examples,
  }));

  // Take first 3 rows as sample
  const sampleRows = sampleData.slice(0, 3);

  const prompt = `You are a data mapping assistant. Analyze the source CSV columns and sample data, then map them to the target fields.

SOURCE COLUMNS: ${JSON.stringify(sourceColumns)}

SAMPLE DATA (first 3 rows):
${JSON.stringify(sampleRows, null, 2)}

TARGET FIELDS:
${JSON.stringify(targetFields, null, 2)}

For each source column, determine the best matching target field based on:
1. Column name similarity
2. Data patterns in the sample
3. Data type compatibility

Return a JSON array with this exact format:
[
  {
    "sourceColumn": "source column name",
    "suggestedTarget": "target field name or null if no match",
    "confidence": 0.0 to 1.0,
    "reasoning": "brief explanation"
  }
]

Important rules:
- Match based on semantic meaning, not just exact name matches
- Consider common variations (e.g., "fname" = "first_name", "dob" = "date_of_birth")
- If a column clearly doesn't match any target field, set suggestedTarget to null
- Be conservative with confidence scores
- Return ONLY the JSON array, no other text`;

  try {
    const response = await aiService.generateResponse({
      messages: [{ role: 'user', content: prompt }],
      maxTokens: 2000,
      temperature: 0.1,
    });

    const content = response.content;
    if (!content) {
      console.error('AI mapping failed: empty response content');
      return [];
    }

    // Parse the JSON response
    const jsonMatch = content.match(/\[[\s\S]*\]/);
    if (!jsonMatch) {
      console.error('Could not parse AI response as JSON');
      return [];
    }

    const suggestions: AIFieldSuggestion[] = JSON.parse(jsonMatch[0]);
    return suggestions;
  } catch (error) {
    console.error('Error getting AI column mapping:', error);
    return [];
  }
}

export async function getAIDataTransformations(
  data: Record<string, string>[],
  mapping: Record<string, string | null>,
  config: ImportModuleConfig
): Promise<{ row: number; transforms: AIDataTransform[] }[]> {
  // Find rows with potential data quality issues
  const problemRows: { row: number; issues: { field: string; value: string; type: string }[] }[] = [];

  data.forEach((row, index) => {
    const issues: { field: string; value: string; type: string }[] = [];

    Object.entries(mapping).forEach(([sourceCol, targetField]) => {
      if (!targetField) return;
      const value = row[sourceCol];
      if (!value) return;

      const fieldConfig = config.fields.find(f => f.name === targetField);
      if (!fieldConfig) return;

      // Check for potential issues based on field type
      if (fieldConfig.type === 'date' && value) {
        // Check if date format might need transformation
        if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
          issues.push({ field: targetField, value, type: 'date_format' });
        }
      }

      if (fieldConfig.type === 'phone' && value) {
        // Check if phone might need cleaning
        if (!/^[\d\-\(\)\s\+\.]+$/.test(value)) {
          issues.push({ field: targetField, value, type: 'phone_format' });
        }
      }

      if (fieldConfig.type === 'enum' && fieldConfig.enumValues && value) {
        // Check if value matches enum but might have wrong case
        const lower = value.toLowerCase();
        if (!fieldConfig.enumValues.includes(lower) &&
            fieldConfig.enumValues.some(e => e.toLowerCase().includes(lower) || lower.includes(e.toLowerCase()))) {
          issues.push({ field: targetField, value, type: 'enum_mismatch' });
        }
      }
    });

    if (issues.length > 0) {
      problemRows.push({ row: index, issues });
    }
  });

  // Only process first 10 problem rows to avoid excessive API calls
  const rowsToProcess = problemRows.slice(0, 10);

  if (rowsToProcess.length === 0) {
    return [];
  }

  const prompt = `You are a data cleaning assistant. Analyze these data quality issues and suggest transformations.

CONFIG FIELDS:
${JSON.stringify(config.fields.map(f => ({ name: f.name, type: f.type, enumValues: f.enumValues })), null, 2)}

PROBLEM ROWS:
${JSON.stringify(rowsToProcess, null, 2)}

For each issue, suggest how to transform the value to the correct format.

Return a JSON array with this exact format:
[
  {
    "row": row_index,
    "transforms": [
      {
        "field": "field_name",
        "originalValue": "original value",
        "transformedValue": "corrected value",
        "explanation": "what was changed and why"
      }
    ]
  }
]

Transformation rules:
- Dates should be YYYY-MM-DD format
- Phone numbers should be cleaned but keep original format if readable
- Enum values should match the allowed values exactly
- Currency should be numeric only (no symbols)
- Return ONLY the JSON array`;

  try {
    const response = await aiService.generateResponse({
      messages: [{ role: 'user', content: prompt }],
      maxTokens: 3000,
      temperature: 0.1,
    });

    const content = response.content;
    if (!content) {
      return [];
    }

    const jsonMatch = content.match(/\[[\s\S]*\]/);
    if (!jsonMatch) {
      return [];
    }

    return JSON.parse(jsonMatch[0]);
  } catch (error) {
    console.error('Error getting AI transformations:', error);
    return [];
  }
}

export async function detectDataModule(
  headers: string[],
  sampleData: Record<string, string>[]
): Promise<{ module: string; confidence: number; reasoning: string } | null> {
  const prompt = `You are a data classification assistant. Analyze these CSV headers and sample data to determine what type of gym/fitness data this represents.

HEADERS: ${JSON.stringify(headers)}

SAMPLE DATA (first 3 rows):
${JSON.stringify(sampleData.slice(0, 3), null, 2)}

POSSIBLE DATA TYPES:
- members: Member/customer data (names, emails, contact info, membership status)
- classes: Class schedules (class names, times, instructors, capacity)
- staff: Staff/employee data (names, roles, departments, pay rates)
- equipment: Equipment inventory (equipment names, brands, serial numbers, maintenance)
- memberships: Membership plans (plan names, prices, durations, features)
- expenses: Financial expenses (descriptions, amounts, dates, categories)
- leads: Sales leads (prospect info, lead sources, follow-up dates)

Return a JSON object with this exact format:
{
  "module": "detected_module_type",
  "confidence": 0.0 to 1.0,
  "reasoning": "brief explanation of why this data type was detected"
}

If you cannot confidently determine the data type (confidence < 0.5), return null.
Return ONLY the JSON object or null, no other text.`;

  try {
    const response = await aiService.generateResponse({
      messages: [{ role: 'user', content: prompt }],
      maxTokens: 500,
      temperature: 0.1,
    });

    const content = response.content.trim();
    if (content === 'null' || content === '') {
      return null;
    }

    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      return null;
    }

    return JSON.parse(jsonMatch[0]);
  } catch (error) {
    console.error('Error detecting data module:', error);
    return null;
  }
}

export async function generateImportSummary(
  importedCount: number,
  mergedCount: number,
  skippedCount: number,
  errors: { rowIndex: number; error: string }[],
  config: ImportModuleConfig
): Promise<string> {
  const errorSummary = errors.slice(0, 5).map(e => `Row ${e.rowIndex + 1}: ${e.error}`).join('\n');

  const prompt = `Generate a brief, user-friendly summary of this ${config.displayName} import operation:

- Successfully imported: ${importedCount} new records
- Merged with existing: ${mergedCount} records
- Skipped: ${skippedCount} records
- Failed: ${errors.length} records
${errors.length > 0 ? `\nSample errors:\n${errorSummary}` : ''}

Write 2-3 sentences summarizing the import results in a helpful, professional tone. If there were errors, briefly mention common issues. Keep it concise.`;

  try {
    const response = await aiService.generateResponse({
      messages: [{ role: 'user', content: prompt }],
      maxTokens: 200,
      temperature: 0.7,
    });

    if (response.content) {
      return response.content;
    }
  } catch (error) {
    console.error('Error generating summary:', error);
  }

  // Fallback summary
  let summary = `Imported ${importedCount} new ${config.displayName.toLowerCase()}.`;
  if (mergedCount > 0) summary += ` Merged ${mergedCount} existing records.`;
  if (skippedCount > 0) summary += ` Skipped ${skippedCount} records.`;
  if (errors.length > 0) summary += ` ${errors.length} records failed to import.`;
  return summary;
}
