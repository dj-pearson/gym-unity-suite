/**
 * Cloudflare Turnstile CAPTCHA Component
 *
 * A privacy-friendly CAPTCHA alternative that integrates with Cloudflare.
 * Used to protect signup forms and other sensitive endpoints from bots.
 *
 * Setup:
 * 1. Get your site key from Cloudflare Dashboard > Turnstile
 * 2. Set VITE_TURNSTILE_SITE_KEY in your environment
 * 3. For server-side verification, set TURNSTILE_SECRET_KEY in edge functions
 *
 * @see https://developers.cloudflare.com/turnstile/
 */

import React, { useEffect, useRef, useCallback, useState } from 'react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';

// Turnstile widget types
declare global {
  interface Window {
    turnstile?: {
      render: (
        container: string | HTMLElement,
        options: TurnstileOptions
      ) => string;
      reset: (widgetId: string) => void;
      remove: (widgetId: string) => void;
      getResponse: (widgetId: string) => string | undefined;
    };
    onTurnstileLoad?: () => void;
  }
}

interface TurnstileOptions {
  sitekey: string;
  callback?: (token: string) => void;
  'expired-callback'?: () => void;
  'error-callback'?: (error: string) => void;
  theme?: 'light' | 'dark' | 'auto';
  size?: 'normal' | 'compact' | 'flexible';
  language?: string;
  appearance?: 'always' | 'execute' | 'interaction-only';
  retry?: 'auto' | 'never';
  'retry-interval'?: number;
  'refresh-expired'?: 'auto' | 'manual' | 'never';
  action?: string;
  cData?: string;
}

interface TurnstileCaptchaProps {
  onVerify: (token: string) => void;
  onExpire?: () => void;
  onError?: (error: string) => void;
  theme?: 'light' | 'dark' | 'auto';
  size?: 'normal' | 'compact' | 'flexible';
  className?: string;
  action?: string;
}

// Turnstile script loading state
let turnstileScriptLoaded = false;
let turnstileScriptLoading = false;
const turnstileLoadCallbacks: (() => void)[] = [];

// Load the Turnstile script
function loadTurnstileScript(): Promise<void> {
  return new Promise((resolve, reject) => {
    if (turnstileScriptLoaded) {
      resolve();
      return;
    }

    if (turnstileScriptLoading) {
      turnstileLoadCallbacks.push(() => resolve());
      return;
    }

    turnstileScriptLoading = true;

    // Set up the callback
    window.onTurnstileLoad = () => {
      turnstileScriptLoaded = true;
      turnstileScriptLoading = false;
      resolve();
      turnstileLoadCallbacks.forEach(cb => cb());
      turnstileLoadCallbacks.length = 0;
    };

    // Create and append the script
    const script = document.createElement('script');
    script.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?onload=onTurnstileLoad';
    script.async = true;
    script.defer = true;
    script.onerror = () => {
      turnstileScriptLoading = false;
      reject(new Error('Failed to load Turnstile script'));
    };

    document.head.appendChild(script);
  });
}

