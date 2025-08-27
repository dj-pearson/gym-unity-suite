import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Megaphone, Mail, Headphones, Trophy } from 'lucide-react';

export function AnnouncementManager() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Megaphone className="w-5 h-5" />
          Announcements
        </CardTitle>
      </CardHeader>
      <CardContent className="text-center py-8">
        <Megaphone className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
        <h3 className="text-lg font-medium text-muted-foreground mb-2">Announcement System</h3>
        <p className="text-sm text-muted-foreground mb-4">
          Broadcast important updates and news to all members
        </p>
        <Badge variant="secondary">Coming Soon</Badge>
      </CardContent>
    </Card>
  );
}

export function EmailTemplates() {
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
        <h3 className="text-lg font-medium text-muted-foreground mb-2">Email Templates</h3>
        <p className="text-sm text-muted-foreground mb-4">
          Create and manage automated email templates
        </p>
        <Badge variant="secondary">Coming Soon</Badge>
      </CardContent>
    </Card>
  );
}

export function SupportTickets() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Headphones className="w-5 h-5" />
          Support Tickets
        </CardTitle>
      </CardHeader>
      <CardContent className="text-center py-8">
        <Headphones className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
        <h3 className="text-lg font-medium text-muted-foreground mb-2">Support System</h3>
        <p className="text-sm text-muted-foreground mb-4">
          Manage member support requests and issues
        </p>
        <Badge variant="secondary">Coming Soon</Badge>
      </CardContent>
    </Card>
  );
}

export function MilestoneTracking() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Trophy className="w-5 h-5" />
          Milestone Tracking
        </CardTitle>
      </CardHeader>
      <CardContent className="text-center py-8">
        <Trophy className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
        <h3 className="text-lg font-medium text-muted-foreground mb-2">Member Milestones</h3>
        <p className="text-sm text-muted-foreground mb-4">
          Track and celebrate member achievements and anniversaries
        </p>
        <Badge variant="secondary">Coming Soon</Badge>
      </CardContent>
    </Card>
  );
}