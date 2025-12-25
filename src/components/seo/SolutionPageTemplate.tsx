/**
 * SolutionPageTemplate - Reusable template for vertical/solution pages
 *
 * This component enables programmatic generation of industry-specific landing pages
 * for improved search visibility and conversion.
 */

import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { SEO } from '@/components/seo/SEO';
import { FAQSection } from '@/components/seo/FAQSection';
import { BreadcrumbNavigation } from '@/components/seo/BreadcrumbNavigation';
import { RelatedSolutions, RelatedComparisons } from '@/components/seo/InternalLinks';
import { Footer } from '@/components/layout/Footer';
import { Logo } from '@/components/ui/logo';
import {
  ArrowRight,
  Check,
  Star,
  Zap,
  Users,
  Calendar,
  CreditCard,
  Smartphone,
  TrendingUp,
  Heart,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import type { SolutionPage } from '@/config/seo.config';

interface SolutionPageTemplateProps {
  pageData: SolutionPage;
  faqs: Array<{ question: string; answer: string }>;
  testimonial?: {
    quote: string;
    author: string;
    role: string;
    rating?: number;
  };
}

// Icon mapping
const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  Flower2: Heart,
  Dumbbell: Zap,
  Swords: Star,
  Sparkles: Star,
  UserCheck: Users,
  Bike: TrendingUp,
  Music: Heart,
};

// Feature icons
const featureIcons = [
  Calendar,
  Users,
  Smartphone,
  CreditCard,
  Heart,
  TrendingUp,
];

