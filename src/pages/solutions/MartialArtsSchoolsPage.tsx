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
  Award,
  TrendingUp,
  Shield
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Logo } from '@/components/ui/logo';

export default function MartialArtsSchoolsPage() {
  const navigate = useNavigate();

  const martialArtsFeatures = [
    {
      icon: Award,
      title: 'Belt Rank Tracking',
      description: 'Track student belt progression, test dates, and requirements. Automated reminders for upcoming tests and rank advancement.'
    },
    {
      icon: Calendar,
      title: 'Class & Program Management',
      description: 'Manage kids\' classes, adult programs, private lessons, and open mat sessions all in one system.'
    },
    {
      icon: Users,
      title: 'Family Plans & Billing',
      description: 'Special family membership pricing with automatic discounts. One bill for multiple family members.'
    },
    {
      icon: Smartphone,
      title: 'Student Mobile App',
      description: 'Branded app where students can book classes, view curriculum, track progress, and watch technique videos.'
    },
    {
      icon: Shield,
      title: 'Tournament Management',
      description: 'Organize in-school tournaments, track competition results, and manage external tournament registrations.'
    },
    {
      icon: TrendingUp,
      title: 'Progress Tracking',
      description: 'Track attendance, skills mastered, and testing history. Show students their journey from white belt to black belt.'
    }
  ];

  const benefits = [
    'Belt progression and testing management',
    'Curriculum tracking by rank',
    'Family plan discounts and billing',
    'Kids\' class and adult program separation',
    'Private lesson scheduling',
    'Equipment sales and uniform tracking',
    'Tournament and competition management',
    'Attendance tracking with parent notifications',
    'Skills assessment and evaluation tools',
    'Instructor certification tracking',
    'Retail sales for uniforms and gear',
    'Birthday party and special event booking'
  ];

  const pricingComparison = [
    { feature: 'Monthly Cost (200 students)', mindbody: '$329/mo', gymunity: '$149/mo' },
    { feature: 'Setup Fees', mindbody: '$1,499', gymunity: '$0' },
    { feature: 'Belt Tracking', mindbody: '❌', gymunity: '✅' },
    { feature: 'Family Plans', mindbody: '✅', gymunity: '✅' },
    { feature: 'Branded Mobile App', mindbody: '❌', gymunity: '✅' },
    { feature: 'Customer Support', mindbody: '24-48hrs', gymunity: '<2hrs' }
  ];

  return (
    <>
      <SEO
        title="Martial Arts School Software | Belt Tracking & Family Plans | $149/mo"
        description="Complete martial arts school management software with belt tracking, family plans, tournament management, and branded mobile app. Perfect for karate, taekwondo, jiu-jitsu schools. Try free for 30 days."
        keywords="martial arts school software, martial arts studio management, karate school software, martial arts belt tracking, taekwondo studio software, bjj gym software"
        canonical="https://gymunitysuite.com/solutions/martial-arts-schools"
        schema={{
          '@context': 'https://schema.org',
          '@type': 'Product',
          name: 'Gym Unity Suite - Martial Arts School Software',
          description: 'Complete martial arts school management software with belt tracking, family plans, and tournament management.',
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
            Built for Martial Arts Schools
          </Badge>
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 text-foreground">
            Martial Arts School Software with Belt Tracking & Family Plans
          </h1>
          <p className="text-xl text-muted-foreground mb-8 max-w-3xl mx-auto">
            Run your martial arts school with precision and discipline. All-in-one platform with belt progression tracking,
            family plan management, tournament organization, and branded mobile app—starting at just $149/month.
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
          <div className="flex items-center justify-center gap-4 text-sm text-muted-foreground flex-wrap">
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
              Everything Your Martial Arts School Needs
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Purpose-built features for karate, taekwondo, jiu-jitsu, MMA, and all martial arts schools
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {martialArtsFeatures.map((feature, index) => {
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

        {/* Belt Tracking Highlight */}
        <section className="container mx-auto px-4 py-20">
          <div className="max-w-4xl mx-auto">
            <div className="grid md:grid-cols-2 gap-12 items-center">
              <div>
                <Badge className="mb-4 bg-primary/10 text-primary border-primary/20">
                  Built for Martial Arts
                </Badge>
                <h2 className="text-3xl md:text-4xl font-bold mb-6">
                  Belt Progression Tracking That Actually Works
                </h2>
                <p className="text-lg text-muted-foreground mb-6">
                  Unlike generic gym software, we built this specifically for martial arts schools.
                  Track each student's journey from white belt to black belt with ease.
                </p>
                <ul className="space-y-3">
                  <li className="flex items-start gap-2">
                    <Check className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                    <span>Custom belt systems for your martial art</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                    <span>Testing requirements by rank</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                    <span>Automatic testing reminders</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                    <span>Digital belt certificates</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                    <span>Progress tracking for students and parents</span>
                  </li>
                </ul>
              </div>
              <div className="bg-gradient-to-br from-primary/10 to-primary/5 p-8 rounded-lg border border-primary/20">
                <h3 className="font-semibold text-lg mb-4">Belt Progression Example</h3>
                <div className="space-y-3">
                  <div className="flex items-center gap-3 p-3 bg-card rounded border border-border">
                    <div className="h-8 w-8 rounded-full bg-white border-2 border-gray-300"></div>
                    <div>
                      <div className="font-medium">White Belt</div>
                      <div className="text-sm text-muted-foreground">Starting rank</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-3 bg-card rounded border border-border">
                    <div className="h-8 w-8 rounded-full bg-yellow-400 border-2 border-yellow-500"></div>
                    <div>
                      <div className="font-medium">Yellow Belt</div>
                      <div className="text-sm text-muted-foreground">3-6 months</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-3 bg-card rounded border border-border">
                    <div className="h-8 w-8 rounded-full bg-green-500 border-2 border-green-600"></div>
                    <div>
                      <div className="font-medium">Green Belt</div>
                      <div className="text-sm text-muted-foreground">6-12 months</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-3 bg-card rounded border border-primary/50">
                    <div className="h-8 w-8 rounded-full bg-black border-2 border-gray-600"></div>
                    <div>
                      <div className="font-medium">Black Belt</div>
                      <div className="text-sm text-muted-foreground">3-5 years</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Benefits List */}
        <section className="container mx-auto px-4 py-20 bg-muted/30">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl md:text-4xl font-bold mb-12 text-center">
              Built Specifically for Martial Arts Schools
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
        <section id="pricing" className="container mx-auto px-4 py-20">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">
                Why Martial Arts Schools Choose Gym Unity Suite
              </h2>
              <p className="text-xl text-muted-foreground">
                Get specialized martial arts features at half the cost of Mindbody
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
              <p className="text-muted-foreground mb-6">
                Plus get belt tracking that Mindbody doesn't even offer
              </p>
              <Button size="lg" onClick={() => navigate('/')} className="bg-primary hover:bg-primary/90">
                Start Saving Today
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </div>
          </div>
        </section>

        {/* Testimonial */}
        <section className="container mx-auto px-4 py-20 bg-muted/30">
          <Card className="max-w-3xl mx-auto">
            <CardContent className="p-8 md:p-12">
              <div className="flex gap-1 mb-6">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="h-6 w-6 fill-primary text-primary" />
                ))}
              </div>
              <blockquote className="text-xl md:text-2xl mb-6 leading-relaxed">
                "The belt tracking feature alone is worth the price. Students and parents love seeing their
                progression in the mobile app. We've been able to eliminate so much paperwork and manual tracking.
                Plus, we're saving over $150/month compared to our old system."
              </blockquote>
              <div>
                <div className="font-semibold text-lg">Master David Kim</div>
                <div className="text-muted-foreground">Owner, Dragon Martial Arts Academy</div>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* CTA Section */}
        <section className="container mx-auto px-4 py-20">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-3xl md:text-4xl font-bold mb-6">
              Ready to Transform Your Martial Arts School?
            </h2>
            <p className="text-xl text-muted-foreground mb-8">
              Join hundreds of martial arts schools that trust Gym Unity Suite to manage their business
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
