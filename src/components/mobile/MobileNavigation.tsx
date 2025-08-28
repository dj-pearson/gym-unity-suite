import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  Menu,
  Home,
  Calendar,
  Users,
  Bell,
  User,
  LogOut,
  Settings,
  CreditCard,
  Activity,
  QrCode,
  Smartphone
} from 'lucide-react';

interface NavItem {
  label: string;
  icon: typeof Home;
  href: string;
  badge?: string;
}

export default function MobileNavigation() {
  const { profile, signOut } = useAuth();
  const location = useLocation();
  const [isOpen, setIsOpen] = useState(false);

  const memberNavItems: NavItem[] = [
    { label: 'Dashboard', icon: Home, href: '/member' },
    { label: 'Classes', icon: Calendar, href: '/member/classes' },
    { label: 'Profile', icon: User, href: '/member/profile' },
    { label: 'Notifications', icon: Bell, href: '/member/notifications' },
    { label: 'Check-In', icon: QrCode, href: '/member/checkin' }
  ];

  const staffNavItems: NavItem[] = [
    { label: 'Dashboard', icon: Home, href: '/' },
    { label: 'Members', icon: Users, href: '/members' },
    { label: 'Classes', icon: Calendar, href: '/classes' },
    { label: 'Analytics', icon: Activity, href: '/analytics' },
    { label: 'Settings', icon: Settings, href: '/settings' }
  ];

  const isStaff = ['owner', 'manager', 'staff'].includes(profile?.role || '');
  const navItems = isStaff ? staffNavItems : memberNavItems;

  const isActive = (href: string) => {
    if (href === '/member' && location.pathname === '/member') return true;
    if (href === '/' && location.pathname === '/') return true;
    return location.pathname.startsWith(href) && href !== '/member' && href !== '/';
  };

  const handleSignOut = async () => {
    try {
      await signOut();
      setIsOpen(false);
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  return (
    <>
      {/* Mobile Bottom Navigation */}
      <div className="fixed bottom-0 left-0 right-0 z-40 bg-background border-t md:hidden">
        <div className="flex items-center justify-around py-2">
          {navItems.slice(0, 4).map((item) => {
            const Icon = item.icon;
            const active = isActive(item.href);
            
            return (
              <Link
                key={item.href}
                to={item.href}
                className={`flex flex-col items-center p-2 rounded-lg transition-colors ${
                  active 
                    ? 'text-primary bg-primary/10' 
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                }`}
              >
                <Icon className="w-5 h-5" />
                <span className="text-xs mt-1">{item.label}</span>
                {item.badge && (
                  <Badge variant="destructive" className="absolute -top-1 -right-1 h-5 w-5 p-0 text-xs">
                    {item.badge}
                  </Badge>
                )}
              </Link>
            );
          })}
          
          {/* Menu Button */}
          <Sheet open={isOpen} onOpenChange={setIsOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="sm" className="flex flex-col p-2">
                <Menu className="w-5 h-5" />
                <span className="text-xs mt-1">Menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-80">
              <SheetHeader>
                <SheetTitle className="flex items-center gap-2">
                  <Smartphone className="w-5 h-5" />
                  RepClub Mobile
                </SheetTitle>
              </SheetHeader>

              <div className="mt-6 space-y-4">
                {/* User Info */}
                <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                  <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                    <User className="w-5 h-5 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">
                      {profile?.first_name} {profile?.last_name}
                    </p>
                    <p className="text-sm text-muted-foreground capitalize">
                      {profile?.role}
                    </p>
                  </div>
                </div>

                <Separator />

                {/* All Navigation Items */}
                <div className="space-y-1">
                  {navItems.map((item) => {
                    const Icon = item.icon;
                    const active = isActive(item.href);
                    
                    return (
                      <Link
                        key={item.href}
                        to={item.href}
                        onClick={() => setIsOpen(false)}
                        className={`flex items-center gap-3 p-3 rounded-lg transition-colors ${
                          active 
                            ? 'bg-primary text-primary-foreground' 
                            : 'hover:bg-muted'
                        }`}
                      >
                        <Icon className="w-5 h-5" />
                        <span className="font-medium">{item.label}</span>
                        {item.badge && (
                          <Badge variant="destructive" className="ml-auto">
                            {item.badge}
                          </Badge>
                        )}
                      </Link>
                    );
                  })}
                </div>

                <Separator />

                {/* Additional Options */}
                <div className="space-y-1">
                  {!isStaff && (
                    <Link
                      to="/member/subscription"
                      onClick={() => setIsOpen(false)}
                      className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted transition-colors"
                    >
                      <CreditCard className="w-5 h-5" />
                      <span className="font-medium">Subscription</span>
                    </Link>
                  )}
                  
                  <Button
                    variant="ghost"
                    className="w-full justify-start gap-3 p-3 h-auto font-medium"
                    onClick={handleSignOut}
                  >
                    <LogOut className="w-5 h-5" />
                    Sign Out
                  </Button>
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>

      {/* Spacer for bottom navigation */}
      <div className="h-16 md:hidden" />
    </>
  );
}