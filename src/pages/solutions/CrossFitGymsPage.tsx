import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { SEO } from '@/components/seo';
import { Footer } from '@/components/layout/Footer';
import {
  Calendar,
  CreditCard,
  Users,
  Smartphone,
  Star,
  Check,
  ArrowRight,
  Trophy,
  TrendingUp,
  Dumbbell
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Logo } from '@/components/ui/logo';

export default function CrossFitGymsPage() {
  const navigate = useNavigate();

  const crossfitFeatures = [
    {
      icon: Calendar,
      title: 'WOD & Class Scheduling',
      description: 'Schedule WODs, Open Gym, and specialty classes. Track athlete attendance and performance metrics.'
    },
    {
      icon: Trophy,
      title: 'Competition Management',
      description: 'Organize in-house competitions, track leaderboards, and manage CrossFit Open registrations.'
    },
    {
      icon: Smartphone,
      title: 'Athlete Mobile App',
      description: 'Branded mobile app where athletes can book classes, log workouts, and view performance history.'
    },
    {
      icon: CreditCard,
      title: 'Flexible Memberships',
      description: 'Unlimited memberships, class packs, drop-ins, and Open Gym access—all with automated billing.'
    },
    {
      icon: Dumbbell,
      title: 'Equipment Management',
      description: 'Track equipment maintenance, schedule repairs, and manage equipment checkout for home WODs.'
    },
    {
      icon: TrendingUp,
      title: 'Performance Analytics',
      description: 'Track athlete progress, benchmark WODs, and measure retention with detailed analytics.'
    }
  ];

  const benefits = [
    'WOD programming and scheduling',
    'Open Gym and flex time management',
    'Competition and event registration',
    'Athlete performance tracking',
    'Unlimited membership tiers',
    'Drop-in and class pack options',
    'Equipment tracking and maintenance logs',
    'Retail sales for apparel and supplements',
    'Fundamentals/OnRamp program management',
    'Coach scheduling and certifications'
  ];

  const pricingComparison = [
    { feature: 'Monthly Cost (200 athletes)', mindbody: '$329/mo', gymunity: '$149/mo' },
    { feature: 'Setup Fees', mindbody: '$1,499', gymunity: '$0' },
    { feature: 'Branded Mobile App', mindbody: '❌', gymunity: '✅' },
    { feature: 'Performance Tracking', mindbody: 'Add-on', gymunity: '✅ Included' },
    { feature: 'Competition Management', mindbody: '❌', gymunity: '✅' },
    { feature: 'Customer Support', mindbody: '24-48hrs', gymunity: '<2hrs' }
  ];

  return (
    <>
      <SEO
        title="CrossFit Gym Management Software | $149/mo"
        description="Complete CrossFit box management software with WOD scheduling, performance tracking, competition management, and branded mobile app. Perfect for boxes with 50-500 athletes. Try free for 30 days."
        keywords="crossfit gym software, crossfit box management, crossfit scheduling software, crossfit gym app, wod tracking software"
        canonical="https://gymunitysuite.com/solutions/crossfit-gyms"
        schema={{
          '@context': 'https://schema.org',
          '@type': 'Product',
          name: 'Gym Unity Suite - CrossFit Box Software',
          description: 'Complete CrossFit box management software with WOD scheduling, performance tracking, and competition management.',
          brand: {
            '@type': 'Brand',
            name: 'Gym Unity Suite'
          },
          offers: {
            '@type': 'Offer',
            price: '149',
            priceCurrency: 'USD',
            priceValidUntil: '2026-12-31',
            availability: 'https://schema.org/InStock'
          },
          aggregateRating: {
            '@type': 'AggregateRating',
            ratingValue: '4.8',
            reviewCount: '127'
          }
        }}
      />

      <div className="min-h-screen bg-background">
        {/* Navigation */}
        <nav className="bg-card/95 backdrop-blur-sm border-b border-border sticky top-0 z-50">
          <div className="container mx-auto px-4 py-4 flex items-center justify-between">
            <Logo size="xl" linkToHome={true} />
            <div className="hidden md:flex items-center space-x-8">
              <a href="#features" className="text-foreground hover:text-primary transition-colors font-medium">
                Features
              </a>
              <a href="#pricing" className="text-foreground hover:text-primary transition-colors font-medium">
                Pricing
              </a>
              <Button onClick={() => navigate('/')} className="bg-primary hover:bg-primary/90">
                Get Started Free
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </div>
        </nav>

        {/* Hero Section */}
        <section className="container mx-auto px-4 py-20 text-center">
          <Badge className="mb-6 bg-primary/10 text-primary border-primary/20">
            Built for CrossFit Boxes
          </Badge>
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 text-foreground">
            CrossFit Gym Management Software Built for Boxes
          </h1>
          <p className="text-xl text-muted-foreground mb-8 max-w-3xl mx-auto">
            Run your CrossFit box with military precision. All-in-one platform with WOD scheduling,
            performance tracking, competition management, and branded mobile app—starting at just $149/month.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-12">
            <Button size="lg" onClick={() => navigate('/')} className="bg-primary hover:bg-primary/90">
              Start Free 30-Day Trial
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
        <section id="features" className="container mx-auto px-4 py-20 bg-muted/30">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Everything Your CrossFit Box Needs
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Purpose-built features for CrossFit boxes of all sizes
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {crossfitFeatures.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <Card key={index} className="border-border hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                      <Icon className="h-6 w-6 text-primary" />
                    </div>
                    <CardTitle className="text-xl">{feature.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <CardDescription className="text-base">{feature.description}</CardDescription>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </section>

        {/* Benefits List */}
        <section className="container mx-auto px-4 py-20">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl md:text-4xl font-bold mb-12 text-center">
              Built Specifically for CrossFit Boxes
            </h2>
            <div className="grid md:grid-cols-2 gap-4">
              {benefits.map((benefit, index) => (
                <div key={index} className="flex items-start gap-3">
                  <Check className="h-6 w-6 text-primary flex-shrink-0 mt-0.5" />
                  <span className="text-lg">{benefit}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Pricing Comparison */}
        <section id="pricing" className="container mx-auto px-4 py-20 bg-muted/30">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">
                Why CrossFit Boxes Choose Gym Unity Suite
              </h2>
              <p className="text-xl text-muted-foreground">
                Get more features at half the cost of Mindbody
              </p>
            </div>
            <Card>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-muted">
                      <tr>
                        <th className="text-left p-4 font-semibold">Feature</th>
                        <th className="text-center p-4 font-semibold">Mindbody</th>
                        <th className="text-center p-4 font-semibold bg-primary/10">Gym Unity Suite</th>
                      </tr>
                    </thead>
                    <tbody>
                      {pricingComparison.map((row, index) => (
                        <tr key={index} className="border-t border-border">
                          <td className="p-4 font-medium">{row.feature}</td>
                          <td className="text-center p-4">{row.mindbody}</td>
                          <td className="text-center p-4 bg-primary/5 font-semibold">{row.gymunity}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
            <div className="text-center mt-8">
              <p className="text-2xl font-bold text-primary mb-4">
                Save $2,160+ per year vs. Mindbody
              </p>
              <Button size="lg" onClick={() => navigate('/')} className="bg-primary hover:bg-primary/90">
                Start Saving Today
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </div>
          </div>
        </section>

        {/* Testimonial */}
        <section className="container mx-auto px-4 py-20">
          <Card className="max-w-3xl mx-auto">
            <CardContent className="p-8 md:p-12">
              <div className="flex gap-1 mb-6">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="h-6 w-6 fill-primary text-primary" />
                ))}
              </div>
              <blockquote className="text-xl md:text-2xl mb-6 leading-relaxed">
                "Gym Unity Suite has everything we need to run our box efficiently. The WOD scheduling
                is intuitive, and our athletes love tracking their progress in the mobile app. Plus,
                we're saving a ton compared to what we were paying before."
              </blockquote>
              <div>
                <div className="font-semibold text-lg">Mike Chen</div>
                <div className="text-muted-foreground">Owner, PowerFit CrossFit</div>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* CTA Section */}
        <section className="container mx-auto px-4 py-20 bg-muted/30">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-3xl md:text-4xl font-bold mb-6">
              Ready to Level Up Your CrossFit Box?
            </h2>
            <p className="text-xl text-muted-foreground mb-8">
              Join hundreds of CrossFit boxes that trust Gym Unity Suite to manage their business
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" onClick={() => navigate('/')} className="bg-primary hover:bg-primary/90">
                Start Free 30-Day Trial
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
              <Button size="lg" variant="outline" onClick={() => navigate('/contact')}>
                Talk to Sales
              </Button>
            </div>
            <p className="text-sm text-muted-foreground mt-6">
              No credit card required • Free onboarding & training • Cancel anytime
            </p>
          </div>
        </section>

        <Footer />
      </div>
    </>
  );
}
