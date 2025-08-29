import React, { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle, Loader2, ArrowRight, Home } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export default function PaymentSuccessPage() {
  const [searchParams] = useSearchParams();
  const sessionId = searchParams.get('session_id');
  const { session } = useAuth();
  const [verifying, setVerifying] = useState(true);
  const [paymentData, setPaymentData] = useState<any>(null);

  useEffect(() => {
    if (sessionId && session) {
      verifyPayment();
    } else {
      setVerifying(false);
    }
  }, [sessionId, session]);

  const verifyPayment = async () => {
    try {
      // Wait a moment for Stripe processing
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const { data, error } = await supabase.functions.invoke('verify-payment', {
        body: { session_id: sessionId }
      });

      if (error) throw error;

      setPaymentData(data);
    } catch (error: any) {
      console.error('Payment verification error:', error);
      setPaymentData({ error: error.message });
    } finally {
      setVerifying(false);
    }
  };

  if (!session) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl font-bold text-foreground">
              Payment Success
            </CardTitle>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <p className="text-muted-foreground">
              Please sign in to view your payment details.
            </p>
            <Button asChild>
              <Link to="/auth">Sign In</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-2xl">
        <CardHeader className="text-center">
          <div className="mx-auto w-16 h-16 bg-success/10 rounded-full flex items-center justify-center mb-4">
            {verifying ? (
              <Loader2 className="h-8 w-8 animate-spin text-success" />
            ) : (
              <CheckCircle className="h-8 w-8 text-success" />
            )}
          </div>
          <CardTitle className="text-3xl font-bold text-foreground">
            {verifying ? 'Verifying Payment...' : 'Payment Successful!'}
          </CardTitle>
        </CardHeader>

        <CardContent className="space-y-6">
          {verifying ? (
            <div className="text-center space-y-4">
              <p className="text-muted-foreground">
                We're confirming your payment with our payment processor...
              </p>
              <div className="flex items-center justify-center space-x-2">
                <div className="w-2 h-2 bg-primary rounded-full animate-bounce"></div>
                <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
              </div>
            </div>
          ) : paymentData?.error ? (
            <div className="text-center space-y-4">
              <p className="text-destructive">
                There was an issue verifying your payment: {paymentData.error}
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button onClick={() => window.location.reload()}>
                  Try Again
                </Button>
                <Button variant="outline" asChild>
                  <Link to="/dashboard">Go to Dashboard</Link>
                </Button>
              </div>
            </div>
          ) : paymentData?.subscribed !== undefined ? (
            // Subscription payment
            <div className="text-center space-y-6">
              <div className="space-y-2">
                <p className="text-lg font-semibold text-foreground">
                  Welcome to {paymentData.subscription_tier} Membership!
                </p>
                <p className="text-muted-foreground">
                  Your subscription is now active.
                </p>
                {paymentData.subscription_end && (
                  <p className="text-sm text-muted-foreground">
                    Next billing date: {new Date(paymentData.subscription_end).toLocaleDateString()}
                  </p>
                )}
              </div>
              
              {sessionId && (
                <div className="bg-muted/50 rounded-lg p-4">
                  <p className="text-sm font-mono text-muted-foreground">
                    Session ID: {sessionId}
                  </p>
                </div>
              )}

              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button asChild>
                  <Link to="/dashboard">
                    Go to Dashboard
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
                <Button variant="outline" asChild>
                  <Link to="/membership-plans">View Plans</Link>
                </Button>
              </div>
            </div>
          ) : paymentData?.payment_verified ? (
            // One-time payment
            <div className="text-center space-y-6">
              <div className="space-y-2">
                <p className="text-lg font-semibold text-foreground">
                  Payment Completed Successfully!
                </p>
                <p className="text-muted-foreground">
                  Thank you for your payment. You should receive a confirmation email shortly.
                </p>
              </div>
              
              {sessionId && (
                <div className="bg-muted/50 rounded-lg p-4">
                  <p className="text-sm font-mono text-muted-foreground">
                    Session ID: {sessionId}
                  </p>
                </div>
              )}

              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button asChild>
                  <Link to="/dashboard">
                    Go to Dashboard
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
                <Button variant="outline" asChild>
                  <Link to="/">
                    <Home className="mr-2 h-4 w-4" />
                    Home
                  </Link>
                </Button>
              </div>
            </div>
          ) : (
            <div className="text-center space-y-4">
              <p className="text-muted-foreground">
                Payment verification is still pending. Please check again in a few moments.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button onClick={() => window.location.reload()}>
                  Check Status Again
                </Button>
                <Button variant="outline" asChild>
                  <Link to="/dashboard">Go to Dashboard</Link>
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}