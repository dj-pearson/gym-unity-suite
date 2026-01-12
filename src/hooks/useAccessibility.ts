import { useEffect, useRef, useCallback, useState } from 'react';

/**
 * useAnnounce Hook
 *
 * Provides a way to announce messages to screen readers via ARIA live regions.
 * Creates an off-screen live region that screen readers will detect.
 *
 * @param politeness - 'polite' waits for current speech, 'assertive' interrupts
 */
export function useAnnounce(politeness: 'polite' | 'assertive' = 'polite') {
  const [announcement, setAnnouncement] = useState('');
  const announcerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    // Create the announcer element if it doesn't exist
    let announcer = document.getElementById(`aria-live-${politeness}`) as HTMLDivElement;

    if (!announcer) {
      announcer = document.createElement('div');
      announcer.id = `aria-live-${politeness}`;
      announcer.setAttribute('aria-live', politeness);
      announcer.setAttribute('aria-atomic', 'true');
      announcer.setAttribute('role', 'status');
      announcer.style.cssText = `
        position: absolute;
        width: 1px;
        height: 1px;
        padding: 0;
        margin: -1px;
        overflow: hidden;
        clip: rect(0, 0, 0, 0);
        white-space: nowrap;
        border: 0;
      `;
      document.body.appendChild(announcer);
    }

    announcerRef.current = announcer;

    return () => {
      // Don't remove the announcer on unmount - it might be used by other components
    };
  }, [politeness]);

  const announce = useCallback((message: string) => {
    if (announcerRef.current && message) {
      // Clear and set the message to ensure screen readers announce it
      announcerRef.current.textContent = '';
      // Use requestAnimationFrame to ensure the DOM updates
      requestAnimationFrame(() => {
        if (announcerRef.current) {
          announcerRef.current.textContent = message;
        }
      });
      setAnnouncement(message);
    }
  }, []);

  const clear = useCallback(() => {
    if (announcerRef.current) {
      announcerRef.current.textContent = '';
      setAnnouncement('');
    }
  }, []);

  return { announce, clear, currentAnnouncement: announcement };
}

/**
 * useFocusTrap Hook
 *
 * Traps focus within a container element, cycling through focusable elements.
 * Essential for modal dialogs, dropdowns, and other overlay components.
 *
 * @param containerRef - Ref to the container element
 * @param enabled - Whether the focus trap is active
 * @param options - Configuration options
 */
interface FocusTrapOptions {
  /** Whether to return focus to the previously focused element on unmount */
  returnFocus?: boolean;
  /** Selector for initially focused element */
  initialFocus?: string;
  /** Callback when escape key is pressed */
  onEscape?: () => void;
}

export function useFocusTrap<T extends HTMLElement>(
  containerRef: React.RefObject<T>,
  enabled: boolean = true,
  options: FocusTrapOptions = {}
) {
  const { returnFocus = true, initialFocus, onEscape } = options;
  const previouslyFocusedRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!enabled) return;

    const container = containerRef.current;
    if (!container) return;

    // Store the previously focused element
    previouslyFocusedRef.current = document.activeElement as HTMLElement;

    // Get all focusable elements
    const getFocusableElements = () => {
      const focusableSelectors = [
        'a[href]',
        'button:not([disabled])',
        'input:not([disabled])',
        'select:not([disabled])',
        'textarea:not([disabled])',
        '[tabindex]:not([tabindex="-1"])',
      ].join(', ');

      return Array.from(
        container.querySelectorAll<HTMLElement>(focusableSelectors)
      ).filter(el => {
        // Filter out elements that are hidden or not visible
        const style = getComputedStyle(el);
        return style.display !== 'none' && style.visibility !== 'hidden';
      });
    };

    // Set initial focus
    const setInitialFocus = () => {
      if (initialFocus) {
        const element = container.querySelector<HTMLElement>(initialFocus);
        if (element) {
          element.focus();
          return;
        }
      }

      const focusableElements = getFocusableElements();
      if (focusableElements.length > 0) {
        focusableElements[0].focus();
      } else {
        // If no focusable elements, focus the container itself
        container.setAttribute('tabindex', '-1');
        container.focus();
      }
    };

    // Handle keyboard navigation
    const handleKeyDown = (event: KeyboardEvent) => {
      // Handle Escape
      if (event.key === 'Escape' && onEscape) {
        event.preventDefault();
        onEscape();
        return;
      }

      // Handle Tab
      if (event.key === 'Tab') {
        const focusableElements = getFocusableElements();

        if (focusableElements.length === 0) {
          event.preventDefault();
          return;
        }

        const firstElement = focusableElements[0];
        const lastElement = focusableElements[focusableElements.length - 1];

        if (event.shiftKey) {
          // Shift + Tab: Move backwards
          if (document.activeElement === firstElement) {
            event.preventDefault();
            lastElement.focus();
          }
        } else {
          // Tab: Move forwards
          if (document.activeElement === lastElement) {
            event.preventDefault();
            firstElement.focus();
          }
        }
      }
    };

    // Set initial focus after a brief delay to ensure DOM is ready
    requestAnimationFrame(setInitialFocus);

    // Add event listener
    container.addEventListener('keydown', handleKeyDown);

    return () => {
      container.removeEventListener('keydown', handleKeyDown);

      // Return focus to previously focused element
      if (returnFocus && previouslyFocusedRef.current) {
        previouslyFocusedRef.current.focus();
      }
    };
  }, [enabled, containerRef, initialFocus, onEscape, returnFocus]);
}

