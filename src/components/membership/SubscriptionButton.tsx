import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { CreditCard, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

interface SubscriptionButtonProps {
  membershipPlanId: string;
  planName: string;
  price: number;
  billingInterval: string;
  isCurrentPlan?: boolean;
  className?: string;
}

export default function SubscriptionButton({ 
  membershipPlanId, 
  planName, 
  price, 
  billingInterval,
  isCurrentPlan = false,
  className = ""
}: SubscriptionButtonProps) {
  const { session } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  const handleSubscribe = async () => {
    if (!session) {
      toast({
        title: "Authentication Required",
        description: "Please sign in to subscribe to a membership plan",
        variant: "destructive"
      });
      return;
    }

    try {
      setLoading(true);
      
      const { data, error } = await supabase.functions.invoke('create-checkout', {
        body: {
          membership_plan_id: membershipPlanId
        }
      });

      if (error) throw error;

      if (data?.url) {
        // Open Stripe checkout in a new tab
        window.open(data.url, '_blank');
      } else {
        throw new Error('No checkout URL returned');
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to create checkout session",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const formatPrice = () => {
    const formattedPrice = price.toFixed(2);
    const interval = billingInterval === 'monthly' ? '/month' : 
                    billingInterval === 'yearly' ? '/year' : 
                    billingInterval === 'quarterly' ? '/quarter' : '';
    return `$${formattedPrice}${interval}`;
  };

  if (isCurrentPlan) {
    return (
      <Button 
        variant="outline" 
        disabled 
        className={`w-full ${className}`}
      >
        Current Plan
      </Button>
    );
  }

  return (
    <Button 
      onClick={handleSubscribe}
      disabled={loading}
      className={`w-full bg-gradient-secondary hover:opacity-90 ${className}`}
    >
      {loading ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Processing...
        </>
      ) : (
        <>
          <CreditCard className="mr-2 h-4 w-4" />
          Subscribe {formatPrice()}
        </>
      )}
    </Button>
  );
}