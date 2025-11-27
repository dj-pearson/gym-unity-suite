import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { SEO, FAQSection, yogaStudioFAQs } from '@/components/seo';
import { Footer } from '@/components/layout/Footer';
import {
  Calendar,
  CreditCard,
  Users,
  Smartphone,
  Star,
  Check,
  ArrowRight,
  Heart,
  TrendingUp,
  Clock
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Logo } from '@/components/ui/logo';

export default function YogaStudiosPage() {
  const navigate = useNavigate();

  const yogaFeatures = [
    {
      icon: Calendar,
      title: 'Class Packs & Workshops',
      description: 'Flexible class packs, drop-in rates, and special workshop pricing. Perfect for yoga studio pricing models.'
    },
    {
      icon: Users,
      title: 'Instructor Management',
      description: 'Schedule multiple instructors, track certifications, and manage substitute teachers seamlessly.'
    },
    {
      icon: Smartphone,
      title: 'Member App',
      description: 'Branded mobile app where students can book classes, view schedules, and connect with your community.'
    },
    {
      icon: CreditCard,
      title: 'Automated Billing',
      description: 'Handle monthly memberships, class packs, and workshops with automated recurring billing.'
    },
    {
      icon: Heart,
      title: 'Waitlist Management',
      description: 'Automatic waitlist notifications when spots open up in popular classes.'
    },
    {
      icon: TrendingUp,
      title: 'Retention Tools',
      description: 'Track attendance patterns and automatically engage students who haven\'t visited recently.'
    }
  ];

  const benefits = [
    'Class capacity management with automatic waitlists',
    'Unlimited class types (Vinyasa, Hatha, Yin, Restorative, etc.)',
    'Workshop and special event management',
    'Instructor schedules and certifications',
    'Class pack and punch card systems',
    'Retail sales for mats, props, and merchandise',
    'Private session scheduling',
    'Student attendance history and analytics'
  ];

  const pricingComparison = [
    { feature: 'Monthly Cost (150 members)', mindbody: '$329/mo', gymunity: '$149/mo' },
    { feature: 'Setup Fees', mindbody: '$1,499', gymunity: '$0' },
    { feature: 'Branded Mobile App', mindbody: '❌', gymunity: '✅' },
    { feature: 'Class Pack Management', mindbody: '✅', gymunity: '✅' },
    { feature: 'Instructor Portal', mindbody: '✅', gymunity: '✅' },
    { feature: 'Customer Support', mindbody: '24-48hrs', gymunity: '<2hrs' }
  ];

  return (
    <>
      <SEO
        title="Yoga Studio Management Software | $149/mo"
        description="Complete yoga studio management software with class scheduling, instructor management, branded mobile app, and automated billing. Perfect for studios with 50-500 members. Try free for 30 days."
        keywords="yoga studio software, yoga studio management, yoga scheduling software, yoga class booking, yoga studio app"
        canonical="https://gymunitysuite.com/solutions/yoga-studios"
        schema={{
          '@context': 'https://schema.org',
          '@type': 'Product',
          name: 'Gym Unity Suite - Yoga Studio Software',
          description: 'Complete yoga studio management software with class scheduling, instructor management, and branded mobile app.',
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
            Built for Yoga Studios
          </Badge>
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 text-foreground">
            Yoga Studio Management Software That Actually Works
          </h1>
          <p className="text-xl text-muted-foreground mb-8 max-w-3xl mx-auto">
            Run your yoga studio with less stress and more profit. All-in-one platform with class scheduling,
            instructor management, branded mobile app, and automated billing—starting at just $149/month.
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
              Everything Your Yoga Studio Needs
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Purpose-built features for yoga studios of all sizes
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {yogaFeatures.map((feature, index) => {
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
              Built Specifically for Yoga Studios
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
                Why Yoga Studios Choose Gym Unity Suite
              </h2>
              <p className="text-xl text-muted-foreground">
                Save thousands compared to Mindbody while getting better features
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
                "Switching to Gym Unity Suite was the best decision we made for our studio.
                The class pack system works perfectly for our pricing model, and our students
                love the mobile app. We're saving over $200/month compared to Mindbody."
              </blockquote>
              <div>
                <div className="font-semibold text-lg">Emma Rodriguez</div>
                <div className="text-muted-foreground">Owner, Zen Yoga Studio</div>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* CTA Section */}
        <section className="container mx-auto px-4 py-20 bg-muted/30">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-3xl md:text-4xl font-bold mb-6">
              Ready to Transform Your Yoga Studio?
            </h2>
            <p className="text-xl text-muted-foreground mb-8">
              Join hundreds of yoga studios that trust Gym Unity Suite to manage their business
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

        {/* FAQ Section */}
        <FAQSection
          title="Yoga Studio Software FAQ"
          subtitle="Common questions about managing your yoga studio with Gym Unity Suite"
          faqs={yogaStudioFAQs}
          className="bg-background"
        />

        <Footer />
      </div>
    </>
  );
}
