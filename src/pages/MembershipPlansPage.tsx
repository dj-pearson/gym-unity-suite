import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Plus, CreditCard, TrendingUp, Users, DollarSign } from 'lucide-react';
import MembershipPlanForm from '@/components/membership/MembershipPlanForm';
import MembershipPlanCard from '@/components/membership/MembershipPlanCard';

interface MembershipPlan {
  id: string;
  name: string;
  description?: string;
  price: number;
  billing_interval: string;
  max_classes_per_month?: number | null;
  access_level: string;
  created_at: string;
}

interface PlanStats {
  planId: string;
  memberCount: number;
  monthlyRevenue: number;
}

export default function MembershipPlansPage() {
  const { profile } = useAuth();
  const { toast } = useToast();
  const [plans, setPlans] = useState<MembershipPlan[]>([]);
  const [planStats, setPlanStats] = useState<PlanStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingPlan, setEditingPlan] = useState<MembershipPlan | null>(null);

  const canManagePlans = profile?.role && ['owner', 'manager'].includes(profile.role);

  useEffect(() => {
    fetchPlans();
  }, [profile?.organization_id]);

  const fetchPlans = async () => {
    if (!profile?.organization_id) return;

    try {
      setLoading(true);

      // Fetch membership plans
      const { data: plansData, error: plansError } = await supabase
        .from('membership_plans')
        .select('*')
        .eq('organization_id', profile.organization_id)
        .order('price', { ascending: true });

      if (plansError) throw plansError;

      setPlans(plansData || []);

      // Fetch membership stats for each plan
      if (plansData && plansData.length > 0) {
        const statsPromises = plansData.map(async (plan) => {
          const { data: memberships, error } = await supabase
            .from('memberships')
            .select('*, membership_plans!inner(*)')
            .eq('membership_plans.id', plan.id)
            .eq('status', 'active');

          if (error) {
            console.error(`Error fetching stats for plan ${plan.id}:`, error);
            return { planId: plan.id, memberCount: 0, monthlyRevenue: 0 };
          }

          const memberCount = memberships?.length || 0;
          let monthlyRevenue = 0;

          if (memberCount > 0) {
            // Calculate monthly revenue based on billing interval
            const multiplier = plan.billing_interval === 'yearly' ? 1/12 : 
                              plan.billing_interval === 'quarterly' ? 1/3 : 1;
            monthlyRevenue = plan.price * memberCount * multiplier;
          }

          return {
            planId: plan.id,
            memberCount,
            monthlyRevenue
          };
        });

        const stats = await Promise.all(statsPromises);
        setPlanStats(stats);
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to fetch membership plans",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (plan: MembershipPlan) => {
    setEditingPlan(plan);
    setShowForm(true);
  };

  const handleDelete = async (planId: string) => {
    if (!confirm('Are you sure you want to delete this membership plan? This action cannot be undone.')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('membership_plans')
        .delete()
        .eq('id', planId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Membership plan deleted successfully",
      });

      fetchPlans();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to delete membership plan",
        variant: "destructive",
      });
    }
  };

  const totalMembers = planStats.reduce((sum, stat) => sum + stat.memberCount, 0);
  const totalMonthlyRevenue = planStats.reduce((sum, stat) => sum + stat.monthlyRevenue, 0);
  const averageRevenuePerMember = totalMembers > 0 ? totalMonthlyRevenue / totalMembers : 0;

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">Membership Plans</h1>
        </div>
        <div className="text-center py-12">
          <div className="animate-pulse text-muted-foreground">Loading membership plans...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div className="p-2 bg-gradient-secondary rounded-lg">
            <CreditCard className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-foreground">Membership Plans</h1>
            <p className="text-muted-foreground">
              Manage pricing and membership tiers for your gym
            </p>
          </div>
        </div>
        {canManagePlans && (
          <Button 
            className="bg-gradient-secondary hover:opacity-90"
            onClick={() => {
              setEditingPlan(null);
              setShowForm(true);
            }}
          >
            <Plus className="mr-2 h-4 w-4" />
            Create Plan
          </Button>
        )}
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="gym-card">
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-foreground">{plans.length}</div>
            <div className="text-sm text-muted-foreground">Active Plans</div>
          </CardContent>
        </Card>
        <Card className="gym-card">
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-primary">{totalMembers}</div>
            <div className="text-sm text-muted-foreground">Total Members</div>
          </CardContent>
        </Card>
        <Card className="gym-card">
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-success">
              ${totalMonthlyRevenue.toFixed(0)}
            </div>
            <div className="text-sm text-muted-foreground">Monthly Revenue</div>
          </CardContent>
        </Card>
        <Card className="gym-card">
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-warning">
              ${averageRevenuePerMember.toFixed(0)}
            </div>
            <div className="text-sm text-muted-foreground">Avg Revenue/Member</div>
          </CardContent>
        </Card>
      </div>

      {/* Plans Grid */}
      {plans.length === 0 ? (
        <Card className="gym-card">
          <CardContent className="text-center py-12">
            <CreditCard className="mx-auto h-12 w-12 text-muted-foreground opacity-50 mb-4" />
            <h3 className="text-lg font-medium text-foreground mb-2">No membership plans yet</h3>
            <p className="text-muted-foreground mb-4">
              Create your first membership plan to start accepting members
            </p>
            {canManagePlans && (
              <Button 
                className="bg-gradient-secondary hover:opacity-90"
                onClick={() => {
                  setEditingPlan(null);
                  setShowForm(true);
                }}
              >
                <Plus className="mr-2 h-4 w-4" />
                Create First Plan
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {plans.map((plan) => {
            const stats = planStats.find(s => s.planId === plan.id);
            return (
              <MembershipPlanCard
                key={plan.id}
                plan={plan}
                onEdit={handleEdit}
                onDelete={handleDelete}
                memberCount={stats?.memberCount || 0}
                canManage={canManagePlans}
              />
            );
          })}
        </div>
      )}

      {/* Form Dialog */}
      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          <MembershipPlanForm
            initialData={editingPlan ? {
              ...editingPlan,
              billing_interval: editingPlan.billing_interval as 'monthly' | 'quarterly' | 'yearly',
              access_level: editingPlan.access_level as 'single_location' | 'all_locations'
            } : undefined}
            onSuccess={() => {
              setShowForm(false);
              setEditingPlan(null);
              fetchPlans();
            }}
            onCancel={() => {
              setShowForm(false);
              setEditingPlan(null);
            }}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}