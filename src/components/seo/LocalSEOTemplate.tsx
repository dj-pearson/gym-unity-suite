/**
 * LocalSEOTemplate - Reusable template for local/geographic SEO pages
 *
 * This component enables programmatic generation of city-specific landing pages
 * for improved local search visibility.
 */

import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { SEO } from '@/components/seo/SEO';
import { FAQSection } from '@/components/seo/FAQSection';
import { BreadcrumbNavigation } from '@/components/seo/BreadcrumbNavigation';
import { RelatedLocations, RelatedSolutions } from '@/components/seo/InternalLinks';
import { Footer } from '@/components/layout/Footer';
import { Logo } from '@/components/ui/logo';
import {
  ArrowRight,
  Check,
  MapPin,
  Building,
  Users,
  Star,
  Zap,
  DollarSign,
  Phone,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import type { LocalSEOPage } from '@/config/seo.config';

interface LocalSEOTemplateProps {
  pageData: LocalSEOPage;
}

// Generate location-specific FAQs
const generateLocalFAQs = (city: string, state: string) => [
  {
    question: `What is the best gym management software in ${city}?`,
    answer: `Gym Unity Suite is the top-rated gym management software for ${city} fitness studios. With features tailored for local businesses including member management, automated billing, class scheduling, and a branded mobile app, it's trusted by hundreds of gyms across ${state}. Starting at just $97/month, it offers enterprise features at boutique pricing.`,
  },
  {
    question: `How much does gym software cost in ${city}?`,
    answer: `Gym management software in ${city} typically ranges from $50-$500/month. Gym Unity Suite starts at $97/month for small studios and scales to $497/month for enterprise gyms. Unlike competitors who charge extra for features, all plans include CRM, billing automation, and a branded mobile app.`,
  },
  {
    question: `Do you offer onsite support in ${city}?`,
    answer: `While Gym Unity Suite is a cloud-based platform, we provide comprehensive remote support with <2 hour response times. We also offer video onboarding sessions and can arrange in-person training for enterprise clients in the ${city} metro area.`,
  },
  {
    question: `Can I migrate my existing gym data to Gym Unity Suite?`,
    answer: `Yes, we offer free data migration for ${city} gyms switching from other platforms like Mindbody, Glofox, or Zen Planner. Our team handles the entire migration process, typically completing it within 3-5 business days.`,
  },
  {
    question: `What types of gyms in ${city} use Gym Unity Suite?`,
    answer: `Gym Unity Suite serves all types of fitness businesses in ${city} including yoga studios, CrossFit boxes, martial arts schools, personal training studios, boutique fitness studios, and traditional gyms. Our flexible platform adapts to your specific business model.`,
  },
  {
    question: `Is there a free trial available for ${city} gyms?`,
    answer: `Yes, we offer a 30-day free trial for all ${city} fitness businesses. No credit card required to start. You can import your existing data during the trial to test everything with your real information.`,
  },
];

export const LocalSEOTemplate = ({ pageData }: LocalSEOTemplateProps) => {
  const navigate = useNavigate();
  const faqs = generateLocalFAQs(pageData.city, pageData.state);

  const breadcrumbItems = [
    { label: 'Home', href: '/' },
    { label: 'Locations', href: '/local' },
    { label: `${pageData.city} Gym Software` },
  ];

  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'LocalBusiness',
    name: `Gym Unity Suite - ${pageData.city}`,
    description: `Gym management software for fitness businesses in ${pageData.city}, ${pageData.state}. Member management, billing, scheduling, and mobile app.`,
    address: {
      '@type': 'PostalAddress',
      addressLocality: pageData.city,
      addressRegion: pageData.stateAbbr,
      addressCountry: 'US',
    },
    areaServed: {
      '@type': 'City',
      name: pageData.city,
      containedInPlace: {
        '@type': 'State',
        name: pageData.state,
      },
    },
    url: `https://gymunitysuite.com/local/${pageData.slug}`,
    priceRange: '$97-$497/month',
    aggregateRating: {
      '@type': 'AggregateRating',
      ratingValue: '4.8',
      reviewCount: '127',
    },
  };

  const features = [
    {
      icon: Users,
      title: 'Member Management',
      description: `Complete member profiles for your ${pageData.city} gym members with check-in tracking and engagement tools.`,
    },
    {
      icon: DollarSign,
      title: 'Automated Billing',
      description: 'Recurring payments, failed payment recovery, and flexible pricing for any membership model.',
    },
    {
      icon: Zap,
      title: 'Class Scheduling',
      description: 'Online booking, waitlists, and recurring classes with instructor management.',
    },
    {
      icon: Phone,
      title: 'Branded Mobile App',
      description: `Your ${pageData.city} studio's branded app for member booking and engagement.`,
    },
  ];

  return (
    <>
      <SEO
        title={`Gym Management Software in ${pageData.city}, ${pageData.stateAbbr} | Gym Unity Suite`}
        description={`Best gym management software for ${pageData.city} fitness studios. Member management, automated billing, class scheduling & branded mobile app. Serving ${pageData.gymsCount} gyms in the ${pageData.city} area.`}
        canonical={`https://gymunitysuite.com/local/${pageData.slug}`}
        keywords={pageData.keywords.join(', ')}
        schema={structuredData}
      />

      <div className="min-h-screen bg-background">
        {/* Navigation */}
        <nav className="bg-card/95 backdrop-blur-sm border-b border-border sticky top-0 z-50">
          <div className="container mx-auto px-4 py-4 flex items-center justify-between">
            <Logo size="md" linkToHome={true} />
            <Button
              onClick={() => navigate('/auth')}
              className="bg-primary hover:bg-primary/90"
            >
              Start Free Trial
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </nav>

        {/* Breadcrumb */}
        <div className="container mx-auto px-4 py-4">
          <BreadcrumbNavigation items={breadcrumbItems} />
        </div>

        {/* Hero Section */}
        <section className="container mx-auto px-4 py-16 text-center">
          <Badge className="mb-6 bg-primary/10 text-primary border-primary/20">
            <MapPin className="h-3 w-3 mr-1" />
            Serving {pageData.city} Gyms
          </Badge>
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 text-foreground">
            Gym Management Software in{' '}
            <span className="text-primary">{pageData.city}</span>
          </h1>
          <p className="text-xl text-muted-foreground mb-8 max-w-3xl mx-auto">
            The all-in-one platform trusted by {pageData.gymsCount} fitness businesses across the{' '}
            {pageData.city} metro area. Member management, automated billing, class scheduling,
            and a branded mobile app—starting at just $97/month.
          </p>

          {/* Stats */}
          <div className="flex flex-wrap justify-center gap-8 mb-10">
            <div className="flex items-center gap-2">
              <Building className="h-5 w-5 text-primary" />
              <div className="text-left">
                <div className="font-bold text-2xl">{pageData.gymsCount}</div>
                <div className="text-sm text-muted-foreground">Gyms in {pageData.city}</div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5 text-primary" />
              <div className="text-left">
                <div className="font-bold text-2xl">{pageData.population}</div>
                <div className="text-sm text-muted-foreground">Population</div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Star className="h-5 w-5 text-primary" />
              <div className="text-left">
                <div className="font-bold text-2xl">4.8/5</div>
                <div className="text-sm text-muted-foreground">Customer Rating</div>
              </div>
            </div>
          </div>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-6">
            <Button size="lg" onClick={() => navigate('/auth')} className="text-lg px-8 py-6">
              Start Free 30-Day Trial
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
            <Button size="lg" variant="outline" onClick={() => navigate('/demo')} className="text-lg px-8 py-6">
              Watch Demo
            </Button>
          </div>

          <p className="text-sm text-muted-foreground">
            No credit card required • Free onboarding • Cancel anytime
          </p>
        </section>

        {/* Features */}
        <section className="py-16 bg-muted/30">
          <div className="container mx-auto px-4">
            <h2 className="text-3xl md:text-4xl font-bold mb-4 text-center">
              Everything Your {pageData.city} Gym Needs
            </h2>
            <p className="text-xl text-muted-foreground text-center mb-12 max-w-2xl mx-auto">
              Purpose-built for fitness businesses in the {pageData.region} region
            </p>

            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              {features.map((feature, index) => {
                const Icon = feature.icon;
                return (
                  <Card key={index} className="text-center">
                    <CardHeader>
                      <div className="mx-auto h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                        <Icon className="h-6 w-6 text-primary" />
                      </div>
                      <CardTitle className="text-lg">{feature.title}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <CardDescription>{feature.description}</CardDescription>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        </section>

        {/* Nearby Areas */}
        <section className="py-16">
          <div className="container mx-auto px-4">
            <h2 className="text-3xl font-bold mb-8 text-center">
              Also Serving Nearby Areas
            </h2>
            <div className="flex flex-wrap justify-center gap-3">
              {pageData.nearbyAreas.map((area, index) => (
                <Badge
                  key={index}
                  variant="secondary"
                  className="px-4 py-2 text-base"
                >
                  <MapPin className="h-3 w-3 mr-1" />
                  {area}
                </Badge>
              ))}
            </div>
          </div>
        </section>

        {/* Pricing CTA */}
        <section className="py-16 bg-primary text-primary-foreground">
          <div className="container mx-auto px-4 text-center">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Ready to Transform Your {pageData.city} Gym?
            </h2>
            <p className="text-xl mb-8 opacity-90 max-w-2xl mx-auto">
              Join fitness businesses across {pageData.state} that trust Gym Unity Suite
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button
                size="lg"
                variant="secondary"
                onClick={() => navigate('/auth')}
                className="text-lg px-8 py-6"
              >
                Start Free Trial
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
          title={`${pageData.city} Gym Software FAQ`}
          subtitle={`Common questions about gym management software in ${pageData.city}`}
          faqs={faqs}
          className="bg-background"
        />

        {/* Related Locations */}
        <RelatedLocations
          title="Other Cities We Serve"
          currentCity={pageData.city}
          limit={8}
          className="bg-muted/30"
        />

        {/* Related Solutions */}
        <RelatedSolutions
          title="Software for Every Fitness Business"
          limit={4}
        />

        <Footer />
      </div>
    </>
  );
};

export default LocalSEOTemplate;
