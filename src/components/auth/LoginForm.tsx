import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useAuth } from '@/contexts/AuthContext';
import { Loader2, Mail, QrCode, Home, ArrowLeft, Calendar, ArrowRight, AlertCircle, ShieldAlert } from 'lucide-react';
import { Logo } from '@/components/ui/logo';
import { BarcodeLogin } from './BarcodeLogin';
import { ForgotPasswordForm } from './ForgotPasswordForm';
import { OTPVerification } from './OTPVerification';
import { PasswordStrengthIndicator } from './PasswordStrengthIndicator';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { validatePasswordSync } from '@/lib/security/password-policy';
import { useLoginRateLimit } from '@/hooks/useRateLimiter';
import { getSafeRedirectURL } from '@/lib/security/url-sanitization';
import { supabase } from '@/integrations/supabase/client';

export const LoginForm: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [passwordError, setPasswordError] = useState('');
  const [showOTPVerification, setShowOTPVerification] = useState(false);
  const [pendingEmail, setPendingEmail] = useState('');
  const [lockoutInfo, setLockoutInfo] = useState<{
    locked: boolean;
    lockoutEndsAt?: number;
    attemptsRemaining: number;
  }>({ locked: false, attemptsRemaining: 5 });
  
  const { signIn, signUp } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [searchParams] = useSearchParams();

  // Get safe redirect URL from query params
  const redirectTo = getSafeRedirectURL(searchParams, 'redirect', '/dashboard');

  // Rate limiting for login attempts - use email as identifier
  const loginRateLimit = useLoginRateLimit(email || 'anonymous');

  // Check lockout status when email changes
  useEffect(() => {
    if (email) {
      const status = loginRateLimit.checkLockout();
      setLockoutInfo(status);
    }
  }, [email]);

  // Calculate remaining lockout time
  const getLockoutTimeRemaining = (): string => {
    if (!lockoutInfo.lockoutEndsAt) return '';
    const remaining = Math.max(0, lockoutInfo.lockoutEndsAt - Date.now());
    const minutes = Math.ceil(remaining / 60000);
    return `${minutes} minute${minutes !== 1 ? 's' : ''}`;
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();

    // Check if account is locked out
    const currentLockout = loginRateLimit.checkLockout();
    if (currentLockout.locked) {
      setLockoutInfo(currentLockout);
      toast({
        title: 'Account Temporarily Locked',
        description: `Too many failed attempts. Please try again in ${getLockoutTimeRemaining()}.`,
        variant: 'destructive',
      });
      return;
    }

    setIsLoading(true);
    const { error } = await signIn(email, password);
    setIsLoading(false);

    if (error) {
      // Record failed attempt
      const result = loginRateLimit.recordFailure();
      setLockoutInfo(result);

      if (result.locked) {
        toast({
          title: 'Account Temporarily Locked',
          description: 'Too many failed login attempts. Please try again in 15 minutes.',
          variant: 'destructive',
        });
      } else if (result.attemptsRemaining <= 2) {
        toast({
          title: 'Warning',
          description: `${result.attemptsRemaining} attempt${result.attemptsRemaining !== 1 ? 's' : ''} remaining before account lockout.`,
          variant: 'destructive',
        });
      }
    } else {
      // Clear failed attempts on successful login
      loginRateLimit.clearAttempts();
      setLockoutInfo({ locked: false, attemptsRemaining: 5 });
      // Redirect to intended destination
      navigate(redirectTo);
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError('');

    if (password !== confirmPassword) {
      setPasswordError('Passwords do not match');
      toast({
        title: 'Passwords do not match',
        description: 'Please make sure both password fields are identical.',
        variant: 'destructive',
      });
      return;
    }

    // Use comprehensive password policy validation
    const validation = validatePasswordSync(password);
    if (!validation.isValid) {
      const errorMessage = validation.errors[0] || 'Password does not meet requirements';
      setPasswordError(errorMessage);
      toast({
        title: 'Password Requirements Not Met',
        description: errorMessage,
        variant: 'destructive',
      });
      return;
    }

    // Show warning for weak passwords even if technically valid
    if (validation.strength === 'weak' || validation.strength === 'fair') {
      toast({
        title: 'Consider a Stronger Password',
        description: 'Your password meets minimum requirements but could be stronger.',
        variant: 'default',
      });
    }

    setIsLoading(true);
    const { error, needsEmailVerification } = await signUp(email, password);
    setIsLoading(false);

    if (error) {
      toast({
        title: 'Sign Up Failed',
        description: error.message,
        variant: 'destructive',
      });
      return;
    }

    if (needsEmailVerification) {
      // Show OTP verification screen
      setPendingEmail(email);
      setShowOTPVerification(true);
    } else {
      // Account created and logged in (email confirmation disabled)
      navigate(redirectTo);
    }
  };

  const handleOTPVerificationSuccess = () => {
    setShowOTPVerification(false);
    setPendingEmail('');
    setEmail('');
    setPassword('');
    setConfirmPassword('');
    // Redirect to dashboard after verification
    navigate(redirectTo);
  };

  const handleOTPVerificationBack = () => {
    setShowOTPVerification(false);
    setPendingEmail('');
  };

  const handleOAuthSignIn = async (provider: 'google' | 'apple') => {
    try {
      setIsLoading(true);

      // Build callback URL with redirect parameter
      const callbackUrl = `${window.location.origin}/auth?redirect=${encodeURIComponent(redirectTo)}`;

      const { error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: callbackUrl,
          // Request email and profile scopes
          scopes: provider === 'google' ? 'email profile' : 'email name',
        },
      });

      if (error) {
        toast({
          title: 'OAuth Error',
          description: error.message,
          variant: 'destructive',
        });
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to sign in with OAuth';
      toast({
        title: 'OAuth Error',
        description: message,
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Clear password error when user starts typing
  const handlePasswordChange = (value: string) => {
    setPassword(value);
    if (passwordError) setPasswordError('');
  };

  const handleConfirmPasswordChange = (value: string) => {
    setConfirmPassword(value);
    if (passwordError) setPasswordError('');
  };

  // If showing OTP verification, render that component
  if (showOTPVerification) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-gradient-subtle p-4">
        <div className="w-full max-w-md">
          <div className="mb-6">
            <Button
              variant="ghost"
              onClick={() => navigate('/')}
              className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              <Home className="w-4 h-4" />
              Back to Homepage
            </Button>
          </div>

          <div className="text-center mb-8">
            <div className="flex justify-center mb-4">
              <Logo size="lg" showText={false} linkToHome={false} />
            </div>
            <h1 className="text-3xl font-bold text-gradient-hero mb-2">Rep Club</h1>
          </div>

          <OTPVerification
            email={pendingEmail}
            onSuccess={handleOTPVerificationSuccess}
            onBack={handleOTPVerificationBack}
            verificationType="signup"
          />
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-gradient-subtle p-4">
      <div className="w-full max-w-md">
        {/* Back to Homepage Button */}
        <div className="mb-6">
          <Button
            variant="ghost"
            onClick={() => navigate('/')}
            className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <Home className="w-4 h-4" />
            Back to Homepage
          </Button>
        </div>

        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <Logo size="lg" showText={false} linkToHome={false} />
          </div>
          <h1 className="text-3xl font-bold text-gradient-hero mb-2">Rep Club</h1>
          <p className="text-muted-foreground">
            Elite Fitness Management Platform
          </p>
        </div>

        <Card className="gym-card">
          <CardHeader>
            <CardTitle>Welcome Back</CardTitle>
            <CardDescription>
              Sign in to your account or create a new one to get started
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="signin" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="signin" className="flex items-center gap-1">
                  <Mail className="w-4 h-4" />
                  <span className="hidden sm:inline">Sign In</span>
                </TabsTrigger>
                <TabsTrigger value="member" className="flex items-center gap-1">
                  <QrCode className="w-4 h-4" />
                  <span className="hidden sm:inline">Member</span>
                </TabsTrigger>
                <TabsTrigger value="signup" className="flex items-center gap-1">
                  <Mail className="w-4 h-4" />
                  <span className="hidden sm:inline">Sign Up</span>
                </TabsTrigger>
              </TabsList>

              {/* SIGN IN TAB */}
              <TabsContent value="signin" className="space-y-4">
                {/* Lockout Warning */}
                {lockoutInfo.locked && (
                  <Alert variant="destructive">
                    <ShieldAlert className="h-4 w-4" />
                    <AlertDescription>
                      Account temporarily locked due to too many failed attempts.
                      Please try again in {getLockoutTimeRemaining()}.
                    </AlertDescription>
                  </Alert>
                )}

                {/* Low attempts warning */}
                {!lockoutInfo.locked && lockoutInfo.attemptsRemaining <= 2 && lockoutInfo.attemptsRemaining > 0 && (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      Warning: {lockoutInfo.attemptsRemaining} login attempt{lockoutInfo.attemptsRemaining !== 1 ? 's' : ''} remaining before temporary lockout.
                    </AlertDescription>
                  </Alert>
                )}

                <form onSubmit={handleSignIn} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="signin-email">Email</Label>
                    <Input
                      id="signin-email"
                      type="email"
                      placeholder="Enter your email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      disabled={lockoutInfo.locked}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signin-password">Password</Label>
                    <Input
                      id="signin-password"
                      type="password"
                      placeholder="Enter your password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      disabled={lockoutInfo.locked}
                    />
                  </div>
                  <Button
                    type="submit"
                    className="w-full bg-gradient-primary hover:opacity-90 transition-smooth"
                    disabled={isLoading || lockoutInfo.locked}
                  >
                    {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    {lockoutInfo.locked ? 'Account Locked' : 'Sign In'}
                  </Button>

                  <div className="text-center">
                    <ForgotPasswordForm />
                  </div>
                </form>

                {/* OAuth Buttons */}
                <div className="space-y-3">
                  <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                      <span className="w-full border-t" />
                    </div>
                    <div className="relative flex justify-center text-xs uppercase">
                      <span className="bg-background px-2 text-muted-foreground">
                        Or continue with
                      </span>
                    </div>
                  </div>

                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={() => handleOAuthSignIn('google')}
                    disabled={isLoading}
                  >
                    <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                      <path
                        fill="currentColor"
                        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                      />
                      <path
                        fill="currentColor"
                        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                      />
                      <path
                        fill="currentColor"
                        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                      />
                      <path
                        fill="currentColor"
                        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                      />
                    </svg>
                    Continue with Google
                  </Button>

                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={() => handleOAuthSignIn('apple')}
                    disabled={isLoading}
                  >
                    <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09l.01-.01zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z"/>
                    </svg>
                    Continue with Apple
                  </Button>
                </div>
              </TabsContent>
              
              {/* MEMBER CHECK-IN TAB */}
              <TabsContent value="member" className="space-y-4">
                <BarcodeLogin />
              </TabsContent>
              
              {/* SIGN UP TAB */}
              <TabsContent value="signup" className="space-y-4">
                <div className="text-center space-y-4">
                  <div className="p-6 bg-muted/50 rounded-lg border border-border">
                    <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Calendar className="w-8 h-8 text-primary" />
                    </div>
                    <h3 className="text-lg font-semibold mb-2">Launching November 1st, 2025</h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      New registrations are currently closed as we prepare for our exciting launch. 
                      Request early access to be among the first to experience Rep Club.
                    </p>
                    <Button 
                      onClick={() => navigate('/#early-access')}
                      className="bg-gradient-primary hover:opacity-90 transition-smooth"
                    >
                      Request Early Access
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </div>
                </div>

                {/* Uncomment this section to enable sign-up with password strength indicator */}
                {/* 
                <form onSubmit={handleSignUp} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="signup-email">Email</Label>
                    <Input
                      id="signup-email"
                      type="email"
                      placeholder="Enter your email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      disabled={isLoading}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="signup-password">Password</Label>
                    <PasswordStrengthIndicator
                      password={password}
                      onPasswordChange={handlePasswordChange}
                      showRequirements={true}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="signup-confirm-password">Confirm Password</Label>
                    <Input
                      id="signup-confirm-password"
                      type="password"
                      placeholder="Confirm your password"
                      value={confirmPassword}
                      onChange={(e) => handleConfirmPasswordChange(e.target.value)}
                      required
                      disabled={isLoading}
                    />
                  </div>

                  {passwordError && (
                    <Alert variant="destructive">
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>{passwordError}</AlertDescription>
                    </Alert>
                  )}

                  <Button
                    type="submit"
                    className="w-full bg-gradient-primary hover:opacity-90 transition-smooth"
                    disabled={isLoading}
                  >
                    {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Create Account
                  </Button>

                  <div className="space-y-3">
                    <div className="relative">
                      <div className="absolute inset-0 flex items-center">
                        <span className="w-full border-t" />
                      </div>
                      <div className="relative flex justify-center text-xs uppercase">
                        <span className="bg-background px-2 text-muted-foreground">
                          Or continue with
                        </span>
                      </div>
                    </div>

                    <Button
                      variant="outline"
                      className="w-full"
                      onClick={() => handleOAuthSignIn('google')}
                      disabled={isLoading}
                    >
                      <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                        <path
                          fill="currentColor"
                          d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                        />
                        <path
                          fill="currentColor"
                          d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                        />
                        <path
                          fill="currentColor"
                          d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                        />
                        <path
                          fill="currentColor"
                          d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                        />
                      </svg>
                      Continue with Google
                    </Button>

                    <Button
                      variant="outline"
                      className="w-full"
                      onClick={() => handleOAuthSignIn('apple')}
                      disabled={isLoading}
                    >
                      <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09l.01-.01zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z"/>
                      </svg>
                      Continue with Apple
                    </Button>
                  </div>
                </form>
                */}
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </main>
  );
};
