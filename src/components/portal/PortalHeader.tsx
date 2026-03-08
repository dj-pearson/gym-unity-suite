import React from 'react';
import { Button } from '@/components/ui/button';
import { Bell, User, Menu, LogOut } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { usePortalThemeContext } from './PortalThemeProvider';

interface PortalHeaderProps {
  organizationName: string;
  logoUrl?: string | null;
  memberName?: string;
  unreadNotifications?: number;
  onMenuToggle?: () => void;
  onProfileClick?: () => void;
  onNotificationsClick?: () => void;
  onSignOut?: () => void;
}

export function PortalHeader({
  organizationName,
  logoUrl,
  memberName,
  unreadNotifications = 0,
  onMenuToggle,
  onProfileClick,
  onNotificationsClick,
  onSignOut,
}: PortalHeaderProps) {
  const { resolvedTheme } = usePortalThemeContext();

  return (
    <header className="sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="flex h-16 items-center justify-between px-4 md:px-6">
        <div className="flex items-center gap-3">
          {/* Mobile menu toggle */}
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
            onClick={onMenuToggle}
            aria-label="Toggle menu"
          >
            <Menu className="h-5 w-5" />
          </Button>

          {/* Logo / Gym Name */}
          <div className="flex items-center gap-3">
            {logoUrl ? (
              <img
                src={logoUrl}
                alt={organizationName}
                className="h-8 w-auto max-w-[140px] object-contain"
              />
            ) : (
              <span
                className="text-lg font-bold tracking-tight"
                style={{ fontFamily: `var(--portal-font-heading, 'Inter')` }}
              >
                {organizationName}
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Welcome message (desktop) */}
          {memberName && (
            <span className="hidden lg:block text-sm text-muted-foreground mr-2">
              Welcome, {memberName}
            </span>
          )}

          {/* Notifications */}
          {onNotificationsClick && (
            <Button
              variant="ghost"
              size="icon"
              className="relative"
              onClick={onNotificationsClick}
              aria-label={`Notifications${unreadNotifications > 0 ? `, ${unreadNotifications} unread` : ''}`}
            >
              <Bell className="h-4 w-4" />
              {unreadNotifications > 0 && (
                <Badge className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center text-xs p-0 min-w-[20px]">
                  {unreadNotifications > 99 ? '99+' : unreadNotifications}
                </Badge>
              )}
            </Button>
          )}

          {/* Profile */}
          {onProfileClick && (
            <Button
              variant="ghost"
              size="icon"
              onClick={onProfileClick}
              aria-label="Profile"
            >
              <User className="h-4 w-4" />
            </Button>
          )}

          {/* Sign out */}
          {onSignOut && (
            <Button
              variant="ghost"
              size="icon"
              onClick={onSignOut}
              className="text-muted-foreground hover:text-destructive"
              aria-label="Sign out"
            >
              <LogOut className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>
    </header>
  );
}
