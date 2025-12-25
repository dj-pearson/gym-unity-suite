/**
 * SolutionsIndexPage - Index page listing all industry solution pages
 *
 * This page serves as a hub for all vertical-specific landing pages,
 * improving crawlability and helping users find their fitness niche.
 */

import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { SEO } from '@/components/seo/SEO';
import { BreadcrumbNavigation } from '@/components/seo/BreadcrumbNavigation';
import { RelatedComparisons } from '@/components/seo/InternalLinks';
import { Footer } from '@/components/layout/Footer';
import { Logo } from '@/components/ui/logo';
import {
  MapPin,
  ArrowRight,
  Briefcase,
  Check,
  Star,
  Heart,
  Zap,
  Users,
  TrendingUp,
  Dumbbell,
  Music,
  Bike,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { solutionPages } from '@/config/seo.config';

// Icon mapping for solutions
const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  Flower2: Heart,
  Dumbbell: Dumbbell,
  Swords: Zap,
  Sparkles: Star,
  UserCheck: Users,
  Bike: Bike,
  Music: Music,
};

const SolutionsIndexPage = () => {
  const navigate = useNavigate();

  const breadcrumbItems = [
    { label: 'Home', href: '/' },
    { label: 'Solutions' },
  ];

  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: 'Gym Unity Suite - Fitness Software Solutions',
    description: 'Gym management software solutions for every type of fitness business',
    itemListElement: solutionPages.map((page, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      item: {
        '@type': 'SoftwareApplication',
        name: page.name,
        url: `https://gymunitysuite.com/solutions/${page.slug}`,
        applicationCategory: 'BusinessApplication',
      },
    })),
  };

  return (
    <>
      <SEO
        title="Gym Software Solutions for Every Fitness Business | Gym Unity Suite"
        description="Purpose-built gym management software for yoga studios, CrossFit boxes, martial arts schools, Pilates studios, personal training, and boutique fitness. Find your solution."
        canonical="https://gymunitysuite.com/solutions"
        keywords="gym software solutions, fitness studio software, yoga studio software, crossfit software, martial arts software, pilates software"
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
            <Briefcase className="h-3 w-3 mr-1" />
            Built for Every Fitness Niche
          </Badge>
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 text-foreground">
            Gym Software for{' '}
            <span className="text-primary">Your Type of Business</span>
          </h1>
          <p className="text-xl text-muted-foreground mb-8 max-w-3xl mx-auto">
            Whether you run a yoga studio, CrossFit box, martial arts school, or boutique fitness studio,
            Gym Unity Suite has purpose-built features for your specific needs.
          </p>

          {/* Stats */}
          <div className="flex flex-wrap justify-center gap-8 mb-10">
            <div className="flex items-center gap-2">
              <Briefcase className="h-5 w-5 text-primary" />
              <div className="text-left">
                <div className="font-bold text-2xl">{solutionPages.length}+</div>
                <div className="text-sm text-muted-foreground">Industry Solutions</div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5 text-primary" />
              <div className="text-left">
                <div className="font-bold text-2xl">500+</div>
                <div className="text-sm text-muted-foreground">Studios Served</div>
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
        </section>

        {/* Solutions Grid */}
        <section className="py-16 bg-muted/30">
          <div className="container mx-auto px-4">
            <h2 className="text-3xl font-bold mb-12 text-center">
              Find Your Perfect Solution
            </h2>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {solutionPages.map((solution) => {
                const Icon = iconMap[solution.icon] || Briefcase;
                return (
                  <Link
                    key={solution.slug}
                    to={`/solutions/${solution.slug}`}
                    className="group"
                  >
                    <Card className="h-full transition-all hover:shadow-lg hover:border-primary">
                      <CardHeader>
                        <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                          <Icon className="h-6 w-6 text-primary" />
                        </div>
                        <CardTitle className="text-xl group-hover:text-primary transition-colors">
                          {solution.name}
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <CardDescription className="mb-4">
                          {solution.description}
                        </CardDescription>
                        <div className="flex items-center justify-between">
                          <Badge variant="secondary">{solution.pricing}</Badge>
                          <span className="text-primary text-sm font-medium flex items-center">
                            Learn more <ArrowRight className="ml-1 h-4 w-4" />
                          </span>
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
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
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-5xl mx-auto">
              {[
                {
                  icon: Check,
                  title: 'Industry-Specific Features',
                  description: 'Purpose-built tools for your exact business type',
                },
                {
                  icon: TrendingUp,
                  title: 'Proven Results',
                  description: '40% better retention on average',
                },
                {
                  icon: Users,
                  title: 'Easy Migration',
                  description: 'Free data migration from any platform',
                },
                {
                  icon: Star,
                  title: 'Top-Rated Support',
                  description: '<2 hour response time, always',
                },
              ].map((benefit, index) => {
                const Icon = benefit.icon;
                return (
                  <div key={index} className="text-center">
                    <div className="mx-auto h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                      <Icon className="h-6 w-6 text-primary" />
                    </div>
                    <h3 className="font-semibold mb-2">{benefit.title}</h3>
                    <p className="text-muted-foreground text-sm">{benefit.description}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-16 bg-primary text-primary-foreground">
          <div className="container mx-auto px-4 text-center">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Not Sure Which Solution Fits?
            </h2>
            <p className="text-xl mb-8 opacity-90 max-w-2xl mx-auto">
              Our team can help you find the perfect setup for your fitness business.
              Get a personalized demo and see exactly how Gym Unity Suite works for you.
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
                Talk to Sales
              </Button>
            </div>
          </div>
        </section>

        {/* Related Comparisons */}
        <RelatedComparisons
          title="Compare to Other Software"
          limit={4}
          className="bg-muted/30"
        />

        <Footer />
      </div>
    </>
  );
};

export default SolutionsIndexPage;
