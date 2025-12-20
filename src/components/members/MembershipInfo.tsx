import React, { useEffect, useState } from 'react';
import { supabase, invokeEdgeFunction } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  CreditCard, 
  Calendar, 
  Clock, 
  DollarSign, 
  ExternalLink,
  Shield
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Database } from '@/integrations/supabase/types';
import { format } from 'date-fns';
import { getStatusBadgeVariant } from '@/lib/colorUtils';

type Membership = Database['public']['Tables']['memberships']['Row'];
type MembershipPlan = Database['public']['Tables']['membership_plans']['Row'];
type Subscriber = Database['public']['Tables']['subscribers']['Row'];

interface MembershipInfo {
  membership: Membership & {
    membership_plans: MembershipPlan;
  };
  subscriber?: Subscriber;
}

interface MembershipInfoProps {
  memberId: string;
}

export function MembershipInfo({ memberId }: MembershipInfoProps) {
  const [membershipInfo, setMembershipInfo] = useState<MembershipInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchMembershipInfo();
  }, [memberId]);

  const fetchMembershipInfo = async () => {
    try {
      // Fetch membership with plan details
      const { data: membership, error: membershipError } = await supabase
        .from('memberships')
        .select(`
          *,
          membership_plans (*)
        `)
        .eq('member_id', memberId)
        .eq('status', 'active')
        .single();

      if (membershipError && membershipError.code !== 'PGRST116') {
        throw membershipError;
      }

      // Fetch subscriber info
      const { data: subscriber, error: subscriberError } = await supabase
        .from('subscribers')
        .select('*')
        .eq('user_id', memberId)
        .single();

      if (subscriberError && subscriberError.code !== 'PGRST116') {
        console.warn('No subscriber info found:', subscriberError);
      }

      if (membership) {
        setMembershipInfo({
          membership,
          subscriber: subscriber || undefined,
        });
      }
    } catch (error: any) {
      console.error('Error fetching membership info:', error);
      toast({
        title: 'Error loading membership',
        description: 'Could not load membership information.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleManageBilling = async () => {
    try {
      const { data, error } = await invokeEdgeFunction<{ url: string }>('customer-portal');

      if (error) throw error;

      if (data?.url) {
        window.open(data.url, '_blank');
      }
    } catch (error: any) {
      toast({
        title: 'Error opening billing portal',
        description: error.message || 'Could not open the billing management portal.',
        variant: 'destructive',
      });
    }
  };

  if (isLoading) {
    return (
      <div className="grid gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="animate-pulse space-y-4">
              <div className="h-4 bg-muted rounded w-1/3"></div>
              <div className="h-4 bg-muted rounded w-1/2"></div>
              <div className="h-4 bg-muted rounded w-1/4"></div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!membershipInfo) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <Shield className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">No Active Membership</h3>
          <p className="text-muted-foreground mb-4">
            You don't have an active membership plan.
          </p>
          <Button>
            <ExternalLink className="w-4 h-4 mr-2" />
            Browse Membership Plans
          </Button>
        </CardContent>
      </Card>
    );
  }

  const { membership, subscriber } = membershipInfo;
  const plan = membership.membership_plans;

  const getBillingStatus = () => {
    if (!subscriber) return null;
    
    if (subscriber.subscribed) {
      return (
        <Badge variant="default">
          Active Subscription
        </Badge>
      );
    }
    
    return (
      <Badge variant="destructive">
        Subscription Inactive
      </Badge>
    );
  };

  return (
    <div className="grid gap-6">
      {/* Main Membership Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              <Shield className="w-5 h-5" />
              Current Membership
            </span>
            <Badge variant={getStatusBadgeVariant(membership.status)}>
              {membership.status}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <h3 className="text-2xl font-bold">{plan.name}</h3>
            <p className="text-muted-foreground">{plan.description}</p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="flex items-center justify-center mb-2">
                <DollarSign className="w-5 h-5 text-muted-foreground" />
              </div>
              <div className="text-2xl font-bold">${plan.price}</div>
              <div className="text-sm text-muted-foreground">
                per {plan.billing_interval}
              </div>
            </div>

            <div className="text-center">
              <div className="flex items-center justify-center mb-2">
                <Calendar className="w-5 h-5 text-muted-foreground" />
              </div>
              <div className="text-sm font-medium">Start Date</div>
              <div className="text-sm text-muted-foreground">
                {format(new Date(membership.start_date), 'MMM d, yyyy')}
              </div>
            </div>

            {membership.end_date && (
              <div className="text-center">
                <div className="flex items-center justify-center mb-2">
                  <Clock className="w-5 h-5 text-muted-foreground" />
                </div>
                <div className="text-sm font-medium">End Date</div>
                <div className="text-sm text-muted-foreground">
                  {format(new Date(membership.end_date), 'MMM d, yyyy')}
                </div>
              </div>
            )}

            {plan.commitment_months && (
              <div className="text-center">
                <div className="flex items-center justify-center mb-2">
                  <Calendar className="w-5 h-5 text-muted-foreground" />
                </div>
                <div className="text-sm font-medium">Commitment</div>
                <div className="text-sm text-muted-foreground">
                  {plan.commitment_months} months
                </div>
              </div>
            )}
          </div>

          {plan.features && plan.features.length > 0 && (
            <div>
              <h4 className="font-semibold mb-2">Plan Features</h4>
              <ul className="space-y-1">
                {plan.features.map((feature, index) => (
                  <li key={index} className="text-sm text-muted-foreground flex items-center">
                    <span className="w-1.5 h-1.5 bg-primary rounded-full mr-2" />
                    {feature}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Billing Information */}
      {subscriber && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span className="flex items-center gap-2">
                <CreditCard className="w-5 h-5" />
                Billing Information
              </span>
              {getBillingStatus()}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <div className="text-sm font-medium">Subscription Tier</div>
                <div className="text-sm text-muted-foreground">
                  {subscriber.subscription_tier || 'N/A'}
                </div>
              </div>

              {subscriber.subscription_end && (
                <div>
                  <div className="text-sm font-medium">Next Billing Date</div>
                  <div className="text-sm text-muted-foreground">
                    {format(new Date(subscriber.subscription_end), 'MMM d, yyyy')}
                  </div>
                </div>
              )}
            </div>

            <Button onClick={handleManageBilling} className="w-full">
              <ExternalLink className="w-4 h-4 mr-2" />
              Manage Billing
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}