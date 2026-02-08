import { useAuthStateMonitor } from '@/hooks/useAuthStateMonitor';

/**
 * AuthStateMonitor - Invisible component that provides proactive session
 * health monitoring with user-facing toast notifications.
 *
 * Place inside the AuthProvider tree to enable:
 * - Unexpected sign-out detection (server-side revocation, other devices)
 * - Token refresh failure alerts
 * - Network connectivity feedback
 * - Cross-tab session synchronization
 *
 * This component renders nothing - it only attaches event listeners
 * and triggers toasts when session issues are detected.
 */
export function AuthStateMonitor() {
  useAuthStateMonitor();
  return null;
}

export default AuthStateMonitor;
