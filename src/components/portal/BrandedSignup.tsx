import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { edgeFunctions } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { Loader2, CheckCircle } from 'lucide-react';
import { usePortalThemeContext } from './PortalThemeProvider';

interface BrandedSignupProps {
  organizationName: string;
  organizationId: string;
  logoUrl?: string | null;
  registrationFields?: string[];
  requireApproval?: boolean;
}

export function BrandedSignup({
  organizationName,
  organizationId,
  logoUrl,
  registrationFields = ['name', 'email', 'phone'],
  requireApproval = false,
}: BrandedSignupProps) {
  const navigate = useNavigate();
  const { resolvedTheme } = usePortalThemeContext();
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Create auth account
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            first_name: firstName,
            last_name: lastName,
            phone,
          },
          emailRedirectTo: `${window.location.origin}/portal/dashboard`,
        },
      });

      if (authError) throw authError;

      if (authData.user) {
        // Set up the user profile with organization context
        await edgeFunctions.invoke('setup-new-user', {
          body: {
            userId: authData.user.id,
            email,
            role: 'member',
            organizationId,
          },
        });

        // Update profile with name and phone
        await supabase
          .from('profiles')
          .update({
            first_name: firstName,
            last_name: lastName,
            phone,
          })
          .eq('id', authData.user.id);
      }

      setSuccess(true);
    } catch (error: any) {
      toast({
        title: 'Registration Failed',
        description: error.message || 'Failed to create account. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="w-full max-w-md mx-auto shadow-lg">
          <CardContent className="text-center space-y-4 py-8">
            <CheckCircle className="h-16 w-16 mx-auto text-green-500" />
            <h2 className="text-xl font-semibold">Welcome to {organizationName}!</h2>
            {requireApproval ? (
              <p className="text-sm text-muted-foreground">
                Your account has been created and is pending approval from the gym.
                You'll receive an email once your account is activated.
              </p>
            ) : (
              <>
                <p className="text-sm text-muted-foreground">
                  Your account has been created. Please check your email to verify your
                  account, then you can sign in.
                </p>
                <Button onClick={() => navigate('/portal/login')}>
                  Go to Sign In
                </Button>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
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
            Create your member account
          </CardDescription>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSignup} className="space-y-4">
            {registrationFields.includes('name') && (
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="firstName">First Name</Label>
                  <Input
                    id="firstName"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    required
                    autoComplete="given-name"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName">Last Name</Label>
                  <Input
                    id="lastName"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    required
                    autoComplete="family-name"
                  />
                </div>
              </div>
            )}

            {registrationFields.includes('email') && (
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoComplete="email"
                />
              </div>
            )}

            {registrationFields.includes('phone') && (
              <div className="space-y-2">
                <Label htmlFor="phone">Phone (optional)</Label>
                <Input
                  id="phone"
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  autoComplete="tel"
                />
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
                autoComplete="new-password"
              />
              <p className="text-xs text-muted-foreground">
                Must be at least 6 characters
              </p>
            </div>

            <Button type="submit" className="w-full" disabled={loading}>
              {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Create Account
            </Button>

            <p className="text-center text-sm text-muted-foreground">
              Already have an account?{' '}
              <Button
                variant="link"
                className="p-0 h-auto"
                onClick={() => navigate('/portal/login')}
              >
                Sign in
              </Button>
            </p>

            {resolvedTheme.show_powered_by && (
              <div className="pt-2 text-center">
                <span className="text-[10px] text-muted-foreground">
                  Powered by Rep Club
                </span>
              </div>
            )}
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