export const SolutionPageTemplate = ({
  pageData,
  faqs,
  testimonial,
}: SolutionPageTemplateProps) => {
  const navigate = useNavigate();
  const Icon = iconMap[pageData.icon] || Star;

  const breadcrumbItems = [
    { label: 'Home', href: '/' },
    { label: 'Solutions', href: '/solutions' },
    { label: pageData.name },
  ];

  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: `Gym Unity Suite - ${pageData.name}`,
    description: pageData.description,
    brand: {
      '@type': 'Brand',
      name: 'Gym Unity Suite',
    },
    offers: {
      '@type': 'Offer',
      price: pageData.pricing.replace('$', '').replace('/mo', ''),
      priceCurrency: 'USD',
      priceValidUntil: '2026-12-31',
      availability: 'https://schema.org/InStock',
    },
    aggregateRating: {
      '@type': 'AggregateRating',
      ratingValue: '4.8',
      reviewCount: '127',
    },
  };

  // Generate feature cards with icons
  const featuresWithIcons = pageData.features.map((feature, index) => ({
    title: feature,
    icon: featureIcons[index % featureIcons.length],
  }));

  return (
    <>
      <SEO
        title={`${pageData.name} Software | ${pageData.pricing} | Gym Unity Suite`}
        description={pageData.description}
        canonical={`https://gymunitysuite.com/solutions/${pageData.slug}`}
        keywords={pageData.keywords.join(', ')}
        schema={structuredData}
      />

      <div className="min-h-screen bg-background">
        {/* Navigation */}
        <nav className="bg-card/95 backdrop-blur-sm border-b border-border sticky top-0 z-50">
          <div className="container mx-auto px-4 py-4 flex items-center justify-between">
            <Logo size="md" linkToHome={true} />
            <div className="hidden md:flex items-center space-x-8">
              <a href="#features" className="text-foreground hover:text-primary transition-colors font-medium">
                Features
              </a>
              <a href="#pricing" className="text-foreground hover:text-primary transition-colors font-medium">
                Pricing
              </a>
              <Button onClick={() => navigate('/auth')} className="bg-primary hover:bg-primary/90">
                Get Started Free
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </div>
        </nav>

        {/* Breadcrumb */}
        <div className="container mx-auto px-4 py-4">
          <BreadcrumbNavigation items={breadcrumbItems} />
        </div>

        {/* Hero Section */}
        <section className="container mx-auto px-4 py-16 text-center">
          <Badge className="mb-6 bg-primary/10 text-primary border-primary/20">
            <Icon className="h-3 w-3 mr-1" />
            Built for {pageData.shortName}
          </Badge>
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 text-foreground">
            {pageData.name} Software That Actually Works
          </h1>
          <p className="text-xl text-muted-foreground mb-8 max-w-3xl mx-auto">
            {pageData.description} Starting at just {pageData.pricing}.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-12">
            <Button size="lg" onClick={() => navigate('/auth')} className="bg-primary hover:bg-primary/90">
              {pageData.ctaText}
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
            <Button size="lg" variant="outline" onClick={() => navigate('/demo')}>
              Watch Demo
            </Button>
          </div>
          <div className="flex items-center justify-center gap-4 text-sm text-muted-foreground">
            <div className="flex items-center">
              <Check className="h-4 w-4 text-primary mr-2" />
              No credit card required
            </div>
            <div className="flex items-center">
              <Check className="h-4 w-4 text-primary mr-2" />
              Free onboarding
            </div>
            <div className="flex items-center">
              <Check className="h-4 w-4 text-primary mr-2" />
              Cancel anytime
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section id="features" className="py-16 bg-muted/30">
          <div className="container mx-auto px-4">
            <h2 className="text-3xl md:text-4xl font-bold mb-4 text-center">
              Everything Your {pageData.shortName} Business Needs
            </h2>
            <p className="text-xl text-muted-foreground text-center mb-12 max-w-2xl mx-auto">
              Purpose-built features designed specifically for {pageData.name.toLowerCase()}
            </p>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto">
              {featuresWithIcons.map((feature, index) => {
                const FeatureIcon = feature.icon;
                return (
                  <Card key={index} className="text-center">
                    <CardHeader>
                      <div className="mx-auto h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                        <FeatureIcon className="h-6 w-6 text-primary" />
                      </div>
                      <CardTitle className="text-lg">{feature.title}</CardTitle>
                    </CardHeader>
                  </Card>
                );
              })}
            </div>
          </div>
        </section>

        {/* Benefits Section */}
        <section className="py-16">
          <div className="container mx-auto px-4">
            <h2 className="text-3xl font-bold mb-12 text-center">
              Why Choose Gym Unity Suite
            </h2>
            <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto">
              {pageData.benefits.map((benefit, index) => (
                <div key={index} className="flex items-start gap-3">
                  <Check className="h-6 w-6 text-primary flex-shrink-0 mt-0.5" />
                  <span className="text-lg">{benefit}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Testimonial */}
        {testimonial && (
          <section className="py-16 bg-muted/30">
            <div className="container mx-auto px-4">
              <Card className="max-w-3xl mx-auto">
                <CardContent className="p-8 md:p-12">
                  {testimonial.rating && (
                    <div className="flex gap-1 mb-6">
                      {[...Array(testimonial.rating)].map((_, i) => (
                        <Star key={i} className="h-6 w-6 fill-primary text-primary" />
                      ))}
                    </div>
                  )}
                  <blockquote className="text-xl md:text-2xl mb-6 leading-relaxed">
                    "{testimonial.quote}"
                  </blockquote>
                  <div>
                    <div className="font-semibold text-lg">{testimonial.author}</div>
                    <div className="text-muted-foreground">{testimonial.role}</div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </section>
        )}

        {/* Pricing CTA */}
        <section id="pricing" className="py-16 bg-primary text-primary-foreground">
          <div className="container mx-auto px-4 text-center">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Ready to Transform Your {pageData.shortName} Business?
            </h2>
            <p className="text-xl mb-8 opacity-90 max-w-2xl mx-auto">
              Join hundreds of {pageData.name.toLowerCase()} that trust Gym Unity Suite
            </p>
            <div className="bg-white/10 rounded-lg p-6 max-w-md mx-auto mb-8">
              <div className="text-4xl font-bold mb-2">{pageData.pricing}</div>
              <div className="opacity-75">Starting price • All features included</div>
            </div>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button
                size="lg"
                variant="secondary"
                onClick={() => navigate('/auth')}
                className="text-lg px-8 py-6"
              >
                Start Free 30-Day Trial
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
              <Button
                size="lg"
                variant="outline"
                onClick={() => navigate('/contact')}
                className="text-lg px-8 py-6 border-primary-foreground text-primary-foreground hover:bg-primary-foreground hover:text-primary"
              >
                Talk to Sales
              </Button>
            </div>
          </div>
        </section>

        {/* FAQ Section */}
        <FAQSection
          title={`${pageData.shortName} Software FAQ`}
          subtitle={`Common questions about ${pageData.name.toLowerCase()} management software`}
          faqs={faqs}
          className="bg-background"
        />

        {/* Related Solutions */}
        <RelatedSolutions
          title="Solutions for Every Fitness Business"
          limit={3}
          className="bg-muted/30"
        />

        {/* Related Comparisons */}
        <RelatedComparisons
          title="Compare to Other Software"
          limit={3}
        />

        <Footer />
      </div>
    </>
  );
};

export default SolutionPageTemplate;
