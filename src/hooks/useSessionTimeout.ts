import { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import {
  getSessionTimeoutConfig,
  getTimeoutForRole,
  type SessionTimeoutConfig
} from '@/components/security/SessionTimeoutSettings';
import type { UserRole } from '@/hooks/usePermissions';

export interface SessionTimeoutState {
  isActive: boolean;
  timeRemaining: number;
  isWarning: boolean;
  showWarningDialog: boolean;
}

export interface UseSessionTimeoutResult {
  state: SessionTimeoutState;
  extendSession: () => void;
  resetTimeout: () => void;
  logout: () => void;
}

const ACTIVITY_EVENTS = [
  'mousedown',
  'mousemove',
  'keydown',
  'scroll',
  'touchstart',
  'click',
  'wheel'
];

// Throttle activity detection to prevent performance issues
const ACTIVITY_THROTTLE_MS = 1000;

export function useSessionTimeout(): UseSessionTimeoutResult {
  const { profile, signOut, session } = useAuth();
  const [state, setState] = useState<SessionTimeoutState>({
    isActive: false,
    timeRemaining: 0,
    isWarning: false,
    showWarningDialog: false
  });

  const timeoutRef = useRef<number | null>(null);
  const warningTimeoutRef = useRef<number | null>(null);
  const lastActivityRef = useRef<number>(Date.now());
  const configRef = useRef<SessionTimeoutConfig>(getSessionTimeoutConfig());
  const throttleRef = useRef<boolean>(false);

  const getTimeoutConfig = useCallback(() => {
    if (!profile?.role) {
      return { timeoutMs: 0, warningMs: 0, enabled: false };
    }
    return getTimeoutForRole(profile.role as UserRole);
  }, [profile?.role]);

  const clearTimeouts = useCallback(() => {
    if (timeoutRef.current) {
      window.clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    if (warningTimeoutRef.current) {
      window.clearTimeout(warningTimeoutRef.current);
      warningTimeoutRef.current = null;
    }
  }, []);

  const logout = useCallback(async () => {
    clearTimeouts();
    setState(prev => ({
      ...prev,
      isActive: false,
      isWarning: false,
      showWarningDialog: false,
      timeRemaining: 0
    }));

    try {
      await signOut();
    } catch (error) {
      console.error('Error during session timeout logout:', error);
    }
  }, [clearTimeouts, signOut]);

  const startWarningCountdown = useCallback((warningMs: number) => {
    const config = configRef.current;

    // Show warning dialog if enabled
    if (config.showWarningDialog) {
      setState(prev => ({
        ...prev,
        isWarning: true,
        showWarningDialog: true,
        timeRemaining: warningMs
      }));
    }

    // Start countdown update
    const updateInterval = setInterval(() => {
      setState(prev => {
        const newTimeRemaining = Math.max(0, prev.timeRemaining - 1000);
        if (newTimeRemaining <= 0) {
          clearInterval(updateInterval);
        }
        return { ...prev, timeRemaining: newTimeRemaining };
      });
    }, 1000);

    // Set final logout timeout
    timeoutRef.current = window.setTimeout(() => {
      clearInterval(updateInterval);
      logout();
    }, warningMs);
  }, [logout]);

  const resetTimeout = useCallback(() => {
    clearTimeouts();
    lastActivityRef.current = Date.now();

    const timeoutConfig = getTimeoutConfig();

    if (!timeoutConfig.enabled || !session) {
      setState({
        isActive: false,
        timeRemaining: 0,
        isWarning: false,
        showWarningDialog: false
      });
      return;
    }

    const { timeoutMs, warningMs } = timeoutConfig;
    const timeUntilWarning = timeoutMs - warningMs;

    setState({
      isActive: true,
      timeRemaining: timeoutMs,
      isWarning: false,
      showWarningDialog: false
    });

    // Set warning timeout
    warningTimeoutRef.current = window.setTimeout(() => {
      startWarningCountdown(warningMs);
    }, timeUntilWarning);
  }, [clearTimeouts, getTimeoutConfig, session, startWarningCountdown]);

  const extendSession = useCallback(() => {
    resetTimeout();
  }, [resetTimeout]);

  // Handle activity detection
  const handleActivity = useCallback(() => {
    if (throttleRef.current) return;

    const config = configRef.current;

    // Only extend on activity if the setting is enabled
    if (config.extendOnActivity && state.isActive && !state.isWarning) {
      resetTimeout();
    }

    // Update last activity time
    lastActivityRef.current = Date.now();

    // Throttle activity detection
    throttleRef.current = true;
    setTimeout(() => {
      throttleRef.current = false;
    }, ACTIVITY_THROTTLE_MS);
  }, [state.isActive, state.isWarning, resetTimeout]);

  // Handle browser close/visibility change
  const handleVisibilityChange = useCallback(() => {
    const config = configRef.current;

    if (document.visibilityState === 'hidden' && config.logoutOnClose) {
      // Store flag for potential logout on return
      sessionStorage.setItem('gym-unity-pending-logout', 'true');
    } else if (document.visibilityState === 'visible') {
      const pendingLogout = sessionStorage.getItem('gym-unity-pending-logout');
      if (pendingLogout === 'true') {
        sessionStorage.removeItem('gym-unity-pending-logout');
        // Could optionally verify session is still valid here
      }

      // Check if session should have expired while tab was hidden
      const timeoutConfig = getTimeoutConfig();
      if (timeoutConfig.enabled) {
        const timeSinceActivity = Date.now() - lastActivityRef.current;
        if (timeSinceActivity >= timeoutConfig.timeoutMs) {
          logout();
          return;
        }
      }

      // Reset timeout on visibility restore
      if (state.isActive) {
        resetTimeout();
      }
    }
  }, [getTimeoutConfig, logout, resetTimeout, state.isActive]);

  // Handle config changes from settings
  const handleConfigChange = useCallback((event: Event) => {
    const customEvent = event as CustomEvent<SessionTimeoutConfig>;
    configRef.current = customEvent.detail;
    resetTimeout();
  }, [resetTimeout]);

  // Initialize session timeout on mount and when session/profile changes
  useEffect(() => {
    if (session && profile?.role) {
      configRef.current = getSessionTimeoutConfig();
      resetTimeout();
    } else {
      clearTimeouts();
      setState({
        isActive: false,
        timeRemaining: 0,
        isWarning: false,
        showWarningDialog: false
      });
    }

    return () => {
      clearTimeouts();
    };
  }, [session, profile?.role, resetTimeout, clearTimeouts]);

  // Set up activity listeners
  useEffect(() => {
    const config = configRef.current;

    if (!config.enabled || !session) {
      return;
    }

    // Add activity event listeners
    ACTIVITY_EVENTS.forEach(event => {
      document.addEventListener(event, handleActivity, { passive: true });
    });

    // Add visibility change listener
    document.addEventListener('visibilitychange', handleVisibilityChange);

    // Add config change listener
    window.addEventListener('session-timeout-config-changed', handleConfigChange);

    return () => {
      ACTIVITY_EVENTS.forEach(event => {
        document.removeEventListener(event, handleActivity);
      });
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('session-timeout-config-changed', handleConfigChange);
    };
  }, [session, handleActivity, handleVisibilityChange, handleConfigChange]);

  // Update remaining time display
  useEffect(() => {
    if (!state.isActive || state.isWarning) return;

    const interval = setInterval(() => {
      const timeoutConfig = getTimeoutConfig();
      const elapsed = Date.now() - lastActivityRef.current;
      const remaining = Math.max(0, timeoutConfig.timeoutMs - elapsed);

      setState(prev => ({
        ...prev,
        timeRemaining: remaining
      }));
    }, 10000); // Update every 10 seconds for performance

    return () => clearInterval(interval);
  }, [state.isActive, state.isWarning, getTimeoutConfig]);

  return {
    state,
    extendSession,
    resetTimeout,
    logout
  };
}

export default useSessionTimeout;
