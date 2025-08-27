import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/contexts/AuthContext';
import { Heart, Users, Trophy, Clock } from 'lucide-react';

interface WelcomeStepProps {
  leadId?: string | null;
  onComplete: () => void;
}

const WELCOME_FEATURES = [
  {
    icon: Heart,
    title: 'Personalized Training',
    description: 'Customized workouts based on your fitness goals and preferences'
  },
  {
    icon: Users,
    title: 'Community Support',
    description: 'Join a community of like-minded individuals on their fitness journey'
  },
  {
    icon: Trophy,
    title: 'Achievement Tracking',
    description: 'Track your progress and celebrate your fitness milestones'
  },
  {
    icon: Clock,
    title: 'Flexible Scheduling',
    description: 'Book classes and gym time that fits your busy lifestyle'
  }
];

export function WelcomeStep({ leadId, onComplete }: WelcomeStepProps) {
  const { profile, organization } = useAuth();

  return (
    <div className="space-y-6">
      {/* Welcome Message */}
      <div className="text-center space-y-4">
        <div className="w-20 h-20 bg-gradient-primary rounded-full mx-auto flex items-center justify-center mb-4">
          <Heart className="w-10 h-10 text-white" />
        </div>
        
        <h2 className="text-2xl font-bold text-foreground">
          Welcome to {organization?.name || 'Rep Club'}!
        </h2>
        
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
          Hi {profile?.first_name || 'there'}! We're excited to have you join our fitness community. 
          Let's get you set up for success on your fitness journey.
        </p>

        {leadId && (
          <Badge variant="secondary" className="text-sm">
            Converting from Lead #{leadId.slice(-8).toUpperCase()}
          </Badge>
        )}
      </div>

      {/* Features Grid */}
      <div className="grid md:grid-cols-2 gap-4">
        {WELCOME_FEATURES.map((feature, index) => {
          const Icon = feature.icon;
          return (
            <Card key={index} className="border-border/50 hover:border-border transition-smooth">
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-primary/10 rounded-lg flex-shrink-0">
                    <Icon className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-medium text-foreground mb-1">{feature.title}</h3>
                    <p className="text-sm text-muted-foreground">{feature.description}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* What's Next */}
      <Card className="bg-gradient-to-r from-primary/5 to-secondary/5 border-primary/20">
        <CardContent className="p-6 text-center">
          <h3 className="text-lg font-semibold text-foreground mb-2">What's Next?</h3>
          <p className="text-muted-foreground mb-4">
            We'll guide you through a quick setup process to personalize your experience:
          </p>
          <div className="flex flex-wrap justify-center gap-2 text-sm">
            <Badge variant="outline">Complete Profile</Badge>
            <Badge variant="outline">Sign Agreements</Badge>
            <Badge variant="outline">Set Fitness Goals</Badge>
            <Badge variant="outline">Schedule Orientation</Badge>
            <Badge variant="outline">Get Member Card</Badge>
          </div>
        </CardContent>
      </Card>

      {/* Action Button */}
      <div className="text-center">
        <Button 
          onClick={onComplete}
          size="lg"
          className="bg-gradient-primary hover:opacity-90 text-white shadow-lg"
        >
          Let's Get Started!
        </Button>
        <p className="text-xs text-muted-foreground mt-2">
          This process takes about 5-10 minutes to complete
        </p>
      </div>
    </div>
  );
}