import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Play,
  Pause,
  Square,
  Timer,
  Zap,
  Heart,
  Activity,
  Target,
  TrendingUp,
  Calendar,
  Award
} from 'lucide-react';

interface WorkoutSession {
  id: string;
  name: string;
  duration: number;
  calories: number;
  exercises: Exercise[];
  startTime?: Date;
  isActive: boolean;
}

interface Exercise {
  id: string;
  name: string;
  sets: number;
  reps: number;
  weight?: number;
  duration?: number;
  completed: boolean;
}

export default function MobileWorkoutTracker() {
  const [activeSession, setActiveSession] = useState<WorkoutSession | null>(null);
  const [sessionTime, setSessionTime] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [weeklyStats, setWeeklyStats] = useState({
    workouts: 3,
    totalTime: 240,
    calories: 1200,
    streak: 5
  });

  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    
    if (isRunning && activeSession) {
      interval = setInterval(() => {
        setSessionTime(prev => prev + 1);
      }, 1000);
    }
    
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isRunning, activeSession]);

  const startWorkout = (sessionType: string) => {
    const workoutTemplates: { [key: string]: WorkoutSession } = {
      strength: {
        id: '1',
        name: 'Strength Training',
        duration: 0,
        calories: 0,
        isActive: true,
        exercises: [
          { id: '1', name: 'Bench Press', sets: 3, reps: 10, weight: 135, completed: false },
          { id: '2', name: 'Squats', sets: 3, reps: 12, weight: 185, completed: false },
          { id: '3', name: 'Deadlifts', sets: 3, reps: 8, weight: 225, completed: false },
          { id: '4', name: 'Pull-ups', sets: 3, reps: 8, completed: false }
        ]
      },
      cardio: {
        id: '2',
        name: 'Cardio Session',
        duration: 0,
        calories: 0,
        isActive: true,
        exercises: [
          { id: '1', name: 'Treadmill Run', sets: 1, reps: 1, duration: 30, completed: false },
          { id: '2', name: 'Cycling', sets: 1, reps: 1, duration: 20, completed: false },
          { id: '3', name: 'Rowing', sets: 1, reps: 1, duration: 15, completed: false }
        ]
      },
      hiit: {
        id: '3',
        name: 'HIIT Workout',
        duration: 0,
        calories: 0,
        isActive: true,
        exercises: [
          { id: '1', name: 'Burpees', sets: 4, reps: 15, completed: false },
          { id: '2', name: 'Mountain Climbers', sets: 4, reps: 20, completed: false },
          { id: '3', name: 'Jump Squats', sets: 4, reps: 15, completed: false },
          { id: '4', name: 'Push-ups', sets: 4, reps: 12, completed: false }
        ]
      }
    };

    const session = workoutTemplates[sessionType];
    if (session) {
      setActiveSession({ ...session, startTime: new Date() });
      setSessionTime(0);
      setIsRunning(true);
    }
  };

  const togglePause = () => {
    setIsRunning(!isRunning);
  };

  const completeExercise = (exerciseId: string) => {
    if (!activeSession) return;
    
    setActiveSession(prev => ({
      ...prev!,
      exercises: prev!.exercises.map(ex => 
        ex.id === exerciseId ? { ...ex, completed: true } : ex
      )
    }));
  };

  const endWorkout = () => {
    if (activeSession) {
      // Calculate calories based on time and workout type
      const calories = Math.round(sessionTime * 0.2); // Rough calculation
      
      setActiveSession(prev => prev ? { ...prev, duration: sessionTime, calories } : null);
      setIsRunning(false);
      
      // Save workout to local storage or API
      setTimeout(() => {
        setActiveSession(null);
        setSessionTime(0);
      }, 3000);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const completedExercises = activeSession?.exercises.filter(ex => ex.completed).length || 0;
  const totalExercises = activeSession?.exercises.length || 0;
  const progressPercentage = totalExercises > 0 ? (completedExercises / totalExercises) * 100 : 0;

  if (!activeSession) {
    return (
      <div className="p-4 pb-20 space-y-6 animate-fade-in">
        {/* Weekly Stats */}
        <Card className="gym-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5 text-primary" />
              This Week
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-primary">{weeklyStats.workouts}</div>
                <div className="text-xs text-muted-foreground">Workouts</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-success">{weeklyStats.totalTime}m</div>
                <div className="text-xs text-muted-foreground">Total Time</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-warning">{weeklyStats.calories}</div>
                <div className="text-xs text-muted-foreground">Calories</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-secondary">{weeklyStats.streak}</div>
                <div className="text-xs text-muted-foreground">Day Streak</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Workout Templates */}
        <Card className="gym-card">
          <CardHeader>
            <CardTitle>Start a Workout</CardTitle>
            <CardDescription>Choose your workout type</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button 
              onClick={() => startWorkout('strength')} 
              className="w-full h-16 flex items-center gap-3"
              variant="outline"
            >
              <div className="p-2 bg-primary/10 rounded-full">
                <Zap className="h-5 w-5 text-primary" />
              </div>
              <div className="text-left">
                <div className="font-semibold">Strength Training</div>
                <div className="text-sm text-muted-foreground">45-60 min • Upper/Lower</div>
              </div>
            </Button>

            <Button 
              onClick={() => startWorkout('cardio')} 
              className="w-full h-16 flex items-center gap-3"
              variant="outline"
            >
              <div className="p-2 bg-success/10 rounded-full">
                <Heart className="h-5 w-5 text-success" />
              </div>
              <div className="text-left">
                <div className="font-semibold">Cardio Session</div>
                <div className="text-sm text-muted-foreground">30-45 min • Endurance</div>
              </div>
            </Button>

            <Button 
              onClick={() => startWorkout('hiit')} 
              className="w-full h-16 flex items-center gap-3"
              variant="outline"
            >
              <div className="p-2 bg-warning/10 rounded-full">
                <Timer className="h-5 w-5 text-warning" />
              </div>
              <div className="text-left">
                <div className="font-semibold">HIIT Workout</div>
                <div className="text-sm text-muted-foreground">20-30 min • High Intensity</div>
              </div>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-4 pb-20 space-y-6 animate-fade-in">
      {/* Active Session Header */}
      <Card className="gym-card bg-gradient-primary text-white">
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-xl font-bold">{activeSession.name}</h2>
              <p className="text-white/80">
                {completedExercises}/{totalExercises} exercises completed
              </p>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold">{formatTime(sessionTime)}</div>
              <div className="text-sm text-white/80">Duration</div>
            </div>
          </div>
          
          <Progress value={progressPercentage} className="mb-4 bg-white/20" />
          
          <div className="flex gap-2">
            <Button
              onClick={togglePause}
              className="flex-1 bg-white text-primary hover:bg-white/90"
            >
              {isRunning ? <Pause className="h-4 w-4 mr-2" /> : <Play className="h-4 w-4 mr-2" />}
              {isRunning ? 'Pause' : 'Resume'}
            </Button>
            <Button
              onClick={endWorkout}
              variant="outline"
              className="border-white text-white hover:bg-white hover:text-primary"
            >
              <Square className="h-4 w-4 mr-2" />
              End
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Exercise List */}
      <Card className="gym-card">
        <CardHeader>
          <CardTitle>Exercises</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {activeSession.exercises.map((exercise) => (
              <div
                key={exercise.id}
                className={`p-4 border rounded-lg transition-all ${
                  exercise.completed 
                    ? 'bg-success/10 border-success/20' 
                    : 'bg-card hover:bg-muted/50'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <h3 className={`font-semibold ${exercise.completed ? 'line-through text-muted-foreground' : ''}`}>
                      {exercise.name}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      {exercise.duration 
                        ? `${exercise.duration} minutes`
                        : `${exercise.sets} sets × ${exercise.reps} reps${exercise.weight ? ` @ ${exercise.weight}lbs` : ''}`
                      }
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {exercise.completed ? (
                      <Badge variant="default" className="bg-success">
                        <Award className="h-3 w-3 mr-1" />
                        Done
                      </Badge>
                    ) : (
                      <Button
                        onClick={() => completeExercise(exercise.id)}
                        size="sm"
                        variant="outline"
                      >
                        Complete
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}