import React, { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';

/**
 * LiveRegion Component
 *
 * An ARIA live region that announces dynamic content changes to screen readers.
 * WCAG 2.1 Level A - Success Criterion 4.1.3 (Status Messages)
 */
interface LiveRegionProps {
  /** The message to announce */
  message?: string;
  /**
   * Politeness level:
   * - 'polite': Wait for current speech to finish (default)
   * - 'assertive': Interrupt current speech immediately
   */
  politeness?: 'polite' | 'assertive';
  /**
   * Role for the live region:
   * - 'status': For status updates (default for polite)
   * - 'alert': For important messages (default for assertive)
   * - 'log': For chat messages or event logs
   */
  role?: 'status' | 'alert' | 'log';
  /** Whether the entire region should be re-read on updates */
  atomic?: boolean;
  /** Which types of changes should be announced */
  relevant?: 'additions' | 'removals' | 'text' | 'all';
  /** Additional CSS classes */
  className?: string;
  /** Children to render (can be used instead of message) */
  children?: React.ReactNode;
}

export const LiveRegion: React.FC<LiveRegionProps> = ({
  message,
  politeness = 'polite',
  role,
  atomic = true,
  relevant = 'additions text',
  className,
  children,
}) => {
  // Determine the role based on politeness if not specified
  const computedRole = role || (politeness === 'assertive' ? 'alert' : 'status');

  return (
    <div
      aria-live={politeness}
      aria-atomic={atomic}
      aria-relevant={relevant}
      role={computedRole}
      className={cn(
        // Visually hidden but available to screen readers
        'sr-only',
        className
      )}
    >
      {message || children}
    </div>
  );
};

/**
 * AnnouncementQueue Component
 *
 * Manages a queue of announcements to ensure they are read in order.
 * Useful when multiple status updates might occur rapidly.
 */
interface AnnouncementQueueProps {
  announcements: string[];
  politeness?: 'polite' | 'assertive';
  debounceMs?: number;
}

export const AnnouncementQueue: React.FC<AnnouncementQueueProps> = ({
  announcements,
  politeness = 'polite',
  debounceMs = 150,
}) => {
  const [currentAnnouncement, setCurrentAnnouncement] = useState('');
  const [key, setKey] = useState(0);

  useEffect(() => {
    if (announcements.length === 0) return;

    const latestAnnouncement = announcements[announcements.length - 1];

    // Debounce rapid announcements
    const timer = setTimeout(() => {
      setCurrentAnnouncement(latestAnnouncement);
      setKey(prev => prev + 1);
    }, debounceMs);

    return () => clearTimeout(timer);
  }, [announcements, debounceMs]);

  return (
    <LiveRegion
      key={key}
      message={currentAnnouncement}
      politeness={politeness}
    />
  );
};

/**
 * FormErrorAnnouncer Component
 *
 * Specifically designed for announcing form validation errors.
 * Provides appropriate delay and formatting for error messages.
 */
interface FormErrorAnnouncerProps {
  errors: string[];
  /** Prefix for the error announcement */
  prefix?: string;
}

export const FormErrorAnnouncer: React.FC<FormErrorAnnouncerProps> = ({
  errors,
  prefix = 'Form error:',
}) => {
  const [announcement, setAnnouncement] = useState('');

  useEffect(() => {
    if (errors.length === 0) {
      setAnnouncement('');
      return;
    }

    // Combine errors for announcement
    const errorMessage = errors.length === 1
      ? `${prefix} ${errors[0]}`
      : `${prefix} ${errors.length} errors. ${errors.join('. ')}`;

    // Delay slightly to ensure it's announced after focus change
    const timer = setTimeout(() => {
      setAnnouncement(errorMessage);
    }, 100);

    return () => clearTimeout(timer);
  }, [errors, prefix]);

  return <LiveRegion message={announcement} politeness="assertive" role="alert" />;
};

/**
 * LoadingAnnouncer Component
 *
 * Announces loading states to screen readers.
 */
interface LoadingAnnouncerProps {
  isLoading: boolean;
  loadingMessage?: string;
  loadedMessage?: string;
}

export const LoadingAnnouncer: React.FC<LoadingAnnouncerProps> = ({
  isLoading,
  loadingMessage = 'Loading...',
  loadedMessage = 'Content loaded',
}) => {
  const [announcement, setAnnouncement] = useState('');
  const previousLoadingRef = React.useRef(isLoading);

  useEffect(() => {
    if (isLoading && !previousLoadingRef.current) {
      // Just started loading
      setAnnouncement(loadingMessage);
    } else if (!isLoading && previousLoadingRef.current) {
      // Just finished loading
      setAnnouncement(loadedMessage);
    }

    previousLoadingRef.current = isLoading;
  }, [isLoading, loadingMessage, loadedMessage]);

  return <LiveRegion message={announcement} politeness="polite" />;
};

/**
 * PageTitleAnnouncer Component
 *
 * Announces page title changes for SPA navigation.
 * Important for screen reader users to know when page content changes.
 */
interface PageTitleAnnouncerProps {
  title: string;
}

export const PageTitleAnnouncer: React.FC<PageTitleAnnouncerProps> = ({ title }) => {
  const [announcement, setAnnouncement] = useState('');
  const previousTitleRef = React.useRef(title);

  useEffect(() => {
    if (title !== previousTitleRef.current) {
      setAnnouncement(`Navigated to ${title}`);
      previousTitleRef.current = title;
    }
  }, [title]);

  return <LiveRegion message={announcement} politeness="polite" />;
};

export default LiveRegion;
