import { createContext, useContext, type ReactNode } from 'react';
import { useSessionTimeout, type UseSessionTimeoutResult } from '@/hooks/useSessionTimeout';
import SessionTimeoutWarning from './SessionTimeoutWarning';

const SessionTimeoutContext = createContext<UseSessionTimeoutResult | null>(null);

interface SessionTimeoutProviderProps {
  children: ReactNode;
}

export function SessionTimeoutProvider({ children }: SessionTimeoutProviderProps) {
  const sessionTimeout = useSessionTimeout();

  return (
    <SessionTimeoutContext.Provider value={sessionTimeout}>
      {children}
      <SessionTimeoutWarning
        isOpen={sessionTimeout.state.showWarningDialog}
        timeRemaining={sessionTimeout.state.timeRemaining}
        onExtend={sessionTimeout.extendSession}
        onLogout={sessionTimeout.logout}
      />
    </SessionTimeoutContext.Provider>
  );
}

export function useSessionTimeoutContext(): UseSessionTimeoutResult {
  const context = useContext(SessionTimeoutContext);
  if (!context) {
    throw new Error('useSessionTimeoutContext must be used within a SessionTimeoutProvider');
  }
  return context;
}

export default SessionTimeoutProvider;
