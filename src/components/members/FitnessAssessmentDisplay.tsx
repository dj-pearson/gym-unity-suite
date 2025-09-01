import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { 
  Target, 
  Activity, 
  Clock, 
  TrendingUp,
  Calendar,
  User,
  AlertTriangle,
  Plus,
  Edit
} from 'lucide-react';
import { format } from 'date-fns';

interface FitnessAssessment {
  id: string;
  member_id: string;
  experience_level: string;
  fitness_goals: string[];
  workout_preferences: string[];
  workout_frequency: string;
  specific_goals?: string;
  health_conditions?: string;
  previous_injuries?: string;
  assessment_date: string;
  created_at: string;
  updated_at: string;
}

interface FitnessAssessmentDisplayProps {
  onUpdateAssessment?: () => void;
}

export default function FitnessAssessmentDisplay({ onUpdateAssessment }: FitnessAssessmentDisplayProps) {
  const { profile } = useAuth();
  const [assessments, setAssessments] = useState<FitnessAssessment[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAllAssessments, setShowAllAssessments] = useState(false);

  useEffect(() => {
    if (profile?.id) {
      fetchFitnessAssessments();
    }
  }, [profile]);

  const fetchFitnessAssessments = async () => {
    try {
      const { data, error } = await supabase
        .from('fitness_assessments')
        .select('*')
        .eq('member_id', profile?.id)
        .order('assessment_date', { ascending: false });

      if (error) throw error;
      
      setAssessments(data || []);
    } catch (error) {
      console.error('Error fetching fitness assessments:', error);
    } finally {
      setLoading(false);
    }
  };

  const getExperienceBadge = (level: string) => {
    const variants: Record<string, any> = {
      'beginner': { variant: 'secondary', label: 'Beginner' },
      'intermediate': { variant: 'default', label: 'Intermediate' },
      'advanced': { variant: 'outline', label: 'Advanced' },
      'expert': { variant: 'destructive', label: 'Expert' }
    };

    const config = variants[level] || variants['beginner'];
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const getFrequencyIcon = (frequency: string) => {
    switch (frequency) {
      case '1-2 times per week':
        return <Clock className="w-4 h-4 text-blue-500" />;
      case '3-4 times per week':
        return <Activity className="w-4 h-4 text-green-500" />;
      case '5+ times per week':
        return <TrendingUp className="w-4 h-4 text-purple-500" />;
      default:
        return <Clock className="w-4 h-4 text-gray-500" />;
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-muted rounded w-1/2"></div>
            <div className="space-y-2">
              <div className="h-3 bg-muted rounded"></div>
              <div className="h-3 bg-muted rounded w-3/4"></div>
              <div className="h-3 bg-muted rounded w-1/2"></div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (assessments.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="w-5 h-5" />
            Fitness Assessment
          </CardTitle>
          <CardDescription>
            Track your fitness goals and progress
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              No fitness assessment found. Complete your fitness assessment to get personalized recommendations and track your progress.
            </AlertDescription>
          </Alert>
          <Button 
            className="mt-4 w-full" 
            onClick={onUpdateAssessment}
          >
            <Plus className="w-4 h-4 mr-2" />
            Complete Fitness Assessment
          </Button>
        </CardContent>
      </Card>
    );
  }

  const latestAssessment = assessments[0];
  const isRecent = new Date(latestAssessment.assessment_date) > new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);

  return (
    <div className="space-y-4">
      {/* Update Reminder */}
      {!isRecent && (
        <Alert>
          <Calendar className="h-4 w-4" />
          <AlertDescription>
            Your fitness assessment is over 90 days old. Consider updating it to ensure your workout recommendations stay current.
            <Button 
              variant="link" 
              className="p-0 h-auto ml-1"
              onClick={onUpdateAssessment}
            >
              Update now
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {/* Latest Assessment */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Target className="w-5 h-5" />
              Current Fitness Profile
            </CardTitle>
            <div className="flex items-center gap-2">
              {getExperienceBadge(latestAssessment.experience_level)}
              <Button 
                variant="outline" 
                size="sm"
                onClick={onUpdateAssessment}
              >
                <Edit className="w-4 h-4 mr-1" />
                Update
              </Button>
            </div>
          </div>
          <CardDescription>
            Last updated {format(new Date(latestAssessment.assessment_date), 'MMMM d, yyyy')}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Overview Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardContent className="p-4 flex items-center gap-3">
                <User className="w-8 h-8 text-blue-500" />
                <div>
                  <p className="text-sm text-muted-foreground">Experience</p>
                  <p className="font-semibold capitalize">{latestAssessment.experience_level}</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4 flex items-center gap-3">
                {getFrequencyIcon(latestAssessment.workout_frequency)}
                <div>
                  <p className="text-sm text-muted-foreground">Frequency</p>
                  <p className="font-semibold">{latestAssessment.workout_frequency}</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4 flex items-center gap-3">
                <Target className="w-8 h-8 text-green-500" />
                <div>
                  <p className="text-sm text-muted-foreground">Goals</p>
                  <p className="font-semibold">{latestAssessment.fitness_goals.length} active</p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Fitness Goals */}
          <div>
            <h3 className="font-semibold mb-3 flex items-center gap-2">
              <Target className="w-4 h-4" />
              Fitness Goals
            </h3>
            <div className="flex flex-wrap gap-2">
              {latestAssessment.fitness_goals.map((goal, index) => (
                <Badge key={index} variant="outline">
                  {goal}
                </Badge>
              ))}
            </div>
          </div>

          {/* Workout Preferences */}
          {latestAssessment.workout_preferences.length > 0 && (
            <div>
              <h3 className="font-semibold mb-3 flex items-center gap-2">
                <Activity className="w-4 h-4" />
                Preferred Workouts
              </h3>
              <div className="flex flex-wrap gap-2">
                {latestAssessment.workout_preferences.map((pref, index) => (
                  <Badge key={index} variant="secondary">
                    {pref}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Specific Goals */}
          {latestAssessment.specific_goals && (
            <div>
              <h3 className="font-semibold mb-2">Specific Goals</h3>
              <p className="text-sm text-muted-foreground p-3 bg-muted/50 rounded-lg">
                {latestAssessment.specific_goals}
              </p>
            </div>
          )}

          {/* Health Information */}
          {(latestAssessment.health_conditions || latestAssessment.previous_injuries) && (
            <>
              <Separator />
              <div className="space-y-3">
                <h3 className="font-semibold text-sm text-muted-foreground">Health Information</h3>
                
                {latestAssessment.health_conditions && (
                  <div>
                    <h4 className="font-medium text-sm mb-1">Health Conditions</h4>
                    <p className="text-sm text-muted-foreground p-2 bg-muted/50 rounded">
                      {latestAssessment.health_conditions}
                    </p>
                  </div>
                )}

                {latestAssessment.previous_injuries && (
                  <div>
                    <h4 className="font-medium text-sm mb-1">Previous Injuries</h4>
                    <p className="text-sm text-muted-foreground p-2 bg-muted/50 rounded">
                      {latestAssessment.previous_injuries}
                    </p>
                  </div>
                )}
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Assessment History */}
      {assessments.length > 1 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Assessment History</CardTitle>
            <CardDescription>
              Track changes in your fitness journey over time
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {assessments.slice(showAllAssessments ? 0 : 1, showAllAssessments ? undefined : 4).map((assessment, index) => (
                <div key={assessment.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <Calendar className="w-4 h-4 text-muted-foreground" />
                    <div>
                      <p className="font-medium text-sm">
                        {format(new Date(assessment.assessment_date), 'MMMM d, yyyy')}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {assessment.fitness_goals.length} goals • {assessment.experience_level}
                      </p>
                    </div>
                  </div>
                  <Badge variant="outline" className="text-xs">
                    {assessment.workout_frequency}
                  </Badge>
                </div>
              ))}
              
              {assessments.length > 4 && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowAllAssessments(!showAllAssessments)}
                  className="w-full"
                >
                  {showAllAssessments ? 'Show Less' : `Show ${assessments.length - 3} More`}
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}