import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Loader2, RefreshCw, ExternalLink } from 'lucide-react';

interface SubscriptionData {
  subscribed: boolean;
  subscription_tier?: string;
  subscription_end?: string;
}

export function SubscriptionManager() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [subscriptionData, setSubscriptionData] = useState<SubscriptionData | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const checkSubscription = async () => {
    if (!user) return;
    
    setRefreshing(true);
    try {
      const { data, error } = await supabase.functions.invoke('check-subscription', {
        headers: {
          Authorization: `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`,
        },
      });

      if (error) throw error;
      setSubscriptionData(data);
    } catch (error) {
      console.error('Error checking subscription:', error);
      toast({
        title: "Error",
        description: "Failed to check subscription status",
        variant: "destructive",
      });
    } finally {
      setRefreshing(false);
    }
  };

  const openCustomerPortal = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('customer-portal', {
        headers: {
          Authorization: `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`,
        },
      });

      if (error) throw error;
      if (data?.url) {
        window.open(data.url, '_blank');
      }
    } catch (error) {
      console.error('Error opening customer portal:', error);
      toast({
        title: "Error",
        description: "Failed to open customer portal",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      checkSubscription();
    }
  }, [user]);

  if (!user) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Subscription Status</CardTitle>
          <CardDescription>Please log in to view your subscription</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          Subscription Status
          <Button
            variant="outline"
            size="sm"
            onClick={checkSubscription}
            disabled={refreshing}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </CardTitle>
        <CardDescription>
          Manage your membership subscription
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {subscriptionData ? (
          <>
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">Status:</span>
              <Badge variant={subscriptionData.subscribed ? "default" : "secondary"}>
                {subscriptionData.subscribed ? "Active" : "Inactive"}
              </Badge>
            </div>
            
            {subscriptionData.subscription_tier && (
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium">Plan:</span>
                <Badge variant="outline">{subscriptionData.subscription_tier}</Badge>
              </div>
            )}
            
            {subscriptionData.subscription_end && (
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium">Next Billing:</span>
                <span className="text-sm">
                  {new Date(subscriptionData.subscription_end).toLocaleDateString()}
                </span>
              </div>
            )}
            
            <div className="pt-4">
              <Button
                onClick={openCustomerPortal}
                disabled={loading}
                className="w-full"
              >
                {loading ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <ExternalLink className="h-4 w-4 mr-2" />
                )}
                Manage Subscription
              </Button>
            </div>
          </>
        ) : (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin mr-2" />
            <span>Loading subscription status...</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}