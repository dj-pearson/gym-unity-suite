import { useEffect, useCallback, useRef } from 'react';
import { useToast } from '@/hooks/use-toast';

interface UseFormDraftOptions {
  formId: string;
  autoSaveInterval?: number; // milliseconds
  onRestore?: (draft: any) => void;
  enabled?: boolean;
}

/**
 * Hook to auto-save form drafts to localStorage
 *
 * Automatically saves form data every N seconds to prevent data loss
 * Restores draft on component mount if available
 *
 * @param formId - Unique identifier for the form (e.g., 'member-signup')
 * @param autoSaveInterval - How often to auto-save in milliseconds (default: 30000 = 30 seconds)
 * @param onRestore - Callback when draft is restored
 * @param enabled - Whether auto-save is enabled (default: true)
 *
 * @example
 * ```tsx
 * const { saveDraft, clearDraft, lastSaved } = useFormDraft({
 *   formId: 'member-signup',
 *   autoSaveInterval: 30000,
 *   onRestore: (draft) => {
 *     form.reset(draft);
 *   }
 * });
 *
 * // Manually save draft
 * saveDraft(formData);
 *
 * // Clear draft after successful submission
 * clearDraft();
 * ```
 */
export function useFormDraft({
  formId,
  autoSaveInterval = 30000,
  onRestore,
  enabled = true,
}: UseFormDraftOptions) {
  const { toast } = useToast();
  const lastSavedRef = useRef<Date | null>(null);
  const autoSaveTimerRef = useRef<NodeJS.Timeout | null>(null);
  const pendingDataRef = useRef<any>(null);

  const STORAGE_KEY = `form-draft-${formId}`;
  const TIMESTAMP_KEY = `form-draft-${formId}-timestamp`;

  /**
   * Save draft to localStorage
   */
  const saveDraft = useCallback((data: any) => {
    if (!enabled) return;

    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
      localStorage.setItem(TIMESTAMP_KEY, new Date().toISOString());
      lastSavedRef.current = new Date();
    } catch (error) {
      console.error('Failed to save draft:', error);
      toast({
        title: 'Auto-save failed',
        description: 'Could not save your progress. Please try again.',
        variant: 'destructive',
      });
    }
  }, [enabled, STORAGE_KEY, TIMESTAMP_KEY, toast]);

  /**
   * Load draft from localStorage
   */
  const loadDraft = useCallback((): any | null => {
    try {
      const draft = localStorage.getItem(STORAGE_KEY);
      const timestamp = localStorage.getItem(TIMESTAMP_KEY);

      if (!draft) return null;

      // Check if draft is older than 7 days (stale)
      if (timestamp) {
        const draftAge = Date.now() - new Date(timestamp).getTime();
        const SEVEN_DAYS = 7 * 24 * 60 * 60 * 1000;

        if (draftAge > SEVEN_DAYS) {
          // Draft is stale, clear it
          clearDraft();
          return null;
        }
      }

      return JSON.parse(draft);
    } catch (error) {
      console.error('Failed to load draft:', error);
      return null;
    }
  }, [STORAGE_KEY, TIMESTAMP_KEY]);

  /**
   * Clear draft from localStorage
   */
  const clearDraft = useCallback(() => {
    try {
      localStorage.removeItem(STORAGE_KEY);
      localStorage.removeItem(TIMESTAMP_KEY);
      lastSavedRef.current = null;
    } catch (error) {
      console.error('Failed to clear draft:', error);
    }
  }, [STORAGE_KEY, TIMESTAMP_KEY]);

  /**
   * Check if draft exists
   */
  const hasDraft = useCallback((): boolean => {
    return localStorage.getItem(STORAGE_KEY) !== null;
  }, [STORAGE_KEY]);

  /**
   * Auto-save pending data
   */
  const performAutoSave = useCallback(() => {
    if (pendingDataRef.current) {
      saveDraft(pendingDataRef.current);
      pendingDataRef.current = null;
    }
  }, [saveDraft]);

  /**
   * Queue data for auto-save
   */
  const queueAutoSave = useCallback((data: any) => {
    pendingDataRef.current = data;
  }, []);

  // Restore draft on mount
  useEffect(() => {
    if (!enabled) return;

    const draft = loadDraft();
    if (draft && onRestore) {
      onRestore(draft);

      toast({
        title: 'Draft restored',
        description: 'Your previous progress has been restored.',
      });
    }
  }, [enabled]); // Only run on mount

  // Set up auto-save interval
  useEffect(() => {
    if (!enabled || !autoSaveInterval) return;

    // Clear any existing timer
    if (autoSaveTimerRef.current) {
      clearInterval(autoSaveTimerRef.current);
    }

    // Set up new timer
    autoSaveTimerRef.current = setInterval(() => {
      performAutoSave();
    }, autoSaveInterval);

    // Cleanup on unmount
    return () => {
      if (autoSaveTimerRef.current) {
        clearInterval(autoSaveTimerRef.current);
      }
      // Save any pending data before unmount
      performAutoSave();
    };
  }, [enabled, autoSaveInterval, performAutoSave]);

  return {
    saveDraft,
    loadDraft,
    clearDraft,
    hasDraft,
    queueAutoSave,
    lastSaved: lastSavedRef.current,
  };
}
