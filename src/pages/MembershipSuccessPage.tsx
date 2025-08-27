import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle, ArrowRight, RefreshCw } from 'lucide-react';
import { Link, useSearchParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export default function MembershipSuccessPage() {
  const [searchParams] = useSearchParams();
  const { session } = useAuth();
  const [verifying, setVerifying] = useState(true);
  const [subscriptionData, setSubscriptionData] = useState<any>(null);
  const sessionId = searchParams.get('session_id');

  useEffect(() => {
    if (session) {
      verifySubscription();
    }
  }, [session, sessionId]);

  const verifySubscription = async () => {
    try {
      setVerifying(true);
      // Wait a moment for Stripe to process
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const { data, error } = await supabase.functions.invoke('check-subscription');
      if (error) throw error;
      
      setSubscriptionData(data);
    } catch (error) {
      console.error('Error verifying subscription:', error);
    } finally {
      setVerifying(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-muted p-4">
      <Card className="w-full max-w-md gym-card">
        <CardHeader className="text-center pb-4">
          <div className="mx-auto mb-4 p-3 bg-success/10 rounded-full w-fit">
            <CheckCircle className="h-8 w-8 text-success" />
          </div>
          <CardTitle className="text-2xl font-bold text-foreground">
            Payment Successful!
          </CardTitle>
        </CardHeader>
        
        <CardContent className="space-y-6">
          {verifying ? (
            <div className="text-center py-6">
              <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-3 text-primary" />
              <p className="text-muted-foreground">
                Verifying your subscription...
              </p>
            </div>
          ) : subscriptionData?.subscribed ? (
            <>
              <div className="text-center space-y-2">
                <h3 className="text-lg font-semibold text-foreground">
                  Welcome to {subscriptionData.subscription_tier} Membership!
                </h3>
                <p className="text-muted-foreground">
                  Your subscription is now active and you have full access to all features.
                </p>
              </div>

              <div className="bg-muted/50 rounded-lg p-4 space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Plan:</span>
                  <span className="font-medium">{subscriptionData.subscription_tier}</span>
                </div>
                {subscriptionData.subscription_end && (
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Next billing:</span>
                    <span className="font-medium">
                      {new Date(subscriptionData.subscription_end).toLocaleDateString()}
                    </span>
                  </div>
                )}
              </div>

              <div className="flex flex-col space-y-3">
                <Button asChild className="bg-gradient-secondary hover:opacity-90">
                  <Link to="/">
                    Go to Dashboard
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
                <Button variant="outline" asChild>
                  <Link to="/membership-plans">
                    View Membership Plans
                  </Link>
                </Button>
              </div>
            </>
          ) : (
            <>
              <div className="text-center space-y-2">
                <h3 className="text-lg font-semibold text-foreground">
                  Processing your subscription...
                </h3>
                <p className="text-muted-foreground">
                  Your payment was successful! Your subscription may take a few minutes to activate.
                </p>
              </div>

              <div className="flex flex-col space-y-3">
                <Button 
                  onClick={verifySubscription}
                  variant="outline"
                  className="w-full"
                >
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Check Status Again
                </Button>
                <Button asChild className="bg-gradient-secondary hover:opacity-90">
                  <Link to="/membership-plans">
                    Back to Membership Plans
                  </Link>
                </Button>
              </div>
            </>
          )}

          {sessionId && (
            <div className="text-center">
              <p className="text-xs text-muted-foreground">
                Session ID: {sessionId.slice(0, 20)}...
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}