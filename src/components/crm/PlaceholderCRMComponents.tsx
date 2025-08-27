import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Mail, 
  Users, 
  CheckCircle, 
  TrendingUp, 
  Calendar, 
  Target,
  UserCheck,
  AlertTriangle,
  MessageSquare
} from 'lucide-react';

export function EmailTemplateManager() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Mail className="w-5 h-5" />
          Email Templates
        </CardTitle>
      </CardHeader>
      <CardContent className="text-center py-8">
        <Mail className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
        <h3 className="text-lg font-medium text-muted-foreground mb-2">Email Template System</h3>
        <p className="text-sm text-muted-foreground mb-4">
          Create and manage automated email templates for leads and members
        </p>
        <Badge variant="secondary">Coming Soon</Badge>
      </CardContent>
    </Card>
  );
}

export function FollowUpTasksManager() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CheckCircle className="w-5 h-5" />
          Follow-up Tasks
        </CardTitle>
      </CardHeader>
      <CardContent className="text-center py-8">
        <CheckCircle className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
        <h3 className="text-lg font-medium text-muted-foreground mb-2">Task Management System</h3>
        <p className="text-sm text-muted-foreground mb-4">
          Automated follow-up tasks and reminders for lead management
        </p>
        <Badge variant="secondary">Coming Soon</Badge>
      </CardContent>
    </Card>
  );
}

export function LeadScoringManager() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Target className="w-5 h-5" />
          Lead Scoring
        </CardTitle>
      </CardHeader>
      <CardContent className="text-center py-8">
        <Target className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
        <h3 className="text-lg font-medium text-muted-foreground mb-2">Lead Scoring System</h3>
        <p className="text-sm text-muted-foreground mb-4">
          Automated lead scoring and qualification rules
        </p>
        <Badge variant="secondary">Coming Soon</Badge>
      </CardContent>
    </Card>
  );
}

export function LeadSourcesManager() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="w-5 h-5" />
          Lead Sources
        </CardTitle>
      </CardHeader>
      <CardContent className="text-center py-8">
        <TrendingUp className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
        <h3 className="text-lg font-medium text-muted-foreground mb-2">Lead Source Management</h3>
        <p className="text-sm text-muted-foreground mb-4">
          Track and manage lead sources with ROI analysis
        </p>
        <Badge variant="secondary">Coming Soon</Badge>
      </CardContent>
    </Card>
  );
}

export function ToursSchedulingManager() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="w-5 h-5" />
          Tour Scheduling
        </CardTitle>
      </CardHeader>
      <CardContent className="text-center py-8">
        <Calendar className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
        <h3 className="text-lg font-medium text-muted-foreground mb-2">Tour Scheduling System</h3>
        <p className="text-sm text-muted-foreground mb-4">
          Facility tour scheduling and outcome tracking
        </p>
        <Badge variant="secondary">Coming Soon</Badge>
      </CardContent>
    </Card>
  );
}

export function SalesQuotesManager() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MessageSquare className="w-5 h-5" />
          Sales Quotes
        </CardTitle>
      </CardHeader>
      <CardContent className="text-center py-8">
        <MessageSquare className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
        <h3 className="text-lg font-medium text-muted-foreground mb-2">Quote Management System</h3>
        <p className="text-sm text-muted-foreground mb-4">
          Generate and manage sales quotes and proposals
        </p>
        <Badge variant="secondary">Coming Soon</Badge>
      </CardContent>
    </Card>
  );
}

export function EnhancedLeadForm() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="w-5 h-5" />
          Enhanced Lead Form
        </CardTitle>
      </CardHeader>
      <CardContent className="text-center py-8">
        <Users className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
        <h3 className="text-lg font-medium text-muted-foreground mb-2">Advanced Lead Capture</h3>
        <p className="text-sm text-muted-foreground mb-4">
          Enhanced lead forms with UTM tracking and fitness goals
        </p>
        <Button variant="outline" disabled>
          Create Lead Form
        </Button>
      </CardContent>
    </Card>
  );
}

export function LeadAttributionManager() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <UserCheck className="w-5 h-5" />
          Lead Attribution
        </CardTitle>
      </CardHeader>
      <CardContent className="text-center py-8">
        <UserCheck className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
        <h3 className="text-lg font-medium text-muted-foreground mb-2">Attribution Management</h3>
        <p className="text-sm text-muted-foreground mb-4">
          Lead attribution tracking and dispute resolution
        </p>
        <Badge variant="secondary">Coming Soon</Badge>
      </CardContent>
    </Card>
  );
}