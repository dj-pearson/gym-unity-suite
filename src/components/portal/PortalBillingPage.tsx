import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { usePortalAuth } from './PortalAuthProvider';
import { supabase } from '@/integrations/supabase/client';
import { CreditCard, Receipt, Calendar, CheckCircle, AlertCircle } from 'lucide-react';

interface MembershipInfo {
  plan_name: string;
  status: string;
  current_period_end?: string;
  amount?: number;
}

interface PaymentRecord {
  id: string;
  amount: number;
  status: string;
  created_at: string;
  description?: string;
}

export default function PortalBillingPage() {
  const { profile } = usePortalAuth();
  const [membership, setMembership] = useState<MembershipInfo | null>(null);
  const [payments, setPayments] = useState<PaymentRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!profile?.id) return;

    const fetchBillingData = async () => {
      try {
        // Fetch membership/subscription info
        const { data: memberData } = await supabase
          .from('members')
          .select('membership_type, status')
          .eq('profile_id', profile.id)
          .maybeSingle();

        if (memberData) {
          setMembership({
            plan_name: memberData.membership_type || 'Standard',
            status: memberData.status || 'active',
          });
        }

        // Fetch recent payments
        const { data: paymentData } = await supabase
          .from('payments')
          .select('id, amount, status, created_at, description')
          .eq('member_id', profile.id)
          .order('created_at', { ascending: false })
          .limit(10);

        if (paymentData) {
          setPayments(paymentData);
        }
      } catch (error) {
        console.error('Error fetching billing data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchBillingData();
  }, [profile?.id]);

  if (loading) {
    return (
      <div className="space-y-4 p-4">
        <div className="h-32 bg-muted animate-pulse rounded-lg" />
        <div className="h-64 bg-muted animate-pulse rounded-lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6 p-4 md:p-6 max-w-2xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold">Billing & Membership</h1>
        <p className="text-muted-foreground">Manage your membership and view payment history</p>
      </div>

      {/* Current Membership */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <CreditCard className="h-5 w-5" />
            Current Membership
          </CardTitle>
        </CardHeader>
        <CardContent>
          {membership ? (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-medium text-lg">{membership.plan_name}</span>
                <Badge variant={membership.status === 'active' ? 'default' : 'secondary'}>
                  {membership.status === 'active' ? (
                    <><CheckCircle className="h-3 w-3 mr-1" /> Active</>
                  ) : (
                    <><AlertCircle className="h-3 w-3 mr-1" /> {membership.status}</>
                  )}
                </Badge>
              </div>
              {membership.current_period_end && (
                <p className="text-sm text-muted-foreground flex items-center gap-1">
                  <Calendar className="h-4 w-4" />
                  Next billing: {new Date(membership.current_period_end).toLocaleDateString()}
                </p>
              )}
            </div>
          ) : (
            <p className="text-muted-foreground">No active membership found. Contact the front desk for details.</p>
          )}
        </CardContent>
      </Card>

      {/* Payment History */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Receipt className="h-5 w-5" />
            Payment History
          </CardTitle>
          <CardDescription>Your recent transactions</CardDescription>
        </CardHeader>
        <CardContent>
          {payments.length > 0 ? (
            <div className="space-y-3">
              {payments.map((payment) => (
                <div key={payment.id} className="flex items-center justify-between py-2">
                  <div>
                    <p className="text-sm font-medium">{payment.description || 'Payment'}</p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(payment.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium">${(payment.amount / 100).toFixed(2)}</p>
                    <Badge variant={payment.status === 'succeeded' ? 'default' : 'secondary'} className="text-xs">
                      {payment.status}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground text-sm">No payment history available.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
