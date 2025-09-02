import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  TrendingUp, 
  Target, 
  Users, 
  Star,
  Trophy,
  Zap,
  Clock,
  Phone
} from 'lucide-react';

interface LeadScore {
  id: string;
  email: string;
  first_name: string | null;
  last_name: string | null;
  total_score: number;
  demographic_score: number;
  behavioral_score: number;
  engagement_score: number;
  interest_level: string;
  estimated_value: number | null;
  source: string | null;
  created_at: string;
  last_activity_date: string | null;
  activity_count: number;
}

export default function LeadScoringDashboard() {
  const { profile } = useAuth();
  const [scoredLeads, setScoredLeads] = useState<LeadScore[]>([]);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('7d');

  useEffect(() => {
    if (profile?.organization_id) {
      fetchLeadScores();
    }
  }, [profile?.organization_id, timeRange]);

  const fetchLeadScores = async () => {
    if (!profile?.organization_id) return;

    try {
      setLoading(true);
      const { data: leads, error } = await supabase
        .from('leads')
        .select(`
          id, email, first_name, last_name, interest_level, estimated_value, 
          source, created_at, phone, notes
        `)
        .eq('organization_id', profile.organization_id)
        .eq('status', 'lead');

      if (error) throw error;

      // Calculate scores for each lead
      const scoredLeadsData = await Promise.all((leads || []).map(async (lead) => {
        // Get activity count
        const { count: activityCount } = await supabase
          .from('lead_activities')
          .select('*', { count: 'exact', head: true })
          .eq('lead_id', lead.id);

        // Get last activity date
        const { data: lastActivity } = await supabase
          .from('lead_activities')
          .select('created_at')
          .eq('lead_id', lead.id)
          .order('created_at', { ascending: false })
          .limit(1)
          .single();

        // Calculate scores
        const demographicScore = calculateDemographicScore(lead);
        const behavioralScore = calculateBehavioralScore(lead, activityCount || 0);
        const engagementScore = calculateEngagementScore(lead, lastActivity?.created_at);
        const totalScore = Math.min(100, demographicScore + behavioralScore + engagementScore);

        return {
          ...lead,
          total_score: totalScore,
          demographic_score: demographicScore,
          behavioral_score: behavioralScore,
          engagement_score: engagementScore,
          activity_count: activityCount || 0,
          last_activity_date: lastActivity?.created_at || null
        };
      }));

      setScoredLeads(scoredLeadsData.sort((a, b) => b.total_score - a.total_score));
    } catch (error) {
      console.error('Error fetching lead scores:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateDemographicScore = (lead: any): number => {
    let score = 0;
    
    // Name completeness
    if (lead.first_name && lead.last_name) score += 10;
    
    // Phone provided
    if (lead.phone) score += 15;
    
    // Interest level
    switch (lead.interest_level) {
      case 'hot': score += 25; break;
      case 'warm': score += 15; break;
      case 'cold': score += 5; break;
    }
    
    // Estimated value
    if (lead.estimated_value) {
      if (lead.estimated_value > 1000) score += 20;
      else if (lead.estimated_value > 500) score += 15;
      else if (lead.estimated_value > 100) score += 10;
      else score += 5;
    }
    
    // Source quality
    switch (lead.source) {
      case 'referral': score += 15; break;
      case 'website': score += 10; break;
      case 'social_media': score += 8; break;
      case 'google': score += 12; break;
      case 'walk_in': score += 20; break;
      default: score += 5; break;
    }

    return Math.min(40, score);
  };

  const calculateBehavioralScore = (lead: any, activityCount: number): number => {
    let score = 0;
    
    // Activity engagement
    if (activityCount > 5) score += 25;
    else if (activityCount > 3) score += 20;
    else if (activityCount > 1) score += 15;
    else if (activityCount > 0) score += 10;
    
    // Notes indicate engagement
    if (lead.notes && lead.notes.length > 50) score += 10;
    
    return Math.min(35, score);
  };

  const calculateEngagementScore = (lead: any, lastActivityDate: string | null): number => {
    let score = 0;
    
    if (lastActivityDate) {
      const daysSinceLastActivity = Math.floor(
        (new Date().getTime() - new Date(lastActivityDate).getTime()) / (1000 * 60 * 60 * 24)
      );
      
      if (daysSinceLastActivity <= 1) score += 25;
      else if (daysSinceLastActivity <= 3) score += 20;
      else if (daysSinceLastActivity <= 7) score += 15;
      else if (daysSinceLastActivity <= 14) score += 10;
      else score += 5;
    }
    
    // Recency of lead creation
    const daysSinceCreated = Math.floor(
      (new Date().getTime() - new Date(lead.created_at).getTime()) / (1000 * 60 * 60 * 24)
    );
    
    if (daysSinceCreated <= 1) score += 10;
    else if (daysSinceCreated <= 7) score += 8;
    else if (daysSinceCreated <= 30) score += 5;
    
    return Math.min(25, score);
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-success';
    if (score >= 60) return 'text-warning';
    if (score >= 40) return 'text-secondary';
    return 'text-muted-foreground';
  };

  const getScoreBadgeVariant = (score: number) => {
    if (score >= 80) return 'default' as const;
    if (score >= 60) return 'secondary' as const;
    return 'outline' as const;
  };

  const formatLeadName = (lead: LeadScore) => {
    if (lead.first_name && lead.last_name) {
      return `${lead.first_name} ${lead.last_name}`;
    }
    return lead.email;
  };

  const highScoreLeads = scoredLeads.filter(lead => lead.total_score >= 70);
  const mediumScoreLeads = scoredLeads.filter(lead => lead.total_score >= 40 && lead.total_score < 70);
  const lowScoreLeads = scoredLeads.filter(lead => lead.total_score < 40);

  const averageScore = scoredLeads.length > 0 
    ? Math.round(scoredLeads.reduce((sum, lead) => sum + lead.total_score, 0) / scoredLeads.length)
    : 0;

  if (loading) {
    return <div className="flex items-center justify-center h-64">Loading lead scores...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Score Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="gym-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Trophy className="h-4 w-4 text-warning" />
              High Score Leads
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-success">{highScoreLeads.length}</div>
            <p className="text-xs text-muted-foreground">Score 70+</p>
          </CardContent>
        </Card>

        <Card className="gym-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Target className="h-4 w-4 text-secondary" />
              Medium Score Leads
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-warning">{mediumScoreLeads.length}</div>
            <p className="text-xs text-muted-foreground">Score 40-69</p>
          </CardContent>
        </Card>

        <Card className="gym-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Users className="h-4 w-4 text-muted-foreground" />
              Low Score Leads
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-muted-foreground">{lowScoreLeads.length}</div>
            <p className="text-xs text-muted-foreground">Score &lt;40</p>
          </CardContent>
        </Card>

        <Card className="gym-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-primary" />
              Average Score
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${getScoreColor(averageScore)}`}>
              {averageScore}
            </div>
            <p className="text-xs text-muted-foreground">Overall average</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="all" className="space-y-4">
        <TabsList>
          <TabsTrigger value="all">All Leads</TabsTrigger>
          <TabsTrigger value="high">High Score ({highScoreLeads.length})</TabsTrigger>
          <TabsTrigger value="medium">Medium Score ({mediumScoreLeads.length})</TabsTrigger>
          <TabsTrigger value="low">Low Score ({lowScoreLeads.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="all">
          <LeadScoreList leads={scoredLeads} />
        </TabsContent>
        
        <TabsContent value="high">
          <LeadScoreList leads={highScoreLeads} />
        </TabsContent>
        
        <TabsContent value="medium">
          <LeadScoreList leads={mediumScoreLeads} />
        </TabsContent>
        
        <TabsContent value="low">
          <LeadScoreList leads={lowScoreLeads} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

interface LeadScoreListProps {
  leads: LeadScore[];
}

function LeadScoreList({ leads }: LeadScoreListProps) {
  const formatLeadName = (lead: LeadScore) => {
    if (lead.first_name && lead.last_name) {
      return `${lead.first_name} ${lead.last_name}`;
    }
    return lead.email;
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-success';
    if (score >= 60) return 'text-warning';
    if (score >= 40) return 'text-secondary';
    return 'text-muted-foreground';
  };

  const getScoreBadgeVariant = (score: number) => {
    if (score >= 80) return 'default' as const;
    if (score >= 60) return 'secondary' as const;
    return 'outline' as const;
  };

  return (
    <Card className="gym-card">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Star className="h-5 w-5 text-primary" />
          Lead Scores ({leads.length})
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {leads.map((lead) => (
            <div key={lead.id} className="p-4 border rounded-lg hover:bg-muted/50 transition-colors">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                    <Users className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <div className="font-medium">{formatLeadName(lead)}</div>
                    <div className="text-sm text-muted-foreground">{lead.email}</div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={getScoreBadgeVariant(lead.total_score)}>
                    {lead.interest_level}
                  </Badge>
                  <div className={`text-2xl font-bold ${getScoreColor(lead.total_score)}`}>
                    {lead.total_score}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4 mb-3">
                <div>
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="text-muted-foreground">Demographics</span>
                    <span>{lead.demographic_score}/40</span>
                  </div>
                  <Progress value={(lead.demographic_score / 40) * 100} className="h-2" />
                </div>
                <div>
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="text-muted-foreground">Behavior</span>
                    <span>{lead.behavioral_score}/35</span>
                  </div>
                  <Progress value={(lead.behavioral_score / 35) * 100} className="h-2" />
                </div>
                <div>
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="text-muted-foreground">Engagement</span>
                    <span>{lead.engagement_score}/25</span>
                  </div>
                  <Progress value={(lead.engagement_score / 25) * 100} className="h-2" />
                </div>
              </div>

              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <div className="flex items-center gap-4">
                  <span className="flex items-center gap-1">
                    <Phone className="h-3 w-3" />
                    {lead.activity_count} activities
                  </span>
                  {lead.estimated_value && (
                    <span>${lead.estimated_value} estimated</span>
                  )}
                  {lead.source && (
                    <span>Source: {lead.source}</span>
                  )}
                </div>
                <div className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {lead.last_activity_date 
                    ? `Last activity: ${new Date(lead.last_activity_date).toLocaleDateString()}`
                    : 'No recent activity'
                  }
                </div>
              </div>
            </div>
          ))}
          
          {leads.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              No leads found in this category
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}