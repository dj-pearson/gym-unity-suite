import React from 'react';
import { Helmet } from 'react-helmet-async';
import { Check, X, Minus } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface ComparisonFeature {
  feature: string;
  category?: string;
  values: {
    [key: string]: boolean | string | number;
  };
}

export interface ComparisonProduct {
  name: string;
  key: string;
  isHighlighted?: boolean;
  price?: string;
  description?: string;
}

interface ComparisonTableProps {
  title?: string;
  subtitle?: string;
  products: ComparisonProduct[];
  features: ComparisonFeature[];
  includeSchema?: boolean;
  className?: string;
}

/**
 * ComparisonTable - An AI-friendly comparison matrix with schema markup
 *
 * This component is optimized for:
 * - AI search engines that parse structured comparison data
 * - Google comparison rich snippets
 * - Screen reader accessibility
 *
 * Usage:
 * <ComparisonTable
 *   title="Gym Software Comparison"
 *   products={[
 *     { name: "Gym Unity Suite", key: "gymunity", isHighlighted: true },
 *     { name: "Mindbody", key: "mindbody" }
 *   ]}
 *   features={[
 *     { feature: "Monthly price", values: { gymunity: "$97/mo", mindbody: "$129+/mo" } },
 *     { feature: "Free mobile app", values: { gymunity: true, mindbody: false } }
 *   ]}
 * />
 */
