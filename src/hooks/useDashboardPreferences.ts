import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/hooks/use-toast';
import {
  getDefaultWidgetsForRole,
  type WidgetConfig,
  type WidgetType,
  AVAILABLE_WIDGETS,
} from '@/lib/dashboardWidgets';

export interface DashboardPreferences {
  widgets: string[]; // Array of widget IDs in order
  layout?: 'grid' | 'list';
  updated_at?: string;
}

/**
 * Hook to manage user dashboard preferences
 *
 * Stores widget configuration in user's profile or local storage as fallback
 * Supports drag-and-drop reordering and widget enable/disable
 *
 * @example
 * ```tsx
 * const {
 *   widgets,
 *   addWidget,
 *   removeWidget,
 *   reorderWidgets,
 *   resetToDefaults,
 *   isLoading
 * } = useDashboardPreferences();
 * ```
 */
export function useDashboardPreferences() {
  const { profile } = useAuth();
  const { toast } = useToast();
  const [widgets, setWidgets] = useState<WidgetConfig[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const STORAGE_KEY = `dashboard-prefs-${profile?.id}`;

  /**
   * Load preferences from Supabase or local storage
   */
  const loadPreferences = useCallback(async () => {
    if (!profile) {
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);

      // Try to load from Supabase profile
      const { data, error } = await supabase
        .from('profiles')
        .select('dashboard_preferences')
        .eq('id', profile.id)
        .single();

      if (error) throw error;

      let widgetIds: string[] = [];

      if (data?.dashboard_preferences) {
        // Parse preferences from profile
        const prefs = data.dashboard_preferences as DashboardPreferences;
        widgetIds = prefs.widgets || [];
      } else {
        // Try local storage fallback
        const localPrefs = localStorage.getItem(STORAGE_KEY);
        if (localPrefs) {
          const parsed = JSON.parse(localPrefs) as DashboardPreferences;
          widgetIds = parsed.widgets || [];
        }
      }

      // If no preferences found, use defaults for user's role
      if (widgetIds.length === 0) {
        const defaultWidgets = getDefaultWidgetsForRole(profile.role || 'member');
        setWidgets(defaultWidgets);
      } else {
        // Map widget IDs to widget configs
        const widgetConfigs = widgetIds
          .map((id) => AVAILABLE_WIDGETS[id as WidgetType])
          .filter(Boolean);
        setWidgets(widgetConfigs);
      }
    } catch (error) {
      console.error('Error loading dashboard preferences:', error);
      // Fallback to defaults
      const defaultWidgets = getDefaultWidgetsForRole(profile?.role || 'member');
      setWidgets(defaultWidgets);
    } finally {
      setIsLoading(false);
    }
  }, [profile, STORAGE_KEY]);

  /**
   * Save preferences to Supabase and local storage
   */
  const savePreferences = useCallback(
    async (widgetList: WidgetConfig[]) => {
      if (!profile) return;

      try {
        setIsSaving(true);

        const prefs: DashboardPreferences = {
          widgets: widgetList.map((w) => w.id),
          layout: 'grid',
          updated_at: new Date().toISOString(),
        };

        // Save to Supabase
        const { error } = await supabase
          .from('profiles')
          .update({ dashboard_preferences: prefs })
          .eq('id', profile.id);

        if (error) throw error;

        // Also save to local storage as backup
        localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs));
      } catch (error) {
        console.error('Error saving dashboard preferences:', error);

        // Save to local storage only if Supabase fails
        const prefs: DashboardPreferences = {
          widgets: widgetList.map((w) => w.id),
          layout: 'grid',
          updated_at: new Date().toISOString(),
        };
        localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs));

        toast({
          title: 'Preferences saved locally',
          description:
            'Could not sync to cloud, but your changes are saved on this device.',
        });
      } finally {
        setIsSaving(false);
      }
    },
    [profile, STORAGE_KEY, toast]
  );

  /**
   * Add a widget to the dashboard
   */
  const addWidget = useCallback(
    async (widgetType: WidgetType) => {
      const widgetConfig = AVAILABLE_WIDGETS[widgetType];
      if (!widgetConfig) return;

      // Check if widget is already added
      if (widgets.some((w) => w.id === widgetConfig.id)) {
        toast({
          title: 'Widget already added',
          description: 'This widget is already on your dashboard.',
          variant: 'destructive',
        });
        return;
      }

      // Check if user's role can access this widget
      if (!widgetConfig.roles.includes(profile?.role || 'member')) {
        toast({
          title: 'Widget not available',
          description: 'This widget is not available for your role.',
          variant: 'destructive',
        });
        return;
      }

      const newWidgets = [...widgets, widgetConfig];
      setWidgets(newWidgets);
      await savePreferences(newWidgets);

      toast({
        title: 'Widget added',
        description: `${widgetConfig.title} has been added to your dashboard.`,
      });
    },
    [widgets, profile, savePreferences, toast]
  );

  /**
   * Remove a widget from the dashboard
   */
  const removeWidget = useCallback(
    async (widgetId: string) => {
      const newWidgets = widgets.filter((w) => w.id !== widgetId);
      setWidgets(newWidgets);
      await savePreferences(newWidgets);

      toast({
        title: 'Widget removed',
        description: 'Widget has been removed from your dashboard.',
      });
    },
    [widgets, savePreferences, toast]
  );

  /**
   * Reorder widgets (for drag-and-drop)
   */
  const reorderWidgets = useCallback(
    async (newOrder: WidgetConfig[]) => {
      setWidgets(newOrder);
      await savePreferences(newOrder);
    },
    [savePreferences]
  );

  /**
   * Reset to default widgets for user's role
   */
  const resetToDefaults = useCallback(async () => {
    const defaultWidgets = getDefaultWidgetsForRole(profile?.role || 'member');
    setWidgets(defaultWidgets);
    await savePreferences(defaultWidgets);

    toast({
      title: 'Dashboard reset',
      description: 'Your dashboard has been reset to default widgets.',
    });
  }, [profile, savePreferences, toast]);

  /**
   * Toggle a widget on/off
   */
  const toggleWidget = useCallback(
    async (widgetType: WidgetType) => {
      const widgetConfig = AVAILABLE_WIDGETS[widgetType];
      if (!widgetConfig) return;

      const exists = widgets.some((w) => w.id === widgetConfig.id);

      if (exists) {
        await removeWidget(widgetConfig.id);
      } else {
        await addWidget(widgetType);
      }
    },
    [widgets, addWidget, removeWidget]
  );

  // Load preferences on mount
  useEffect(() => {
    loadPreferences();
  }, [loadPreferences]);

  return {
    widgets,
    isLoading,
    isSaving,
    addWidget,
    removeWidget,
    reorderWidgets,
    resetToDefaults,
    toggleWidget,
  };
}
