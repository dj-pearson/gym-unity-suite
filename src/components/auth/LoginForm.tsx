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
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { validatePasswordSync } from '@/lib/security/password-policy';
import { useLoginRateLimit } from '@/hooks/useRateLimiter';

export const LoginForm: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [passwordError, setPasswordError] = useState('');
  const [lockoutInfo, setLockoutInfo] = useState<{
    locked: boolean;
    lockoutEndsAt?: number;
    attemptsRemaining: number;
  }>({ locked: false, attemptsRemaining: 5 });
  const { signIn, signUp } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

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
      navigate('/dashboard');
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
    await signUp(email, password);
    setIsLoading(false);
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
              </TabsContent>
              
              <TabsContent value="member" className="space-y-4">
                <BarcodeLogin />
              </TabsContent>
              
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
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </main>
  );
};