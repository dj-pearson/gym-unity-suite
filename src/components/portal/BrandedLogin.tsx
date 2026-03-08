import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { Loader2, Mail } from 'lucide-react';
import { usePortalThemeContext } from './PortalThemeProvider';

interface BrandedLoginProps {
  organizationName: string;
  organizationId: string;
  logoUrl?: string | null;
  loginBackgroundUrl?: string | null;
  showSignupLink?: boolean;
}

export function BrandedLogin({
  organizationName,
  organizationId,
  logoUrl,
  loginBackgroundUrl,
  showSignupLink = true,
}: BrandedLoginProps) {
  const navigate = useNavigate();
  const { resolvedTheme } = usePortalThemeContext();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [magicLinkSent, setMagicLinkSent] = useState(false);
  const [mode, setMode] = useState<'password' | 'magic'>('password');

  const handlePasswordLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      // Verify member belongs to this organization
      const { data: profile } = await supabase
        .from('profiles')
        .select('organization_id, role')
        .eq('id', data.user.id)
        .single();

      if (profile?.organization_id !== organizationId) {
        await supabase.auth.signOut();
        toast({
          title: 'Access Denied',
          description: 'Your account is not associated with this gym.',
          variant: 'destructive',
        });
        return;
      }

      navigate('/portal/dashboard');
    } catch (error: any) {
      toast({
        title: 'Login Failed',
        description: error.message || 'Invalid email or password.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleMagicLink = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: `${window.location.origin}/portal/dashboard`,
        },
      });

      if (error) throw error;
      setMagicLinkSent(true);
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to send magic link.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center p-4"
      style={{
        backgroundImage: loginBackgroundUrl ? `url(${loginBackgroundUrl})` : undefined,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        fontFamily: `var(--portal-font-body, 'Inter'), sans-serif`,
      }}
    >
      <div className={loginBackgroundUrl ? 'backdrop-blur-sm' : ''}>
        <Card className="w-full max-w-md mx-auto shadow-lg">
          <CardHeader className="text-center space-y-4">
            {logoUrl ? (
              <img
                src={logoUrl}
                alt={organizationName}
                className="h-12 w-auto mx-auto object-contain"
              />
            ) : (
              <CardTitle
                className="text-2xl"
                style={{ fontFamily: `var(--portal-font-heading, 'Inter')` }}
              >
                {organizationName}
              </CardTitle>
            )}
            <CardDescription>
              Sign in to your member account
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-4">
            {magicLinkSent ? (
              <div className="text-center space-y-4 py-4">
                <Mail className="h-12 w-12 mx-auto text-primary" />
                <p className="text-sm text-muted-foreground">
                  Check your email for a magic link to sign in. You can close this tab.
                </p>
                <Button variant="ghost" onClick={() => setMagicLinkSent(false)}>
                  Try a different method
                </Button>
              </div>
            ) : (
              <>
                <form onSubmit={mode === 'password' ? handlePasswordLogin : handleMagicLink}>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="email">Email</Label>
                      <Input
                        id="email"
                        type="email"
                        placeholder="you@example.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        autoComplete="email"
                      />
                    </div>

                    {mode === 'password' && (
                      <div className="space-y-2">
                        <Label htmlFor="password">Password</Label>
                        <Input
                          id="password"
                          type="password"
                          placeholder="Enter your password"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          required
                          autoComplete="current-password"
                        />
                      </div>
                    )}

                    <Button type="submit" className="w-full" disabled={loading}>
                      {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                      {mode === 'password' ? 'Sign In' : 'Send Magic Link'}
                    </Button>
                  </div>
                </form>

                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <Separator />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-background px-2 text-muted-foreground">or</span>
                  </div>
                </div>

                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => setMode(mode === 'password' ? 'magic' : 'password')}
                >
                  {mode === 'password' ? 'Sign in with Magic Link' : 'Sign in with Password'}
                </Button>

                {showSignupLink && (
                  <p className="text-center text-sm text-muted-foreground">
                    Don't have an account?{' '}
                    <Button
                      variant="link"
                      className="p-0 h-auto"
                      onClick={() => navigate('/portal/signup')}
                    >
                      Sign up
                    </Button>
                  </p>
                )}
              </>
            )}

            {/* Powered by badge */}
            {resolvedTheme.show_powered_by && (
              <div className="pt-4 text-center">
                <span className="text-[10px] text-muted-foreground">
                  Powered by Rep Club
                </span>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
