import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Loader2, QrCode, HelpCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';

interface BarcodeLoginProps {
  onSuccess?: () => void;
}

export const BarcodeLogin: React.FC<BarcodeLoginProps> = ({ onSuccess }) => {
  const [barcode, setBarcode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isRecoveryOpen, setIsRecoveryOpen] = useState(false);
  const [recoveryEmail, setRecoveryEmail] = useState('');
  const [isRecoveryLoading, setIsRecoveryLoading] = useState(false);
  const { toast } = useToast();
  const { signIn } = useAuth();

  const handleBarcodeLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!barcode.trim()) {
      toast({
        title: 'Invalid Input',
        description: 'Please enter your member ID',
        variant: 'destructive',
      });
      return;
    }
    
    setIsLoading(true);
    
    try {
      // First, find the user by barcode
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('email, id')
        .eq('barcode', barcode.trim())
        .eq('role', 'member')
        .single();
        
      if (profileError || !profile) {
        toast({
          title: 'Member Not Found',
          description: 'Invalid member ID. Please check and try again.',
          variant: 'destructive',
        });
        return;
      }
      
      // For barcode login, we need to send a "magic link" since we don't have password
      const { error: authError } = await supabase.auth.signInWithOtp({
        email: profile.email,
        options: {
          emailRedirectTo: `${window.location.origin}/`,
        },
      });
      
      if (authError) {
        toast({
          title: 'Login Failed',
          description: authError.message,
          variant: 'destructive',
        });
        return;
      }
      
      toast({
        title: 'Check Your Email',
        description: 'We\'ve sent you a login link. Check your email to continue.',
      });
      
      onSuccess?.();
      
    } catch (error) {
      console.error('Barcode login error:', error);
      toast({
        title: 'Login Error',
        description: 'Something went wrong. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleBarcodeRecovery = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!recoveryEmail.trim()) {
      toast({
        title: 'Invalid Email',
        description: 'Please enter your email address',
        variant: 'destructive',
      });
      return;
    }
    
    setIsRecoveryLoading(true);
    
    try {
      // Find profile by email
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('barcode, first_name, last_name')
        .eq('email', recoveryEmail.trim())
        .eq('role', 'member')
        .single();
        
      if (profileError || !profile) {
        toast({
          title: 'Email Not Found',
          description: 'No member account found with this email address.',
          variant: 'destructive',
        });
        return;
      }
      
      if (!profile.barcode) {
        toast({
          title: 'No Member ID',
          description: 'Your account doesn\'t have a member ID yet. Please contact staff.',
          variant: 'destructive',
        });
        return;
      }
      
      toast({
        title: 'Member ID Found',
        description: `Your Member ID is: ${profile.barcode}`,
      });
      
      setBarcode(profile.barcode);
      setIsRecoveryOpen(false);
      
    } catch (error) {
      console.error('Barcode recovery error:', error);
      toast({
        title: 'Recovery Error',
        description: 'Something went wrong. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsRecoveryLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="text-center">
        <QrCode className="w-12 h-12 mx-auto mb-3 text-primary" />
        <h3 className="text-lg font-semibold mb-2">Member Login</h3>
        <p className="text-sm text-muted-foreground">
          Enter your Member ID to access your account
        </p>
      </div>
      
      <form onSubmit={handleBarcodeLogin} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="member-id">Member ID</Label>
          <Input
            id="member-id"
            type="text"
            placeholder="Enter your 12-digit Member ID"
            value={barcode}
            onChange={(e) => setBarcode(e.target.value)}
            maxLength={12}
            className="text-center font-mono tracking-wider"
            required
          />
          <p className="text-xs text-muted-foreground">
            Find your Member ID in the gym app or on your membership card
          </p>
        </div>
        
        <Button 
          type="submit" 
          className="w-full bg-gradient-primary hover:opacity-90 transition-smooth"
          disabled={isLoading}
        >
          {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Login with Member ID
        </Button>
      </form>
      
      <div className="text-center">
        <Dialog open={isRecoveryOpen} onOpenChange={setIsRecoveryOpen}>
          <DialogTrigger asChild>
            <Button variant="link" size="sm">
              <HelpCircle className="w-4 h-4 mr-1" />
              Forgot your Member ID?
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Recover Member ID</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleBarcodeRecovery} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="recovery-email">Email Address</Label>
                <Input
                  id="recovery-email"
                  type="email"
                  placeholder="Enter your email address"
                  value={recoveryEmail}
                  onChange={(e) => setRecoveryEmail(e.target.value)}
                  required
                />
                <p className="text-xs text-muted-foreground">
                  Enter the email associated with your membership
                </p>
              </div>
              <Button 
                type="submit" 
                className="w-full"
                disabled={isRecoveryLoading}
              >
                {isRecoveryLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Find My Member ID
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};