import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Home, CalendarDays, QrCode, User, MoreHorizontal } from 'lucide-react';
import { cn } from '@/lib/utils';
import { usePortalThemeContext } from './PortalThemeProvider';

interface NavItem {
  label: string;
  icon: React.ElementType;
  path: string;
  featureKey?: string;
}

const defaultNavItems: NavItem[] = [
  { label: 'Home', icon: Home, path: '/portal/dashboard' },
  { label: 'Classes', icon: CalendarDays, path: '/portal/classes', featureKey: 'classes' },
  { label: 'Check In', icon: QrCode, path: '/portal/check-in', featureKey: 'check_in' },
  { label: 'Profile', icon: User, path: '/portal/profile' },
  { label: 'More', icon: MoreHorizontal, path: '/portal/more' },
];

export function PortalBottomNav() {
  const navigate = useNavigate();
  const location = useLocation();
  const { isFeatureEnabled } = usePortalThemeContext();

  const visibleItems = defaultNavItems.filter(
    item => !item.featureKey || isFeatureEnabled(item.featureKey)
  );

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 md:hidden border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60"
      role="navigation"
      aria-label="Main navigation"
    >
      <div className="flex items-center justify-around h-16 px-2">
        {visibleItems.map((item) => {
          const isActive = location.pathname === item.path ||
            location.pathname.startsWith(item.path + '/');
          const Icon = item.icon;

          return (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className={cn(
                "flex flex-col items-center justify-center gap-1 w-full h-full text-xs transition-colors",
                isActive
                  ? "text-primary font-medium"
                  : "text-muted-foreground hover:text-foreground"
              )}
              aria-current={isActive ? 'page' : undefined}
            >
              <Icon className="h-5 w-5" />
              <span>{item.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
