import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import {
  CheckCircle2,
  Circle,
  Users,
  Calendar,
  CreditCard,
  Settings,
  ArrowRight,
  X,
  Sparkles
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';

interface SetupTask {
  id: string;
  title: string;
  description: string;
  icon: React.ElementType;
  href: string;
  checkFn?: () => Promise<boolean>;
}

const SETUP_TASKS: SetupTask[] = [
  {
    id: 'add-member',
    title: 'Add your first member',
    description: 'Start by adding a member to your gym',
    icon: Users,
    href: '/members',
  },
  {
    id: 'create-class',
    title: 'Create a class',
    description: 'Set up your first fitness class',
    icon: Calendar,
    href: '/classes',
  },
  {
    id: 'setup-billing',
    title: 'Configure billing',
    description: 'Set up membership plans and pricing',
    icon: CreditCard,
    href: '/membership-plans',
  },
  {
    id: 'customize-settings',
    title: 'Customize settings',
    description: 'Configure your gym profile and preferences',
    icon: Settings,
    href: '/settings',
  },
];

export function GettingStartedWidget() {
  const navigate = useNavigate();
  const { profile, organization } = useAuth();
  const [completedTasks, setCompletedTasks] = useState<string[]>([]);
  const [dismissed, setDismissed] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkTaskCompletion();
    checkDismissed();
  }, [organization?.id]);

  const checkDismissed = () => {
    const dismissedKey = `getting-started-dismissed-${organization?.id}`;
    const isDismissed = localStorage.getItem(dismissedKey) === 'true';
    setDismissed(isDismissed);
  };

  const checkTaskCompletion = async () => {
    if (!organization?.id) {
      setLoading(false);
      return;
    }

    try {
      const completed: string[] = [];

      // Check if any members exist
      const { count: memberCount } = await supabase
        .from('members')
        .select('*', { count: 'exact', head: true })
        .eq('organization_id', organization.id);

      if (memberCount && memberCount > 0) {
        completed.push('add-member');
      }

      // Check if any classes exist
      const { count: classCount } = await supabase
        .from('classes')
        .select('*', { count: 'exact', head: true })
        .eq('organization_id', organization.id);

      if (classCount && classCount > 0) {
        completed.push('create-class');
      }

      // Check if any membership plans exist
      const { count: planCount } = await supabase
        .from('membership_plans')
        .select('*', { count: 'exact', head: true })
        .eq('organization_id', organization.id);

      if (planCount && planCount > 0) {
        completed.push('setup-billing');
      }

      // Check if organization settings have been customized
      if (organization.name && organization.name !== 'My Gym') {
        completed.push('customize-settings');
      }

      setCompletedTasks(completed);
    } catch (error) {
      console.error('Error checking task completion:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDismiss = () => {
    const dismissedKey = `getting-started-dismissed-${organization?.id}`;
    localStorage.setItem(dismissedKey, 'true');
    setDismissed(true);
  };

  const progress = (completedTasks.length / SETUP_TASKS.length) * 100;
  const allComplete = completedTasks.length === SETUP_TASKS.length;

  // Don't show if dismissed or all complete
  if (dismissed || allComplete || loading) {
    return null;
  }

  return (
    <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Sparkles className="h-5 w-5 text-primary" />
            </div>
            <div>
              <CardTitle className="text-lg">Getting Started</CardTitle>
              <CardDescription>
                Complete these steps to get the most out of Rep Club
              </CardDescription>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-muted-foreground hover:text-foreground"
            onClick={handleDismiss}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Progress bar */}
        <div className="mt-4 space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Progress</span>
            <Badge variant="secondary">
              {completedTasks.length}/{SETUP_TASKS.length} complete
            </Badge>
          </div>
          <Progress value={progress} className="h-2" />
        </div>
      </CardHeader>

      <CardContent className="pt-0">
        <div className="space-y-3">
          {SETUP_TASKS.map((task) => {
            const isComplete = completedTasks.includes(task.id);
            const Icon = task.icon;

            return (
              <div
                key={task.id}
                className={`flex items-center gap-3 p-3 rounded-lg border transition-colors ${
                  isComplete
                    ? 'bg-muted/50 border-border'
                    : 'bg-background border-border hover:border-primary/50 cursor-pointer'
                }`}
                onClick={() => !isComplete && navigate(task.href)}
              >
                <div className={`p-2 rounded-lg ${isComplete ? 'bg-green-100 dark:bg-green-900/30' : 'bg-primary/10'}`}>
                  {isComplete ? (
                    <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400" />
                  ) : (
                    <Icon className="h-4 w-4 text-primary" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className={`text-sm font-medium ${isComplete ? 'line-through text-muted-foreground' : ''}`}>
                    {task.title}
                  </p>
                  <p className="text-xs text-muted-foreground truncate">
                    {task.description}
                  </p>
                </div>
                {!isComplete && (
                  <ArrowRight className="h-4 w-4 text-muted-foreground" />
                )}
              </div>
            );
          })}
        </div>

        {/* Quick tip */}
        <div className="mt-4 p-3 bg-muted/50 rounded-lg">
          <p className="text-xs text-muted-foreground">
            <span className="font-medium text-foreground">Pro tip:</span> Use the sidebar
            navigation to access all features, or press{' '}
            <kbd className="px-1.5 py-0.5 bg-background border rounded text-xs font-mono">
              Cmd+K
            </kbd>{' '}
            to search.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
