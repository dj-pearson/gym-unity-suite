import React from 'react';
import { Helmet } from 'react-helmet-async';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Footer } from '@/components/layout/Footer';
import { 
  ArrowRight,
  Check,
  X,
  Star,
  DollarSign,
  Users,
  Zap,
  Shield,
  Smartphone,
  TrendingUp
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Logo } from '@/components/ui/logo';
import { FAQSection, mindbodyAlternativeFAQs } from '@/components/seo';

const comparisonFeatures = [
  { category: 'Pricing & Value', features: [
    { feature: 'Monthly pricing starts at', repclub: '$149/month', mindbody: '$129/month + fees' },
    { feature: 'Setup fees', repclub: '$0', mindbody: '$199+' },
    { feature: 'Transaction fees', repclub: 'Standard processing only', mindbody: '2.5% + processing' },
    { feature: 'Contract length', repclub: 'Month-to-month', mindbody: '12+ months minimum' }
  ]},
  { category: 'Core Features', features: [
    { feature: 'Member management', repclub: true, mindbody: true },
    { feature: 'Class scheduling', repclub: true, mindbody: true },
    { feature: 'Mobile-optimized booking', repclub: true, mindbody: false },
    { feature: 'Automated billing', repclub: true, mindbody: true },
    { feature: 'Staff payroll management', repclub: true, mindbody: false },
    { feature: 'Equipment management', repclub: true, mindbody: false }
  ]},
  { category: 'User Experience', features: [
    { feature: 'Modern, intuitive interface', repclub: true, mindbody: false },
    { feature: 'Fast loading times', repclub: true, mindbody: false },
    { feature: 'Mobile-first design', repclub: true, mindbody: false },
    { feature: 'Easy member onboarding', repclub: true, mindbody: false }
  ]},
  { category: 'Support & Training', features: [
    { feature: 'Free setup & training', repclub: true, mindbody: false },
    { feature: 'Live chat support', repclub: true, mindbody: true },
    { feature: 'Phone support included', repclub: true, mindbody: false },
    { feature: 'Dedicated success manager', repclub: true, mindbody: false }
  ]}
];

const whySwitch = [
  {
    icon: DollarSign,
    title: 'Save $3,000+ Annually',
    description: 'No setup fees, lower monthly costs, and no hidden transaction fees. Most gyms save thousands per year.',
    highlight: 'Average annual savings: $3,200'
  },
  {
    icon: Zap,
    title: '3x Faster Performance',
    description: 'Modern technology means instant page loads vs. Mindbody\'s slow, outdated interface.',
    highlight: 'Pages load in under 2 seconds'
  },
  {
    icon: Smartphone,
    title: 'Mobile-First Experience',
    description: 'Built for mobile from day one. Members love the booking experience vs. Mindbody\'s clunky mobile site.',
    highlight: '85% of bookings happen on mobile'
  },
  {
    icon: Users,
    title: 'Better Member Experience',
    description: 'Intuitive interface that members actually enjoy using, leading to higher engagement and retention.',
    highlight: '23% higher member retention'
  }
];

const testimonials = [
  {
    name: 'Sarah Mitchell',
    role: 'Owner, Flex Studios',
    content: 'We switched from Mindbody after 3 years of frustration. Rep Club is everything Mindbody should have been - fast, intuitive, and actually works on mobile. Our members love it.',
    rating: 5,
    previousSoftware: 'Mindbody',
    savings: '$4,200/year'
  },
  {
    name: 'Marcus Johnson',
    role: 'Manager, Elite Fitness',
    content: 'The difference is night and day. Rep Club loads instantly, bookings work flawlessly, and we\'re saving over $300/month. Should have switched years ago.',
    rating: 5,
    previousSoftware: 'Mindbody',
    savings: '$3,600/year'
  },
  {
    name: 'Jennifer Kim',
    role: 'Owner, Zen Yoga Collective',
    content: 'Mindbody was holding us back with its outdated interface and high fees. Rep Club modernized our entire operation and our members are much happier.',
    rating: 5,
    previousSoftware: 'Mindbody',
    savings: '$2,800/year'
  }
];

const pricingComparison = {
  repclub: {
    name: 'Rep Club Professional',
    price: 349,
    members: '2,000 members',
    features: [
      'Everything included',
      'No setup fees',
      'No transaction fees',
      'Month-to-month',
      'Free training & support',
      'Mobile-optimized',
      'Modern interface'
    ]
  },
  mindbody: {
    name: 'Mindbody Starter',
    price: 129,
    members: '500 members',
    additionalCosts: [
      'Setup fee: $199+',
      'Transaction fees: 2.5%',
      'Advanced features: +$50-200/mo',
      'Branded app: +$99/mo',
      'Training: $150/hr'
    ],
    realCost: '$450-650+/month'
  }
};

