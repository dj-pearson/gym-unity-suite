import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { type OnboardingTourType, getRecommendedToursForRole } from '@/lib/onboardingSteps';

export interface OnboardingState {
  completedTours: OnboardingTourType[];
  currentTour: OnboardingTourType | null;
  showWizard: boolean;
  setupComplete: boolean;
}

/**
 * Hook to manage onboarding state and tours
 *
 * Tracks which tours the user has completed and manages the onboarding flow
 * Stores state in Supabase user profile
 *
 * @example
 * ```tsx
 * const {
 *   startTour,
 *   completeTour,
 *   shouldShowTour,
 *   completedTours,
 *   resetOnboarding
 * } = useOnboarding();
 *
 * // Start a tour
 * startTour('dashboard');
 *
 * // Check if should show
 * if (shouldShowTour('members')) {
 *   // Show tour
 * }
 * ```
 */
export function useOnboarding() {
  const { profile } = useAuth();
  const [state, setState] = useState<OnboardingState>({
    completedTours: [],
    currentTour: null,
    showWizard: false,
    setupComplete: false,
  });
  const [isLoading, setIsLoading] = useState(true);

  const STORAGE_KEY = `onboarding-${profile?.id}`;

  /**
   * Load onboarding state from Supabase or local storage
   */
  const loadState = useCallback(async () => {
    if (!profile) {
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);

      // Try to load from Supabase profile
      const { data, error } = await supabase
        .from('profiles')
        .select('onboarding_state')
        .eq('id', profile.id)
        .single();

      if (error) throw error;

      let loadedState: OnboardingState | null = null;

      const profileData = data as any;
      if (profileData?.onboarding_state) {
        // Parse state from profile
        loadedState = profileData.onboarding_state as OnboardingState;
      } else {
        // Try local storage fallback
        const localState = localStorage.getItem(STORAGE_KEY);
        if (localState) {
          loadedState = JSON.parse(localState);
        }
      }

      if (loadedState) {
        setState(loadedState);
      } else {
        // First-time user - show wizard and first-time tour
        setState({
          completedTours: [],
          currentTour: 'first-time',
          showWizard: true,
          setupComplete: false,
        });
      }
    } catch (error) {
      console.error('Error loading onboarding state:', error);
      // Default to first-time experience
      setState({
        completedTours: [],
        currentTour: 'first-time',
        showWizard: true,
        setupComplete: false,
      });
    } finally {
      setIsLoading(false);
    }
  }, [profile, STORAGE_KEY]);

  /**
   * Save onboarding state to Supabase and local storage
   */
  const saveState = useCallback(
    async (newState: OnboardingState) => {
      if (!profile) return;

      try {
        // Save to Supabase
        const { error } = await supabase
          .from('profiles')
          .update({ onboarding_state: newState } as any)
          .eq('id', profile.id);

        if (error) throw error;

        // Also save to local storage as backup
        localStorage.setItem(STORAGE_KEY, JSON.stringify(newState));

        setState(newState);
      } catch (error) {
        console.error('Error saving onboarding state:', error);

        // Save to local storage only if Supabase fails
        localStorage.setItem(STORAGE_KEY, JSON.stringify(newState));
        setState(newState);
      }
    },
    [profile, STORAGE_KEY]
  );

  /**
   * Start a specific tour
   */
  const startTour = useCallback(
    async (tourType: OnboardingTourType) => {
      const newState: OnboardingState = {
        ...state,
        currentTour: tourType,
      };
      await saveState(newState);
    },
    [state, saveState]
  );

  /**
   * Mark a tour as completed
   */
  const completeTour = useCallback(
    async (tourType: OnboardingTourType) => {
      const completedTours = state.completedTours.includes(tourType)
        ? state.completedTours
        : [...state.completedTours, tourType];

      const newState: OnboardingState = {
        ...state,
        completedTours,
        currentTour: null,
      };

      await saveState(newState);
    },
    [state, saveState]
  );

  /**
   * Skip a tour (marks as completed without showing)
   */
  const skipTour = useCallback(
    async (tourType: OnboardingTourType) => {
      await completeTour(tourType);
    },
    [completeTour]
  );

  /**
   * Check if a tour should be shown
   */
  const shouldShowTour = useCallback(
    (tourType: OnboardingTourType): boolean => {
      return !state.completedTours.includes(tourType);
    },
    [state.completedTours]
  );

  /**
   * Complete the initial setup wizard
   */
  const completeSetup = useCallback(async () => {
    const newState: OnboardingState = {
      ...state,
      showWizard: false,
      setupComplete: true,
    };
    await saveState(newState);
  }, [state, saveState]);

  /**
   * Reset all onboarding (for testing or re-onboarding)
   */
  const resetOnboarding = useCallback(async () => {
    const newState: OnboardingState = {
      completedTours: [],
      currentTour: 'first-time',
      showWizard: true,
      setupComplete: false,
    };
    await saveState(newState);
  }, [saveState]);

  /**
   * Get next recommended tour for user's role
   */
  const getNextRecommendedTour = useCallback((): OnboardingTourType | null => {
    const recommendedTours = getRecommendedToursForRole(profile?.role || 'member');
    const nextTour = recommendedTours.find((tour) => !state.completedTours.includes(tour));
    return nextTour || null;
  }, [profile, state.completedTours]);

  /**
   * Skip all remaining tours
   */
  const skipAllTours = useCallback(async () => {
    const recommendedTours = getRecommendedToursForRole(profile?.role || 'member');
    const newState: OnboardingState = {
      ...state,
      completedTours: recommendedTours,
      currentTour: null,
    };
    await saveState(newState);
  }, [profile, state, saveState]);

  // Load state on mount
  useEffect(() => {
    loadState();
  }, [loadState]);

  return {
    ...state,
    isLoading,
    startTour,
    completeTour,
    skipTour,
    shouldShowTour,
    completeSetup,
    resetOnboarding,
    getNextRecommendedTour,
    skipAllTours,
  };
}
