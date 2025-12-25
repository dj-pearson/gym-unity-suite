/**
 * LocalIndexPage - Index page listing all local SEO pages
 *
 * This page serves as a hub for all city-specific landing pages,
 * improving crawlability and providing users a way to find their city.
 */

import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { SEO } from '@/components/seo/SEO';
import { BreadcrumbNavigation } from '@/components/seo/BreadcrumbNavigation';
import { Footer } from '@/components/layout/Footer';
import { Logo } from '@/components/ui/logo';
import { MapPin, ArrowRight, Building, Users, Search } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { localSEOPages } from '@/config/seo.config';

// Group cities by region
const groupByRegion = () => {
  const regions: Record<string, typeof localSEOPages> = {};
  localSEOPages.forEach((page) => {
    if (!regions[page.region]) {
      regions[page.region] = [];
    }
    regions[page.region].push(page);
  });
  return regions;
};

const LocalIndexPage = () => {
  const navigate = useNavigate();
  const regionGroups = groupByRegion();

  const breadcrumbItems = [
    { label: 'Home', href: '/' },
    { label: 'Locations' },
  ];

  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: 'Gym Unity Suite - Locations We Serve',
    description: 'Gym management software available in major US cities',
    itemListElement: localSEOPages.map((page, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      item: {
        '@type': 'City',
        name: page.city,
        url: `https://gymunitysuite.com/local/${page.slug}`,
      },
    })),
  };

  return (
    <>
      <SEO
        title="Gym Management Software by City | Local Fitness Studio Solutions"
        description="Find gym management software in your city. Gym Unity Suite serves fitness studios across the United States with local support and tailored solutions."
        canonical="https://gymunitysuite.com/local"
        keywords="gym software near me, local gym management software, fitness studio software by city"
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
            Nationwide Coverage
          </Badge>
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 text-foreground">
            Gym Management Software in{' '}
            <span className="text-primary">Your City</span>
          </h1>
          <p className="text-xl text-muted-foreground mb-8 max-w-3xl mx-auto">
            Gym Unity Suite serves fitness businesses across the United States.
            Find local support and solutions tailored for your area.
          </p>

          {/* Stats */}
          <div className="flex flex-wrap justify-center gap-8 mb-10">
            <div className="flex items-center gap-2">
              <MapPin className="h-5 w-5 text-primary" />
              <div className="text-left">
                <div className="font-bold text-2xl">{localSEOPages.length}+</div>
                <div className="text-sm text-muted-foreground">Major Cities</div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Building className="h-5 w-5 text-primary" />
              <div className="text-left">
                <div className="font-bold text-2xl">500+</div>
                <div className="text-sm text-muted-foreground">Studios Served</div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5 text-primary" />
              <div className="text-left">
                <div className="font-bold text-2xl">50K+</div>
                <div className="text-sm text-muted-foreground">Members Managed</div>
              </div>
            </div>
          </div>
        </section>

        {/* Cities by Region */}
        <section className="py-16 bg-muted/30">
          <div className="container mx-auto px-4">
            <h2 className="text-3xl font-bold mb-12 text-center">
              Browse by Region
            </h2>

            <div className="space-y-12">
              {Object.entries(regionGroups).map(([region, cities]) => (
                <div key={region}>
                  <h3 className="text-2xl font-semibold mb-6 flex items-center gap-2">
                    <MapPin className="h-5 w-5 text-primary" />
                    {region}
                  </h3>
                  <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {cities.map((city) => (
                      <Link
                        key={city.slug}
                        to={`/local/${city.slug}`}
                        className="group"
                      >
                        <Card className="h-full transition-all hover:shadow-lg hover:border-primary">
                          <CardHeader className="pb-2">
                            <CardTitle className="text-lg group-hover:text-primary transition-colors flex items-center gap-2">
                              <MapPin className="h-4 w-4" />
                              {city.city}
                            </CardTitle>
                          </CardHeader>
                          <CardContent>
                            <div className="flex justify-between text-sm text-muted-foreground">
                              <span>{city.stateAbbr}</span>
                              <span>{city.gymsCount} gyms</span>
                            </div>
                          </CardContent>
                        </Card>
                      </Link>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-16 bg-primary text-primary-foreground">
          <div className="container mx-auto px-4 text-center">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Don't See Your City?
            </h2>
            <p className="text-xl mb-8 opacity-90 max-w-2xl mx-auto">
              Gym Unity Suite works anywhere in the United States. Start your free trial today
              and get dedicated support no matter where you're located.
            </p>
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
                Contact Sales
              </Button>
            </div>
          </div>
        </section>

        <Footer />
      </div>
    </>
  );
};

export default LocalIndexPage;
