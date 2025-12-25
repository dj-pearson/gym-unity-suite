/**
 * InternalLinks - SEO-optimized internal linking components
 *
 * These components provide contextual internal links to improve:
 * - Site crawlability
 * - PageRank distribution
 * - User navigation
 * - Topical authority
 */

import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, MapPin, Briefcase, GitCompare, Zap } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  localSEOPages,
  solutionPages,
  comparisonPages,
  featurePages,
  type LocalSEOPage,
  type SolutionPage,
  type ComparisonPage,
  type FeaturePage,
} from '@/config/seo.config';

interface RelatedLinksProps {
  title?: string;
  className?: string;
  limit?: number;
}

interface ContextualLinksProps {
  currentPage?: string;
  pageType?: 'local' | 'solution' | 'comparison' | 'feature' | 'blog';
  className?: string;
}

/**
 * RelatedSolutions - Shows related solution/vertical pages
 */
export const RelatedSolutions = ({
  title = 'Solutions for Every Fitness Business',
  className = '',
  limit = 6,
}: RelatedLinksProps) => {
  const solutions = solutionPages.slice(0, limit);

  return (
    <section className={`py-12 ${className}`}>
      <div className="container mx-auto px-4">
        <h2 className="text-2xl md:text-3xl font-bold mb-8 text-center">{title}</h2>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {solutions.map((solution) => (
            <Link
              key={solution.slug}
              to={`/solutions/${solution.slug}`}
              className="group"
            >
              <Card className="h-full transition-shadow hover:shadow-lg">
                <CardHeader className="pb-2">
                  <div className="flex items-center gap-2">
                    <Briefcase className="h-5 w-5 text-primary" />
                    <CardTitle className="text-lg group-hover:text-primary transition-colors">
                      {solution.name}
                    </CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <CardDescription className="mb-3">
                    {solution.description}
                  </CardDescription>
                  <div className="flex items-center text-primary text-sm font-medium">
                    Learn more <ArrowRight className="ml-1 h-4 w-4" />
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
};

/**
 * RelatedLocations - Shows related local SEO pages
 */
export const RelatedLocations = ({
  title = 'Gym Software by City',
  className = '',
  limit = 8,
  currentCity,
}: RelatedLinksProps & { currentCity?: string }) => {
  const locations = localSEOPages
    .filter((loc) => loc.city !== currentCity)
    .slice(0, limit);

  return (
    <section className={`py-12 ${className}`}>
      <div className="container mx-auto px-4">
        <h2 className="text-2xl md:text-3xl font-bold mb-8 text-center">{title}</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {locations.map((location) => (
            <Link
              key={location.slug}
              to={`/local/${location.slug}`}
              className="flex items-center gap-2 p-4 bg-card rounded-lg border hover:border-primary hover:shadow-md transition-all group"
            >
              <MapPin className="h-4 w-4 text-primary flex-shrink-0" />
              <div>
                <span className="font-medium group-hover:text-primary transition-colors">
                  {location.city}
                </span>
                <span className="text-muted-foreground text-sm block">
                  {location.stateAbbr}
                </span>
              </div>
            </Link>
          ))}
        </div>
        <div className="text-center mt-6">
          <Link
            to="/local"
            className="text-primary hover:underline inline-flex items-center"
          >
            View all locations <ArrowRight className="ml-1 h-4 w-4" />
          </Link>
        </div>
      </div>
    </section>
  );
};

/**
 * RelatedComparisons - Shows competitor comparison pages
 */
export const RelatedComparisons = ({
  title = 'Compare Gym Software',
  className = '',
  limit = 4,
  excludeCompetitor,
}: RelatedLinksProps & { excludeCompetitor?: string }) => {
  const comparisons = comparisonPages
    .filter((comp) => comp.competitor !== excludeCompetitor)
    .slice(0, limit);

  return (
    <section className={`py-12 ${className}`}>
      <div className="container mx-auto px-4">
        <h2 className="text-2xl md:text-3xl font-bold mb-8 text-center">{title}</h2>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {comparisons.map((comparison) => (
            <Link
              key={comparison.slug}
              to={`/compare/${comparison.slug}`}
              className="group"
            >
              <Card className="h-full transition-shadow hover:shadow-lg">
                <CardContent className="pt-6">
                  <div className="flex items-center gap-2 mb-3">
                    <GitCompare className="h-5 w-5 text-primary" />
                    <span className="font-semibold group-hover:text-primary transition-colors">
                      vs {comparison.competitor}
                    </span>
                  </div>
                  <Badge variant="secondary" className="bg-green-100 text-green-800">
                    Save {comparison.savings}
                  </Badge>
                  <div className="flex items-center text-primary text-sm font-medium mt-4">
                    See comparison <ArrowRight className="ml-1 h-4 w-4" />
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
};

/**
 * RelatedFeatures - Shows feature pages
 */
export const RelatedFeatures = ({
  title = 'Explore Features',
  className = '',
  limit = 6,
}: RelatedLinksProps) => {
  const features = featurePages.slice(0, limit);

  return (
    <section className={`py-12 ${className}`}>
      <div className="container mx-auto px-4">
        <h2 className="text-2xl md:text-3xl font-bold mb-8 text-center">{title}</h2>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature) => (
            <Link
              key={feature.slug}
              to={`/features/${feature.slug}`}
              className="flex items-start gap-4 p-4 bg-card rounded-lg border hover:border-primary hover:shadow-md transition-all group"
            >
              <Zap className="h-5 w-5 text-primary flex-shrink-0 mt-1" />
              <div>
                <span className="font-medium group-hover:text-primary transition-colors block">
                  {feature.name}
                </span>
                <span className="text-muted-foreground text-sm">
                  {feature.description}
                </span>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
};

/**
 * ContextualLinks - Smart internal links based on current page context
 */
export const ContextualLinks = ({
  currentPage,
  pageType = 'solution',
  className = '',
}: ContextualLinksProps) => {
  // Determine which links to show based on page type
  const renderLinks = () => {
    switch (pageType) {
      case 'local':
        return (
          <>
            <RelatedSolutions limit={3} className="bg-muted/30" />
            <RelatedComparisons limit={3} />
          </>
        );
      case 'solution':
        return (
          <>
            <RelatedComparisons limit={3} className="bg-muted/30" />
            <RelatedLocations limit={6} />
          </>
        );
      case 'comparison':
        return (
          <>
            <RelatedSolutions limit={3} className="bg-muted/30" />
            <RelatedComparisons limit={3} excludeCompetitor={currentPage} />
          </>
        );
      case 'feature':
        return (
          <>
            <RelatedSolutions limit={3} className="bg-muted/30" />
            <RelatedComparisons limit={3} />
          </>
        );
      case 'blog':
        return (
          <>
            <RelatedFeatures limit={3} className="bg-muted/30" />
            <RelatedSolutions limit={3} />
          </>
        );
      default:
        return (
          <>
            <RelatedSolutions limit={4} />
            <RelatedComparisons limit={3} />
          </>
        );
    }
  };

  return <div className={className}>{renderLinks()}</div>;
};

/**
 * QuickLinks - Compact inline links for within content
 */
export const QuickLinks = ({
  links,
  className = '',
}: {
  links: { label: string; href: string }[];
  className?: string;
}) => {
  return (
    <div className={`flex flex-wrap gap-2 ${className}`}>
      {links.map((link, index) => (
        <Link
          key={index}
          to={link.href}
          className="inline-flex items-center px-3 py-1 bg-primary/10 text-primary rounded-full text-sm hover:bg-primary/20 transition-colors"
        >
          {link.label}
          <ArrowRight className="ml-1 h-3 w-3" />
        </Link>
      ))}
    </div>
  );
};

/**
 * FooterSEOLinks - SEO-optimized footer links organized by category
 */
export const FooterSEOLinks = ({ className = '' }: { className?: string }) => {
  return (
    <div className={`grid grid-cols-2 md:grid-cols-4 gap-8 ${className}`}>
      {/* Solutions */}
      <div>
        <h4 className="font-semibold mb-4">Solutions</h4>
        <ul className="space-y-2">
          {solutionPages.slice(0, 5).map((solution) => (
            <li key={solution.slug}>
              <Link
                to={`/solutions/${solution.slug}`}
                className="text-muted-foreground hover:text-primary transition-colors text-sm"
              >
                {solution.shortName} Software
              </Link>
            </li>
          ))}
        </ul>
      </div>

      {/* Features */}
      <div>
        <h4 className="font-semibold mb-4">Features</h4>
        <ul className="space-y-2">
          {featurePages.map((feature) => (
            <li key={feature.slug}>
              <Link
                to={`/features/${feature.slug}`}
                className="text-muted-foreground hover:text-primary transition-colors text-sm"
              >
                {feature.shortName}
              </Link>
            </li>
          ))}
        </ul>
      </div>

      {/* Compare */}
      <div>
        <h4 className="font-semibold mb-4">Compare</h4>
        <ul className="space-y-2">
          {comparisonPages.slice(0, 5).map((comparison) => (
            <li key={comparison.slug}>
              <Link
                to={`/compare/${comparison.slug}`}
                className="text-muted-foreground hover:text-primary transition-colors text-sm"
              >
                vs {comparison.competitor}
              </Link>
            </li>
          ))}
        </ul>
      </div>

      {/* Locations */}
      <div>
        <h4 className="font-semibold mb-4">Locations</h4>
        <ul className="space-y-2">
          {localSEOPages.slice(0, 5).map((location) => (
            <li key={location.slug}>
              <Link
                to={`/local/${location.slug}`}
                className="text-muted-foreground hover:text-primary transition-colors text-sm"
              >
                {location.city}
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default {
  RelatedSolutions,
  RelatedLocations,
  RelatedComparisons,
  RelatedFeatures,
  ContextualLinks,
  QuickLinks,
  FooterSEOLinks,
};
