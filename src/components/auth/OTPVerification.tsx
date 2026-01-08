import React, { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, Mail, ArrowLeft, CheckCircle2, AlertCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface OTPVerificationProps {
  email: string;
  onSuccess?: () => void;
  onBack?: () => void;
  verificationType?: 'signup' | 'email' | 'sms';
}

export const OTPVerification: React.FC<OTPVerificationProps> = ({
  email,
  onSuccess,
  onBack,
  verificationType = 'signup',
}) => {
  const [otpCode, setOtpCode] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  // Cooldown timer for resend button
  useEffect(() => {
    if (resendCooldown > 0) {
      const timer = setTimeout(() => {
        setResendCooldown(resendCooldown - 1);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [resendCooldown]);

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (otpCode.length !== 6) {
      setError('Please enter a 6-digit code');
      return;
    }

    setIsVerifying(true);

    try {
      const { error: verifyError } = await supabase.auth.verifyOtp({
        email,
        token: otpCode,
        type: verificationType,
      });

      if (verifyError) {
        setError(verifyError.message);
        toast({
          title: 'Verification Failed',
          description: verifyError.message,
          variant: 'destructive',
        });
      } else {
        toast({
          title: 'Email Verified!',
          description: 'Your email has been successfully verified.',
        });
        onSuccess?.();
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'An unknown error occurred';
      setError(message);
      toast({
        title: 'Verification Error',
        description: message,
        variant: 'destructive',
      });
    } finally {
      setIsVerifying(false);
    }
  };

  const handleResendCode = useCallback(async () => {
    if (resendCooldown > 0) return;

    setIsResending(true);
    setError(null);

    try {
      const { error: resendError } = await supabase.auth.resend({
        type: verificationType,
        email,
      });

      if (resendError) {
        toast({
          title: 'Resend Failed',
          description: resendError.message,
          variant: 'destructive',
        });
      } else {
        toast({
          title: 'Code Sent',
          description: 'A new verification code has been sent to your email.',
        });
        setResendCooldown(60); // 60 second cooldown
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to resend code';
      toast({
        title: 'Resend Error',
        description: message,
        variant: 'destructive',
      });
    } finally {
      setIsResending(false);
    }
  }, [email, verificationType, resendCooldown, toast]);

  const handleOtpChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, ''); // Only allow digits
    if (value.length <= 6) {
      setOtpCode(value);
      setError(null);
    }
  };

  return (
    <Card className="gym-card">
      <CardHeader className="text-center">
        <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
          <Mail className="w-8 h-8 text-primary" />
        </div>
        <CardTitle>Check Your Email</CardTitle>
        <CardDescription>
          We've sent a 6-digit verification code to
          <br />
          <span className="font-semibold text-foreground">{email}</span>
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <form onSubmit={handleVerifyOtp} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="otp-code">Verification Code</Label>
            <Input
              id="otp-code"
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              placeholder="000000"
              value={otpCode}
              onChange={handleOtpChange}
              maxLength={6}
              className="text-center text-2xl tracking-widest font-mono"
              autoComplete="one-time-code"
              autoFocus
              disabled={isVerifying}
            />
            <p className="text-xs text-muted-foreground text-center">
              Enter the 6-digit code from your email
            </p>
          </div>

          <Button
            type="submit"
            className="w-full bg-gradient-primary hover:opacity-90 transition-smooth"
            disabled={isVerifying || otpCode.length !== 6}
          >
            {isVerifying && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isVerifying ? 'Verifying...' : 'Verify Email'}
          </Button>
        </form>

        <div className="space-y-3">
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">
                Didn't receive the code?
              </span>
            </div>
          </div>

          <Button
            variant="outline"
            className="w-full"
            onClick={handleResendCode}
            disabled={isResending || resendCooldown > 0}
          >
            {isResending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {resendCooldown > 0
              ? `Resend in ${resendCooldown}s`
              : 'Resend Code'}
          </Button>

          {onBack && (
            <Button
              variant="ghost"
              className="w-full"
              onClick={onBack}
              disabled={isVerifying}
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Sign Up
            </Button>
          )}
        </div>

        <div className="mt-6 p-4 bg-muted/50 rounded-lg border border-border space-y-2">
          <div className="flex items-start gap-2 text-sm">
            <CheckCircle2 className="h-4 w-4 text-primary mt-0.5 shrink-0" />
            <span>Check your spam folder if you don't see the email</span>
          </div>
          <div className="flex items-start gap-2 text-sm">
            <CheckCircle2 className="h-4 w-4 text-primary mt-0.5 shrink-0" />
            <span>The code expires in 60 minutes</span>
          </div>
          <div className="flex items-start gap-2 text-sm">
            <CheckCircle2 className="h-4 w-4 text-primary mt-0.5 shrink-0" />
            <span>Make sure you're checking {email}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
