import React from 'react';
import { SidebarProvider } from '@/components/ui/sidebar';
import { MemberSidebar } from './MemberSidebar';
import { Button } from '@/components/ui/button';
import { Bell, User, LogOut } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { Badge } from '@/components/ui/badge';
import { useUnreadCount } from '@/hooks/useNotifications';

interface MemberLayoutProps {
  children: React.ReactNode;
}

export function MemberLayout({ children }: MemberLayoutProps) {
  const { profile, signOut } = useAuth();
  const navigate = useNavigate();

  // Fetch real unread notification count from the database
  const unreadCount = useUnreadCount(profile?.organization_id, profile?.id);

  const handleSignOut = async () => {
    await signOut();
    navigate('/auth');
  };

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background">
        <MemberSidebar />
        
        <div className="flex-1 flex flex-col">
          {/* Header */}
          <header className="sticky top-0 z-40 w-full border-b bg-background/80 backdrop-blur">
            <div className="flex h-16 items-center justify-between px-6">
              <div className="flex items-center gap-4">
                <h2 className="text-lg font-semibold text-foreground">
                  Welcome back, {profile?.first_name || 'Member'}!
                </h2>
              </div>
              
              <div className="flex items-center gap-3">
                {/* Notifications Bell */}
                <Button variant="ghost" size="sm" asChild className="relative">
                  <Link to="/member/notifications">
                    <Bell className="h-4 w-4" />
                    {unreadCount > 0 && (
                      <Badge className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center text-xs bg-gradient-primary text-white p-0 min-w-[20px]">
                        {unreadCount > 99 ? '99+' : unreadCount}
                      </Badge>
                    )}
                  </Link>
                </Button>
                
                {/* Profile Button */}
                <Button variant="ghost" size="sm" asChild>
                  <Link to="/member/profile">
                    <User className="h-4 w-4" />
                  </Link>
                </Button>
                
                {/* Sign Out */}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleSignOut}
                  className="text-muted-foreground hover:text-destructive"
                >
                  <LogOut className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </header>

          {/* Main Content */}
          <main className="flex-1">
            {children}
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}