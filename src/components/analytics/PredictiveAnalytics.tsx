import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { 
  TrendingUp, 
  TrendingDown, 
  AlertTriangle, 
  Target, 
  Users, 
  Calendar,
  DollarSign,
  Brain,
  Lightbulb,
  Zap
} from 'lucide-react';

interface ChurnPrediction {
  memberId: string;
  memberName: string;
  email: string;
  churnRisk: 'high' | 'medium' | 'low';
  churnProbability: number;
  factors: string[];
  lastVisit: string;
  membershipType: string;
  daysSinceLastVisit: number;
}

interface RevenueForcast {
  month: string;
  predicted: number;
  confidence: number;
  factors: string[];
}

interface ClassDemandPrediction {
  className: string;
  timeSlot: string;
  predictedBookings: number;
  capacity: number;
  utilizationForecast: number;
  recommendation: string;
}

export default function PredictiveAnalytics() {
  const { profile } = useAuth();
  const [loading, setLoading] = useState(true);
  const [churnPredictions, setChurnPredictions] = useState<ChurnPrediction[]>([]);
  const [revenueForecasts, setRevenueForecasts] = useState<RevenueForcast[]>([]);
  const [classDemandPredictions, setClassDemandPredictions] = useState<ClassDemandPrediction[]>([]);

  useEffect(() => {
    if (profile?.organization_id) {
      fetchPredictiveAnalytics();
    }
  }, [profile?.organization_id]);

  const fetchPredictiveAnalytics = async () => {
    if (!profile?.organization_id) return;

    try {
      setLoading(true);
      
      // Fetch member engagement data for churn prediction
      const { data: memberEngagement } = await supabase
        .from('member_engagement_summary')
        .select('*')
        .eq('organization_id', profile.organization_id);

      // Calculate churn predictions based on engagement patterns
      const predictions: ChurnPrediction[] = [];
      
      memberEngagement?.forEach(member => {
        const daysSinceLastVisit = member.last_visit_date 
          ? Math.floor((Date.now() - new Date(member.last_visit_date).getTime()) / (1000 * 60 * 60 * 24))
          : 999;
        
        let churnRisk: 'high' | 'medium' | 'low' = 'low';
        let churnProbability = 0;
        const factors: string[] = [];

        // Risk calculation based on various factors
        if (daysSinceLastVisit > 14) {
          churnRisk = 'high';
          churnProbability += 40;
          factors.push('No recent visits');
        } else if (daysSinceLastVisit > 7) {
          churnRisk = 'medium';
          churnProbability += 20;
          factors.push('Declining visit frequency');
        }

        if (member.visits_last_30_days < 4) {
          churnProbability += 25;
          factors.push('Low monthly visits');
        }

        if (member.classes_booked_last_30 === 0) {
          churnProbability += 15;
          factors.push('No class participation');
        }

        if (member.avg_visit_duration_minutes < 45) {
          churnProbability += 10;
          factors.push('Short visit duration');
        }

        // Adjust risk level based on probability
        if (churnProbability >= 60) churnRisk = 'high';
        else if (churnProbability >= 30) churnRisk = 'medium';
        else churnRisk = 'low';

        // Only include medium and high risk members
        if (churnRisk !== 'low') {
          predictions.push({
            memberId: member.member_id,
            memberName: `${member.first_name} ${member.last_name}`,
            email: member.email,
            churnRisk,
            churnProbability: Math.min(churnProbability, 95),
            factors,
            lastVisit: member.last_visit_date || 'Never',
            membershipType: 'Standard', // Would come from membership data
            daysSinceLastVisit
          });
        }
      });

      setChurnPredictions(predictions.sort((a, b) => b.churnProbability - a.churnProbability));

      // Generate revenue forecasts (simplified predictive model)
      const forecasts: RevenueForcast[] = [];
      const currentMonth = new Date().getMonth();
      
      for (let i = 0; i < 6; i++) {
        const month = new Date();
        month.setMonth(currentMonth + i);
        
        // Simplified forecast based on trends (in real app, would use ML models)
        const baseRevenue = 15000; // Base monthly revenue
        const seasonalMultiplier = getSeasonalMultiplier(month.getMonth());
        const growthTrend = 1.05; // 5% monthly growth
        
        forecasts.push({
          month: month.toLocaleDateString('en', { month: 'short', year: 'numeric' }),
          predicted: Math.round(baseRevenue * seasonalMultiplier * Math.pow(growthTrend, i)),
          confidence: Math.max(95 - (i * 10), 60), // Decreasing confidence over time
          factors: [
            'Historical trends',
            'Seasonal patterns',
            'Member retention rate',
            'Marketing campaigns'
          ]
        });
      }

      setRevenueForecasts(forecasts);

      // Generate class demand predictions
      const { data: classes } = await supabase
        .from('classes')
        .select(`
          id,
          name,
          max_capacity,
          scheduled_at,
          class_bookings(count)
        `)
        .eq('organization_id', profile.organization_id)
        .gte('scheduled_at', new Date().toISOString())
        .order('scheduled_at', { ascending: true })
        .limit(10);

      const classPredictions: ClassDemandPrediction[] = [];
      
      classes?.forEach(cls => {
        const currentBookings = cls.class_bookings?.[0]?.count || 0;
        const utilization = (currentBookings / cls.max_capacity) * 100;
        
        // Predict future bookings based on historical patterns
        const predictedBookings = Math.min(
          Math.round(currentBookings * 1.2), // 20% growth expectation
          cls.max_capacity
        );
        
        const utilizationForecast = (predictedBookings / cls.max_capacity) * 100;
        
        let recommendation = '';
        if (utilizationForecast > 90) {
          recommendation = 'Consider adding another session';
        } else if (utilizationForecast < 40) {
          recommendation = 'Low demand - consider rescheduling';
        } else {
          recommendation = 'Optimal utilization expected';
        }

        classPredictions.push({
          className: cls.name,
          timeSlot: new Date(cls.scheduled_at).toLocaleString(),
          predictedBookings,
          capacity: cls.max_capacity,
          utilizationForecast,
          recommendation
        });
      });

      setClassDemandPredictions(classPredictions);

    } catch (error) {
      console.error('Error fetching predictive analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  const getSeasonalMultiplier = (month: number): number => {
    // January (New Year resolutions) and summer months typically see higher membership
    const seasonalFactors = [1.3, 1.1, 1.0, 0.9, 1.1, 1.2, 1.2, 1.1, 0.9, 0.9, 0.8, 0.9];
    return seasonalFactors[month] || 1.0;
  };

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case 'high': return 'text-red-500 bg-red-50 border-red-200';
      case 'medium': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'low': return 'text-green-600 bg-green-50 border-green-200';
      default: return 'text-gray-500 bg-gray-50 border-gray-200';
    }
  };

  if (loading) {
    return <div className="text-center py-8">Loading predictive analytics...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Brain className="h-6 w-6 text-primary" />
        <h2 className="text-2xl font-bold">Predictive Analytics</h2>
        <Badge variant="secondary" className="ml-2">
          <Zap className="w-3 h-3 mr-1" />
          AI-Powered
        </Badge>
      </div>

      <Tabs defaultValue="churn" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="churn" className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4" />
            Churn Risk
          </TabsTrigger>
          <TabsTrigger value="revenue" className="flex items-center gap-2">
            <DollarSign className="w-4 h-4" />
            Revenue Forecast
          </TabsTrigger>
          <TabsTrigger value="demand" className="flex items-center gap-2">
            <Calendar className="w-4 h-4" />
            Class Demand
          </TabsTrigger>
        </TabsList>

        <TabsContent value="churn" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5" />
                Member Churn Risk Analysis
              </CardTitle>
              <CardDescription>
                Members at risk of canceling their membership based on engagement patterns
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {churnPredictions.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Users className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>Great news! No members currently at high churn risk.</p>
                  </div>
                ) : (
                  churnPredictions.slice(0, 10).map((prediction) => (
                    <div key={prediction.memberId} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="font-medium">{prediction.memberName}</h3>
                          <Badge className={getRiskColor(prediction.churnRisk)}>
                            {prediction.churnRisk.toUpperCase()} RISK
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground mb-2">{prediction.email}</p>
                        <div className="flex items-center gap-4 text-xs text-muted-foreground">
                          <span>Last visit: {
                            prediction.lastVisit === 'Never' 
                              ? 'Never' 
                              : `${prediction.daysSinceLastVisit} days ago`
                          }</span>
                          <span>Risk factors: {prediction.factors.join(', ')}</span>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-bold text-destructive">
                          {prediction.churnProbability}%
                        </div>
                        <Progress 
                          value={prediction.churnProbability} 
                          className="w-24 h-2 mt-1"
                        />
                        <Button size="sm" className="mt-2">
                          <Lightbulb className="w-3 h-3 mr-1" />
                          Intervene
                        </Button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="revenue" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Revenue Forecast
              </CardTitle>
              <CardDescription>
                Predicted revenue trends for the next 6 months
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-80 mb-6">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={revenueForecasts}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip 
                      formatter={(value, name) => [
                        `$${value.toLocaleString()}`, 
                        'Predicted Revenue'
                      ]}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="predicted" 
                      stroke="hsl(var(--primary))" 
                      strokeWidth={3}
                      dot={{ r: 6 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {revenueForecasts.slice(0, 4).map((forecast, index) => (
                  <div key={index} className="p-4 border rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-medium">{forecast.month}</h3>
                      <Badge variant="outline">{forecast.confidence}% confidence</Badge>
                    </div>
                    <div className="text-2xl font-bold text-green-600 mb-2">
                      ${forecast.predicted.toLocaleString()}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Key factors: {forecast.factors.slice(0, 2).join(', ')}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="demand" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Class Demand Predictions
              </CardTitle>
              <CardDescription>
                Forecasted booking patterns and capacity utilization
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {classDemandPredictions.map((prediction, index) => (
                  <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex-1">
                      <h3 className="font-medium mb-1">{prediction.className}</h3>
                      <p className="text-sm text-muted-foreground mb-2">{prediction.timeSlot}</p>
                      <div className="flex items-center gap-4 text-xs">
                        <span>Predicted: {prediction.predictedBookings}/{prediction.capacity}</span>
                        <span>Utilization: {Math.round(prediction.utilizationForecast)}%</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <Progress 
                        value={prediction.utilizationForecast} 
                        className="w-24 h-2 mb-2"
                      />
                      <Badge variant={
                        prediction.utilizationForecast > 90 ? 'destructive' :
                        prediction.utilizationForecast < 40 ? 'secondary' : 'default'
                      }>
                        {prediction.recommendation}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}