import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { CreditCard, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

interface OneTimePaymentButtonProps {
  amount: number;
  description: string;
  orderType?: string;
  metadata?: Record<string, any>;
  className?: string;
  variant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link";
  size?: "default" | "sm" | "lg" | "icon";
  children?: React.ReactNode;
}

export function OneTimePaymentButton({ 
  amount,
  description,
  orderType = "one_time",
  metadata = {},
  className = "",
  variant = "default",
  size = "default",
  children
}: OneTimePaymentButtonProps) {
  const { session } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  const handlePayment = async () => {
    if (!session) {
      toast({
        title: "Authentication Required",
        description: "Please sign in to make a payment",
        variant: "destructive"
      });
      return;
    }

    try {
      setLoading(true);
      
      const { data, error } = await supabase.functions.invoke('create-one-time-payment', {
        body: {
          amount: amount,
          description: description,
          order_type: orderType,
          metadata: metadata
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
        description: error.message || "Failed to create payment session",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const formatPrice = () => {
    return `$${amount.toFixed(2)}`;
  };

  return (
    <Button 
      onClick={handlePayment}
      disabled={loading}
      variant={variant}
      size={size}
      className={`${className}`}
    >
      {loading ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Processing...
        </>
      ) : (
        <>
          <CreditCard className="mr-2 h-4 w-4" />
          {children || `Pay ${formatPrice()}`}
        </>
      )}
    </Button>
  );
}

// Export as default for backward compatibility
export default OneTimePaymentButton;