export const TurnstileCaptcha: React.FC<TurnstileCaptchaProps> = ({
  onVerify,
  onExpire,
  onError,
  theme = 'auto',
  size = 'normal',
  className = '',
  action,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const widgetIdRef = useRef<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Get site key from environment
  const siteKey = import.meta.env.VITE_TURNSTILE_SITE_KEY;

  const renderWidget = useCallback(async () => {
    if (!containerRef.current || !window.turnstile || !siteKey) {
      return;
    }

    // Remove existing widget if any
    if (widgetIdRef.current) {
      try {
        window.turnstile.remove(widgetIdRef.current);
      } catch {
        // Ignore removal errors
      }
    }

    try {
      const options: TurnstileOptions = {
        sitekey: siteKey,
        theme,
        size,
        callback: (token) => {
          setError(null);
          onVerify(token);
        },
        'expired-callback': () => {
          setError('Verification expired. Please verify again.');
          onExpire?.();
        },
        'error-callback': (err) => {
          setError('Verification failed. Please try again.');
          onError?.(err);
        },
        retry: 'auto',
        'retry-interval': 5000,
        'refresh-expired': 'auto',
      };

      if (action) {
        options.action = action;
      }

      widgetIdRef.current = window.turnstile.render(containerRef.current, options);
      setIsLoading(false);
    } catch (err) {
      setError('Failed to initialize CAPTCHA');
      setIsLoading(false);
    }
  }, [siteKey, theme, size, action, onVerify, onExpire, onError]);

  // Initialize Turnstile
  useEffect(() => {
    if (!siteKey) {
      setError('CAPTCHA not configured');
      setIsLoading(false);
      return;
    }

    loadTurnstileScript()
      .then(() => {
        renderWidget();
      })
      .catch((err) => {
        setError('Failed to load CAPTCHA');
        setIsLoading(false);
        console.error('Turnstile load error:', err);
      });

    // Cleanup
    return () => {
      if (widgetIdRef.current && window.turnstile) {
        try {
          window.turnstile.remove(widgetIdRef.current);
        } catch {
          // Ignore removal errors
        }
      }
    };
  }, [siteKey, renderWidget]);

  const handleRetry = () => {
    setError(null);
    setIsLoading(true);
    renderWidget();
  };

  // If no site key configured, show a development message
  if (!siteKey) {
    return (
      <div className={`text-sm text-muted-foreground text-center py-4 ${className}`}>
        <p>CAPTCHA disabled (no site key configured)</p>
        <p className="text-xs mt-1">Set VITE_TURNSTILE_SITE_KEY in production</p>
      </div>
    );
  }

  return (
    <div className={className}>
      {error && (
        <Alert variant="destructive" className="mb-4">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription className="flex items-center justify-between">
            <span>{error}</span>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleRetry}
              className="ml-2 h-6 px-2"
            >
              <RefreshCw className="h-3 w-3 mr-1" />
              Retry
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {isLoading && (
        <div className="flex items-center justify-center py-4">
          <div className="animate-pulse text-sm text-muted-foreground">
            Loading CAPTCHA...
          </div>
        </div>
      )}

      <div
        ref={containerRef}
        className="flex justify-center"
        style={{ minHeight: isLoading ? 0 : undefined }}
      />
    </div>
  );
};

/**
 * Hook to manage Turnstile token state
 */
export function useTurnstile() {
  const [token, setToken] = useState<string | null>(null);
  const [isVerified, setIsVerified] = useState(false);

  const handleVerify = useCallback((newToken: string) => {
    setToken(newToken);
    setIsVerified(true);
  }, []);

  const handleExpire = useCallback(() => {
    setToken(null);
    setIsVerified(false);
  }, []);

  const reset = useCallback(() => {
    setToken(null);
    setIsVerified(false);
  }, []);

  return {
    token,
    isVerified,
    handleVerify,
    handleExpire,
    reset,
  };
}

/**
 * Server-side token verification (for edge functions)
 *
 * Usage in edge function:
 * ```typescript
 * const isValid = await verifyTurnstileToken(token, secretKey, clientIp);
 * ```
 */
export async function verifyTurnstileToken(
  token: string,
  secretKey: string,
  remoteIp?: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const formData = new URLSearchParams();
    formData.append('secret', secretKey);
    formData.append('response', token);
    if (remoteIp) {
      formData.append('remoteip', remoteIp);
    }

    const response = await fetch(
      'https://challenges.cloudflare.com/turnstile/v0/siteverify',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: formData.toString(),
      }
    );

    const result = await response.json();

    if (result.success) {
      return { success: true };
    }

    return {
      success: false,
      error: result['error-codes']?.join(', ') || 'Verification failed',
    };
  } catch (error) {
    return {
      success: false,
      error: 'Failed to verify token',
    };
  }
}

export default TurnstileCaptcha;
