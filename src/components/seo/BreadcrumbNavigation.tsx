import React from 'react';
import { Helmet } from 'react-helmet-async';
import { Link } from 'react-router-dom';
import { ChevronRight, Home } from 'lucide-react';

export interface BreadcrumbItem {
  name: string;
  href: string;
}

interface BreadcrumbNavigationProps {
  items: BreadcrumbItem[];
  className?: string;
  includeSchema?: boolean;
  showHome?: boolean;
}

/**
 * BreadcrumbNavigation - SEO-optimized breadcrumb navigation with schema markup
 *
 * This component provides:
 * - Visual breadcrumb navigation for users
 * - BreadcrumbList schema.org markup for Google rich snippets
 * - Improved site hierarchy understanding for search engines
 * - Better accessibility with proper ARIA labels
 *
 * Usage:
 * <BreadcrumbNavigation
 *   items={[
 *     { name: "Solutions", href: "/solutions" },
 *     { name: "Yoga Studios", href: "/solutions/yoga-studios" }
 *   ]}
 * />
 */
export const BreadcrumbNavigation = ({
  items,
  className = '',
  includeSchema = true,
  showHome = true,
}: BreadcrumbNavigationProps) => {
  const baseUrl = 'https://gymunitysuite.com';

  // Build full breadcrumb list including home
  const fullItems: BreadcrumbItem[] = showHome
    ? [{ name: 'Home', href: '/' }, ...items]
    : items;

  // Generate BreadcrumbList schema for search engines
  const breadcrumbSchema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: fullItems.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: `${baseUrl}${item.href}`,
    })),
  };

  return (
    <>
      {/* Schema markup for SEO */}
      {includeSchema && (
        <Helmet>
          <script type="application/ld+json">
            {JSON.stringify(breadcrumbSchema)}
          </script>
        </Helmet>
      )}

      {/* Visual breadcrumb navigation */}
      <nav
        aria-label="Breadcrumb"
        className={`flex items-center text-sm text-muted-foreground ${className}`}
      >
        <ol
          className="flex items-center flex-wrap gap-1"
          itemScope
          itemType="https://schema.org/BreadcrumbList"
        >
          {fullItems.map((item, index) => {
            const isLast = index === fullItems.length - 1;
            const isHome = index === 0 && showHome;

            return (
              <li
                key={item.href}
                className="flex items-center"
                itemScope
                itemProp="itemListElement"
                itemType="https://schema.org/ListItem"
              >
                {index > 0 && (
                  <ChevronRight className="h-4 w-4 mx-1 text-muted-foreground/50" />
                )}

                {isLast ? (
                  // Current page (not a link)
                  <span
                    className="font-medium text-foreground"
                    itemProp="name"
                    aria-current="page"
                  >
                    {isHome ? <Home className="h-4 w-4" /> : item.name}
                  </span>
                ) : (
                  // Link to parent page
                  <Link
                    to={item.href}
                    className="hover:text-primary transition-colors"
                    itemProp="item"
                  >
                    <span itemProp="name">
                      {isHome ? <Home className="h-4 w-4" /> : item.name}
                    </span>
                  </Link>
                )}

                <meta itemProp="position" content={String(index + 1)} />
              </li>
            );
          })}
        </ol>
      </nav>

      {/* AI-friendly hidden structured content */}
      <div className="sr-only" aria-hidden="true">
        <p>
          Page location: {fullItems.map((item) => item.name).join(' > ')}
        </p>
      </div>
    </>
  );
};

// Pre-built breadcrumb paths for common page types
export const createComparisonBreadcrumbs = (competitorName: string): BreadcrumbItem[] => [
  { name: 'Compare', href: '/compare' },
  { name: `${competitorName} Alternative`, href: `/compare/${competitorName.toLowerCase().replace(/\s+/g, '-')}-alternative` },
];

export const createSolutionBreadcrumbs = (solutionName: string, slug: string): BreadcrumbItem[] => [
  { name: 'Solutions', href: '/solutions' },
  { name: solutionName, href: `/solutions/${slug}` },
];

export const createBlogBreadcrumbs = (articleTitle: string, slug: string): BreadcrumbItem[] => [
  { name: 'Blog', href: '/blog' },
  { name: articleTitle, href: `/blog/${slug}` },
];

export const createFeatureBreadcrumbs = (featureName: string, slug: string): BreadcrumbItem[] => [
  { name: 'Features', href: '/features' },
  { name: featureName, href: `/features/${slug}` },
];

export const createLocalBreadcrumbs = (locationName: string, slug: string): BreadcrumbItem[] => [
  { name: 'Locations', href: '/local' },
  { name: locationName, href: `/local/${slug}` },
];

export default BreadcrumbNavigation;
