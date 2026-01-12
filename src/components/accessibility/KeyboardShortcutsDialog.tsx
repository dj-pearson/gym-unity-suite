import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Keyboard } from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * KeyboardShortcutsDialog Component
 *
 * Displays all available keyboard shortcuts in an accessible dialog.
 * WCAG 2.1 Level A - Success Criterion 2.1.1 (Keyboard)
 */

interface ShortcutCategory {
  name: string;
  shortcuts: Shortcut[];
}

interface Shortcut {
  action: string;
  keys: string[];
  description?: string;
}

const shortcutCategories: ShortcutCategory[] = [
  {
    name: 'Global',
    shortcuts: [
      { action: 'Open Command Palette', keys: ['⌘', 'K'], description: 'Search and navigate anywhere' },
      { action: 'Toggle Sidebar', keys: ['B'], description: 'Show or hide the navigation sidebar' },
      { action: 'Close Dialog/Modal', keys: ['Esc'], description: 'Close any open dialog or modal' },
      { action: 'Skip to Main Content', keys: ['Tab'], description: 'First Tab press focuses skip link' },
    ],
  },
  {
    name: 'Navigation',
    shortcuts: [
      { action: 'Navigate List Items', keys: ['↑', '↓'], description: 'Move through list items' },
      { action: 'First/Last Item', keys: ['Home', 'End'], description: 'Jump to first or last item' },
      { action: 'Select Item', keys: ['Enter'], description: 'Select or activate focused item' },
      { action: 'Go Back', keys: ['Alt', '←'], description: 'Navigate to previous page' },
    ],
  },
  {
    name: 'Forms',
    shortcuts: [
      { action: 'Submit Form', keys: ['Enter'], description: 'Submit the current form' },
      { action: 'Cancel/Close', keys: ['Esc'], description: 'Cancel and close form dialog' },
      { action: 'Next Field', keys: ['Tab'], description: 'Move to next form field' },
      { action: 'Previous Field', keys: ['Shift', 'Tab'], description: 'Move to previous form field' },
    ],
  },
  {
    name: 'Tables',
    shortcuts: [
      { action: 'Navigate Cells', keys: ['↑', '↓', '←', '→'], description: 'Move through table cells' },
      { action: 'Select Row', keys: ['Space'], description: 'Select/deselect current row' },
      { action: 'Select All', keys: ['⌘', 'A'], description: 'Select all rows' },
      { action: 'Sort Column', keys: ['Enter'], description: 'Sort by focused column' },
    ],
  },
  {
    name: 'Calendar & Scheduling',
    shortcuts: [
      { action: 'Previous/Next Day', keys: ['←', '→'], description: 'Navigate days' },
      { action: 'Previous/Next Week', keys: ['↑', '↓'], description: 'Navigate weeks' },
      { action: 'Go to Today', keys: ['T'], description: 'Jump to current date' },
      { action: 'Open Event', keys: ['Enter'], description: 'Open selected event details' },
    ],
  },
];

interface KeyboardShortcutsDialogProps {
  /** Whether dialog is open */
  open?: boolean;
  /** Callback when open state changes */
  onOpenChange?: (open: boolean) => void;
  /** Custom trigger element */
  trigger?: React.ReactNode;
  /** Additional CSS classes */
  className?: string;
}

export const KeyboardShortcutsDialog: React.FC<KeyboardShortcutsDialogProps> = ({
  open,
  onOpenChange,
  trigger,
  className,
}) => {
  const isMac = typeof navigator !== 'undefined' && /Mac|iPod|iPhone|iPad/.test(navigator.platform);

  // Convert ⌘ to Ctrl for non-Mac
  const formatKey = (key: string) => {
    if (key === '⌘' && !isMac) return 'Ctrl';
    return key;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {trigger ? (
        <DialogTrigger asChild>{trigger}</DialogTrigger>
      ) : (
        <DialogTrigger asChild>
          <Button variant="ghost" size="sm" className={cn('gap-2', className)}>
            <Keyboard className="h-4 w-4" aria-hidden="true" />
            <span>Keyboard Shortcuts</span>
          </Button>
        </DialogTrigger>
      )}
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Keyboard className="h-5 w-5" aria-hidden="true" />
            Keyboard Shortcuts
          </DialogTitle>
          <DialogDescription>
            Use these keyboard shortcuts to navigate and interact with Rep Club more efficiently.
            {isMac ? ' Showing Mac shortcuts.' : ' Showing Windows/Linux shortcuts.'}
          </DialogDescription>
        </DialogHeader>

        <div className="mt-4 space-y-6">
          {shortcutCategories.map((category) => (
            <section key={category.name} aria-labelledby={`category-${category.name}`}>
              <h3
                id={`category-${category.name}`}
                className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3"
              >
                {category.name}
              </h3>
              <div className="space-y-2">
                {category.shortcuts.map((shortcut, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between py-2 px-3 rounded-lg hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex-1">
                      <span className="font-medium text-sm">{shortcut.action}</span>
                      {shortcut.description && (
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {shortcut.description}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-1 ml-4">
                      {shortcut.keys.map((key, keyIndex) => (
                        <React.Fragment key={keyIndex}>
                          <kbd className="inline-flex items-center justify-center min-w-[28px] h-7 px-2 bg-muted border border-border rounded text-xs font-mono font-medium">
                            {formatKey(key)}
                          </kbd>
                          {keyIndex < shortcut.keys.length - 1 && (
                            <span className="text-muted-foreground text-xs mx-0.5">+</span>
                          )}
                        </React.Fragment>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </section>
          ))}
        </div>

        <div className="mt-6 pt-4 border-t">
          <p className="text-xs text-muted-foreground">
            Press <kbd className="px-1.5 py-0.5 bg-muted rounded text-xs">?</kbd> anywhere to open this dialog.
            All shortcuts work with screen readers and assistive technology.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
};

/**
 * useKeyboardShortcutsHelp Hook
 *
 * Provides keyboard shortcut help functionality.
 * Press '?' to open the shortcuts dialog.
 */
export function useKeyboardShortcutsHelp() {
  const [isOpen, setIsOpen] = React.useState(false);

  React.useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Only trigger on '?' key when not in an input
      if (
        event.key === '?' &&
        !['INPUT', 'TEXTAREA', 'SELECT'].includes((event.target as HTMLElement).tagName)
      ) {
        event.preventDefault();
        setIsOpen(true);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  return { isOpen, setIsOpen };
}

export default KeyboardShortcutsDialog;
