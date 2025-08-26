import React from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { 
  LayoutDashboard, 
  Users, 
  Calendar, 
  CreditCard, 
  Settings, 
  LogOut,
  Dumbbell,
  UserCheck,
  BarChart3,
  Store,
  Phone
} from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';

interface DashboardLayoutProps {
  children: React.ReactNode;
}

const navigation = [
  { name: 'Dashboard', href: '/', icon: LayoutDashboard },
  { name: 'Members', href: '/members', icon: Users },
  { name: 'CRM', href: '/crm', icon: Phone },
  { name: 'Classes', href: '/classes', icon: Calendar },
  { name: 'Check-ins', href: '/checkins', icon: UserCheck },
  { name: 'Billing', href: '/billing', icon: CreditCard },
  { name: 'Reports', href: '/reports', icon: BarChart3 },
  { name: 'Retail', href: '/retail', icon: Store },
  { name: 'Settings', href: '/settings', icon: Settings },
];

export const DashboardLayout: React.FC<DashboardLayoutProps> = ({ children }) => {
  const { profile, organization, signOut } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    navigate('/auth');
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Sidebar */}
      <div className="hidden lg:flex lg:w-64 lg:flex-col lg:fixed lg:inset-y-0">
        <div className="flex flex-col flex-grow bg-card border-r border-border shadow-elevation-1">
          {/* Logo */}
          <div className="flex items-center flex-shrink-0 px-6 py-6">
            <div className="flex items-center">
              <div className="flex items-center justify-center w-10 h-10 bg-gradient-primary rounded-lg mr-3">
                <Dumbbell className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-foreground">
                  {organization?.name || 'Gym Unity Suite'}
                </h1>
                <p className="text-xs text-muted-foreground capitalize">
                  {profile?.role} Portal
                </p>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-4 space-y-1">
            {navigation.map((item) => {
              const isActive = location.pathname === item.href;
              return (
                <Button
                  key={item.name}
                  variant={isActive ? 'secondary' : 'ghost'}
                  className={cn(
                    'w-full justify-start transition-smooth',
                    isActive && 'bg-gradient-primary text-white shadow-glow'
                  )}
                  onClick={() => navigate(item.href)}
                >
                  <item.icon className="mr-3 h-5 w-5" />
                  {item.name}
                </Button>
              );
            })}
          </nav>

          {/* User info and sign out */}
          <div className="flex-shrink-0 p-4 border-t border-border">
            <div className="flex items-center mb-3">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-gradient-secondary rounded-full flex items-center justify-center">
                  <span className="text-sm font-medium text-white">
                    {profile?.first_name?.[0] || profile?.email?.[0]?.toUpperCase() || 'U'}
                  </span>
                </div>
              </div>
              <div className="ml-3 flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground truncate">
                  {profile?.first_name || profile?.email}
                </p>
                <p className="text-xs text-muted-foreground truncate">
                  {profile?.email}
                </p>
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              className="w-full justify-start"
              onClick={handleSignOut}
            >
              <LogOut className="mr-2 h-4 w-4" />
              Sign Out
            </Button>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="lg:pl-64">
        <div className="flex flex-col">
          {/* Mobile header */}
          <div className="lg:hidden bg-card border-b border-border px-4 py-3 shadow-elevation-1">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="flex items-center justify-center w-8 h-8 bg-gradient-primary rounded-lg mr-3">
                  <Dumbbell className="w-5 h-5 text-white" />
                </div>
                <h1 className="text-lg font-bold text-foreground">
                  {organization?.name || 'Gym Unity Suite'}
                </h1>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={handleSignOut}
              >
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Page content */}
          <main className="flex-1">
            <div className="p-6">
              {children}
            </div>
          </main>
        </div>
      </div>
    </div>
  );
};