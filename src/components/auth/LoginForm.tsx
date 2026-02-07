import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useAuth } from '@/contexts/AuthContext';
import {
  Loader2, Mail, QrCode, Home, ArrowLeft, Calendar, ArrowRight,
  AlertCircle, ShieldAlert, Dumbbell, BarChart3, Users, Shield,
  Zap, Star, Eye, EyeOff,
} from 'lucide-react';
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
import { SkipLink } from '@/components/accessibility/SkipLink';
import { cn } from '@/lib/utils';

type AuthTab = 'signin' | 'member' | 'signup';

const FEATURES = [
  { icon: Users, label: 'Member Management', desc: 'Track thousands of members effortlessly' },
  { icon: BarChart3, label: 'Analytics & Insights', desc: 'Real-time dashboards and reports' },
  { icon: Calendar, label: 'Class Scheduling', desc: 'Automated booking and waitlists' },
  { icon: Shield, label: 'Enterprise Security', desc: 'Multi-tenant isolation & RBAC' },
  { icon: Zap, label: 'Smart Automations', desc: 'AI-powered workflows and alerts' },
  { icon: Dumbbell, label: 'Equipment Tracking', desc: 'Maintenance logs and utilization' },
];

const GoogleIcon = () => (
  <svg className="w-5 h-5" viewBox="0 0 24 24">
    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
  </svg>
);

const AppleIcon = () => (
  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
    <path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09l.01-.01zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z" />
  </svg>
);

const OAuthDivider = () => (
  <div className="relative my-6">
    <div className="absolute inset-0 flex items-center">
      <div className="w-full border-t border-white/10" />
    </div>
    <div className="relative flex justify-center text-xs uppercase">
      <span className="px-3 text-muted-foreground bg-[hsl(240,10%,5%)]">
        Or continue with
      </span>
    </div>
  </div>
);

interface OAuthButtonsProps {
  onGoogleClick: () => void;
  onAppleClick: () => void;
  disabled: boolean;
}

const OAuthButtons = ({ onGoogleClick, onAppleClick, disabled }: OAuthButtonsProps) => (
  <div className="grid grid-cols-2 gap-3">
    <button
      type="button"
      onClick={onGoogleClick}
      disabled={disabled}
      className={cn(
        "flex items-center justify-center gap-2 px-4 py-3 rounded-xl",
        "bg-white/5 border border-white/10 text-sm font-medium",
        "hover:bg-white/10 hover:border-white/20 transition-all duration-200",
        "disabled:opacity-50 disabled:cursor-not-allowed",
        "focus:outline-none focus:ring-2 focus:ring-primary/50"
      )}
    >
      <GoogleIcon />
      <span>Google</span>
    </button>
    <button
      type="button"
      onClick={onAppleClick}
      disabled={disabled}
      className={cn(
        "flex items-center justify-center gap-2 px-4 py-3 rounded-xl",
        "bg-white/5 border border-white/10 text-sm font-medium",
        "hover:bg-white/10 hover:border-white/20 transition-all duration-200",
        "disabled:opacity-50 disabled:cursor-not-allowed",
        "focus:outline-none focus:ring-2 focus:ring-primary/50"
      )}
    >
      <AppleIcon />
      <span>Apple</span>
    </button>
  </div>
);

