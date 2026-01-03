/**
 * Forgot Password Form Component
 *
 * Provides password reset functionality with rate limiting
 * to prevent abuse of the password reset endpoint.
 */

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { useAuth } from '@/contexts/AuthContext';
import { useRateLimiter } from '@/hooks/useRateLimiter';
import { Loader2, Mail, AlertCircle, CheckCircle2 } from 'lucide-react';

interface ForgotPasswordFormProps {
  trigger?: React.ReactNode;
}

export const ForgotPasswordForm: React.FC<ForgotPasswordFormProps> = ({ trigger }) => {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [success, setSuccess] = useState(false);
  const { resetPassword } = useAuth();

  // Rate limiting for password reset - 3 requests per hour
  const rateLimiter = useRateLimiter({
    type: 'passwordReset',
    endpoint: 'password-reset',
  });

  // Check rate limit status when dialog opens
  useEffect(() => {
    if (isOpen) {
      rateLimiter.refresh();
    }
  }, [isOpen]);

  // Calculate time until rate limit resets
  const getTimeUntilReset = (): string => {
    if (!rateLimiter.resetAt) return '';
    const remaining = Math.max(0, rateLimiter.resetAt - Date.now());
    const minutes = Math.ceil(remaining / 60000);
    if (minutes > 60) {
      const hours = Math.floor(minutes / 60);
      return `${hours} hour${hours !== 1 ? 's' : ''}`;
    }
    return `${minutes} minute${minutes !== 1 ? 's' : ''}`;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Check rate limit before proceeding
    const limitResult = rateLimiter.checkLimit();
    if (!limitResult.allowed) {
      return;
    }

    setIsLoading(true);
    const { error } = await resetPassword(email);
    setIsLoading(false);

    if (!error) {
      setSuccess(true);
      // Close dialog after 3 seconds
      setTimeout(() => {
        setIsOpen(false);
        setSuccess(false);
        setEmail('');
      }, 3000);
    }
  };

  const handleOpenChange = (open: boolean) => {
    setIsOpen(open);
    if (!open) {
      setEmail('');
      setSuccess(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="link" className="px-0 text-sm text-muted-foreground">
            Forgot your password?
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            Reset Password
          </DialogTitle>
          <DialogDescription>
            Enter your email address and we'll send you a link to reset your password.
          </DialogDescription>
        </DialogHeader>

        {success ? (
          <div className="py-6">
            <Alert className="border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-950">
              <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400" />
              <AlertDescription className="text-green-800 dark:text-green-200">
                If an account exists with this email, you will receive a password reset link shortly.
                Please check your inbox and spam folder.
              </AlertDescription>
            </Alert>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Rate limit warning */}
            {rateLimiter.isLimited && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Too many password reset requests. Please try again in {getTimeUntilReset()}.
                </AlertDescription>
              </Alert>
            )}

            {/* Low attempts warning */}
            {!rateLimiter.isLimited && rateLimiter.remaining <= 1 && rateLimiter.remaining > 0 && (
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  {rateLimiter.remaining} password reset request{rateLimiter.remaining !== 1 ? 's' : ''} remaining.
                  Limit resets in {getTimeUntilReset()}.
                </AlertDescription>
              </Alert>
            )}

            <div className="space-y-2">
              <Label htmlFor="reset-email">Email Address</Label>
              <Input
                id="reset-email"
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={isLoading || rateLimiter.isLimited}
                autoComplete="email"
              />
            </div>

            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsOpen(false)}
                disabled={isLoading}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isLoading || rateLimiter.isLimited || !email}
                className="bg-gradient-primary hover:opacity-90"
              >
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {rateLimiter.isLimited ? 'Rate Limited' : 'Send Reset Link'}
              </Button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default ForgotPasswordForm;
