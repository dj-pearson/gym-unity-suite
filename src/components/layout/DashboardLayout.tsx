import React from 'react';
import { useIsMobile } from '@/hooks/use-mobile';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import {
  SidebarProvider,
  SidebarInset,
  SidebarTrigger
} from '@/components/ui/sidebar';
import { AppSidebar } from './AppSidebar';
import {
  LogOut,
  Menu,
  Search,
  Bell
} from 'lucide-react';
import { Logo } from '@/components/ui/logo';
import { useNavigate } from 'react-router-dom';
import { CommandPalette, useCommandPalette } from '@/components/CommandPalette';
import { NotificationCenter, NotificationBadge } from '@/components/NotificationCenter';
import { Popover, PopoverTrigger } from '@/components/ui/popover';
import { PWAInstallPrompt } from '@/components/PWAInstallPrompt';

interface DashboardLayoutProps {
  children: React.ReactNode;
}

/**
 * IMPORTANT: This platform is MOBILE-FIRST
 * 
 * All new pages must include:
 * 1. Proper mobile-optimized headers
 * 2. Sidebar integration (if backend/authenticated)
 * 3. Complete mobile responsiveness using best practices
 * 4. Touch-friendly interactions and proper spacing
 * 
 * Functional Page Organization:
 * - Sales & Marketing: CRM, Lead Management, Pipeline, Marketing Automation
 * - Operations: Member Management, Class Scheduling, Check-ins, Equipment
 * - Business: Billing, Reports, Analytics, Retail/POS
 * - Configuration: Settings, User Management, Integrations
 */

export const DashboardLayout: React.FC<DashboardLayoutProps> = ({ children }) => {
  const { profile, organization, signOut } = useAuth();
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const { open, setOpen } = useCommandPalette();
  const [notificationsOpen, setNotificationsOpen] = React.useState(false);

  const handleSignOut = async () => {
    await signOut();
    navigate('/auth');
  };

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background">
        <AppSidebar />
        
        <SidebarInset className="flex-1 flex flex-col">
          {/* Mobile-first header with sidebar trigger */}
          <header className="sticky top-0 z-40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b border-border">
            <div className="flex h-14 items-center gap-4 px-4 lg:px-6">
              <SidebarTrigger className="-ml-1 text-sidebar-foreground" />
              
              {/* Mobile header content */}
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <div className="flex-shrink-0 lg:hidden">
                  <Logo size="sm" showText={false} linkToHome={true} />
                </div>
                <div className="flex-1 min-w-0">
                  <h1 className="text-lg font-bold text-foreground truncate">
                    {organization?.name || 'Rep Club'}
                  </h1>
                </div>
              </div>

              {/* Command palette trigger & Notifications */}
              <div className="flex items-center gap-2">
                {/* Notifications */}
                <Popover open={notificationsOpen} onOpenChange={setNotificationsOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      size="icon"
                      className="relative h-9 w-9"
                    >
                      <Bell className="h-4 w-4" />
                      <NotificationBadge
                        organizationId={profile?.organization_id}
                        userId={profile?.id}
                      />
                    </Button>
                  </PopoverTrigger>
                  <NotificationCenter
                    open={notificationsOpen}
                    onOpenChange={setNotificationsOpen}
                  />
                </Popover>

                {/* Command Palette */}
                <Button
                  variant="outline"
                  onClick={() => setOpen(true)}
                  className="relative h-9 w-9 p-0 lg:w-auto lg:px-3 lg:justify-start"
                >
                  <Search className="h-4 w-4 lg:mr-2" />
                  <span className="hidden lg:inline-flex">Search</span>
                  <kbd className="pointer-events-none ml-auto hidden h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium opacity-100 lg:inline-flex">
                    <span className="text-xs">⌘</span>K
                  </kbd>
                </Button>

                {/* Mobile sign out button */}
                <Button
                  variant="outline"
                  size="icon"
                  onClick={handleSignOut}
                  className="w-9 h-9 lg:hidden"
                >
                  <LogOut className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </header>

          {/* Main content area - mobile optimized */}
          <main className="flex-1 overflow-auto">
            <div className="container max-w-none p-4 md:p-6 lg:p-8">
              {children}
            </div>
          </main>
        </SidebarInset>
      </div>

      {/* Command Palette - Global search and navigation */}
      <CommandPalette open={open} onOpenChange={setOpen} />

      {/* PWA Install Prompt - Shows when app can be installed */}
      <PWAInstallPrompt />
    </SidebarProvider>
  );
};