export default function MindbodyAlternativePage() {
  const navigate = useNavigate();

  const structuredData = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    "name": "Mindbody Alternative - Better Gym Management Software",
    "description": "Rep Club is the modern Mindbody alternative. Save $3,000+ annually with better features, faster performance, and no hidden fees. Switch today!",
    "url": "https://repclub.net/compare/mindbody-alternative",
    "mainEntity": {
      "@type": "SoftwareApplication",
      "name": "Rep Club - Mindbody Alternative",
      "applicationCategory": "BusinessApplication"
    }
  };

  const faqData = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": [
      {
        "@type": "Question",
        "name": "How much can I save switching from Mindbody to Rep Club?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Most gyms save $3,000-$5,000 annually by switching to Rep Club. This includes savings from no setup fees, lower monthly costs, and elimination of Mindbody's 2.5% transaction fees."
        }
      },
      {
        "@type": "Question",
        "name": "Is Rep Club easier to use than Mindbody?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Yes, Rep Club features a modern, intuitive interface that's 3x faster than Mindbody. It's built mobile-first and designed for today's gym owners and members."
        }
      },
      {
        "@type": "Question",
        "name": "How long does it take to switch from Mindbody?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "We provide free data migration and setup assistance. Most gyms complete their switch within 1-2 weeks with our dedicated onboarding team."
        }
      }
    ]
  };

  return (
    <>
      <Helmet>
        <title>Mindbody Alternative | Better Gym Management Software - Rep Club</title>
        <meta name="description" content="Rep Club is the modern Mindbody alternative. Save $3,000+ annually with better features, faster performance, and no hidden fees. Free migration & setup!" />
        <meta name="keywords" content="mindbody alternative, gym management software, fitness software, mindbody competitor, gym booking software, fitness management system" />
        <link rel="canonical" href="https://repclub.net/compare/mindbody-alternative" />
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
            <Button 
              onClick={() => navigate('/auth')}
              className="bg-gradient-primary hover:opacity-90"
            >
              Switch to Rep Club Free
            </Button>
          </div>
        </nav>

        {/* Hero Section */}
        <section className="bg-gradient-subtle py-20">
          <div className="container mx-auto px-4">
            <div className="max-w-5xl mx-auto text-center">
              <Badge className="mb-6 bg-primary/10 text-primary border-primary/20">
                #1 Mindbody Alternative
              </Badge>
              <h1 className="text-4xl md:text-5xl font-bold mb-6">
                The Modern Alternative to Mindbody
              </h1>
              <p className="text-xl text-muted-foreground mb-8 max-w-3xl mx-auto">
                Save $3,000+ annually with Rep Club - the gym management software that actually works. 
                Modern interface, mobile-first design, and no hidden fees.
              </p>
              
              {/* Comparison Stats */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6 max-w-4xl mx-auto mb-12">
                <div className="bg-card/80 backdrop-blur-sm rounded-lg p-6 border border-border">
                  <div className="text-3xl font-bold text-success">$3,200</div>
                  <div className="text-sm text-muted-foreground">Average annual savings</div>
                </div>
                <div className="bg-card/80 backdrop-blur-sm rounded-lg p-6 border border-border">
                  <div className="text-3xl font-bold text-primary">3x</div>
                  <div className="text-sm text-muted-foreground">Faster than Mindbody</div>
                </div>
                <div className="bg-card/80 backdrop-blur-sm rounded-lg p-6 border border-border">
                  <div className="text-3xl font-bold text-primary">23%</div>
                  <div className="text-sm text-muted-foreground">Higher retention</div>
                </div>
                <div className="bg-card/80 backdrop-blur-sm rounded-lg p-6 border border-border">
                  <div className="text-3xl font-bold text-success">Free</div>
                  <div className="text-sm text-muted-foreground">Migration & setup</div>
                </div>
              </div>
              
              <div className="flex flex-col sm:flex-row items-center justify-center space-y-4 sm:space-y-0 sm:space-x-4">
                <Button 
                  size="lg" 
                  onClick={() => navigate('/auth')}
                  className="bg-gradient-primary hover:opacity-90 px-8 py-4"
                >
                  Switch from Mindbody Free
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
                <Button 
                  variant="outline" 
                  size="lg"
                  onClick={() => navigate('/demo')}
                  className="px-8 py-4"
                >
                  See Live Demo
                </Button>
              </div>
            </div>
          </div>
        </section>

        {/* Why Switch Section */}
        <section className="container mx-auto px-4 py-20">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold mb-4">Why Gym Owners Are Switching from Mindbody</h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Thousands of fitness businesses have made the switch. Here's why Rep Club is winning.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-16">
            {whySwitch.map((reason, index) => (
              <Card key={index} className="gym-card group hover:shadow-elevation-3 transition-all duration-300">
                <CardHeader>
                  <div className="flex items-start space-x-4">
                    <div className="p-3 bg-gradient-primary rounded-lg group-hover:scale-110 transition-transform flex-shrink-0">
                      <reason.icon className="h-6 w-6 text-white" />
                    </div>
                    <div className="flex-1">
                      <CardTitle className="text-xl mb-2">{reason.title}</CardTitle>
                      <CardDescription className="text-base mb-3">
                        {reason.description}
                      </CardDescription>
                      <Badge variant="outline" className="bg-success/10 text-success border-success/20">
                        {reason.highlight}
                      </Badge>
                    </div>
                  </div>
                </CardHeader>
              </Card>
            ))}
          </div>
        </section>

        {/* Detailed Comparison */}
        <section className="bg-muted/50 py-20">
          <div className="container mx-auto px-4">
            <div className="text-center mb-16">
              <h2 className="text-3xl font-bold mb-4">Rep Club vs. Mindbody: Complete Comparison</h2>
              <p className="text-xl text-muted-foreground">
                See exactly how we stack up across all the features that matter.
              </p>
            </div>

            <div className="max-w-6xl mx-auto space-y-12">
              {comparisonFeatures.map((category, categoryIndex) => (
                <div key={categoryIndex}>
                  <h3 className="text-2xl font-semibold mb-6">{category.category}</h3>
                  <div className="overflow-x-auto">
                    <table className="w-full border-collapse bg-card rounded-lg overflow-hidden">
                      <thead>
                        <tr className="bg-muted">
                          <th className="text-left p-4 font-semibold">Feature</th>
                          <th className="text-center p-4 font-semibold text-primary">Rep Club</th>
                          <th className="text-center p-4 font-semibold">Mindbody</th>
                        </tr>
                      </thead>
                      <tbody>
                        {category.features.map((row, index) => (
                          <tr key={index} className="border-t border-border">
                            <td className="p-4 font-medium">{row.feature}</td>
                            <td className="p-4 text-center">
                              {typeof row.repclub === 'boolean' ? (
                                row.repclub ? (
                                  <Check className="h-5 w-5 text-success mx-auto" />
                                ) : (
                                  <X className="h-5 w-5 text-destructive mx-auto" />
                                )
                              ) : (
                                <span className="font-semibold text-primary">{row.repclub}</span>
                              )}
                            </td>
                            <td className="p-4 text-center">
                              {typeof row.mindbody === 'boolean' ? (
                                row.mindbody ? (
                                  <Check className="h-5 w-5 text-success mx-auto" />
                                ) : (
                                  <X className="h-5 w-5 text-destructive mx-auto" />
                                )
                              ) : (
                                <span className="text-muted-foreground">{row.mindbody}</span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Pricing Comparison */}
        <section className="container mx-auto px-4 py-20">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold mb-4">True Cost Comparison</h2>
            <p className="text-xl text-muted-foreground">
              Mindbody's hidden fees add up quickly. See the real cost difference.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-5xl mx-auto">
            {/* Rep Club Pricing */}
            <Card className="gym-card border-primary border-2 relative">
              <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                <Badge className="bg-primary text-primary-foreground px-4 py-1">
                  Recommended
                </Badge>
              </div>
              <CardHeader className="text-center pb-8">
                <CardTitle className="text-2xl font-bold text-primary">{pricingComparison.repclub.name}</CardTitle>
                <div className="mt-4">
                  <div className="text-4xl font-bold text-foreground">
                    ${pricingComparison.repclub.price}
                    <span className="text-lg text-muted-foreground font-normal">/month</span>
                  </div>
                  <p className="text-sm text-muted-foreground mt-2">{pricingComparison.repclub.members}</p>
                </div>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3 mb-8">
                  {pricingComparison.repclub.features.map((feature, index) => (
                    <li key={index} className="flex items-center space-x-3">
                      <Check className="h-4 w-4 text-success flex-shrink-0" />
                      <span className="text-sm">{feature}</span>
                    </li>
                  ))}
                </ul>
                <div className="text-center">
                  <div className="text-lg font-bold text-primary mb-2">Total: $349/month</div>
                  <div className="text-sm text-muted-foreground">All-inclusive pricing</div>
                </div>
              </CardContent>
            </Card>

            {/* Mindbody Pricing */}
            <Card className="gym-card">
              <CardHeader className="text-center pb-8">
                <CardTitle className="text-2xl font-bold">{pricingComparison.mindbody.name}</CardTitle>
                <div className="mt-4">
                  <div className="text-4xl font-bold text-foreground">
                    ${pricingComparison.mindbody.price}
                    <span className="text-lg text-muted-foreground font-normal">/month</span>
                  </div>
                  <p className="text-sm text-muted-foreground mt-2">{pricingComparison.mindbody.members}</p>
                  <p className="text-xs text-destructive mt-1">Base price only</p>
                </div>
              </CardHeader>
              <CardContent>
                <div className="mb-6">
                  <h4 className="font-semibold mb-3 text-destructive">Additional Required Costs:</h4>
                  <ul className="space-y-2">
                    {pricingComparison.mindbody.additionalCosts.map((cost, index) => (
                      <li key={index} className="flex items-center space-x-2 text-sm">
                        <DollarSign className="h-3 w-3 text-destructive flex-shrink-0" />
                        <span>{cost}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="text-center border-t pt-6">
                  <div className="text-lg font-bold text-destructive mb-2">{pricingComparison.mindbody.realCost}</div>
                  <div className="text-sm text-muted-foreground">Typical total cost</div>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="text-center mt-12">
            <div className="bg-success/10 border border-success/20 rounded-lg p-6 max-w-md mx-auto">
              <h3 className="text-xl font-bold text-success mb-2">You Save $1,800-3,600/Year</h3>
              <p className="text-sm text-muted-foreground">Plus better features and support</p>
            </div>
          </div>
        </section>

        {/* Testimonials */}
        <section className="bg-muted/50 py-20">
          <div className="container mx-auto px-4">
            <div className="text-center mb-16">
              <h2 className="text-3xl font-bold mb-4">Gym Owners Who Made the Switch</h2>
              <p className="text-xl text-muted-foreground">
                Real stories from fitness professionals who left Mindbody for Rep Club.
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
              {testimonials.map((testimonial, index) => (
                <Card key={index} className="gym-card">
                  <CardHeader>
                    <div className="flex items-center mb-4">
                      {[...Array(testimonial.rating)].map((_, i) => (
                        <Star key={i} className="h-4 w-4 fill-primary text-primary" />
                      ))}
                    </div>
                    <div className="flex space-x-2">
                      <Badge variant="outline" className="text-xs">
                        From: {testimonial.previousSoftware}
                      </Badge>
                      <Badge className="text-xs bg-success/10 text-success border-success/20">
                        Saves: {testimonial.savings}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <blockquote className="text-foreground mb-4 italic">
                      "{testimonial.content}"
                    </blockquote>
                    <div>
                      <div className="font-semibold text-foreground">{testimonial.name}</div>
                      <div className="text-sm text-muted-foreground">{testimonial.role}</div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* FAQ Section with Schema Markup */}
        <FAQSection
          title="Mindbody Alternative FAQ"
          subtitle="Common questions about switching from Mindbody to Gym Unity Suite"
          faqs={mindbodyAlternativeFAQs}
          className="bg-background"
        />

        {/* CTA Section */}
        <section className="bg-gradient-hero py-20 text-white">
          <div className="container mx-auto px-4 text-center">
            <h2 className="text-3xl font-bold mb-4">
              Ready to Leave Mindbody Behind?
            </h2>
            <p className="text-xl mb-8 opacity-90 max-w-2xl mx-auto">
              Join thousands of gym owners who have upgraded to Rep Club. Free migration, 
              setup, and training included. No risk, all reward.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center space-y-4 sm:space-y-0 sm:space-x-4">
              <Button 
                size="lg" 
                onClick={() => navigate('/auth')}
                variant="secondary"
                className="px-8 py-4 text-lg shadow-elevation-2"
              >
                Switch from Mindbody Free
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
              <Button 
                variant="outline" 
                size="lg"
                onClick={() => navigate('/demo')}
                className="px-8 py-4 text-lg border-white/20 text-white hover:bg-white/10"
              >
                See Live Demo
              </Button>
            </div>
            <p className="text-sm opacity-75 mt-6">
              Free data migration • No setup fees • 30-day money-back guarantee
            </p>
          </div>
        </section>

        <Footer />
      </div>
    </>
  );
}