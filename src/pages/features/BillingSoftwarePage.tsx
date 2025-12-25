import React from 'react';
import { Helmet } from 'react-helmet-async';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Footer } from '@/components/layout/Footer';
import {
  CreditCard,
  RefreshCw,
  Bell,
  FileText,
  Shield,
  BarChart3,
  ArrowRight,
  Check,
  Star,
  DollarSign,
  Calendar,
  Zap
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Logo } from '@/components/ui/logo';

const billingFeatures = [
  {
    title: 'Automated Recurring Billing',
    description: 'Set up automatic monthly, quarterly, or annual billing cycles. Never chase payments again with intelligent retry logic and automated dunning.',
    icon: RefreshCw
  },
  {
    title: 'Multiple Payment Methods',
    description: 'Accept credit cards, debit cards, ACH transfers, and digital wallets. Give members flexibility in how they pay.',
    icon: CreditCard
  },
  {
    title: 'Smart Payment Reminders',
    description: 'Automated email and SMS reminders before charges, failed payment notifications, and proactive communication to reduce churn.',
    icon: Bell
  },
  {
    title: 'Flexible Invoicing',
    description: 'Generate professional invoices automatically, customize branding, and send itemized receipts. Perfect for personal training and retail.',
    icon: FileText
  },
  {
    title: 'PCI-Compliant Security',
    description: 'Bank-level encryption and PCI DSS compliance ensure member payment data is always protected and secure.',
    icon: Shield
  },
  {
    title: 'Revenue Analytics',
    description: 'Track MRR, ARR, payment success rates, and revenue trends. Identify opportunities to optimize pricing and reduce failed payments.',
    icon: BarChart3
  }
];

const benefits = [
  'Reduce payment collection time by 85%',
  'Increase successful payment rate to 98%+',
  'Save 15+ hours per week on billing admin',
  'Reduce involuntary churn by up to 40%',
  'Eliminate late payment follow-ups',
  'Improve cash flow predictability'
];

const testimonials = [
  {
    name: 'Jennifer Martinez',
    role: 'Owner, FitFusion Studio',
    content: 'Automated billing transformed our business. We went from chasing payments constantly to having predictable revenue. Failed payments dropped 60% thanks to the smart retry system.',
    rating: 5,
    gym: 'FitFusion Studio - 650 members'
  },
  {
    name: 'David Chen',
    role: 'GM, Iron Valley Fitness',
    content: 'The billing analytics alone are worth it. We can now predict cash flow accurately and the automated dunning recovered $8K in failed payments last month that we would have lost.',
    rating: 5,
    gym: 'Iron Valley Fitness - 1,500 members'
  }
];

const comparisonData = [
  { feature: 'Automated recurring billing', gymunity: true, mindbody: true, zenplanner: true, glofox: true },
  { feature: 'Smart payment retry logic', gymunity: true, mindbody: false, zenplanner: false, glofox: true },
  { feature: 'ACH & credit card processing', gymunity: true, mindbody: true, zenplanner: true, glofox: false },
  { feature: 'Failed payment recovery', gymunity: true, mindbody: false, zenplanner: false, glofox: false },
  { feature: 'Revenue forecasting', gymunity: true, mindbody: true, zenplanner: false, glofox: false },
  { feature: 'Custom invoice branding', gymunity: true, mindbody: false, zenplanner: false, glofox: true }
];

const pricingComparison = [
  { provider: 'Gym Unity Suite', monthly: '$97', transactionFee: '2.9% + $0.30', setup: '$0' },
  { provider: 'Mindbody', monthly: '$129+', transactionFee: '3.5% + $0.15', setup: '$299' },
  { provider: 'ZenPlanner', monthly: '$117+', transactionFee: '3.2% + $0.25', setup: '$199' },
  { provider: 'Glofox', monthly: '$110+', transactionFee: '3.0% + $0.30', setup: '$0' }
];

