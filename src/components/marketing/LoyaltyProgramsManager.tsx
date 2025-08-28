import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { 
  Gift, 
  Star, 
  Award, 
  TrendingUp, 
  Users, 
  Plus,
  Calendar,
  CheckCircle
} from 'lucide-react';

interface LoyaltyMember {
  member_id: string;
  first_name?: string;
  last_name?: string;
  email: string;
  current_balance: number;
  points_earned: number;
  points_redeemed: number;
  activity_type: string;
  reason: string;
  created_at: string;
}

const SAMPLE_LOYALTY_RULES = [
  { activity: 'Check-in', points: 10, description: 'Points earned for each gym visit' },
  { activity: 'Class Attendance', points: 25, description: 'Bonus points for attending fitness classes' },
  { activity: 'Referral', points: 500, description: 'Points for successful member referrals' },
  { activity: 'Birthday', points: 100, description: 'Birthday bonus points' },
  { activity: 'Monthly Challenge', points: 200, description: 'Completing monthly fitness challenges' }
];

const SAMPLE_REWARDS = [
  { name: 'Free Smoothie', cost: 100, category: 'Food & Beverage' },
  { name: 'Guest Pass', cost: 200, category: 'Access' },
  { name: 'Personal Training Session', cost: 500, category: 'Services' },
  { name: 'Gym Merchandise', cost: 300, category: 'Retail' },
  { name: 'Free Month Membership', cost: 1000, category: 'Membership' }
];

