import React from 'react';
import { Button } from '@/components/ui/button';
import { Users, Calendar, UserCheck } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const quickActions = [
  {
    title: 'Add New Member',
    description: 'Register a new gym member',
    icon: Users,
    action: '/members/new',
    gradient: 'from-primary to-primary-glow',
  },
  {
    title: 'Schedule Class',
    description: 'Create a new class session',
    icon: Calendar,
    action: '/classes/new',
    gradient: 'from-secondary to-secondary-glow',
  },
  {
    title: 'Member Check-in',
    description: 'Check in a member quickly',
    icon: UserCheck,
    action: '/checkins',
    gradient: 'from-success to-green-400',
  },
];

/**
 * QuickActionsWidget - Common tasks and shortcuts
 */
export function QuickActionsWidget() {
  const navigate = useNavigate();

  return (
    <div className="space-y-3">
      {quickActions.map((action, index) => (
        <Button
          key={index}
          variant="outline"
          className="w-full justify-start h-auto p-4 hover:shadow-md transition-all"
          onClick={() => navigate(action.action)}
        >
          <div className={`p-2 rounded-lg bg-gradient-to-br mr-4 ${action.gradient}`}>
            <action.icon className="h-5 w-5 text-white" />
          </div>
          <div className="text-left">
            <div className="font-medium">{action.title}</div>
            <div className="text-sm text-muted-foreground">
              {action.description}
            </div>
          </div>
        </Button>
      ))}
    </div>
  );
}
