import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { Target, Activity, Heart, Zap } from 'lucide-react';

interface FitnessAssessmentStepProps {
  onComplete: () => void;
}

const FITNESS_GOALS = [
  { id: 'weight_loss', label: 'Weight Loss', icon: Target, color: 'bg-red-100 text-red-600' },
  { id: 'muscle_gain', label: 'Muscle Building', icon: Zap, color: 'bg-blue-100 text-blue-600' },
  { id: 'strength', label: 'Strength Training', icon: Activity, color: 'bg-green-100 text-green-600' },
  { id: 'endurance', label: 'Cardiovascular Health', icon: Heart, color: 'bg-purple-100 text-purple-600' },
  { id: 'flexibility', label: 'Flexibility & Mobility', icon: Target, color: 'bg-orange-100 text-orange-600' },
  { id: 'general_fitness', label: 'General Fitness', icon: Activity, color: 'bg-gray-100 text-gray-600' }
];

const EXPERIENCE_LEVELS = [
  { id: 'beginner', label: 'Beginner', description: 'New to fitness or returning after a break' },
  { id: 'intermediate', label: 'Intermediate', description: 'Regular exercise routine for 6+ months' },
  { id: 'advanced', label: 'Advanced', description: 'Consistent training for 2+ years' }
];

const WORKOUT_PREFERENCES = [
  { id: 'strength_training', label: 'Strength Training' },
  { id: 'cardio', label: 'Cardio Workouts' },
  { id: 'yoga', label: 'Yoga & Stretching' },
  { id: 'hiit', label: 'HIIT Classes' },
  { id: 'group_classes', label: 'Group Fitness Classes' },
  { id: 'swimming', label: 'Swimming' },
  { id: 'cycling', label: 'Cycling/Spin' },
  { id: 'martial_arts', label: 'Martial Arts' }
];