export default function LoyaltyProgramsManager() {
  const { profile } = useAuth();
  const { toast } = useToast();
  const [loyaltyMembers, setLoyaltyMembers] = useState<LoyaltyMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    total_members: 0,
    total_points_earned: 0,
    total_points_redeemed: 0,
    avg_balance: 0
  });

  useEffect(() => {
    if (profile?.organization_id) {
      fetchLoyaltyData();
    }
  }, [profile?.organization_id]);

  const fetchLoyaltyData = async () => {
    if (!profile?.organization_id) return;

    try {
      setLoading(true);

      const { data: loyaltyData, error } = await supabase
        .from('loyalty_points')
        .select(`
          member_id,
          current_balance,
          points_earned,
          points_redeemed,
          activity_type,
          reason,
          created_at,
          profiles!loyalty_points_member_id_fkey (
            first_name,
            last_name,
            email
          )
        `)
        .eq('profiles.organization_id', profile.organization_id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching loyalty data:', error);
        toast({
          title: "Error",
          description: "Failed to fetch loyalty program data",
          variant: "destructive",
        });
        return;
      }

      // Transform and aggregate data
      const memberMap = new Map();
      loyaltyData?.forEach(entry => {
        const memberId = entry.member_id;
        if (!memberMap.has(memberId)) {
          memberMap.set(memberId, {
            member_id: memberId,
            first_name: entry.profiles?.first_name,
            last_name: entry.profiles?.last_name,
            email: entry.profiles?.email,
            current_balance: entry.current_balance,
            points_earned: entry.points_earned,
            points_redeemed: entry.points_redeemed,
            activity_type: entry.activity_type,
            reason: entry.reason,
            created_at: entry.created_at
          });
        }
      });

      const members = Array.from(memberMap.values());
      setLoyaltyMembers(members);

      // Calculate stats
      const totalMembers = members.length;
      const totalEarned = members.reduce((sum, m) => sum + (m.points_earned || 0), 0);
      const totalRedeemed = members.reduce((sum, m) => sum + (m.points_redeemed || 0), 0);
      const avgBalance = totalMembers > 0 ? members.reduce((sum, m) => sum + (m.current_balance || 0), 0) / totalMembers : 0;

      setStats({
        total_members: totalMembers,
        total_points_earned: totalEarned,
        total_points_redeemed: totalRedeemed,
        avg_balance: Math.round(avgBalance)
      });

    } catch (error) {
      console.error('Error fetching loyalty data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getMemberName = (member: LoyaltyMember) => {
    if (member.first_name && member.last_name) {
      return `${member.first_name} ${member.last_name}`;
    }
    return member.email;
  };

  const getMemberTier = (balance: number) => {
    if (balance >= 1000) return { name: 'Gold', color: 'text-yellow-600', bg: 'bg-yellow-100' };
    if (balance >= 500) return { name: 'Silver', color: 'text-gray-600', bg: 'bg-gray-100' };
    return { name: 'Bronze', color: 'text-orange-600', bg: 'bg-orange-100' };
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <Card className="gym-card">
          <CardContent className="p-6 text-center">
            <div className="animate-pulse text-muted-foreground">Loading loyalty program data...</div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Loyalty Programs</h2>
          <p className="text-muted-foreground">Reward members for engagement and build loyalty</p>
        </div>
        <Button className="bg-gradient-secondary hover:opacity-90">
          <Plus className="mr-2 h-4 w-4" />
          Add Reward
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="gym-card">
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Users className="h-4 w-4 text-primary" />
              <div className="text-sm text-muted-foreground">Active Members</div>
            </div>
            <div className="text-2xl font-bold text-foreground mt-1">
              {stats.total_members}
            </div>
          </CardContent>
        </Card>
        <Card className="gym-card">
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <TrendingUp className="h-4 w-4 text-secondary" />
              <div className="text-sm text-muted-foreground">Points Earned</div>
            </div>
            <div className="text-2xl font-bold text-foreground mt-1">
              {stats.total_points_earned.toLocaleString()}
            </div>
          </CardContent>
        </Card>
        <Card className="gym-card">
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Gift className="h-4 w-4 text-accent" />
              <div className="text-sm text-muted-foreground">Points Redeemed</div>
            </div>
            <div className="text-2xl font-bold text-foreground mt-1">
              {stats.total_points_redeemed.toLocaleString()}
            </div>
          </CardContent>
        </Card>
        <Card className="gym-card">
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Star className="h-4 w-4 text-warning" />
              <div className="text-sm text-muted-foreground">Avg Balance</div>
            </div>
            <div className="text-2xl font-bold text-foreground mt-1">
              {stats.avg_balance}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Program Configuration */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Point Rules */}
        <Card className="gym-card">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Star className="h-5 w-5" />
              <span>Point Earning Rules</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {SAMPLE_LOYALTY_RULES.map((rule, index) => (
                <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex-1">
                    <h4 className="font-medium text-foreground">{rule.activity}</h4>
                    <p className="text-sm text-muted-foreground">{rule.description}</p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Badge className="bg-primary/10 text-primary">+{rule.points} pts</Badge>
                    <Button variant="outline" size="sm">Edit</Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Available Rewards */}
        <Card className="gym-card">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Gift className="h-5 w-5" />
              <span>Available Rewards</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {SAMPLE_REWARDS.map((reward, index) => (
                <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex-1">
                    <h4 className="font-medium text-foreground">{reward.name}</h4>
                    <p className="text-sm text-muted-foreground">{reward.category}</p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Badge variant="outline">{reward.cost} pts</Badge>
                    <Button variant="outline" size="sm">Edit</Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Top Members */}
      <Card className="gym-card">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Award className="h-5 w-5" />
            <span>Top Loyalty Members</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loyaltyMembers.length === 0 ? (
            <div className="text-center py-8">
              <Star className="mx-auto h-12 w-12 text-muted-foreground opacity-50 mb-4" />
              <h3 className="text-lg font-medium text-foreground mb-2">No Loyalty Data Yet</h3>
              <p className="text-muted-foreground">
                Loyalty program data will appear here as members earn and redeem points.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {loyaltyMembers.slice(0, 10).map((member, index) => {
                const tier = getMemberTier(member.current_balance);
                const progress = Math.min((member.current_balance / 1000) * 100, 100);

                return (
                  <div key={member.member_id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center space-x-4">
                      <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 text-primary font-semibold text-sm">
                        #{index + 1}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-1">
                          <h4 className="font-medium text-foreground">{getMemberName(member)}</h4>
                          <Badge className={`${tier.bg} ${tier.color} text-xs`}>
                            {tier.name}
                          </Badge>
                        </div>
                        <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                          <span>{member.current_balance} points</span>
                          <span>•</span>
                          <span>Earned: {member.points_earned}</span>
                          <span>•</span>
                          <span>Redeemed: {member.points_redeemed}</span>
                        </div>
                        <div className="mt-2">
                          <Progress value={progress} className="h-2" />
                          <p className="text-xs text-muted-foreground mt-1">
                            {1000 - member.current_balance > 0 
                              ? `${1000 - member.current_balance} points to Gold tier`
                              : 'Gold tier achieved!'
                            }
                          </p>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Button variant="outline" size="sm">
                        <Gift className="h-4 w-4 mr-1" />
                        Award Points
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}