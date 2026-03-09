import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { usePortalAuth } from './PortalAuthProvider';
import { usePortalThemeContext } from './PortalThemeProvider';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { Gift, Copy, Users, Share2, CheckCircle } from 'lucide-react';

interface ReferralStats {
  totalReferrals: number;
  convertedReferrals: number;
  pointsEarned: number;
}

export default function PortalReferralsPage() {
  const { profile, user } = usePortalAuth();
  const { theme } = usePortalThemeContext();
  const [stats, setStats] = useState<ReferralStats>({ totalReferrals: 0, convertedReferrals: 0, pointsEarned: 0 });
  const [loading, setLoading] = useState(true);

  // Generate a simple referral link using the member's ID
  const referralCode = profile?.id?.slice(0, 8) || '';
  const portalBase = window.location.origin;
  const referralLink = `${portalBase}/portal/signup?ref=${referralCode}`;

  useEffect(() => {
    if (!profile?.id) return;

    const fetchReferralStats = async () => {
      try {
        const { data, count } = await supabase
          .from('referrals')
          .select('id, status, converted_at', { count: 'exact' })
          .eq('referrer_id', profile.id);

        const converted = (data || []).filter(r => r.status === 'converted').length;

        setStats({
          totalReferrals: count || 0,
          convertedReferrals: converted,
          pointsEarned: converted * 100, // 100 points per conversion
        });
      } catch (error) {
        console.error('Error fetching referral stats:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchReferralStats();
  }, [profile?.id]);

  const copyLink = () => {
    navigator.clipboard.writeText(referralLink);
    toast({ title: 'Copied!', description: 'Referral link copied to clipboard.' });
  };

  const shareLink = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Join me at ${theme?.pwa_name || 'our gym'}!`,
          text: 'Check out this gym - I think you\'ll love it!',
          url: referralLink,
        });
      } catch {
        copyLink();
      }
    } else {
      copyLink();
    }
  };

  if (loading) {
    return (
      <div className="space-y-4 p-4">
        <div className="h-32 bg-muted animate-pulse rounded-lg" />
        <div className="h-48 bg-muted animate-pulse rounded-lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6 p-4 md:p-6 max-w-2xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold">Refer a Friend</h1>
        <p className="text-muted-foreground">Share the love and earn rewards for each friend who joins</p>
      </div>

      {/* Referral Link */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Gift className="h-5 w-5" />
            Your Referral Link
          </CardTitle>
          <CardDescription>
            Share this link with friends. You'll earn 100 loyalty points for each friend who signs up!
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Input
              value={referralLink}
              readOnly
              className="font-mono text-sm"
            />
            <Button variant="outline" size="icon" onClick={copyLink}>
              <Copy className="h-4 w-4" />
            </Button>
          </div>
          <Button onClick={shareLink} className="w-full gap-2">
            <Share2 className="h-4 w-4" />
            Share with Friends
          </Button>
        </CardContent>
      </Card>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        <Card>
          <CardContent className="pt-6 text-center">
            <Users className="h-5 w-5 mx-auto mb-1 text-muted-foreground" />
            <p className="text-2xl font-bold">{stats.totalReferrals}</p>
            <p className="text-xs text-muted-foreground">Referred</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6 text-center">
            <CheckCircle className="h-5 w-5 mx-auto mb-1 text-green-500" />
            <p className="text-2xl font-bold">{stats.convertedReferrals}</p>
            <p className="text-xs text-muted-foreground">Joined</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6 text-center">
            <Gift className="h-5 w-5 mx-auto mb-1 text-yellow-500" />
            <p className="text-2xl font-bold">{stats.pointsEarned}</p>
            <p className="text-xs text-muted-foreground">Points Earned</p>
          </CardContent>
        </Card>
      </div>

      {/* How It Works */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">How It Works</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[
              { step: '1', title: 'Share your link', desc: 'Send your unique referral link to friends' },
              { step: '2', title: 'They sign up', desc: 'Your friend creates an account using your link' },
              { step: '3', title: 'You get rewarded', desc: 'Earn 100 loyalty points for each friend who joins' },
            ].map((item) => (
              <div key={item.step} className="flex items-start gap-3">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center text-sm font-bold">
                  {item.step}
                </div>
                <div>
                  <p className="font-medium text-sm">{item.title}</p>
                  <p className="text-xs text-muted-foreground">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