export function FitnessAssessmentStep({ onComplete }: FitnessAssessmentStepProps) {
  const { profile } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  
  // Form state
  const [selectedGoals, setSelectedGoals] = useState<string[]>([]);
  const [experienceLevel, setExperienceLevel] = useState('');
  const [workoutPreferences, setWorkoutPreferences] = useState<string[]>([]);
  const [workoutFrequency, setWorkoutFrequency] = useState('');
  const [specificGoals, setSpecificGoals] = useState('');
  const [healthConditions, setHealthConditions] = useState('');
  const [previousInjuries, setPreviousInjuries] = useState('');

  const progress = Math.round(
    ((selectedGoals.length > 0 ? 1 : 0) +
     (experienceLevel ? 1 : 0) +
     (workoutPreferences.length > 0 ? 1 : 0) +
     (workoutFrequency ? 1 : 0)) / 4 * 100
  );

  const handleGoalToggle = (goalId: string) => {
    setSelectedGoals(prev => 
      prev.includes(goalId) 
        ? prev.filter(g => g !== goalId)
        : [...prev, goalId]
    );
  };

  const handlePreferenceToggle = (preferenceId: string) => {
    setWorkoutPreferences(prev => 
      prev.includes(preferenceId) 
        ? prev.filter(p => p !== preferenceId)
        : [...prev, preferenceId]
    );
  };

  const handleSubmit = async () => {
    if (selectedGoals.length === 0 || !experienceLevel || !workoutFrequency) {
      toast({
        title: "Please complete required fields",
        description: "Goals, experience level, and workout frequency are required.",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    try {
      const assessmentData = {
        member_id: profile?.id,
        fitness_goals: selectedGoals,
        experience_level: experienceLevel,
        workout_preferences: workoutPreferences,
        workout_frequency: workoutFrequency,
        specific_goals: specificGoals,
        health_conditions: healthConditions,
        previous_injuries: previousInjuries,
        assessment_date: new Date().toISOString()
      };

      // Create fitness assessment record
      const { error } = await supabase
        .from('fitness_assessments')
        .insert([assessmentData]);

      if (error) throw error;

      // Update member profile with fitness interests
      await supabase
        .from('profiles')
        .update({ interests: selectedGoals })
        .eq('id', profile?.id);

      toast({
        title: "Fitness assessment completed!",
        description: "Your goals and preferences have been saved."
      });

      onComplete();
    } catch (error: any) {
      toast({
        title: "Error saving assessment",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Progress */}
      <div className="space-y-2">
        <div className="flex justify-between text-sm">
          <span className="font-medium">Fitness Assessment Progress</span>
          <span className="text-muted-foreground">{progress}%</span>
        </div>
        <Progress value={progress} className="h-2" />
      </div>

      {/* Fitness Goals */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="w-5 h-5 text-primary" />
            What are your fitness goals? *
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {FITNESS_GOALS.map((goal) => {
              const Icon = goal.icon;
              const isSelected = selectedGoals.includes(goal.id);
              
              return (
                <Card 
                  key={goal.id}
                  className={`cursor-pointer transition-all border-2 ${
                    isSelected 
                      ? 'border-primary bg-primary/5 shadow-md' 
                      : 'border-border hover:border-border/60'
                  }`}
                  onClick={() => handleGoalToggle(goal.id)}
                >
                  <CardContent className="p-4 text-center">
                    <div className={`w-10 h-10 rounded-lg mx-auto mb-2 flex items-center justify-center ${goal.color}`}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <p className="font-medium text-sm">{goal.label}</p>
                    {isSelected && (
                      <Badge variant="default" className="mt-2">Selected</Badge>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Experience Level */}
      <Card>
        <CardHeader>
          <CardTitle>What's your fitness experience level? *</CardTitle>
        </CardHeader>
        <CardContent>
          <RadioGroup value={experienceLevel} onValueChange={setExperienceLevel}>
            {EXPERIENCE_LEVELS.map((level) => (
              <div key={level.id} className="flex items-center space-x-3 p-3 rounded-lg border hover:bg-accent">
                <RadioGroupItem value={level.id} id={level.id} />
                <div className="flex-1">
                  <Label htmlFor={level.id} className="font-medium cursor-pointer">
                    {level.label}
                  </Label>
                  <p className="text-sm text-muted-foreground">{level.description}</p>
                </div>
              </div>
            ))}
          </RadioGroup>
        </CardContent>
      </Card>

      {/* Workout Preferences */}
      <Card>
        <CardHeader>
          <CardTitle>What types of workouts interest you?</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid sm:grid-cols-2 gap-3">
            {WORKOUT_PREFERENCES.map((preference) => (
              <div key={preference.id} className="flex items-center space-x-2">
                <Checkbox
                  id={preference.id}
                  checked={workoutPreferences.includes(preference.id)}
                  onCheckedChange={() => handlePreferenceToggle(preference.id)}
                />
                <Label htmlFor={preference.id} className="cursor-pointer">
                  {preference.label}
                </Label>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Workout Frequency */}
      <Card>
        <CardHeader>
          <CardTitle>How often do you plan to work out? *</CardTitle>
        </CardHeader>
        <CardContent>
          <RadioGroup value={workoutFrequency} onValueChange={setWorkoutFrequency}>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="1-2" id="freq-1-2" />
              <Label htmlFor="freq-1-2">1-2 times per week</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="3-4" id="freq-3-4" />
              <Label htmlFor="freq-3-4">3-4 times per week</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="5-6" id="freq-5-6" />
              <Label htmlFor="freq-5-6">5-6 times per week</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="daily" id="freq-daily" />
              <Label htmlFor="freq-daily">Daily</Label>
            </div>
          </RadioGroup>
        </CardContent>
      </Card>

      {/* Additional Information */}
      <div className="grid md:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Specific Goals (Optional)</CardTitle>
          </CardHeader>
          <CardContent>
            <Textarea
              placeholder="Tell us about any specific fitness goals or targets you'd like to achieve..."
              value={specificGoals}
              onChange={(e) => setSpecificGoals(e.target.value)}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Health Conditions & Injuries (Optional)</CardTitle>
          </CardHeader>
          <CardContent>
            <Textarea
              placeholder="Please mention any health conditions or previous injuries we should be aware of..."
              value={healthConditions + '\n\n' + previousInjuries}
              onChange={(e) => {
                const text = e.target.value;
                const parts = text.split('\n\n');
                setHealthConditions(parts[0] || '');
                setPreviousInjuries(parts[1] || '');
              }}
            />
          </CardContent>
        </Card>
      </div>

      {/* Submit Button */}
      <div className="text-center">
        <Button 
          onClick={handleSubmit}
          disabled={loading || selectedGoals.length === 0 || !experienceLevel || !workoutFrequency}
          size="lg"
        >
          {loading ? 'Saving Assessment...' : 'Complete Fitness Assessment'}
        </Button>
      </div>
    </div>
  );
}