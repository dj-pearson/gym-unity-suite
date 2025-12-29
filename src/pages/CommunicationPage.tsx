import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { SimpleMessagingCenter } from '@/components/communication/SimpleMessagingCenter';
import { AnnouncementManager } from '@/components/communication/AnnouncementManager';
import { EmailTemplates } from '@/components/communication/EmailTemplates';
import { SupportTickets } from '@/components/communication/SupportTickets';
import { MilestoneTracking } from '@/components/communication/MilestoneTracking';
import { ErrorBoundary } from '@/components/ui/error-boundary';
import { MessageSquare, Megaphone, Mail, Headphones, Trophy } from 'lucide-react';

export default function CommunicationPage() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground">Communication Hub</h1>
        <p className="text-muted-foreground">
          Manage member communications, announcements, and support
        </p>
      </div>

      {/* Communication Tabs */}
      <Tabs defaultValue="messaging" className="space-y-6">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="messaging" className="flex items-center gap-2">
            <MessageSquare className="w-4 h-4" />
            <span className="hidden sm:inline">Messaging</span>
          </TabsTrigger>
          <TabsTrigger value="announcements" className="flex items-center gap-2">
            <Megaphone className="w-4 h-4" />
            <span className="hidden sm:inline">Announcements</span>
          </TabsTrigger>
          <TabsTrigger value="templates" className="flex items-center gap-2">
            <Mail className="w-4 h-4" />
            <span className="hidden sm:inline">Templates</span>
          </TabsTrigger>
          <TabsTrigger value="support" className="flex items-center gap-2">
            <Headphones className="w-4 h-4" />
            <span className="hidden sm:inline">Support</span>
          </TabsTrigger>
          <TabsTrigger value="milestones" className="flex items-center gap-2">
            <Trophy className="w-4 h-4" />
            <span className="hidden sm:inline">Milestones</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="messaging" className="space-y-6">
          <ErrorBoundary componentName="Messaging Center">
            <SimpleMessagingCenter />
          </ErrorBoundary>
        </TabsContent>

        <TabsContent value="announcements" className="space-y-6">
          <ErrorBoundary componentName="Announcements">
            <AnnouncementManager />
          </ErrorBoundary>
        </TabsContent>

        <TabsContent value="templates" className="space-y-6">
          <ErrorBoundary componentName="Email Templates">
            <EmailTemplates />
          </ErrorBoundary>
        </TabsContent>

        <TabsContent value="support" className="space-y-6">
          <ErrorBoundary componentName="Support Tickets">
            <SupportTickets />
          </ErrorBoundary>
        </TabsContent>

        <TabsContent value="milestones" className="space-y-6">
          <ErrorBoundary componentName="Milestones">
            <MilestoneTracking />
          </ErrorBoundary>
        </TabsContent>
      </Tabs>
    </div>
  );
}