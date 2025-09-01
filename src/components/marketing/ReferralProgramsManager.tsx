import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Share2, UserPlus, Users, Plus, Gift, DollarSign, TrendingUp } from 'lucide-react';

interface ReferralProgram {
  id: string;
  name: string;
  description: string;
  referrer_reward_type: string;
  referrer_reward_value: number;
  referee_reward_type: string;
  referee_reward_value: number;
  max_referrals_per_member: number;
  program_start_date: string;
  program_end_date: string;
  is_active: boolean;
  organization_id: string;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export default function ReferralProgramsManager() {
  const { profile } = useAuth();
  const [programs, setPrograms] = useState<ReferralProgram[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateDialog, setShowCreateDialog] = useState(false);

  useEffect(() => {
    if (profile?.organization_id) {
      fetchReferralPrograms();
    }
  }, [profile?.organization_id]);

  const fetchReferralPrograms = async () => {
    if (!profile?.organization_id) return;

    try {
      const { data, error } = await supabase
        .from('referral_programs')
        .select('*')
        .eq('organization_id', profile.organization_id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setPrograms(data || []);
    } catch (error) {
      console.error('Error fetching referral programs:', error);
      toast.error('Failed to load referral programs');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center h-64">Loading referral programs...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Referral Programs</h2>
          <p className="text-muted-foreground">Set up and manage member referral rewards</p>
        </div>
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Create Program
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create Referral Program</DialogTitle>
            </DialogHeader>
            <div className="text-center py-6">
              <Gift className="mx-auto h-12 w-12 text-muted-foreground opacity-50 mb-4" />
              <p className="text-muted-foreground">Referral program creation coming soon</p>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Share2 className="h-4 w-4 text-primary" />
              <div className="text-sm text-muted-foreground">Active Programs</div>
            </div>
            <div className="text-2xl font-bold text-foreground mt-1">
              {programs.filter(p => p.is_active).length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <UserPlus className="h-4 w-4 text-secondary" />
              <div className="text-sm text-muted-foreground">Total Referrals</div>
            </div>
            <div className="text-2xl font-bold text-foreground mt-1">0</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <DollarSign className="h-4 w-4 text-accent" />
              <div className="text-sm text-muted-foreground">Rewards Given</div>
            </div>
            <div className="text-2xl font-bold text-foreground mt-1">$0</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Share2 className="h-5 w-5" />
            <span>Referral Programs</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {programs.length > 0 ? (
            <div className="space-y-4">
              {programs.map((program) => (
                <div key={program.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <h3 className="font-medium">{program.name}</h3>
                    <p className="text-sm text-muted-foreground">
                      Referrer gets: ${program.referrer_reward_value} • Referee gets: ${program.referee_reward_value}
                    </p>
                  </div>
                  <Badge variant={program.is_active ? 'default' : 'secondary'}>
                    {program.is_active ? 'Active' : 'Inactive'}
                  </Badge>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <UserPlus className="mx-auto h-12 w-12 text-muted-foreground opacity-50 mb-4" />
              <h3 className="text-lg font-medium text-foreground mb-2">Referral Programs Connected</h3>
              <p className="text-muted-foreground mb-4">
                Ready to set up member referral programs and track rewards
              </p>
              <Button onClick={() => setShowCreateDialog(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Create Your First Program
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}