export const ComparisonTable = ({
  title = 'Feature Comparison',
  subtitle,
  products,
  features,
  includeSchema = true,
  className = '',
}: ComparisonTableProps) => {
  // Generate comparison schema for SEO
  const comparisonSchema = {
    '@context': 'https://schema.org',
    '@type': 'Table',
    about: {
      '@type': 'ItemList',
      itemListElement: products.map((product, index) => ({
        '@type': 'SoftwareApplication',
        position: index + 1,
        name: product.name,
        applicationCategory: 'BusinessApplication',
        ...(product.price && {
          offers: {
            '@type': 'Offer',
            price: product.price.replace(/[^0-9.]/g, ''),
            priceCurrency: 'USD',
          },
        }),
      })),
    },
  };

  const renderValue = (value: boolean | string | number) => {
    if (typeof value === 'boolean') {
      return value ? (
        <Check className="h-5 w-5 text-green-500 mx-auto" aria-label="Yes" />
      ) : (
        <X className="h-5 w-5 text-red-500 mx-auto" aria-label="No" />
      );
    }
    if (value === null || value === undefined || value === '-') {
      return <Minus className="h-5 w-5 text-muted-foreground mx-auto" aria-label="Not applicable" />;
    }
    return <span className="text-sm">{value}</span>;
  };

  // Group features by category
  const groupedFeatures = features.reduce((acc, feature) => {
    const category = feature.category || 'Features';
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(feature);
    return acc;
  }, {} as Record<string, ComparisonFeature[]>);

  return (
    <section className={cn('py-16', className)} id="comparison">
      {/* Schema markup for SEO */}
      {includeSchema && (
        <Helmet>
          <script type="application/ld+json">
            {JSON.stringify(comparisonSchema)}
          </script>
        </Helmet>
      )}

      <div className="container mx-auto px-4">
        {/* Section header */}
        {(title || subtitle) && (
          <div className="text-center mb-12">
            {title && (
              <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
                {title}
              </h2>
            )}
            {subtitle && (
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                {subtitle}
              </p>
            )}
          </div>
        )}

        {/* Comparison Table */}
        <div className="overflow-x-auto">
          <table className="w-full border-collapse bg-card rounded-lg overflow-hidden shadow-sm" role="grid">
            <thead>
              <tr className="bg-muted">
                <th className="text-left p-4 font-semibold text-foreground border-b border-border min-w-[200px]">
                  Feature
                </th>
                {products.map((product) => (
                  <th
                    key={product.key}
                    className={cn(
                      'text-center p-4 font-semibold border-b border-border min-w-[150px]',
                      product.isHighlighted && 'bg-primary/10 text-primary'
                    )}
                  >
                    <div className="flex flex-col items-center gap-1">
                      <span>{product.name}</span>
                      {product.price && (
                        <span className="text-sm font-normal text-muted-foreground">
                          {product.price}
                        </span>
                      )}
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {Object.entries(groupedFeatures).map(([category, categoryFeatures], categoryIndex) => (
                <React.Fragment key={category}>
                  {/* Category header row */}
                  {Object.keys(groupedFeatures).length > 1 && (
                    <tr className="bg-muted/50">
                      <td
                        colSpan={products.length + 1}
                        className="p-3 font-semibold text-foreground border-b border-border"
                      >
                        {category}
                      </td>
                    </tr>
                  )}
                  {/* Feature rows */}
                  {categoryFeatures.map((feature, featureIndex) => (
                    <tr
                      key={`${category}-${featureIndex}`}
                      className="border-b border-border hover:bg-muted/30 transition-colors"
                    >
                      <td className="p-4 text-foreground font-medium">
                        {feature.feature}
                      </td>
                      {products.map((product) => (
                        <td
                          key={`${feature.feature}-${product.key}`}
                          className={cn(
                            'p-4 text-center',
                            product.isHighlighted && 'bg-primary/5'
                          )}
                        >
                          {renderValue(feature.values[product.key])}
                        </td>
                      ))}
                    </tr>
                  ))}
                </React.Fragment>
              ))}
            </tbody>
          </table>
        </div>

        {/* AI-friendly plain text version (hidden but crawlable) */}
        <div className="sr-only" aria-hidden="true">
          <h3>Comparison Summary</h3>
          {products.map((product) => (
            <div key={product.key}>
              <h4>{product.name}</h4>
              {product.price && <p>Price: {product.price}</p>}
              <ul>
                {features.map((feature, idx) => {
                  const value = feature.values[product.key];
                  const displayValue = typeof value === 'boolean'
                    ? (value ? 'Yes' : 'No')
                    : String(value);
                  return (
                    <li key={idx}>
                      {feature.feature}: {displayValue}
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

// Pre-built comparison data for common use cases

export const gymSoftwareComparison = {
  products: [
    { name: 'Gym Unity Suite', key: 'gymunity', isHighlighted: true, price: 'From $97/mo' },
    { name: 'Mindbody', key: 'mindbody', price: 'From $129/mo' },
    { name: 'Glofox', key: 'glofox', price: 'From $110/mo' },
    { name: 'Zen Planner', key: 'zenplanner', price: 'From $117/mo' },
  ],
  features: [
    // Pricing & Value
    { feature: 'Setup fees', category: 'Pricing & Value', values: { gymunity: '$0', mindbody: '$199+', glofox: '$0', zenplanner: '$0' } },
    { feature: 'Transaction fees', category: 'Pricing & Value', values: { gymunity: 'None', mindbody: '2.5%', glofox: 'None', zenplanner: 'None' } },
    { feature: 'Contract required', category: 'Pricing & Value', values: { gymunity: false, mindbody: true, glofox: true, zenplanner: false } },
    { feature: 'Free trial', category: 'Pricing & Value', values: { gymunity: '14 days', mindbody: 'Demo only', glofox: '14 days', zenplanner: '14 days' } },

    // Core Features
    { feature: 'Member management', category: 'Core Features', values: { gymunity: true, mindbody: true, glofox: true, zenplanner: true } },
    { feature: 'Class scheduling', category: 'Core Features', values: { gymunity: true, mindbody: true, glofox: true, zenplanner: true } },
    { feature: 'Automated billing', category: 'Core Features', values: { gymunity: true, mindbody: true, glofox: true, zenplanner: true } },
    { feature: 'Built-in CRM', category: 'Core Features', values: { gymunity: true, mindbody: false, glofox: true, zenplanner: false } },
    { feature: 'Lead scoring', category: 'Core Features', values: { gymunity: true, mindbody: false, glofox: false, zenplanner: false } },
    { feature: 'Marketing automation', category: 'Core Features', values: { gymunity: true, mindbody: true, glofox: true, zenplanner: true } },

    // Mobile & Apps
    { feature: 'Branded mobile app', category: 'Mobile & Apps', values: { gymunity: 'Included', mindbody: '+$99/mo', glofox: 'Included', zenplanner: '+$99/mo' } },
    { feature: 'Member self-service', category: 'Mobile & Apps', values: { gymunity: true, mindbody: true, glofox: true, zenplanner: true } },
    { feature: 'Digital check-in', category: 'Mobile & Apps', values: { gymunity: true, mindbody: true, glofox: true, zenplanner: true } },

    // Support
    { feature: '24/7 support', category: 'Support & Training', values: { gymunity: true, mindbody: false, glofox: false, zenplanner: false } },
    { feature: 'Free onboarding', category: 'Support & Training', values: { gymunity: true, mindbody: false, glofox: true, zenplanner: true } },
    { feature: 'Free data migration', category: 'Support & Training', values: { gymunity: true, mindbody: false, glofox: true, zenplanner: true } },
  ],
};

export default ComparisonTable;
