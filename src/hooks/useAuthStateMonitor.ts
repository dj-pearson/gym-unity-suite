import { useEffect, useRef, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

/**
 * useAuthStateMonitor - Proactive session health monitoring with user feedback
 *
 * Monitors for:
 * - Unexpected sign-outs (e.g. from another tab or server-side session revocation)
 * - Token refresh failures that would silently break API calls
 * - Network connectivity drops that affect auth operations
 * - Cross-tab session synchronization via storage events
 *
 * Provides toast-based user feedback so users are never left wondering
 * why their actions stopped working.
 */
export function useAuthStateMonitor() {
  const { user, session, signOut } = useAuth();
  const wasAuthenticatedRef = useRef(false);
  const isSigningOutRef = useRef(false);
  const networkWasOfflineRef = useRef(false);
  const tokenRefreshFailCountRef = useRef(0);
  const MAX_TOKEN_REFRESH_FAILS = 2;

  // Track whether user was previously authenticated
  useEffect(() => {
    if (user && session) {
      wasAuthenticatedRef.current = true;
      tokenRefreshFailCountRef.current = 0;
    }
  }, [user, session]);

  // Monitor for unexpected sign-out events
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, newSession) => {
        if (event === 'SIGNED_OUT' && wasAuthenticatedRef.current && !isSigningOutRef.current) {
          // Unexpected sign-out (not initiated by user on this tab)
          wasAuthenticatedRef.current = false;
          toast({
            title: 'Session Ended',
            description: 'You have been signed out. This may have occurred from another device or your session expired.',
            variant: 'destructive',
          });
        }

        if (event === 'TOKEN_REFRESHED' && newSession) {
          // Token refreshed successfully - reset fail counter
          tokenRefreshFailCountRef.current = 0;
        }
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // Override signOut to mark intentional logouts
  const handleIntentionalSignOut = useCallback(async () => {
    isSigningOutRef.current = true;
    wasAuthenticatedRef.current = false;
    try {
      await signOut();
    } finally {
      isSigningOutRef.current = false;
    }
  }, [signOut]);

  // Monitor network connectivity
  useEffect(() => {
    const handleOnline = () => {
      if (networkWasOfflineRef.current) {
        networkWasOfflineRef.current = false;
        toast({
          title: 'Connection Restored',
          description: 'Your internet connection has been restored. Data will sync automatically.',
        });

        // Attempt to refresh session after reconnect
        if (wasAuthenticatedRef.current) {
          supabase.auth.getSession().then(({ data: { session: currentSession }, error }) => {
            if (error || !currentSession) {
              toast({
                title: 'Session Expired',
                description: 'Your session could not be restored. Please sign in again.',
                variant: 'destructive',
              });
            }
          });
        }
      }
    };

    const handleOffline = () => {
      networkWasOfflineRef.current = true;
      if (wasAuthenticatedRef.current) {
        toast({
          title: 'Connection Lost',
          description: 'You appear to be offline. Some features may be unavailable until your connection is restored.',
          variant: 'destructive',
        });
      }
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Monitor cross-tab session changes via storage events
  useEffect(() => {
    const handleStorageChange = (event: StorageEvent) => {
      // Supabase stores auth tokens in localStorage with keys containing 'auth-token'
      if (event.key && event.key.includes('auth-token')) {
        if (event.newValue === null && wasAuthenticatedRef.current && !isSigningOutRef.current) {
          // Auth token was removed in another tab
          wasAuthenticatedRef.current = false;
          toast({
            title: 'Signed Out',
            description: 'You were signed out in another tab.',
            variant: 'destructive',
          });
        } else if (event.oldValue === null && event.newValue !== null && !wasAuthenticatedRef.current) {
          // User signed in from another tab
          toast({
            title: 'Session Detected',
            description: 'A sign-in was detected from another tab. Refreshing your session.',
          });
          // Refresh to pick up the new session
          supabase.auth.getSession();
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  // Periodic session health check (every 5 minutes for authenticated users)
  useEffect(() => {
    if (!user || !session) return;

    const checkSessionHealth = async () => {
      try {
        const { data: { session: currentSession }, error } = await supabase.auth.getSession();

        if (error) {
          tokenRefreshFailCountRef.current++;

          if (tokenRefreshFailCountRef.current >= MAX_TOKEN_REFRESH_FAILS) {
            toast({
              title: 'Session Issue',
              description: 'We\'re having trouble keeping your session active. Please save your work and refresh the page.',
              variant: 'destructive',
            });
          }
          return;
        }

        if (!currentSession && wasAuthenticatedRef.current) {
          wasAuthenticatedRef.current = false;
          toast({
            title: 'Session Expired',
            description: 'Your session has expired. Please sign in again to continue.',
            variant: 'destructive',
          });
        }

        // Reset fail counter on success
        tokenRefreshFailCountRef.current = 0;
      } catch {
        // Network error during health check - handled by online/offline listeners
      }
    };

    const healthCheckInterval = setInterval(checkSessionHealth, 5 * 60 * 1000);

    return () => {
      clearInterval(healthCheckInterval);
    };
  }, [user, session]);

  return {
    handleIntentionalSignOut,
  };
}

export default useAuthStateMonitor;
