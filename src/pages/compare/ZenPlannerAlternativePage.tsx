import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { SEO, FAQSection, zenPlannerAlternativeFAQs } from '@/components/seo';
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

export default function ZenPlannerAlternativePage() {
  const navigate = useNavigate();

  const featureComparison = [
    {
      category: 'Core Features',
      features: [
        { name: 'Member Management', zenplanner: true, gymunity: true },
        { name: 'Class Scheduling', zenplanner: true, gymunity: true },
        { name: 'Automated Billing', zenplanner: true, gymunity: true },
        { name: 'Mobile App (Branded)', zenplanner: 'Add-on', gymunity: true },
        { name: 'Reporting & Analytics', zenplanner: true, gymunity: true },
      ]
    },
    {
      category: 'Advanced Features',
      features: [
        { name: 'CRM & Sales Pipeline', zenplanner: true, gymunity: true },
        { name: 'Lead Scoring', zenplanner: false, gymunity: true },
        { name: 'Marketing Automation', zenplanner: 'Basic', gymunity: 'Advanced' },
        { name: 'Custom Branding (All Plans)', zenplanner: false, gymunity: true },
        { name: 'White Label Mobile App', zenplanner: 'Extra $50/mo', gymunity: 'Included' },
      ]
    },
    {
      category: 'Pricing & Support',
      features: [
        { name: 'Monthly Cost (150 members)', zenplanner: '$217/mo', gymunity: '$149/mo' },
        { name: 'Setup Fees', zenplanner: '$0', gymunity: '$0' },
        { name: 'Contract Length', zenplanner: '12 months', gymunity: 'Month-to-month' },
        { name: 'Response Time', zenplanner: '24hrs', gymunity: '<2hrs' },
        { name: 'Phone Support', zenplanner: 'All Plans', gymunity: 'All Plans' },
      ]
    }
  ];

  const pricingComparison = [
    {
      metric: 'Monthly Cost (150 members)',
      zenplanner: '$217/mo',
      gymunity: '$149/mo',
      savings: '$68/mo'
    },
    {
      metric: 'Branded Mobile App',
      zenplanner: '+$50/mo',
      gymunity: 'Included',
      savings: '$50/mo'
    },
    {
      metric: 'Total Monthly Cost',
      zenplanner: '$267/mo',
      gymunity: '$149/mo',
      savings: '$118/mo'
    },
    {
      metric: 'Annual Cost',
      zenplanner: '$3,204',
      gymunity: '$1,788',
      savings: '$1,416/year'
    }
  ];

  const prosConsZenPlanner = {
    pros: [
      'Strong CRM capabilities',
      'Good for larger gyms and martial arts schools',
      'Comprehensive workout tracking features',
      'Solid billing and payment processing',
      'Good reporting and analytics'
    ],
    cons: [
      'More expensive than alternatives',
      'Requires 12-month contract',
      'Mobile app costs extra ($50/mo)',
      'UI can feel dated and cluttered',
      'Slower customer support response',
      'Limited marketing automation'
    ]
  };

  const prosConsGymUnity = {
    pros: [
      'More affordable ($118/mo savings)',
      'No long-term contracts required',
      'Branded mobile app included',
      'Modern, intuitive interface',
      'Fast support response (<2 hours)',
      'Advanced marketing automation',
      'Lead scoring included'
    ],
    cons: [
      'Newer platform (less market presence)',
      'Smaller user community',
      'Fewer integrations than Zen Planner'
    ]
  };

  const faqs = [
    {
      question: 'Is Gym Unity Suite a good alternative to Zen Planner?',
      answer: 'Yes, Gym Unity Suite is an excellent alternative to Zen Planner, especially for boutique fitness studios and gyms with under 500 members. You get similar core features (member management, class scheduling, CRM, automated billing) at a lower price point, with a branded mobile app included and no long-term contracts required.'
    },
    {
      question: 'What are the main differences between Zen Planner and Gym Unity Suite?',
      answer: 'The main differences are: 1) Pricing - Gym Unity Suite is $118/mo cheaper when you include the mobile app, 2) Contracts - Zen Planner requires 12 months, Gym Unity Suite is month-to-month, 3) Mobile App - Extra $50/mo on Zen Planner, included with Gym Unity Suite, 4) Support - <2hr response for Gym Unity Suite vs 24hrs for Zen Planner, 5) Interface - Gym Unity Suite has a more modern UI.'
    },
    {
      question: 'Can I migrate my data from Zen Planner to Gym Unity Suite?',
      answer: 'Yes! We provide free data migration assistance for all customers switching from Zen Planner. Our team will help you export your member data, class schedules, billing information, and workout history from Zen Planner and import it into Gym Unity Suite with minimal downtime.'
    },
    {
      question: 'Which is cheaper, Zen Planner or Gym Unity Suite?',
      answer: 'Gym Unity Suite is significantly cheaper. When comparing apples-to-apples (including the mobile app), you save $118 per month or $1,416 per year. Gym Unity Suite starts at $149/mo with everything included, while Zen Planner is $217/mo plus $50/mo for the mobile app ($267/mo total).'
    },
    {
      question: 'Does Gym Unity Suite work for CrossFit gyms and martial arts schools like Zen Planner?',
      answer: 'Yes! Gym Unity Suite works great for CrossFit boxes, martial arts schools, yoga studios, and all types of fitness facilities. We have built-in features for WOD tracking, belt progression, class packs, and all the specialized needs of different fitness verticals.'
    },
    {
      question: 'Do I need a long-term contract with Gym Unity Suite?',
      answer: 'No! Unlike Zen Planner which requires a 12-month contract, Gym Unity Suite is month-to-month. You can cancel anytime with no penalties or early termination fees.'
    }
  ];

  return (
    <>
      <SEO
        title="Zen Planner Alternative - Better & More Affordable | Gym Unity Suite"
        description="Looking for a Zen Planner alternative? Gym Unity Suite offers the same features at a lower price, with no contracts and mobile app included. Save $1,416/year. Try free for 30 days."
        keywords="zen planner alternative, cheaper alternative to zen planner, zen planner vs gym unity suite, zen planner competitor, gym management software"
        canonical="https://gymunitysuite.com/compare/zen-planner-alternative"
        schema={{
          '@context': 'https://schema.org',
          '@type': 'Article',
          headline: 'Zen Planner Alternative: Complete Comparison Guide 2025',
          description: 'Comprehensive comparison of Zen Planner vs Gym Unity Suite. Compare features, pricing, contracts, and support to find the best gym management software.',
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
            Zen Planner Alternative
          </Badge>
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 text-foreground">
            A Better Alternative to Zen Planner—No Contracts Required
          </h1>
          <p className="text-xl text-muted-foreground mb-8 max-w-3xl mx-auto">
            Get all the features you need—member management, class scheduling, CRM, mobile app,
            automated billing—at a lower price with no 12-month contract. Cancel anytime.
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
              Save $1,416 per year vs. Zen Planner
            </p>
            <p className="text-muted-foreground">
              No contracts • Mobile app included • Faster support
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
                  <CardTitle>Choose Zen Planner if you:</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-start gap-2">
                    <Check className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                    <span>Have a large gym (500+ members)</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <Check className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                    <span>Need extensive workout tracking features</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <Check className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                    <span>Are comfortable with 12-month contracts</span>
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
                    <span>Want to save $1,400+ per year</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <Check className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                    <span>Need month-to-month flexibility</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <Check className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                    <span>Want mobile app included (not extra)</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <Check className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                    <span>Prefer a modern, intuitive interface</span>
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
                            <th className="text-center p-4 font-semibold w-32">Zen Planner</th>
                            <th className="text-center p-4 font-semibold w-32 bg-primary/5">Gym Unity Suite</th>
                          </tr>
                        </thead>
                        <tbody>
                          {category.features.map((feature, featIndex) => (
                            <tr key={featIndex} className="border-t border-border">
                              <td className="p-4">{feature.name}</td>
                              <td className="text-center p-4">
                                {typeof feature.zenplanner === 'boolean' ? (
                                  feature.zenplanner ? (
                                    <Check className="h-5 w-5 text-green-600 inline" />
                                  ) : (
                                    <X className="h-5 w-5 text-muted-foreground inline" />
                                  )
                                ) : (
                                  <span className="text-sm">{feature.zenplanner}</span>
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
              True Cost Comparison (Apples-to-Apples)
            </h2>
            <Card>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-muted">
                      <tr>
                        <th className="text-left p-4 font-semibold">Cost Component</th>
                        <th className="text-center p-4 font-semibold">Zen Planner</th>
                        <th className="text-center p-4 font-semibold bg-primary/10">Gym Unity Suite</th>
                        <th className="text-center p-4 font-semibold bg-green-50 dark:bg-green-950">Your Savings</th>
                      </tr>
                    </thead>
                    <tbody>
                      {pricingComparison.map((row, index) => (
                        <tr key={index} className="border-t border-border">
                          <td className="p-4 font-medium">{row.metric}</td>
                          <td className="text-center p-4">{row.zenplanner}</td>
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
            <div className="mt-8 p-6 bg-amber-50 dark:bg-amber-950 border border-amber-200 dark:border-amber-800 rounded-lg">
              <p className="text-sm font-semibold mb-2">Important Note:</p>
              <p className="text-sm text-muted-foreground">
                Zen Planner requires a 12-month contract. If you cancel early, you'll owe the remaining months.
                Gym Unity Suite is month-to-month with no contracts—cancel anytime with no penalties.
              </p>
            </div>
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
                <h3 className="text-2xl font-bold mb-6">Zen Planner</h3>
                <Card className="mb-4">
                  <CardHeader className="bg-green-50 dark:bg-green-950">
                    <CardTitle className="text-lg">Pros</CardTitle>
                  </CardHeader>
                  <CardContent className="pt-6">
                    <ul className="space-y-3">
                      {prosConsZenPlanner.pros.map((pro, index) => (
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
                      {prosConsZenPlanner.cons.map((con, index) => (
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
              Ready to Break Free from Contracts?
            </h2>
            <p className="text-xl text-muted-foreground mb-8">
              Join hundreds of gyms that switched from Zen Planner to Gym Unity Suite
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
              Free data migration • No contracts • No credit card required
            </p>
          </div>
        </section>

        {/* FAQ Section */}
        <FAQSection
          title="Zen Planner Alternative FAQ"
          subtitle="Common questions about switching from Zen Planner to Gym Unity Suite"
          faqs={zenPlannerAlternativeFAQs}
          className="bg-muted/30"
        />

        <Footer />
      </div>
    </>
  );
}