export const LoginForm: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [passwordError, setPasswordError] = useState('');
  const [showOTPVerification, setShowOTPVerification] = useState(false);
  const [pendingEmail, setPendingEmail] = useState('');
  const [activeTab, setActiveTab] = useState<AuthTab>('signin');
  const [showPassword, setShowPassword] = useState(false);
  const [lockoutInfo, setLockoutInfo] = useState<{
    locked: boolean;
    lockoutEndsAt?: number;
    attemptsRemaining: number;
  }>({ locked: false, attemptsRemaining: 5 });

  const { signIn, signUp } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [searchParams] = useSearchParams();

  const redirectTo = getSafeRedirectURL(searchParams, 'redirect', '/dashboard');
  const loginRateLimit = useLoginRateLimit(email || 'anonymous');

  useEffect(() => {
    if (email) {
      const status = loginRateLimit.checkLockout();
      setLockoutInfo(status);
    }
  }, [email]);

  const getLockoutTimeRemaining = (): string => {
    if (!lockoutInfo.lockoutEndsAt) return '';
    const remaining = Math.max(0, lockoutInfo.lockoutEndsAt - Date.now());
    const minutes = Math.ceil(remaining / 60000);
    return `${minutes} minute${minutes !== 1 ? 's' : ''}`;
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
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
      loginRateLimit.clearAttempts();
      setLockoutInfo({ locked: false, attemptsRemaining: 5 });
      navigate(redirectTo);
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError('');

    if (password !== confirmPassword) {
      setPasswordError('Passwords do not match');
      toast({ title: 'Passwords do not match', description: 'Please make sure both password fields are identical.', variant: 'destructive' });
      return;
    }

    const validation = validatePasswordSync(password);
    if (!validation.isValid) {
      const errorMessage = validation.errors[0] || 'Password does not meet requirements';
      setPasswordError(errorMessage);
      toast({ title: 'Password Requirements Not Met', description: errorMessage, variant: 'destructive' });
      return;
    }

    if (validation.strength === 'weak' || validation.strength === 'fair') {
      toast({ title: 'Consider a Stronger Password', description: 'Your password meets minimum requirements but could be stronger.', variant: 'default' });
    }

    setIsLoading(true);
    const { error, needsEmailVerification } = await signUp(email, password);
    setIsLoading(false);

    if (error) {
      toast({ title: 'Sign Up Failed', description: error.message, variant: 'destructive' });
      return;
    }

    if (needsEmailVerification) {
      setPendingEmail(email);
      setShowOTPVerification(true);
    } else {
      navigate(redirectTo);
    }
  };

  const handleOTPVerificationSuccess = () => {
    setShowOTPVerification(false);
    setPendingEmail('');
    setEmail('');
    setPassword('');
    setConfirmPassword('');
    navigate(redirectTo);
  };

  const handleOTPVerificationBack = () => {
    setShowOTPVerification(false);
    setPendingEmail('');
  };

  const handleOAuthSignIn = async (provider: 'google' | 'apple') => {
    try {
      setIsLoading(true);
      const functionsUrl = import.meta.env.VITE_SUPABASE_FUNCTIONS_URL || import.meta.env.VITE_FUNCTIONS_URL;

      if (functionsUrl) {
        const oauthUrl = `${functionsUrl}/oauth-proxy?action=authorize&provider=${provider}&redirect_to=${encodeURIComponent(redirectTo)}`;
        window.location.href = oauthUrl;
        return;
      }

      const callbackUrl = `${window.location.origin}/auth/callback?redirect_to=${encodeURIComponent(redirectTo)}`;
      const { error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: callbackUrl,
          scopes: provider === 'google' ? 'email profile' : 'email name',
        },
      });

      if (error) {
        toast({ title: 'OAuth Error', description: error.message, variant: 'destructive' });
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to sign in with OAuth';
      toast({ title: 'OAuth Error', description: message, variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  };

  const handlePasswordChange = (value: string) => {
    setPassword(value);
    if (passwordError) setPasswordError('');
  };

  const handleConfirmPasswordChange = (value: string) => {
    setConfirmPassword(value);
    if (passwordError) setPasswordError('');
  };

  // OTP verification screen
  if (showOTPVerification) {
    return (
      <>
        <SkipLink targetId="main-content" />
        <main id="main-content" className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden" role="main">
          <AuthBackground />
          <div className="w-full max-w-md relative z-10">
            <div className="mb-6">
              <Button
                variant="ghost"
                onClick={() => navigate('/')}
                className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
                aria-label="Back to homepage"
              >
                <ArrowLeft className="w-4 h-4" aria-hidden="true" />
                <Home className="w-4 h-4" aria-hidden="true" />
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
      </>
    );
  }

  return (
    <>
      <SkipLink targetId="main-content" />
      <main id="main-content" className="min-h-screen flex relative overflow-hidden" role="main">
        <AuthBackground />

        {/* Left Panel - Brand Showcase (hidden on mobile) */}
        <div className="hidden lg:flex lg:w-1/2 xl:w-[55%] relative z-10 flex-col justify-between p-12 xl:p-16">
          {/* Top - Logo & Navigation */}
          <div>
            <Button
              variant="ghost"
              onClick={() => navigate('/')}
              className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors -ml-4"
              aria-label="Back to homepage"
            >
              <ArrowLeft className="w-4 h-4" aria-hidden="true" />
              <Home className="w-4 h-4" aria-hidden="true" />
              Back to Homepage
            </Button>
          </div>

          {/* Center - Brand Message */}
          <div className="space-y-8">
            <div>
              <div className="flex items-center gap-3 mb-6">
                <Logo size="xl" showText={false} linkToHome={false} />
              </div>
              <h1 className="text-5xl xl:text-6xl font-bold leading-tight">
                <span className="text-gradient-hero">Elevate Your</span>
                <br />
                <span className="text-gradient-primary">Fitness Empire</span>
              </h1>
              <p className="mt-6 text-lg text-muted-foreground max-w-md leading-relaxed">
                The all-in-one platform trusted by elite gyms and fitness studios
                to manage members, classes, billing, and growth.
              </p>
            </div>

            {/* Feature Grid */}
            <div className="grid grid-cols-2 gap-3">
              {FEATURES.map(({ icon: Icon, label, desc }) => (
                <div
                  key={label}
                  className="group flex items-start gap-3 p-3 rounded-xl bg-white/[0.03] border border-white/[0.06] hover:bg-white/[0.06] hover:border-white/[0.12] transition-all duration-300"
                >
                  <div className="flex-shrink-0 w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                    <Icon className="w-4 h-4 text-primary" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-foreground">{label}</p>
                    <p className="text-xs text-muted-foreground mt-0.5 leading-snug">{desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Bottom - Trust Indicators */}
          <div className="flex items-center gap-6 text-sm text-muted-foreground">
            <div className="flex items-center gap-1.5">
              <Shield className="w-4 h-4 text-primary/70" />
              <span>SOC 2 Ready</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Star className="w-4 h-4 text-primary/70" />
              <span>99.9% Uptime</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Users className="w-4 h-4 text-primary/70" />
              <span>Enterprise Grade</span>
            </div>
          </div>
        </div>

        {/* Right Panel - Auth Form */}
        <div className="w-full lg:w-1/2 xl:w-[45%] relative z-10 flex items-center justify-center p-6 sm:p-8 lg:p-12">
          {/* Glass panel behind the form */}
          <div className="absolute inset-0 bg-black/20 backdrop-blur-xl lg:backdrop-blur-2xl border-l border-white/[0.06]" />

          <div className="w-full max-w-[420px] relative z-10">
            {/* Mobile header */}
            <div className="lg:hidden mb-8">
              <Button
                variant="ghost"
                onClick={() => navigate('/')}
                className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors -ml-4 mb-6"
                aria-label="Back to homepage"
              >
                <ArrowLeft className="w-4 h-4" aria-hidden="true" />
                <Home className="w-4 h-4" aria-hidden="true" />
                Back
              </Button>
              <div className="flex items-center gap-3">
                <Logo size="md" showText={false} linkToHome={false} />
                <div>
                  <h1 className="text-2xl font-bold text-gradient-hero">Rep Club</h1>
                  <p className="text-xs text-muted-foreground">Elite Fitness Management</p>
                </div>
              </div>
            </div>

            {/* Welcome text (desktop) */}
            <div className="hidden lg:block mb-8">
              <h2 className="text-2xl font-bold text-foreground">Welcome back</h2>
              <p className="text-muted-foreground mt-1">Sign in to your account to continue</p>
            </div>

            {/* Tab Navigation */}
            <div className="flex gap-1 p-1 mb-6 rounded-xl bg-white/[0.04] border border-white/[0.08]">
              {([
                { id: 'signin' as AuthTab, label: 'Sign In', icon: Mail },
                { id: 'member' as AuthTab, label: 'Member', icon: QrCode },
                { id: 'signup' as AuthTab, label: 'Sign Up', icon: Mail },
              ]).map(({ id, label, icon: Icon }) => (
                <button
                  key={id}
                  onClick={() => setActiveTab(id)}
                  className={cn(
                    "flex-1 flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-lg text-sm font-medium transition-all duration-200",
                    activeTab === id
                      ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20"
                      : "text-muted-foreground hover:text-foreground hover:bg-white/[0.04]"
                  )}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">{label}</span>
                </button>
              ))}
            </div>

            {/* SIGN IN TAB */}
            {activeTab === 'signin' && (
              <div className="space-y-5 animate-in fade-in duration-200">
                {lockoutInfo.locked && (
                  <Alert variant="destructive">
                    <ShieldAlert className="h-4 w-4" />
                    <AlertDescription>
                      Account temporarily locked. Try again in {getLockoutTimeRemaining()}.
                    </AlertDescription>
                  </Alert>
                )}

                {!lockoutInfo.locked && lockoutInfo.attemptsRemaining <= 2 && lockoutInfo.attemptsRemaining > 0 && (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      {lockoutInfo.attemptsRemaining} attempt{lockoutInfo.attemptsRemaining !== 1 ? 's' : ''} remaining before lockout.
                    </AlertDescription>
                  </Alert>
                )}

                {/* OAuth buttons first for prominence */}
                <OAuthButtons
                  onGoogleClick={() => handleOAuthSignIn('google')}
                  onAppleClick={() => handleOAuthSignIn('apple')}
                  disabled={isLoading}
                />

                <OAuthDivider />

                <form onSubmit={handleSignIn} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="signin-email" className="text-sm text-muted-foreground">Email</Label>
                    <Input
                      id="signin-email"
                      type="email"
                      placeholder="you@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      disabled={lockoutInfo.locked}
                      className="h-11 bg-white/[0.04] border-white/[0.08] rounded-xl focus:border-primary/50 focus:ring-primary/20 placeholder:text-muted-foreground/50"
                    />
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="signin-password" className="text-sm text-muted-foreground">Password</Label>
                      <ForgotPasswordForm />
                    </div>
                    <div className="relative">
                      <Input
                        id="signin-password"
                        type={showPassword ? 'text' : 'password'}
                        placeholder="Enter your password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        disabled={lockoutInfo.locked}
                        className="h-11 bg-white/[0.04] border-white/[0.08] rounded-xl focus:border-primary/50 focus:ring-primary/20 placeholder:text-muted-foreground/50 pr-10"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                        tabIndex={-1}
                        aria-label={showPassword ? 'Hide password' : 'Show password'}
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                  <Button
                    type="submit"
                    className="w-full h-11 rounded-xl bg-primary text-primary-foreground font-semibold shadow-lg shadow-primary/25 hover:shadow-primary/40 hover:brightness-110 transition-all duration-200"
                    disabled={isLoading || lockoutInfo.locked}
                  >
                    {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    {lockoutInfo.locked ? 'Account Locked' : 'Sign In'}
                  </Button>
                </form>

                <p className="text-center text-sm text-muted-foreground">
                  Don't have an account?{' '}
                  <button
                    onClick={() => setActiveTab('signup')}
                    className="text-primary hover:text-primary/80 font-medium transition-colors"
                  >
                    Sign up
                  </button>
                </p>
              </div>
            )}

            {/* MEMBER CHECK-IN TAB */}
            {activeTab === 'member' && (
              <div className="animate-in fade-in duration-200">
                <BarcodeLogin />
              </div>
            )}

            {/* SIGN UP TAB */}
            {activeTab === 'signup' && (
              <div className="space-y-5 animate-in fade-in duration-200">
                <div className="p-5 rounded-xl bg-white/[0.03] border border-white/[0.08]">
                  <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center mx-auto mb-3">
                    <Calendar className="w-6 h-6 text-primary" />
                  </div>
                  <h3 className="text-lg font-semibold text-center mb-2">Launching November 1st, 2025</h3>
                  <p className="text-sm text-muted-foreground text-center mb-4 leading-relaxed">
                    New registrations are currently closed as we prepare for launch.
                    Request early access to be among the first to experience Rep Club.
                  </p>
                  <Button
                    onClick={() => navigate('/#early-access')}
                    className="w-full h-11 rounded-xl bg-primary text-primary-foreground font-semibold shadow-lg shadow-primary/25 hover:shadow-primary/40 hover:brightness-110 transition-all duration-200"
                  >
                    Request Early Access
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </div>

                <p className="text-center text-sm text-muted-foreground">
                  Already have an account?{' '}
                  <button
                    onClick={() => setActiveTab('signin')}
                    className="text-primary hover:text-primary/80 font-medium transition-colors"
                  >
                    Sign in
                  </button>
                </p>

                {/* Uncomment this section to enable sign-up with password strength indicator */}
                {/*
                <OAuthButtons
                  onGoogleClick={() => handleOAuthSignIn('google')}
                  onAppleClick={() => handleOAuthSignIn('apple')}
                  disabled={isLoading}
                />

                <OAuthDivider />

                <form onSubmit={handleSignUp} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="signup-email" className="text-sm text-muted-foreground">Email</Label>
                    <Input
                      id="signup-email"
                      type="email"
                      placeholder="you@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      disabled={isLoading}
                      className="h-11 bg-white/[0.04] border-white/[0.08] rounded-xl"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signup-password" className="text-sm text-muted-foreground">Password</Label>
                    <PasswordStrengthIndicator
                      password={password}
                      onPasswordChange={handlePasswordChange}
                      showRequirements={true}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signup-confirm-password" className="text-sm text-muted-foreground">Confirm Password</Label>
                    <Input
                      id="signup-confirm-password"
                      type="password"
                      placeholder="Confirm your password"
                      value={confirmPassword}
                      onChange={(e) => handleConfirmPasswordChange(e.target.value)}
                      required
                      disabled={isLoading}
                      className="h-11 bg-white/[0.04] border-white/[0.08] rounded-xl"
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
                    className="w-full h-11 rounded-xl bg-primary text-primary-foreground font-semibold shadow-lg shadow-primary/25"
                    disabled={isLoading}
                  >
                    {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Create Account
                  </Button>
                </form>

                <p className="text-center text-sm text-muted-foreground">
                  Already have an account?{' '}
                  <button
                    onClick={() => setActiveTab('signin')}
                    className="text-primary hover:text-primary/80 font-medium transition-colors"
                  >
                    Sign in
                  </button>
                </p>
                */}
              </div>
            )}

            {/* Footer */}
            <div className="mt-8 pt-6 border-t border-white/[0.06] text-center">
              <p className="text-xs text-muted-foreground/60">
                By signing in, you agree to our{' '}
                <a href="/terms" className="text-muted-foreground hover:text-foreground transition-colors underline underline-offset-2">
                  Terms of Service
                </a>{' '}
                and{' '}
                <a href="/privacy" className="text-muted-foreground hover:text-foreground transition-colors underline underline-offset-2">
                  Privacy Policy
                </a>
              </p>
            </div>
          </div>
        </div>
      </main>
    </>
  );
};

/** Animated background with floating gradient orbs */
function AuthBackground() {
  return (
    <div className="fixed inset-0 z-0 overflow-hidden bg-[hsl(240,10%,3.9%)]">
      {/* Primary gradient glow - top center */}
      <div
        className="absolute -top-[30%] left-1/2 -translate-x-1/2 w-[900px] h-[900px] rounded-full opacity-[0.12]"
        style={{
          background: 'radial-gradient(circle, hsl(45, 93%, 47%) 0%, transparent 70%)',
          animation: 'float-up 20s ease-in-out infinite',
        }}
      />
      {/* Secondary glow - bottom left */}
      <div
        className="absolute -bottom-[20%] -left-[10%] w-[600px] h-[600px] rounded-full opacity-[0.07]"
        style={{
          background: 'radial-gradient(circle, hsl(45, 100%, 60%) 0%, transparent 70%)',
          animation: 'float-left 25s ease-in-out infinite',
        }}
      />
      {/* Accent glow - right */}
      <div
        className="absolute top-[30%] -right-[10%] w-[500px] h-[500px] rounded-full opacity-[0.05]"
        style={{
          background: 'radial-gradient(circle, hsl(200, 80%, 50%) 0%, transparent 70%)',
          animation: 'float-down 22s ease-in-out infinite',
        }}
      />
      {/* Subtle grid pattern */}
      <div
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: 'linear-gradient(rgba(255,255,255,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.05) 1px, transparent 1px)',
          backgroundSize: '60px 60px',
        }}
      />
      {/* Noise texture overlay */}
      <div className="absolute inset-0 opacity-[0.015]" style={{
        backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
      }} />
    </div>
  );
}