export default function BillingSoftwarePage() {
  const navigate = useNavigate();

  const structuredData = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    "name": "Gym Unity Suite Billing Software",
    "description": "Automated gym billing and payment processing software with recurring billing, smart payment retry, and revenue analytics. Designed for fitness studios and gyms.",
    "url": "https://gymunitysuite.com/features/billing-software",
    "applicationCategory": "BusinessApplication",
    "operatingSystem": "Web Browser, iOS, Android",
    "featureList": billingFeatures.map(f => f.title),
    "offers": {
      "@type": "Offer",
      "name": "Gym Unity Suite Billing",
      "price": "97",
      "priceCurrency": "USD",
      "description": "Complete gym billing software with 30-day free trial"
    },
    "aggregateRating": {
      "@type": "AggregateRating",
      "ratingValue": "4.9",
      "reviewCount": "284"
    }
  };

  const faqData = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": [
      {
        "@type": "Question",
        "name": "What is gym billing software?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Gym billing software automates membership payment collection, recurring billing cycles, invoice generation, and payment processing for fitness businesses. It handles credit cards, ACH transfers, failed payment recovery, and provides revenue analytics—eliminating manual billing tasks and improving cash flow."
        }
      },
      {
        "@type": "Question",
        "name": "How does automated billing reduce churn?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Automated billing reduces involuntary churn by 30-40% through smart payment retry logic, proactive payment reminders, and automated dunning campaigns. When a payment fails, the system automatically retries at optimal times and sends personalized messages to update payment methods before members are forced to cancel."
        }
      },
      {
        "@type": "Question",
        "name": "Is gym billing software PCI compliant?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Yes, reputable gym billing software like Gym Unity Suite is fully PCI DSS compliant, meaning it meets strict security standards for processing, storing, and transmitting credit card data. Payment information is encrypted and tokenized to protect member data and reduce your liability."
        }
      },
      {
        "@type": "Question",
        "name": "What payment methods should gym billing software accept?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Modern gym billing software should accept credit cards (Visa, Mastercard, Amex, Discover), debit cards, ACH/bank transfers, and digital wallets (Apple Pay, Google Pay). Offering multiple payment options increases successful payment rates by 15-20% and improves member satisfaction."
        }
      },
      {
        "@type": "Question",
        "name": "How much does gym billing software cost?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Gym billing software typically costs $97-$200/month for the software platform, plus transaction fees of 2.9-3.5% + $0.15-$0.30 per payment. Some providers charge setup fees ($0-$299). Gym Unity Suite starts at $97/month with competitive 2.9% + $0.30 transaction fees and no setup costs."
        }
      }
    ]
  };

  return (
    <>
      <Helmet>
        <title>Gym Billing Software | Automated Payment Processing for Fitness Studios</title>
        <meta name="description" content="Automated gym billing software with recurring payments, smart retry logic & revenue analytics. Reduce churn by 40%, save 15+ hours/week. Start free trial!" />
        <meta name="keywords" content="gym billing software, fitness billing software, gym payment processing, automated gym billing, gym membership billing, recurring payment software, gym invoice software" />
        <link rel="canonical" href="https://gymunitysuite.com/features/billing-software" />
        <script type="application/ld+json">
          {JSON.stringify(structuredData)}
        </script>
        <script type="application/ld+json">
          {JSON.stringify(faqData)}
        </script>
      </Helmet>

      <div className="min-h-screen bg-background">
        {/* Navigation */}
        <nav className="bg-card/95 backdrop-blur-sm border-b border-border sticky top-0 z-50">
          <div className="container mx-auto px-4 py-4 flex items-center justify-between">
            <Logo size="md" linkToHome={true} />
            <div className="flex items-center space-x-4">
              <Button
                variant="ghost"
                onClick={() => navigate('/features')}
                className="text-foreground hover:text-primary font-medium"
              >
                ← Features
              </Button>
              <Button
                onClick={() => navigate('/auth')}
                className="bg-gradient-primary hover:opacity-90"
              >
                Start Free Trial
              </Button>
            </div>
          </div>
        </nav>

        {/* Hero Section */}
        <section className="bg-gradient-subtle py-20">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto text-center">
              <Badge className="mb-6 bg-primary/10 text-primary border-primary/20">
                Gym Billing Software
              </Badge>
              <h1 className="text-4xl md:text-5xl font-bold mb-6">
                Automated Gym Billing & Payment Processing Software
              </h1>
              <p className="text-xl text-muted-foreground mb-8 max-w-3xl mx-auto">
                Stop chasing payments and eliminate billing headaches. Gym Unity Suite automates recurring billing,
                recovers failed payments, and provides real-time revenue insights—saving you 15+ hours per week.
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center space-y-4 sm:space-y-0 sm:space-x-4 mb-12">
                <Button
                  size="lg"
                  onClick={() => navigate('/auth')}
                  className="bg-gradient-primary hover:opacity-90 px-8 py-4"
                >
                  Try Billing Software Free
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
                <Button
                  variant="outline"
                  size="lg"
                  onClick={() => navigate('/demo')}
                  className="px-8 py-4"
                >
                  Watch Demo
                </Button>
              </div>

              {/* Key Stats */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-2xl mx-auto">
                <div className="text-center">
                  <div className="text-3xl font-bold text-primary">98%</div>
                  <div className="text-sm text-muted-foreground">Payment success rate</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-primary">40%</div>
                  <div className="text-sm text-muted-foreground">Less involuntary churn</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-primary">15+ hrs</div>
                  <div className="text-sm text-muted-foreground">Saved per week</div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="container mx-auto px-4 py-20">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold mb-4">Complete Gym Billing Features</h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Everything you need to automate payments and maximize revenue collection.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {billingFeatures.map((feature, index) => (
              <Card key={index} className="gym-card group hover:shadow-elevation-3 transition-all duration-300">
                <CardHeader>
                  <div className="flex items-center space-x-4">
                    <div className="p-3 bg-gradient-primary rounded-lg group-hover:scale-110 transition-transform">
                      <feature.icon className="h-6 w-6 text-white" />
                    </div>
                    <CardTitle className="text-lg">{feature.title}</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-base">
                    {feature.description}
                  </CardDescription>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* Benefits Section */}
        <section className="bg-muted/50 py-20">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto">
              <div className="text-center mb-16">
                <h2 className="text-3xl font-bold mb-4">Why Gym Owners Choose Gym Unity Suite Billing</h2>
                <p className="text-xl text-muted-foreground">
                  Transform your revenue operations with intelligent billing automation.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-16">
                <div>
                  <h3 className="text-2xl font-semibold mb-6">Key Benefits</h3>
                  <ul className="space-y-4">
                    {benefits.map((benefit, index) => (
                      <li key={index} className="flex items-start space-x-3">
                        <Check className="h-5 w-5 text-success mt-1 flex-shrink-0" />
                        <span className="text-foreground">{benefit}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="bg-gradient-primary p-8 rounded-lg text-white">
                  <h3 className="text-2xl font-semibold mb-4">Revenue Impact Calculator</h3>
                  <div className="space-y-4">
                    <div className="flex justify-between">
                      <span>Failed payments recovered:</span>
                      <span className="font-semibold">$3,200/mo</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Time saved on billing:</span>
                      <span className="font-semibold">15 hrs/week</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Churn reduction value:</span>
                      <span className="font-semibold">$4,800/mo</span>
                    </div>
                    <div className="border-t border-white/20 pt-4">
                      <div className="flex justify-between text-lg">
                        <span>Total annual value:</span>
                        <span className="font-bold">$96,000+</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Comparison Section */}
        <section className="container mx-auto px-4 py-20">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold mb-4">How Gym Unity Suite Compares</h2>
            <p className="text-xl text-muted-foreground">
              See why gym owners choose our billing software over Mindbody, ZenPlanner, and Glofox.
            </p>
          </div>

          <div className="max-w-4xl mx-auto mb-12">
            <div className="overflow-x-auto">
              <table className="w-full border-collapse bg-card rounded-lg overflow-hidden">
                <thead>
                  <tr className="bg-muted">
                    <th className="text-left p-4 font-semibold">Feature</th>
                    <th className="text-center p-4 font-semibold">Gym Unity Suite</th>
                    <th className="text-center p-4 font-semibold">Mindbody</th>
                    <th className="text-center p-4 font-semibold">ZenPlanner</th>
                    <th className="text-center p-4 font-semibold">Glofox</th>
                  </tr>
                </thead>
                <tbody>
                  {comparisonData.map((row, index) => (
                    <tr key={index} className="border-t border-border">
                      <td className="p-4 font-medium">{row.feature}</td>
                      <td className="p-4 text-center">
                        {row.gymunity ? (
                          <Check className="h-5 w-5 text-success mx-auto" />
                        ) : (
                          <span className="text-muted-foreground">✕</span>
                        )}
                      </td>
                      <td className="p-4 text-center">
                        {row.mindbody ? (
                          <Check className="h-5 w-5 text-success mx-auto" />
                        ) : (
                          <span className="text-muted-foreground">✕</span>
                        )}
                      </td>
                      <td className="p-4 text-center">
                        {row.zenplanner ? (
                          <Check className="h-5 w-5 text-success mx-auto" />
                        ) : (
                          <span className="text-muted-foreground">✕</span>
                        )}
                      </td>
                      <td className="p-4 text-center">
                        {row.glofox ? (
                          <Check className="h-5 w-5 text-success mx-auto" />
                        ) : (
                          <span className="text-muted-foreground">✕</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Pricing Comparison */}
          <div className="max-w-4xl mx-auto">
            <h3 className="text-2xl font-bold mb-8 text-center">Pricing Comparison</h3>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse bg-card rounded-lg overflow-hidden">
                <thead>
                  <tr className="bg-muted">
                    <th className="text-left p-4 font-semibold">Provider</th>
                    <th className="text-center p-4 font-semibold">Monthly Fee</th>
                    <th className="text-center p-4 font-semibold">Transaction Fee</th>
                    <th className="text-center p-4 font-semibold">Setup Fee</th>
                  </tr>
                </thead>
                <tbody>
                  {pricingComparison.map((row, index) => (
                    <tr key={index} className={`border-t border-border ${index === 0 ? 'bg-primary/5' : ''}`}>
                      <td className="p-4 font-medium">{row.provider}</td>
                      <td className="p-4 text-center font-semibold">{row.monthly}</td>
                      <td className="p-4 text-center">{row.transactionFee}</td>
                      <td className="p-4 text-center">{row.setup}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>

        {/* Testimonials */}
        <section className="bg-muted/50 py-20">
          <div className="container mx-auto px-4">
            <div className="text-center mb-16">
              <h2 className="text-3xl font-bold mb-4">Real Results from Gym Owners</h2>
              <p className="text-xl text-muted-foreground">
                See how our billing software is transforming fitness businesses.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
              {testimonials.map((testimonial, index) => (
                <Card key={index} className="gym-card">
                  <CardHeader>
                    <div className="flex items-center mb-4">
                      {[...Array(testimonial.rating)].map((_, i) => (
                        <Star key={i} className="h-4 w-4 fill-primary text-primary" />
                      ))}
                    </div>
                  </CardHeader>
                  <CardContent>
                    <blockquote className="text-foreground mb-4 italic text-lg">
                      "{testimonial.content}"
                    </blockquote>
                    <div>
                      <div className="font-semibold text-foreground">{testimonial.name}</div>
                      <div className="text-sm text-muted-foreground">{testimonial.role}</div>
                      <div className="text-xs text-muted-foreground mt-1">{testimonial.gym}</div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* FAQ Section */}
        <section className="container mx-auto px-4 py-20">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold mb-4">Frequently Asked Questions</h2>
            <p className="text-xl text-muted-foreground">
              Common questions about gym billing software.
            </p>
          </div>

          <div className="max-w-3xl mx-auto space-y-6">
            <Card className="gym-card">
              <CardHeader>
                <CardTitle>What is gym billing software?</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Gym billing software automates membership payment collection, recurring billing cycles, invoice generation,
                  and payment processing for fitness businesses. It handles credit cards, ACH transfers, failed payment recovery,
                  and provides revenue analytics—eliminating manual billing tasks and improving cash flow.
                </p>
              </CardContent>
            </Card>

            <Card className="gym-card">
              <CardHeader>
                <CardTitle>How does automated billing reduce churn?</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Automated billing reduces involuntary churn by 30-40% through smart payment retry logic, proactive payment
                  reminders, and automated dunning campaigns. When a payment fails, the system automatically retries at optimal
                  times and sends personalized messages to update payment methods before members are forced to cancel.
                </p>
              </CardContent>
            </Card>

            <Card className="gym-card">
              <CardHeader>
                <CardTitle>Is gym billing software PCI compliant?</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Yes, reputable gym billing software like Gym Unity Suite is fully PCI DSS compliant, meaning it meets strict
                  security standards for processing, storing, and transmitting credit card data. Payment information is encrypted
                  and tokenized to protect member data and reduce your liability.
                </p>
              </CardContent>
            </Card>

            <Card className="gym-card">
              <CardHeader>
                <CardTitle>What payment methods should gym billing software accept?</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Modern gym billing software should accept credit cards (Visa, Mastercard, Amex, Discover), debit cards,
                  ACH/bank transfers, and digital wallets (Apple Pay, Google Pay). Offering multiple payment options increases
                  successful payment rates by 15-20% and improves member satisfaction.
                </p>
              </CardContent>
            </Card>

            <Card className="gym-card">
              <CardHeader>
                <CardTitle>How much does gym billing software cost?</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Gym billing software typically costs $97-$200/month for the software platform, plus transaction fees of
                  2.9-3.5% + $0.15-$0.30 per payment. Some providers charge setup fees ($0-$299). Gym Unity Suite starts at
                  $97/month with competitive 2.9% + $0.30 transaction fees and no setup costs.
                </p>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* CTA Section */}
        <section className="bg-gradient-hero py-20 text-white">
          <div className="container mx-auto px-4 text-center">
            <h2 className="text-3xl font-bold mb-4">
              Ready to Automate Your Gym Billing?
            </h2>
            <p className="text-xl mb-8 opacity-90 max-w-2xl mx-auto">
              Join hundreds of gym owners who have eliminated billing headaches with Gym Unity Suite.
              Start your free trial today - no credit card required.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center space-y-4 sm:space-y-0 sm:space-x-4">
              <Button
                size="lg"
                onClick={() => navigate('/auth')}
                variant="secondary"
                className="px-8 py-4 text-lg shadow-elevation-2"
              >
                Start Free Trial
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
              <Button
                variant="outline"
                size="lg"
                onClick={() => navigate('/compare/mindbody-alternative')}
                className="px-8 py-4 text-lg border-white/20 text-white hover:bg-white/10"
              >
                Compare with Mindbody
              </Button>
            </div>
          </div>
        </section>

        <Footer />
      </div>
    </>
  );
}
