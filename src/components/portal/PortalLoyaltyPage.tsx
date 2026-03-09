import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { usePortalAuth } from './PortalAuthProvider';
import { supabase } from '@/integrations/supabase/client';
import { Trophy, Star, Gift, TrendingUp } from 'lucide-react';

interface LoyaltyData {
  total_points: number;
  tier: string;
  history: {
    id: string;
    points: number;
    activity_type: string;
    description: string;
    created_at: string;
  }[];
}

const TIER_THRESHOLDS = [
  { name: 'Bronze', min: 0, max: 499 },
  { name: 'Silver', min: 500, max: 1499 },
  { name: 'Gold', min: 1500, max: 3999 },
  { name: 'Platinum', min: 4000, max: Infinity },
];

function getTier(points: number) {
  return TIER_THRESHOLDS.find(t => points >= t.min && points <= t.max) || TIER_THRESHOLDS[0];
}

function getNextTier(points: number) {
  const currentIdx = TIER_THRESHOLDS.findIndex(t => points >= t.min && points <= t.max);
  return currentIdx < TIER_THRESHOLDS.length - 1 ? TIER_THRESHOLDS[currentIdx + 1] : null;
}

export default function PortalLoyaltyPage() {
  const { profile } = usePortalAuth();
  const [loyaltyData, setLoyaltyData] = useState<LoyaltyData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!profile?.id) return;

    const fetchLoyalty = async () => {
      try {
        const { data: pointsData } = await supabase
          .from('loyalty_points')
          .select('id, points, activity_type, description, created_at')
          .eq('member_id', profile.id)
          .order('created_at', { ascending: false })
          .limit(20);

        const totalPoints = (pointsData || []).reduce((sum, p) => sum + (p.points || 0), 0);

        setLoyaltyData({
          total_points: totalPoints,
          tier: getTier(totalPoints).name,
          history: pointsData || [],
        });
      } catch (error) {
        console.error('Error fetching loyalty data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchLoyalty();
  }, [profile?.id]);

  if (loading) {
    return (
      <div className="space-y-4 p-4">
        <div className="h-32 bg-muted animate-pulse rounded-lg" />
        <div className="h-64 bg-muted animate-pulse rounded-lg" />
      </div>
    );
  }

  const points = loyaltyData?.total_points || 0;
  const currentTier = getTier(points);
  const nextTier = getNextTier(points);
  const progressToNext = nextTier
    ? ((points - currentTier.min) / (nextTier.min - currentTier.min)) * 100
    : 100;

  return (
    <div className="space-y-6 p-4 md:p-6 max-w-2xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold">Loyalty Rewards</h1>
        <p className="text-muted-foreground">Earn points for staying active and unlock rewards</p>
      </div>

      {/* Points Summary */}
      <Card>
        <CardContent className="pt-6">
          <div className="text-center space-y-3">
            <div className="inline-flex items-center gap-2">
              <Trophy className="h-8 w-8 text-yellow-500" />
              <span className="text-4xl font-bold">{points.toLocaleString()}</span>
            </div>
            <p className="text-muted-foreground">Total Points</p>
            <Badge className="text-sm px-3 py-1">
              <Star className="h-3 w-3 mr-1" />
              {currentTier.name} Member
            </Badge>
          </div>

          {nextTier && (
            <div className="mt-6 space-y-2">
              <div className="flex justify-between text-sm text-muted-foreground">
                <span>{currentTier.name}</span>
                <span>{nextTier.name}</span>
              </div>
              <Progress value={progressToNext} className="h-2" />
              <p className="text-xs text-muted-foreground text-center">
                {nextTier.min - points} points to {nextTier.name}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* How to Earn */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <TrendingUp className="h-5 w-5" />
            How to Earn Points
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3">
            {[
              { activity: 'Check in', points: '+10', icon: '🏋️' },
              { activity: 'Attend a class', points: '+25', icon: '📅' },
              { activity: 'Refer a friend', points: '+100', icon: '👥' },
              { activity: 'Monthly streak', points: '+50', icon: '🔥' },
            ].map((item) => (
              <div key={item.activity} className="flex items-center justify-between py-1">
                <span className="flex items-center gap-2 text-sm">
                  <span>{item.icon}</span> {item.activity}
                </span>
                <Badge variant="outline">{item.points} pts</Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Gift className="h-5 w-5" />
            Points History
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loyaltyData?.history && loyaltyData.history.length > 0 ? (
            <div className="space-y-3">
              {loyaltyData.history.map((entry) => (
                <div key={entry.id} className="flex items-center justify-between py-2">
                  <div>
                    <p className="text-sm font-medium">{entry.description || entry.activity_type}</p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(entry.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <Badge variant={entry.points > 0 ? 'default' : 'secondary'}>
                    {entry.points > 0 ? '+' : ''}{entry.points} pts
                  </Badge>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground text-sm">No points activity yet. Start earning by checking in!</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
