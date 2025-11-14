import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { SEO, createFAQSchema } from '@/components/seo';
import { Footer } from '@/components/layout/Footer';
import {
  Check,
  X,
  ArrowRight,
  DollarSign,
  Users,
  Smartphone,
  Zap,
  Star
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Logo } from '@/components/ui/logo';

export default function GlofoxAlternativePage() {
  const navigate = useNavigate();

  const featureComparison = [
    {
      category: 'Core Features',
      features: [
        { name: 'Member Management', glofox: true, gymunity: true },
        { name: 'Class Scheduling', glofox: true, gymunity: true },
        { name: 'Automated Billing', glofox: true, gymunity: true },
        { name: 'Mobile App (Branded)', glofox: true, gymunity: true },
        { name: 'Reporting & Analytics', glofox: true, gymunity: true },
      ]
    },
    {
      category: 'Advanced Features',
      features: [
        { name: 'CRM & Sales Pipeline', glofox: false, gymunity: true },
        { name: 'Lead Scoring', glofox: false, gymunity: true },
        { name: 'Marketing Automation', glofox: 'Limited', gymunity: true },
        { name: 'Custom Branding (All Plans)', glofox: false, gymunity: true },
        { name: 'Multi-Location Support', glofox: true, gymunity: true },
      ]
    },
    {
      category: 'Support & Service',
      features: [
        { name: 'Setup Fees', glofox: '$999', gymunity: '$0' },
        { name: 'Free Onboarding', glofox: false, gymunity: true },
        { name: 'Response Time', glofox: '24hrs', gymunity: '<2hrs' },
        { name: 'Phone Support', glofox: 'Business+', gymunity: 'All Plans' },
        { name: 'Dedicated Success Manager', glofox: 'Enterprise', gymunity: 'Pro+' },
      ]
    }
  ];

  const pricingComparison = [
    {
      metric: 'Monthly Cost (150 members)',
      glofox: '$299/mo',
      gymunity: '$149/mo',
      savings: '$150/mo'
    },
    {
      metric: 'Setup Fees',
      glofox: '$999',
      gymunity: '$0',
      savings: '$999'
    },
    {
      metric: 'Annual Cost',
      glofox: '$4,587',
      gymunity: '$1,788',
      savings: '$2,799/year'
    }
  ];

  const prosConsGlofox = {
    pros: [
      'Well-established brand with market presence',
      'Comprehensive feature set for larger studios',
      'Good international payment support',
      'Strong reporting capabilities'
    ],
    cons: [
      'High setup fees ($999+)',
      'No CRM included in base plans',
      'Slower customer support response times',
      'Expensive for small to mid-sized studios',
      'Limited marketing automation on lower tiers'
    ]
  };

  const prosConsGymUnity = {
    pros: [
      'No setup fees - start free',
      'CRM & sales pipeline included',
      'Fast support response (<2 hours)',
      'More affordable for small-mid studios',
      'Custom branding on all plans',
      'Marketing automation included'
    ],
    cons: [
      'Newer platform (less market presence)',
      'Smaller integration marketplace',
      'Not ideal for 10,000+ member facilities'
    ]
  };

  const faqs = [
    {
      question: 'Is Gym Unity Suite a good alternative to Glofox?',
      answer: 'Yes, Gym Unity Suite is an excellent alternative to Glofox, especially for boutique fitness studios with under 500 members. You get similar core features (member management, class scheduling, automated billing, mobile app) at a significantly lower price point, with no setup fees and faster support response times.'
    },
    {
      question: 'What are the main differences between Glofox and Gym Unity Suite?',
      answer: 'The main differences are: 1) Pricing - Gym Unity Suite starts at $149/mo with no setup fees vs Glofox at $299/mo plus $999 setup, 2) CRM - included in Gym Unity Suite, add-on for Glofox, 3) Support - <2hr response for Gym Unity Suite vs 24hrs for Glofox, 4) Custom branding - included on all Gym Unity Suite plans vs limited on Glofox.'
    },
    {
      question: 'Can I migrate my data from Glofox to Gym Unity Suite?',
      answer: 'Yes! We provide free data migration assistance for all new customers switching from Glofox. Our team will help you export your member data, class schedules, and billing information from Glofox and import it into Gym Unity Suite with zero downtime.'
    },
    {
      question: 'Which is cheaper, Glofox or Gym Unity Suite?',
      answer: 'Gym Unity Suite is significantly cheaper. For a studio with 150 members, you save $2,799 per year compared to Glofox. This includes the $999 Glofox setup fee savings plus $150/month in subscription savings.'
    },
    {
      question: 'Does Gym Unity Suite have a mobile app like Glofox?',
      answer: 'Yes, Gym Unity Suite includes a fully branded mobile app (iOS and Android) on all plans. Members can book classes, view schedules, manage their membership, and track their progress - all from their phone.'
    }
  ];

  return (
    <>
      <SEO
        title="Glofox Alternative - Better & More Affordable | Gym Unity Suite"
        description="Looking for a Glofox alternative? Gym Unity Suite offers the same features at half the price, with no setup fees. Save $2,799/year. Try free for 30 days."
        keywords="glofox alternative, cheaper alternative to glofox, glofox vs gym unity suite, glofox competitor, gym management software alternative"
        canonical="https://gymunitysuite.com/compare/glofox-alternative"
        schema={{
          '@context': 'https://schema.org',
          '@type': 'Article',
          headline: 'Glofox Alternative: Complete Comparison Guide 2025',
          description: 'Comprehensive comparison of Glofox vs Gym Unity Suite. Compare features, pricing, and support to find the best gym management software for your studio.',
          author: {
            '@type': 'Organization',
            name: 'Gym Unity Suite'
          },
          publisher: {
            '@type': 'Organization',
            name: 'Gym Unity Suite',
            logo: {
              '@type': 'ImageObject',
              url: 'https://gymunitysuite.com/assets/logo.png'
            }
          },
          datePublished: '2025-11-14',
          dateModified: '2025-11-14'
        }}
      />

      <div className="min-h-screen bg-background">
        {/* Navigation */}
        <nav className="bg-card/95 backdrop-blur-sm border-b border-border sticky top-0 z-50">
          <div className="container mx-auto px-4 py-4 flex items-center justify-between">
            <Logo size="xl" linkToHome={true} />
            <div className="hidden md:flex items-center space-x-8">
              <a href="#comparison" className="text-foreground hover:text-primary transition-colors font-medium">
                Comparison
              </a>
              <a href="#pricing" className="text-foreground hover:text-primary transition-colors font-medium">
                Pricing
              </a>
              <a href="#faq" className="text-foreground hover:text-primary transition-colors font-medium">
                FAQ
              </a>
              <Button onClick={() => navigate('/')} className="bg-primary hover:bg-primary/90">
                Try Free
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </div>
        </nav>

        {/* Hero Section */}
        <section className="container mx-auto px-4 py-20 text-center">
          <Badge className="mb-6 bg-primary/10 text-primary border-primary/20">
            Glofox Alternative
          </Badge>
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 text-foreground">
            A Better, More Affordable Alternative to Glofox
          </h1>
          <p className="text-xl text-muted-foreground mb-8 max-w-3xl mx-auto">
            Get all the features you love about Glofox—member management, class scheduling, mobile app,
            automated billing—at half the price, with no setup fees and faster support.
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
          <div className="max-w-2xl mx-auto bg-primary/10 border border-primary/20 rounded-lg p-6">
            <p className="text-2xl font-bold text-primary mb-2">
              Save $2,799 per year vs. Glofox
            </p>
            <p className="text-muted-foreground">
              No setup fees • Faster support • CRM included
            </p>
          </div>
        </section>

        {/* Executive Summary */}
        <section className="container mx-auto px-4 py-20 bg-muted/30">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl md:text-4xl font-bold mb-8 text-center">
              Quick Verdict: When to Choose Each
            </h2>
            <div className="grid md:grid-cols-2 gap-8">
              <Card>
                <CardHeader>
                  <CardTitle>Choose Glofox if you:</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-start gap-2">
                    <Check className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                    <span>Have a large studio (500+ members)</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <Check className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                    <span>Need extensive international payment support</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <Check className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                    <span>Don't mind higher costs for brand recognition</span>
                  </div>
                </CardContent>
              </Card>
              <Card className="border-primary">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    Choose Gym Unity Suite if you:
                    <Badge className="bg-primary">Recommended</Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-start gap-2">
                    <Check className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                    <span>Want to save $2,700+ per year</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <Check className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                    <span>Need CRM & sales pipeline included</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <Check className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                    <span>Value fast support response times</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <Check className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                    <span>Have a boutique studio (50-500 members)</span>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* Feature Comparison */}
        <section id="comparison" className="container mx-auto px-4 py-20">
          <div className="max-w-5xl mx-auto">
            <h2 className="text-3xl md:text-4xl font-bold mb-12 text-center">
              Feature-by-Feature Comparison
            </h2>
            <Card>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  {featureComparison.map((category, catIndex) => (
                    <div key={catIndex}>
                      <div className="bg-muted p-4 font-semibold text-lg border-b border-border">
                        {category.category}
                      </div>
                      <table className="w-full">
                        <thead>
                          <tr className="bg-muted/50">
                            <th className="text-left p-4 font-semibold">Feature</th>
                            <th className="text-center p-4 font-semibold w-32">Glofox</th>
                            <th className="text-center p-4 font-semibold w-32 bg-primary/5">Gym Unity Suite</th>
                          </tr>
                        </thead>
                        <tbody>
                          {category.features.map((feature, featIndex) => (
                            <tr key={featIndex} className="border-t border-border">
                              <td className="p-4">{feature.name}</td>
                              <td className="text-center p-4">
                                {typeof feature.glofox === 'boolean' ? (
                                  feature.glofox ? (
                                    <Check className="h-5 w-5 text-green-600 inline" />
                                  ) : (
                                    <X className="h-5 w-5 text-muted-foreground inline" />
                                  )
                                ) : (
                                  <span className="text-sm">{feature.glofox}</span>
                                )}
                              </td>
                              <td className="text-center p-4 bg-primary/5">
                                {typeof feature.gymunity === 'boolean' ? (
                                  feature.gymunity ? (
                                    <Check className="h-5 w-5 text-primary inline" />
                                  ) : (
                                    <X className="h-5 w-5 text-muted-foreground inline" />
                                  )
                                ) : (
                                  <span className="text-sm font-semibold">{feature.gymunity}</span>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Pricing Breakdown */}
        <section id="pricing" className="container mx-auto px-4 py-20 bg-muted/30">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl md:text-4xl font-bold mb-12 text-center">
              Transparent Pricing Comparison
            </h2>
            <Card>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-muted">
                      <tr>
                        <th className="text-left p-4 font-semibold">Pricing Metric</th>
                        <th className="text-center p-4 font-semibold">Glofox</th>
                        <th className="text-center p-4 font-semibold bg-primary/10">Gym Unity Suite</th>
                        <th className="text-center p-4 font-semibold bg-green-50 dark:bg-green-950">Your Savings</th>
                      </tr>
                    </thead>
                    <tbody>
                      {pricingComparison.map((row, index) => (
                        <tr key={index} className="border-t border-border">
                          <td className="p-4 font-medium">{row.metric}</td>
                          <td className="text-center p-4">{row.glofox}</td>
                          <td className="text-center p-4 bg-primary/5 font-semibold">{row.gymunity}</td>
                          <td className="text-center p-4 bg-green-50 dark:bg-green-950 font-bold text-green-600 dark:text-green-400">
                            {row.savings}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
            <div className="text-center mt-8">
              <Button size="lg" onClick={() => navigate('/')} className="bg-primary hover:bg-primary/90">
                Start Saving Today
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </div>
          </div>
        </section>

        {/* Pros & Cons */}
        <section className="container mx-auto px-4 py-20">
          <div className="max-w-5xl mx-auto">
            <h2 className="text-3xl md:text-4xl font-bold mb-12 text-center">
              Honest Assessment: Pros & Cons
            </h2>
            <div className="grid md:grid-cols-2 gap-8">
              <div>
                <h3 className="text-2xl font-bold mb-6">Glofox</h3>
                <Card className="mb-4">
                  <CardHeader className="bg-green-50 dark:bg-green-950">
                    <CardTitle className="text-lg">Pros</CardTitle>
                  </CardHeader>
                  <CardContent className="pt-6">
                    <ul className="space-y-3">
                      {prosConsGlofox.pros.map((pro, index) => (
                        <li key={index} className="flex items-start gap-2">
                          <Check className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                          <span>{pro}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="bg-red-50 dark:bg-red-950">
                    <CardTitle className="text-lg">Cons</CardTitle>
                  </CardHeader>
                  <CardContent className="pt-6">
                    <ul className="space-y-3">
                      {prosConsGlofox.cons.map((con, index) => (
                        <li key={index} className="flex items-start gap-2">
                          <X className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
                          <span>{con}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              </div>
              <div>
                <h3 className="text-2xl font-bold mb-6">Gym Unity Suite</h3>
                <Card className="mb-4">
                  <CardHeader className="bg-green-50 dark:bg-green-950">
                    <CardTitle className="text-lg">Pros</CardTitle>
                  </CardHeader>
                  <CardContent className="pt-6">
                    <ul className="space-y-3">
                      {prosConsGymUnity.pros.map((pro, index) => (
                        <li key={index} className="flex items-start gap-2">
                          <Check className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                          <span>{pro}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="bg-red-50 dark:bg-red-950">
                    <CardTitle className="text-lg">Cons</CardTitle>
                  </CardHeader>
                  <CardContent className="pt-6">
                    <ul className="space-y-3">
                      {prosConsGymUnity.cons.map((con, index) => (
                        <li key={index} className="flex items-start gap-2">
                          <X className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
                          <span>{con}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section id="faq" className="container mx-auto px-4 py-20 bg-muted/30">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl md:text-4xl font-bold mb-12 text-center">
              Frequently Asked Questions
            </h2>
            <div className="space-y-6">
              {faqs.map((faq, index) => (
                <Card key={index}>
                  <CardHeader>
                    <CardTitle className="text-lg">{faq.question}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground leading-relaxed">{faq.answer}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="container mx-auto px-4 py-20">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-3xl md:text-4xl font-bold mb-6">
              Ready to Make the Switch?
            </h2>
            <p className="text-xl text-muted-foreground mb-8">
              Join hundreds of studios that switched from Glofox and never looked back
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
              <Button size="lg" onClick={() => navigate('/')} className="bg-primary hover:bg-primary/90">
                Start Free 30-Day Trial
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
              <Button size="lg" variant="outline" onClick={() => navigate('/contact')}>
                Talk to Our Team
              </Button>
            </div>
            <p className="text-sm text-muted-foreground">
              Free data migration • No setup fees • No credit card required
            </p>
          </div>
        </section>

        <Footer />
      </div>
    </>
  );
}
