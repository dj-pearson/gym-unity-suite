// Core SEO Components
export { SEO, createBlogPostSchema, createFAQSchema, createProductSchema, createHowToSchema } from './SEO';
export type { SEOProps } from './SEO';
export { SEOHead } from './SEOHead';

// FAQ Components
export { FAQSection, gymSoftwareFAQs, yogaStudioFAQs, mindbodyAlternativeFAQs, crossfitFAQs, glofoxAlternativeFAQs, zenPlannerAlternativeFAQs } from './FAQSection';
export type { FAQItem } from './FAQSection';

// Comparison Components
export { ComparisonTable, gymSoftwareComparison } from './ComparisonTable';
export type { ComparisonFeature, ComparisonProduct } from './ComparisonTable';

// Navigation Components
export { BreadcrumbNavigation, createComparisonBreadcrumbs, createSolutionBreadcrumbs, createBlogBreadcrumbs, createFeatureBreadcrumbs, createLocalBreadcrumbs } from './BreadcrumbNavigation';

// Testimonial Components
export { TestimonialSection, mindbodyMigrationTestimonials } from './TestimonialSection';

// Image Optimization
export { OptimizedImage } from './OptimizedImage';

// Internal Linking Components
export {
  RelatedSolutions,
  RelatedLocations,
  RelatedComparisons,
  RelatedFeatures,
  ContextualLinks,
  QuickLinks,
  FooterSEOLinks,
} from './InternalLinks';

// Programmatic Page Templates
export { LocalSEOTemplate } from './LocalSEOTemplate';
export { SolutionPageTemplate } from './SolutionPageTemplate';
