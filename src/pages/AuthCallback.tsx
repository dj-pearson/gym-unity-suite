import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, CheckCircle2, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

type CallbackStatus = 'processing' | 'success' | 'error';

export default function AuthCallback() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState<CallbackStatus>('processing');
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    const handleCallback = async () => {
      try {
        const error = searchParams.get('error');
        if (error) {
          setStatus('error');
          setErrorMessage(searchParams.get('error_description') || error);
          return;
        }

        // Handle magic link token from OAuth proxy
        const token = searchParams.get('token');
        const type = searchParams.get('type');
        const redirectTo = searchParams.get('redirect_to') || '/dashboard';

        if (token && type) {
          const { data, error: verifyError } = await supabase.auth.verifyOtp({
            token_hash: token,
            type: type as 'magiclink' | 'email',
          });

          if (verifyError) {
            setStatus('error');
            setErrorMessage(verifyError.message);
            return;
          }

          if (data.session) {
            setStatus('success');
            setTimeout(() => navigate(redirectTo, { replace: true }), 800);
            return;
          }
        }

        // Handle PKCE code (fallback for standard Supabase OAuth)
        const code = searchParams.get('code');
        if (code) {
          const { data, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
          if (exchangeError) {
            setStatus('error');
            setErrorMessage(exchangeError.message);
            return;
          }
          if (data.session) {
            setStatus('success');
            setTimeout(() => navigate('/dashboard', { replace: true }), 800);
            return;
          }
        }

        // No valid auth data found
        navigate('/auth', { replace: true });
      } catch (err) {
        setStatus('error');
        setErrorMessage(err instanceof Error ? err.message : 'An unexpected error occurred');
      }
    };

    handleCallback();
  }, [navigate, searchParams]);

  return (
    <main className="min-h-screen flex items-center justify-center p-4">
      <div className="text-center space-y-6 max-w-md">
        {status === 'processing' && (
          <>
            <div className="w-16 h-16 mx-auto rounded-full bg-primary/10 flex items-center justify-center">
              <Loader2 className="w-8 h-8 text-primary animate-spin" />
            </div>
            <div>
              <h1 className="text-2xl font-bold mb-2">Completing sign in...</h1>
              <p className="text-muted-foreground">Please wait while we verify your credentials.</p>
            </div>
          </>
        )}

        {status === 'success' && (
          <>
            <div className="w-16 h-16 mx-auto rounded-full bg-green-500/10 flex items-center justify-center">
              <CheckCircle2 className="w-8 h-8 text-green-500" />
            </div>
            <div>
              <h1 className="text-2xl font-bold mb-2">Sign in successful</h1>
              <p className="text-muted-foreground">Redirecting you now...</p>
            </div>
          </>
        )}

        {status === 'error' && (
          <>
            <div className="w-16 h-16 mx-auto rounded-full bg-destructive/10 flex items-center justify-center">
              <XCircle className="w-8 h-8 text-destructive" />
            </div>
            <div>
              <h1 className="text-2xl font-bold mb-2">Authentication Failed</h1>
              <p className="text-muted-foreground">{errorMessage}</p>
            </div>
            <Button onClick={() => navigate('/auth')} variant="outline">
              Try Again
            </Button>
          </>
        )}
      </div>
    </main>
  );
}
