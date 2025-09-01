import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { 
  Home, 
  Calendar, 
  User, 
  Bell, 
  CreditCard,
  Menu,
  Settings,
  LogOut,
  Activity,
  Users,
  Dumbbell,
  MessageSquare,
  Search,
  Plus,
  ChevronRight
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface NavigationItem {
  label: string;
  href: string;
  icon: any;
  badge?: string | number;
  description?: string;
  isExternal?: boolean;
}

interface QuickAction {
  label: string;
  icon: any;
  action: () => void;
  color: string;
}

export default function EnhancedMobileNavigation() {
  const { profile, signOut } = useAuth();
  const location = useLocation();
  const [isOpen, setIsOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(3);
  const [quickSearchOpen, setQuickSearchOpen] = useState(false);

  const memberNavItems: NavigationItem[] = [
    {
      label: 'Dashboard',
      href: '/member/dashboard',
      icon: Home,
      description: 'Your fitness overview'
    },
    {
      label: 'Classes',
      href: '/member/classes',
      icon: Calendar,
      description: 'Book and manage classes'
    },
    {
      label: 'Profile',
      href: '/member/profile',
      icon: User,
      description: 'Account settings'
    },
    {
      label: 'Notifications',
      href: '/member/notifications',
      icon: Bell,
      badge: unreadCount > 0 ? unreadCount : undefined,
      description: 'Updates and alerts'
    },
    {
      label: 'Billing',
      href: '/billing',
      icon: CreditCard,
      description: 'Payments and plans'
    },
    {
      label: 'Workout History',
      href: '/member/workout-history',
      icon: Activity,
      description: 'Track your progress'
    }
  ];

  const staffNavItems: NavigationItem[] = [
    {
      label: 'Dashboard',
      href: '/dashboard',
      icon: Home,
      description: 'Staff overview'
    },
    {
      label: 'Members',
      href: '/members',
      icon: Users,
      description: 'Member management'
    },
    {
      label: 'Classes',
      href: '/classes',
      icon: Calendar,
      description: 'Class scheduling'
    },
    {
      label: 'Equipment',
      href: '/equipment',
      icon: Dumbbell,
      description: 'Equipment tracking'
    },
    {
      label: 'Communication',
      href: '/communication',
      icon: MessageSquare,
      description: 'Member communication'
    }
  ];

  const quickActions: QuickAction[] = [
    {
      label: 'Quick Check-in',
      icon: Activity,
      action: () => handleQuickCheckIn(),
      color: 'bg-green-500'
    },
    {
      label: 'Book Class',
      icon: Plus,
      action: () => handleQuickBooking(),
      color: 'bg-blue-500'
    },
    {
      label: 'Find Member',
      icon: Search,
      action: () => setQuickSearchOpen(true),
      color: 'bg-purple-500'
    },
    {
      label: 'Emergency',
      icon: Bell,
      action: () => handleEmergency(),
      color: 'bg-red-500'
    }
  ];

  const handleQuickCheckIn = () => {
    // Navigate to check-in page or open scanner
    window.location.href = '/mobile/check-in';
  };

  const handleQuickBooking = () => {
    // Navigate to quick booking
    window.location.href = '/member/classes';
  };

  const handleEmergency = () => {
    // Emergency contact or alert
    alert('Emergency protocols would be triggered here');
  };

  const navItems = profile?.role === 'member' ? memberNavItems : staffNavItems;
  const showQuickActions = profile?.role !== 'member';

  const isActiveRoute = (href: string) => {
    return location.pathname === href || location.pathname.startsWith(href + '/');
  };

  // Simulate real-time updates
  useEffect(() => {
    const interval = setInterval(() => {
      // Simulate notification count updates
      setUnreadCount(Math.max(0, Math.floor(Math.random() * 5)));
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  return (
    <>
      {/* Mobile Bottom Navigation */}
      <div className="fixed bottom-0 left-0 right-0 bg-background border-t border-border z-50 md:hidden">
        <div className="grid grid-cols-5 h-16">
          {navItems.slice(0, 4).map((item) => {
            const Icon = item.icon;
            const isActive = isActiveRoute(item.href);
            
            return (
              <Link
                key={item.href}
                to={item.href}
                className={cn(
                  "flex flex-col items-center justify-center gap-1 text-xs relative",
                  isActive 
                    ? "text-primary bg-primary/10" 
                    : "text-muted-foreground hover:text-primary"
                )}
              >
                <Icon className="w-5 h-5" />
                <span className="text-[10px] leading-none">{item.label}</span>
                {item.badge && (
                  <Badge className="absolute -top-1 -right-1 h-5 w-5 p-0 text-[10px] flex items-center justify-center">
                    {item.badge}
                  </Badge>
                )}
              </Link>
            );
          })}
          
          {/* Menu Button */}
          <Sheet open={isOpen} onOpenChange={setIsOpen}>
            <SheetTrigger asChild>
              <button className="flex flex-col items-center justify-center gap-1 text-xs text-muted-foreground hover:text-primary">
                <Menu className="w-5 h-5" />
                <span className="text-[10px] leading-none">More</span>
              </button>
            </SheetTrigger>
            <SheetContent side="right" className="w-80 p-0">
              <SheetHeader className="p-6 pb-4 border-b">
                <SheetTitle className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <User className="w-5 h-5 text-primary" />
                  </div>
                  <div className="text-left">
                    <p className="font-semibold">{profile?.first_name} {profile?.last_name}</p>
                    <p className="text-sm text-muted-foreground capitalize">{profile?.role}</p>
                  </div>
                </SheetTitle>
              </SheetHeader>

              <div className="flex-1 overflow-y-auto">
                {/* Quick Actions (for staff) */}
                {showQuickActions && (
                  <div className="p-6 border-b">
                    <h3 className="font-semibold mb-4">Quick Actions</h3>
                    <div className="grid grid-cols-2 gap-3">
                      {quickActions.map((action) => {
                        const Icon = action.icon;
                        return (
                          <Button
                            key={action.label}
                            variant="outline"
                            className="h-auto p-3 flex flex-col gap-2"
                            onClick={() => {
                              action.action();
                              setIsOpen(false);
                            }}
                          >
                            <div className={cn("w-8 h-8 rounded-full flex items-center justify-center", action.color)}>
                              <Icon className="w-4 h-4 text-white" />
                            </div>
                            <span className="text-xs">{action.label}</span>
                          </Button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* All Navigation Items */}
                <div className="p-6 space-y-2">
                  <h3 className="font-semibold mb-4">Navigation</h3>
                  {navItems.map((item) => {
                    const Icon = item.icon;
                    const isActive = isActiveRoute(item.href);
                    
                    return (
                      <Link
                        key={item.href}
                        to={item.href}
                        onClick={() => setIsOpen(false)}
                        className={cn(
                          "flex items-center gap-3 p-3 rounded-lg transition-colors relative",
                          isActive
                            ? "bg-primary/10 text-primary"
                            : "hover:bg-accent text-muted-foreground hover:text-foreground"
                        )}
                      >
                        <Icon className="w-5 h-5" />
                        <div className="flex-1">
                          <p className="font-medium">{item.label}</p>
                          {item.description && (
                            <p className="text-xs text-muted-foreground">{item.description}</p>
                          )}
                        </div>
                        {item.badge && (
                          <Badge variant="secondary" className="text-xs">
                            {item.badge}
                          </Badge>
                        )}
                        <ChevronRight className="w-4 h-4" />
                      </Link>
                    );
                  })}
                </div>

                {/* Settings & Logout */}
                <div className="p-6 border-t space-y-2">
                  <Link
                    to="/settings"
                    onClick={() => setIsOpen(false)}
                    className="flex items-center gap-3 p-3 rounded-lg hover:bg-accent text-muted-foreground hover:text-foreground"
                  >
                    <Settings className="w-5 h-5" />
                    <span>Settings</span>
                    <ChevronRight className="w-4 h-4 ml-auto" />
                  </Link>
                  
                  <button
                    onClick={() => {
                      signOut();
                      setIsOpen(false);
                    }}
                    className="flex items-center gap-3 p-3 rounded-lg hover:bg-accent text-muted-foreground hover:text-foreground w-full text-left"
                  >
                    <LogOut className="w-5 h-5" />
                    <span>Sign Out</span>
                  </button>
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>

      {/* Add padding to content to account for fixed bottom nav */}
      <div className="h-16 md:hidden" />
    </>
  );
}