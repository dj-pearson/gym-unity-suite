import React from 'react';
import { usePortalThemeContext } from './PortalThemeProvider';

interface PortalFooterProps {
  organizationName: string;
}

export function PortalFooter({ organizationName }: PortalFooterProps) {
  const { resolvedTheme } = usePortalThemeContext();
  const showPoweredBy = resolvedTheme.show_powered_by;
  const currentYear = new Date().getFullYear();

  return (
    <footer className="hidden md:block border-t bg-background py-4 px-6">
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span>&copy; {currentYear} {organizationName}. All rights reserved.</span>
        {showPoweredBy && (
          <span className="flex items-center gap-1">
            {resolvedTheme.powered_by_style === 'badge' ? (
              <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-muted text-[10px]">
                Powered by Rep Club
              </span>
            ) : (
              <span>Powered by Rep Club</span>
            )}
          </span>
        )}
      </div>
    </footer>
  );
}
