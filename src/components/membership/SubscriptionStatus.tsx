import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CreditCard, RefreshCw, Settings, Calendar, User } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';

interface SubscriptionData {
  subscribed: boolean;
  subscription_tier?: string;
  subscription_end?: string;
  membership_plan_id?: string;
}

export default function SubscriptionStatus() {
  const { session, user } = useAuth();
  const { toast } = useToast();
  const [subscriptionData, setSubscriptionData] = useState<SubscriptionData | null>(null);
  const [loading, setLoading] = useState(false);
  const [portalLoading, setPortalLoading] = useState(false);

  useEffect(() => {
    if (session) {
      checkSubscription();
      // Auto-refresh every 30 seconds
      const interval = setInterval(checkSubscription, 30000);
      return () => clearInterval(interval);
    }
  }, [session]);

  const checkSubscription = async () => {
    if (!session) return;

    try {
      setLoading(true);
      const { data, error } = await supabase.functions.invoke('check-subscription');
      
      if (error) throw error;
      setSubscriptionData(data);
    } catch (error: any) {
      console.error('Error checking subscription:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to check subscription status",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const openCustomerPortal = async () => {
    if (!session) return;

    try {
      setPortalLoading(true);
      const { data, error } = await supabase.functions.invoke('customer-portal');
      
      if (error) throw error;

      if (data?.url) {
        // Open customer portal in a new tab
        window.open(data.url, '_blank');
      }
    } catch (error: any) {
      toast({
        title: "Error", 
        description: error.message || "Failed to open customer portal",
        variant: "destructive"
      });
    } finally {
      setPortalLoading(false);
    }
  };

  if (!session) {
    return null;
  }

  return (
    <Card className="gym-card">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center">
            <CreditCard className="mr-2 h-5 w-5" />
            Subscription Status
          </CardTitle>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={checkSubscription}
            disabled={loading}
          >
            <RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {loading && !subscriptionData ? (
          <div className="text-center py-4">
            <div className="animate-pulse text-muted-foreground">Checking subscription...</div>
          </div>
        ) : subscriptionData ? (
          <>
            {/* Subscription Status */}
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Status:</span>
              <Badge 
                variant={subscriptionData.subscribed ? "default" : "secondary"}
                className={subscriptionData.subscribed ? "bg-success" : ""}
              >
                {subscriptionData.subscribed ? 'Active' : 'Inactive'}
              </Badge>
            </div>

            {/* Plan Details */}
            {subscriptionData.subscribed && (
              <>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium flex items-center">
                    <User className="mr-1 h-4 w-4" />
                    Plan:
                  </span>
                  <span className="font-semibold text-primary">
                    {subscriptionData.subscription_tier || 'Unknown'}
                  </span>
                </div>

                {subscriptionData.subscription_end && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium flex items-center">
                      <Calendar className="mr-1 h-4 w-4" />
                      Next billing:
                    </span>
                    <span className="text-sm text-muted-foreground">
                      {format(new Date(subscriptionData.subscription_end), 'PPP')}
                    </span>
                  </div>
                )}

                {/* Manage Subscription */}
                <div className="pt-2 border-t">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={openCustomerPortal}
                    disabled={portalLoading}
                    className="w-full"
                  >
                    <Settings className="mr-2 h-4 w-4" />
                    {portalLoading ? 'Opening...' : 'Manage Subscription'}
                  </Button>
                  <p className="text-xs text-muted-foreground mt-2 text-center">
                    Update payment method, cancel, or change plan
                  </p>
                </div>
              </>
            )}

            {/* No Subscription */}
            {!subscriptionData.subscribed && (
              <div className="text-center py-4">
                <p className="text-sm text-muted-foreground mb-4">
                  You don't have an active subscription. Choose a membership plan to get started.
                </p>
              </div>
            )}
          </>
        ) : (
          <div className="text-center py-4">
            <p className="text-sm text-muted-foreground">
              Unable to load subscription status
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}