import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Plus, Gift, Star, TrendingUp, Award, Coins } from 'lucide-react';

interface LoyaltyPoint {
  id: string;
  member_id: string;
  points_earned: number;
  points_redeemed: number;
  current_balance: number;
  reason: string;
  activity_type: 'check_in' | 'referral' | 'class_attendance' | 'milestone' | 'bonus' | 'redemption';
  reference_id?: string;
  created_at: string;
  member?: {
    first_name?: string;
    last_name?: string;
    email: string;
  };
}

interface Member {
  id: string;
  first_name?: string;
  last_name?: string;
  email: string;
}

interface PointsFormData {
  member_id: string;
  points: string;
  reason: string;
  activity_type: string;
}

export default function LoyaltyPointsManager() {
  const { profile } = useAuth();
  const { toast } = useToast();
  const [loyaltyPoints, setLoyaltyPoints] = useState<LoyaltyPoint[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [formData, setFormData] = useState<PointsFormData>({
    member_id: '',
    points: '10',
    reason: '',
    activity_type: 'bonus'
  });

  useEffect(() => {
    fetchLoyaltyPoints();
    fetchMembers();
  }, [profile?.organization_id]);

  const fetchLoyaltyPoints = async () => {
    if (!profile?.organization_id) return;

    try {
      const { data, error } = await supabase
        .from('loyalty_points')
        .select(`
          *,
          member:profiles!member_id(first_name, last_name, email, organization_id)
        `)
        .eq('member.organization_id', profile.organization_id)
        .order('created_at', { ascending: false })
        .limit(100);

      if (error) throw error;
      setLoyaltyPoints(data as any[] || []);
    } catch (error: any) {
      console.error('Error fetching loyalty points:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchMembers = async () => {
    if (!profile?.organization_id) return;

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, first_name, last_name, email')
        .eq('organization_id', profile.organization_id)
        .eq('role', 'member')
        .order('first_name');

      if (error) throw error;
      setMembers(data || []);
    } catch (error: any) {
      console.error('Error fetching members:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile?.id) return;

    try {
      const points = parseInt(formData.points);
      if (isNaN(points) || points === 0) {
        toast({
          title: "Error",
          description: "Please enter a valid number of points",
          variant: "destructive",
        });
        return;
      }

      const isRedemption = formData.activity_type === 'redemption';
      const pointsData = {
        member_id: formData.member_id,
        points_earned: isRedemption ? 0 : points,
        points_redeemed: isRedemption ? Math.abs(points) : 0,
        current_balance: isRedemption ? -Math.abs(points) : points,
        reason: formData.reason,
        activity_type: formData.activity_type as LoyaltyPoint['activity_type']
      };

      const { error } = await supabase
        .from('loyalty_points')
        .insert([pointsData]);

      if (error) throw error;

      toast({
        title: "Success",
        description: `${isRedemption ? 'Redeemed' : 'Awarded'} ${Math.abs(points)} points successfully`,
      });

      setDialogOpen(false);
      resetForm();
      fetchLoyaltyPoints();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to process points",
        variant: "destructive",
      });
    }
  };

  const resetForm = () => {
    setFormData({
      member_id: '',
      points: '10',
      reason: '',
      activity_type: 'bonus'
    });
  };

  const getActivityTypeColor = (type: string) => {
    switch (type) {
      case 'check_in': return 'bg-blue-100 text-blue-800';
      case 'referral': return 'bg-purple-100 text-purple-800';
      case 'class_attendance': return 'bg-green-100 text-green-800';
      case 'milestone': return 'bg-yellow-100 text-yellow-800';
      case 'bonus': return 'bg-indigo-100 text-indigo-800';
      case 'redemption': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getActivityTypeIcon = (type: string) => {
    switch (type) {
      case 'check_in': return <TrendingUp className="h-4 w-4" />;
      case 'referral': return <Star className="h-4 w-4" />;
      case 'class_attendance': return <Award className="h-4 w-4" />;
      case 'milestone': return <Gift className="h-4 w-4" />;
      case 'bonus': return <Coins className="h-4 w-4" />;
      case 'redemption': return <Gift className="h-4 w-4" />;
      default: return <Star className="h-4 w-4" />;
    }
  };

  if (loading) return <div className="text-center py-8">Loading loyalty points...</div>;

  // Calculate summary statistics
  const totalPointsAwarded = loyaltyPoints.reduce((sum, point) => sum + point.points_earned, 0);
  const totalPointsRedeemed = loyaltyPoints.reduce((sum, point) => sum + point.points_redeemed, 0);
  const activeMembers = new Set(loyaltyPoints.map(point => point.member_id)).size;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Loyalty Points</h2>
          <p className="text-muted-foreground">
            Manage member loyalty points and rewards
          </p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={resetForm}>
              <Plus className="mr-2 h-4 w-4" />
              Award Points
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>Award or Redeem Points</DialogTitle>
              <DialogDescription>
                Give points to members or process point redemptions
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="member_id">Member</Label>
                <Select value={formData.member_id} onValueChange={(value) => setFormData({ ...formData, member_id: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a member" />
                  </SelectTrigger>
                  <SelectContent>
                    {members.map((member) => (
                      <SelectItem key={member.id} value={member.id}>
                        {member.first_name} {member.last_name} ({member.email})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="activity_type">Activity Type</Label>
                  <Select value={formData.activity_type} onValueChange={(value) => setFormData({ ...formData, activity_type: value })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="bonus">Bonus Points</SelectItem>
                      <SelectItem value="check_in">Check-in</SelectItem>
                      <SelectItem value="referral">Referral</SelectItem>
                      <SelectItem value="class_attendance">Class Attendance</SelectItem>
                      <SelectItem value="milestone">Milestone</SelectItem>
                      <SelectItem value="redemption">Redemption</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="points">
                    Points {formData.activity_type === 'redemption' && '(will be deducted)'}
                  </Label>
                  <Input
                    id="points"
                    type="number"
                    value={formData.points}
                    onChange={(e) => setFormData({ ...formData, points: e.target.value })}
                    min="1"
                    required
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="reason">Reason</Label>
                <Textarea
                  id="reason"
                  value={formData.reason}
                  onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                  rows={2}
                  placeholder="Reason for awarding/redeeming points"
                  required
                />
              </div>

              <div className="flex justify-end space-x-2">
                <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit">
                  {formData.activity_type === 'redemption' ? 'Redeem' : 'Award'} Points
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Points Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold">{totalPointsAwarded.toLocaleString()}</div>
                <div className="text-sm text-muted-foreground">Total Awarded</div>
              </div>
              <Gift className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold">{totalPointsRedeemed.toLocaleString()}</div>
                <div className="text-sm text-muted-foreground">Total Redeemed</div>
              </div>
              <Coins className="h-8 w-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold">{(totalPointsAwarded - totalPointsRedeemed).toLocaleString()}</div>
                <div className="text-sm text-muted-foreground">Outstanding Points</div>
              </div>
              <Star className="h-8 w-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold">{activeMembers}</div>
                <div className="text-sm text-muted-foreground">Active Members</div>
              </div>
              <Award className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Points History */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
          <CardDescription>
            Latest loyalty points transactions
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loyaltyPoints.length === 0 ? (
            <div className="text-center py-8">
              <Star className="mx-auto h-12 w-12 text-muted-foreground opacity-50 mb-4" />
              <h3 className="text-lg font-medium mb-2">No points activity</h3>
              <p className="text-muted-foreground">
                Start awarding points to members for their loyalty and engagement
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {loyaltyPoints.map((point) => (
                <div key={point.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-4">
                    <div className="flex-shrink-0">
                      {getActivityTypeIcon(point.activity_type)}
                    </div>
                    <div>
                      <h4 className="font-medium">
                        {point.member?.first_name} {point.member?.last_name}
                      </h4>
                      <p className="text-sm text-muted-foreground">{point.member?.email}</p>
                      <p className="text-sm text-muted-foreground mt-1">{point.reason}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <p className={`font-medium ${point.activity_type === 'redemption' ? 'text-red-600' : 'text-green-600'}`}>
                        {point.activity_type === 'redemption' ? '-' : '+'}
                        {point.activity_type === 'redemption' ? point.points_redeemed : point.points_earned} points
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {new Date(point.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    <Badge className={getActivityTypeColor(point.activity_type)}>
                      {point.activity_type.replace('_', ' ')}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}