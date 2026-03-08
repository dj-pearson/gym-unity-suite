import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Home, CalendarDays, QrCode, User, Bell, CreditCard,
  Trophy, Gift, Dumbbell, Activity, Settings
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { usePortalThemeContext } from './PortalThemeProvider';

interface SidebarNavItem {
  label: string;
  icon: React.ElementType;
  path: string;
  featureKey?: string;
}

const navSections: { title: string; items: SidebarNavItem[] }[] = [
  {
    title: 'Main',
    items: [
      { label: 'Dashboard', icon: Home, path: '/portal/dashboard' },
      { label: 'Classes', icon: CalendarDays, path: '/portal/classes', featureKey: 'classes' },
      { label: 'Check In', icon: QrCode, path: '/portal/check-in', featureKey: 'check_in' },
    ],
  },
  {
    title: 'My Account',
    items: [
      { label: 'Profile', icon: User, path: '/portal/profile' },
      { label: 'Notifications', icon: Bell, path: '/portal/notifications' },
      { label: 'Billing', icon: CreditCard, path: '/portal/billing', featureKey: 'billing_self_service' },
    ],
  },
  {
    title: 'Engagement',
    items: [
      { label: 'Loyalty Points', icon: Trophy, path: '/portal/loyalty', featureKey: 'loyalty' },
      { label: 'Referrals', icon: Gift, path: '/portal/referrals', featureKey: 'referrals' },
      { label: 'Workout History', icon: Activity, path: '/portal/history', featureKey: 'workout_history' },
      { label: 'Fitness', icon: Dumbbell, path: '/portal/fitness', featureKey: 'fitness_tracking' },
    ],
  },
];

interface PortalSidebarProps {
  organizationName: string;
  logoUrl?: string | null;
  isOpen?: boolean;
  onClose?: () => void;
}

export function PortalSidebar({ organizationName, logoUrl, isOpen, onClose }: PortalSidebarProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const { isFeatureEnabled } = usePortalThemeContext();

  const handleNavClick = (path: string) => {
    navigate(path);
    onClose?.();
  };

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 md:hidden"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      <aside
        className={cn(
          "fixed top-0 left-0 z-50 h-full w-64 border-r bg-background transition-transform duration-200 md:sticky md:top-16 md:h-[calc(100vh-4rem)] md:translate-x-0",
          isOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        {/* Mobile header in sidebar */}
        <div className="flex items-center gap-3 h-16 px-4 border-b md:hidden">
          {logoUrl ? (
            <img src={logoUrl} alt={organizationName} className="h-8 w-auto" />
          ) : (
            <span className="font-bold text-lg">{organizationName}</span>
          )}
        </div>

        <nav className="flex flex-col gap-1 p-4 overflow-y-auto" role="navigation">
          {navSections.map((section) => {
            const visibleItems = section.items.filter(
              item => !item.featureKey || isFeatureEnabled(item.featureKey)
            );
            if (visibleItems.length === 0) return null;

            return (
              <div key={section.title} className="mb-4">
                <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 px-3">
                  {section.title}
                </h3>
                {visibleItems.map((item) => {
                  const isActive = location.pathname === item.path ||
                    location.pathname.startsWith(item.path + '/');
                  const Icon = item.icon;

                  return (
                    <button
                      key={item.path}
                      onClick={() => handleNavClick(item.path)}
                      className={cn(
                        "flex items-center gap-3 w-full rounded-lg px-3 py-2 text-sm transition-colors",
                        isActive
                          ? "bg-primary/10 text-primary font-medium"
                          : "text-muted-foreground hover:bg-muted hover:text-foreground"
                      )}
                      aria-current={isActive ? 'page' : undefined}
                    >
                      <Icon className="h-4 w-4 flex-shrink-0" />
                      <span>{item.label}</span>
                    </button>
                  );
                })}
              </div>
            );
          })}
        </nav>
      </aside>
    </>
  );
}
