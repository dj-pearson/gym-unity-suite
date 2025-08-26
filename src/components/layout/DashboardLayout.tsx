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
  Dumbbell,
  LogOut,
  Menu
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

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
                <div className="flex items-center justify-center w-8 h-8 bg-gradient-primary rounded-lg flex-shrink-0 lg:hidden">
                  <Dumbbell className="w-5 h-5 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <h1 className="text-lg font-bold text-foreground truncate">
                    {organization?.name || 'Rep Club'}
                  </h1>
                </div>
              </div>

              {/* Mobile sign out button */}
              <div className="lg:hidden">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={handleSignOut}
                  className="w-9 h-9"
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
    </SidebarProvider>
  );
};