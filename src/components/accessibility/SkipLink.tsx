import React from 'react';
import { cn } from '@/lib/utils';

interface SkipLinkProps {
  /** Target element ID to skip to (without #) */
  targetId?: string;
  /** Custom text for the skip link */
  text?: string;
  /** Additional CSS classes */
  className?: string;
}

/**
 * SkipLink Component
 *
 * Provides a skip-to-main-content link for keyboard and screen reader users.
 * WCAG 2.1 Level A - Success Criterion 2.4.1 (Bypass Blocks)
 *
 * The link is visually hidden until focused, then appears prominently.
 * This allows keyboard users to skip repetitive navigation content.
 */
export const SkipLink: React.FC<SkipLinkProps> = ({
  targetId = 'main-content',
  text = 'Skip to main content',
  className,
}) => {
  const handleClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    const target = document.getElementById(targetId);

    if (target) {
      // Set focus to the target element
      target.setAttribute('tabindex', '-1');
      target.focus();

      // Scroll the element into view
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });

      // Remove tabindex after focus (cleanup)
      target.addEventListener('blur', () => {
        target.removeAttribute('tabindex');
      }, { once: true });
    }
  };

  return (
    <a
      href={`#${targetId}`}
      onClick={handleClick}
      className={cn(
        // Visually hidden by default
        'sr-only',
        // Visible when focused
        'focus:not-sr-only',
        'focus:fixed focus:top-4 focus:left-4 focus:z-[9999]',
        // Styling when visible
        'focus:px-6 focus:py-3',
        'focus:bg-primary focus:text-primary-foreground',
        'focus:rounded-lg focus:shadow-lg',
        'focus:font-semibold focus:text-sm',
        // Focus ring for visibility
        'focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
        // Transition for smooth appearance
        'transition-all duration-200',
        className
      )}
    >
      {text}
    </a>
  );
};

/**
 * SkipLinks Component
 *
 * Provides multiple skip links for complex page layouts.
 * Useful for pages with multiple landmark regions.
 */
interface SkipLinksProps {
  links?: Array<{
    targetId: string;
    text: string;
  }>;
  className?: string;
}

export const SkipLinks: React.FC<SkipLinksProps> = ({
  links = [
    { targetId: 'main-content', text: 'Skip to main content' },
    { targetId: 'main-navigation', text: 'Skip to navigation' },
  ],
  className,
}) => {
  return (
    <div className={cn('skip-links', className)}>
      {links.map((link) => (
        <SkipLink
          key={link.targetId}
          targetId={link.targetId}
          text={link.text}
        />
      ))}
    </div>
  );
};

export default SkipLink;