/**
 * useReducedMotion Hook
 *
 * Detects if the user prefers reduced motion.
 * WCAG 2.1 Level AAA - Success Criterion 2.3.3 (Animation from Interactions)
 */
export function useReducedMotion(): boolean {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');

    setPrefersReducedMotion(mediaQuery.matches);

    const handleChange = (event: MediaQueryListEvent) => {
      setPrefersReducedMotion(event.matches);
    };

    // Modern browsers
    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener('change', handleChange);
    } else {
      // Fallback for older browsers
      mediaQuery.addListener(handleChange);
    }

    return () => {
      if (mediaQuery.removeEventListener) {
        mediaQuery.removeEventListener('change', handleChange);
      } else {
        mediaQuery.removeListener(handleChange);
      }
    };
  }, []);

  return prefersReducedMotion;
}

/**
 * useKeyboardNavigation Hook
 *
 * Enables keyboard navigation for lists and grids.
 * Supports arrow keys, Home, End, and optional character navigation.
 */
interface KeyboardNavigationOptions {
  /** Whether navigation wraps around at boundaries */
  wrap?: boolean;
  /** Orientation of the list (affects which arrow keys to use) */
  orientation?: 'horizontal' | 'vertical' | 'both';
  /** Callback when an item is selected */
  onSelect?: (index: number) => void;
}

export function useKeyboardNavigation(
  itemCount: number,
  options: KeyboardNavigationOptions = {}
) {
  const { wrap = true, orientation = 'vertical', onSelect } = options;
  const [focusedIndex, setFocusedIndex] = useState(0);

  const handleKeyDown = useCallback((event: React.KeyboardEvent) => {
    let newIndex = focusedIndex;
    let handled = false;

    switch (event.key) {
      case 'ArrowDown':
        if (orientation === 'vertical' || orientation === 'both') {
          newIndex = wrap
            ? (focusedIndex + 1) % itemCount
            : Math.min(focusedIndex + 1, itemCount - 1);
          handled = true;
        }
        break;
      case 'ArrowUp':
        if (orientation === 'vertical' || orientation === 'both') {
          newIndex = wrap
            ? (focusedIndex - 1 + itemCount) % itemCount
            : Math.max(focusedIndex - 1, 0);
          handled = true;
        }
        break;
      case 'ArrowRight':
        if (orientation === 'horizontal' || orientation === 'both') {
          newIndex = wrap
            ? (focusedIndex + 1) % itemCount
            : Math.min(focusedIndex + 1, itemCount - 1);
          handled = true;
        }
        break;
      case 'ArrowLeft':
        if (orientation === 'horizontal' || orientation === 'both') {
          newIndex = wrap
            ? (focusedIndex - 1 + itemCount) % itemCount
            : Math.max(focusedIndex - 1, 0);
          handled = true;
        }
        break;
      case 'Home':
        newIndex = 0;
        handled = true;
        break;
      case 'End':
        newIndex = itemCount - 1;
        handled = true;
        break;
      case 'Enter':
      case ' ':
        if (onSelect) {
          event.preventDefault();
          onSelect(focusedIndex);
        }
        return;
    }

    if (handled) {
      event.preventDefault();
      setFocusedIndex(newIndex);
    }
  }, [focusedIndex, itemCount, orientation, wrap, onSelect]);

  return {
    focusedIndex,
    setFocusedIndex,
    handleKeyDown,
  };
}

/**
 * useHighContrastMode Hook
 *
 * Detects if the user prefers high contrast mode.
 */
export function useHighContrastMode(): boolean {
  const [prefersHighContrast, setPrefersHighContrast] = useState(false);

  useEffect(() => {
    // Check for Windows high contrast mode
    const mediaQuery = window.matchMedia('(prefers-contrast: more)');

    setPrefersHighContrast(mediaQuery.matches);

    const handleChange = (event: MediaQueryListEvent) => {
      setPrefersHighContrast(event.matches);
    };

    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener('change', handleChange);
    } else {
      mediaQuery.addListener(handleChange);
    }

    return () => {
      if (mediaQuery.removeEventListener) {
        mediaQuery.removeEventListener('change', handleChange);
      } else {
        mediaQuery.removeListener(handleChange);
      }
    };
  }, []);

  return prefersHighContrast;
}

/**
 * useFocusVisible Hook
 *
 * Tracks whether the current focus is from keyboard navigation.
 * Useful for showing focus rings only for keyboard users.
 */
export function useFocusVisible(): boolean {
  const [isKeyboardUser, setIsKeyboardUser] = useState(false);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Tab') {
        setIsKeyboardUser(true);
      }
    };

    const handleMouseDown = () => {
      setIsKeyboardUser(false);
    };

    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('mousedown', handleMouseDown);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('mousedown', handleMouseDown);
    };
  }, []);

  return isKeyboardUser;
}
