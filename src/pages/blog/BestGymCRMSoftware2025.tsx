import React from 'react';
import { Link } from 'react-router-dom';
import { SEO, FAQSection, createBlogPostSchema } from '@/components/seo';
import { Footer } from '@/components/layout/Footer';
import { Logo } from '@/components/ui/logo';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  ArrowRight,
  Check,
  Star,
  TrendingUp,
  Users,
  MessageSquare,
  Target,
  BarChart3,
  Zap,
  DollarSign,
  Calendar,
  Mail,
  Phone,
} from 'lucide-react';

export default function BestGymCRMSoftware2025() {
  const publishDate = '2025-11-28';
  const modifiedDate = '2025-11-28';
  const author = 'Gym Unity Suite Team';
  const readingTime = '12 min read';

  // Top CRM platforms
  const crmPlatforms = [
    {
      rank: 1,
      name: 'Gym Unity Suite',
      rating: 4.9,
      price: '$97/mo',
      bestFor: 'All-in-one gym management with built-in CRM',
      pros: [
        'Native integration with billing, scheduling, and member management',
        'Automated lead nurturing and follow-up campaigns',
        'Visual sales pipeline with drag-and-drop',
        'Member referral tracking and rewards',
        'Unlimited contacts and campaigns',
        'Mobile app for on-the-go lead management'
      ],
      cons: [
        'Newer platform compared to legacy competitors',
        'Advanced marketing automation rolling out in phases'
      ],
      features: {
        leadTracking: true,
        automatedFollowUp: true,
        salesPipeline: true,
        emailMarketing: true,
        smsMarketing: true,
        referralTracking: true,
        reporting: true,
        mobileApp: true
      }
    },
    {
      rank: 2,
      name: 'Mindbody',
      rating: 4.2,
      price: '$129+/mo',
      bestFor: 'Large studios with complex marketing needs',
      pros: [
        'Established platform with wide industry adoption',
        'Robust marketing automation features',
        'Large third-party integration marketplace'
      ],
      cons: [
        'Expensive with many features requiring add-ons',
        'Steep learning curve',
        'Limited customization options',
        'Transaction fees on top of subscription'
      ],
      features: {
        leadTracking: true,
        automatedFollowUp: true,
        salesPipeline: true,
        emailMarketing: true,
        smsMarketing: false,
        referralTracking: false,
        reporting: true,
        mobileApp: true
      }
    },
    {
      rank: 3,
      name: 'ZenPlanner',
      rating: 4.0,
      price: '$117+/mo',
      bestFor: 'CrossFit boxes and martial arts studios',
      pros: [
        'Purpose-built for CrossFit and martial arts',
        'Good workout tracking features',
        'Decent email marketing tools'
      ],
      cons: [
        'CRM features are basic compared to competitors',
        'Limited automation capabilities',
        'No built-in SMS marketing',
        'Outdated user interface'
      ],
      features: {
        leadTracking: true,
        automatedFollowUp: false,
        salesPipeline: false,
        emailMarketing: true,
        smsMarketing: false,
        referralTracking: false,
        reporting: true,
        mobileApp: true
      }
    },
    {
      rank: 4,
      name: 'Glofox',
      rating: 4.1,
      price: '$110+/mo',
      bestFor: 'Boutique fitness studios',
      pros: [
        'Modern, intuitive interface',
        'Good member engagement features',
        'Solid mobile experience'
      ],
      cons: [
        'Limited advanced CRM automation',
        'Fewer customization options',
        'Higher transaction fees',
        'Limited reporting capabilities'
      ],
      features: {
        leadTracking: true,
        automatedFollowUp: true,
        salesPipeline: false,
        emailMarketing: true,
        smsMarketing: true,
        referralTracking: false,
        reporting: false,
        mobileApp: true
      }
    }
  ];

  // Essential CRM features
  const essentialFeatures = [
    {
      title: 'Lead Capture & Tracking',
      description: 'Automatically capture leads from your website, social media, and walk-ins. Track every interaction and touchpoint in one centralized database.',
      icon: Users,
      why: 'Prevents leads from falling through the cracks and gives you complete visibility into your sales pipeline.'
    },
    {
      title: 'Automated Follow-Up',
      description: 'Set up email and SMS drip campaigns that automatically nurture leads based on their behavior and stage in the sales funnel.',
      icon: Zap,
      why: 'Increases conversion rates by 30-50% by ensuring timely, personalized communication without manual work.'
    },
    {
      title: 'Visual Sales Pipeline',
      description: 'Drag-and-drop pipeline view shows exactly where each lead is in your sales process, from inquiry to member.',
      icon: Target,
      why: 'Helps sales teams prioritize high-value leads and identify bottlenecks in the conversion process.'
    },
    {
      title: 'Multi-Channel Communication',
      description: 'Communicate with leads via email, SMS, phone, and in-app messaging—all from one platform with full conversation history.',
      icon: MessageSquare,
      why: 'Meeting leads on their preferred channel increases engagement and speeds up the sales cycle.'
    },
    {
      title: 'Referral Tracking',
      description: 'Track member referrals, automate referral rewards, and identify your best brand ambassadors.',
      icon: TrendingUp,
      why: 'Referrals convert at 3-5x higher rates than other lead sources and cost virtually nothing to acquire.'
    },
    {
      title: 'Sales Analytics & Reporting',
      description: 'Real-time dashboards showing conversion rates, sales velocity, revenue forecasting, and rep performance.',
      icon: BarChart3,
      why: 'Data-driven insights help you optimize your sales process and predict future revenue accurately.'
    }
  ];

  // Comparison criteria
  const comparisonCriteria = [
    {
      criteria: 'Ease of Use',
      winner: 'Gym Unity Suite',
      reason: 'Intuitive interface designed specifically for gym staff, minimal training required.'
    },
    {
      criteria: 'Value for Money',
      winner: 'Gym Unity Suite',
      reason: 'All features included at $97/mo with no hidden fees or expensive add-ons.'
    },
    {
      criteria: 'Automation Capabilities',
      winner: 'Tie: Gym Unity Suite & Mindbody',
      reason: 'Both offer robust automation, but Gym Unity Suite is more affordable.'
    },
    {
      criteria: 'Integration with Gym Operations',
      winner: 'Gym Unity Suite',
      reason: 'Built-in integration with scheduling, billing, and member management—no third-party tools needed.'
    },
    {
      criteria: 'Mobile Experience',
      winner: 'Tie: Gym Unity Suite & Glofox',
      reason: 'Both offer excellent mobile apps for managing leads on the go.'
    },
    {
      criteria: 'Reporting & Analytics',
      winner: 'Gym Unity Suite',
      reason: 'Comprehensive revenue analytics, cohort analysis, and predictive forecasting.'
    }
  ];

  // FAQ data
  const crmFAQs = [
    {
      question: 'What is gym CRM software?',
      answer: 'Gym CRM (Customer Relationship Management) software helps fitness businesses manage leads, track sales pipelines, automate follow-up communications, and convert prospects into paying members. It centralizes all prospect and member data, tracks interactions, and provides tools for email/SMS marketing, referral tracking, and sales analytics.'
    },
    {
      question: 'How much does gym CRM software cost?',
      answer: 'Gym CRM software typically ranges from $97-$200/month depending on features and member count. Gym Unity Suite starts at $97/month with unlimited contacts and full CRM features. Mindbody starts at $129+/month, ZenPlanner at $117+/month, and Glofox at $110+/month. Be aware of hidden costs like setup fees, transaction fees, and add-on charges.'
    },
    {
      question: 'Can I use a general CRM like Salesforce or HubSpot for my gym?',
      answer: 'While general CRMs can work, they lack fitness-specific features like class booking integration, membership management, check-in tracking, and workout history. You\'ll need extensive customization and likely additional tools for gym operations. Purpose-built gym CRM software like Gym Unity Suite provides all these features out of the box, saving time and money.'
    },
    {
      question: 'How does CRM software improve gym lead conversion?',
      answer: 'Gym CRM software improves conversion by 30-50% through: automated follow-up ensuring no lead is forgotten, personalized drip campaigns nurturing prospects over time, visual pipelines helping staff prioritize high-value leads, behavior tracking enabling targeted messaging, and analytics identifying bottlenecks in your sales process.'
    },
    {
      question: 'What is the best CRM for small gyms?',
      answer: 'For small gyms (under 500 members), Gym Unity Suite offers the best value with all-in-one functionality at $97/month. It includes CRM, scheduling, billing, and member management without requiring multiple tools or integrations. Glofox is another good option for boutique studios, though more limited in advanced automation.'
    },
    {
      question: 'Should my gym CRM integrate with my other software?',
      answer: 'Yes, integration is critical. Your CRM should seamlessly connect with scheduling (to track class bookings), billing (to see payment history), marketing (for campaign tracking), and member management (for complete member profiles). Gym Unity Suite has native integration across all these areas, eliminating data silos and reducing manual work.'
    }
  ];

  // Article schema
  const articleSchema = createBlogPostSchema(
    'Best Gym CRM Software 2025: Top 4 Platforms Compared',
    'Comprehensive comparison of the best gym CRM software for fitness studios in 2025. Compare features, pricing, and ratings for Gym Unity Suite, Mindbody, ZenPlanner, and Glofox.',
    author,
    publishDate,
    modifiedDate,
    'https://gymunitysuite.com/assets/blog/best-gym-crm-software-2025.jpg'
  );

  return (
    <>
      <SEO
        title="Best Gym CRM Software 2025: Top 4 Platforms Compared for Fitness Studios"
        description="Compare the best gym CRM software: Gym Unity Suite, Mindbody, ZenPlanner & Glofox. See features, pricing, ratings, and which platform is right for your fitness business."
        keywords="gym CRM software, fitness CRM, gym lead management software, best gym CRM, fitness studio CRM, gym sales software, gym member management CRM"
        canonical="https://gymunitysuite.com/blog/best-gym-crm-software-2025"
        ogType="article"
        schema={articleSchema}
      />

      <div className="min-h-screen bg-background">
        {/* Navigation */}
        <nav className="bg-card/95 backdrop-blur-sm border-b border-border sticky top-0 z-50">
          <div className="container mx-auto px-4 py-4 flex items-center justify-between">
            <Logo size="xl" linkToHome={true} />
            <div className="hidden md:flex items-center space-x-8">
              <Link to="/blog" className="text-foreground hover:text-primary transition-colors font-medium">
                Blog
              </Link>
              <Link to="/features" className="text-foreground hover:text-primary transition-colors font-medium">
                Features
              </Link>
              <Button asChild className="bg-primary hover:bg-primary/90">
                <Link to="/">
                  Try Free <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </div>
          </div>
        </nav>

        {/* Article Header */}
        <header className="container mx-auto px-4 py-12 max-w-4xl">
          <div className="flex items-center gap-2 mb-6">
            <Link to="/blog" className="text-primary hover:underline text-sm">
              Blog
            </Link>
            <span className="text-muted-foreground">/</span>
            <span className="text-sm text-muted-foreground">CRM Software</span>
          </div>

          <Badge className="mb-4 bg-blue-500/10 text-blue-600 border-blue-500/20">
            Software Comparison
          </Badge>

          <h1 className="text-4xl md:text-5xl font-bold mb-6 text-foreground leading-tight">
            Best Gym CRM Software 2025: Top 4 Platforms Compared
          </h1>

          <p className="text-xl text-muted-foreground mb-8 leading-relaxed">
            Finding the right CRM software can transform your gym's sales process. We've compared the top 4 gym CRM
            platforms based on features, pricing, ease of use, and real user reviews to help you make the best choice
            for your fitness business.
          </p>

          <div className="flex items-center justify-between text-sm text-muted-foreground border-y border-border py-4">
            <div className="flex items-center gap-6">
              <span className="flex items-center gap-2">
                <Users className="h-4 w-4" />
                {author}
              </span>
              <span className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                {new Date(publishDate).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
              </span>
            </div>
            <span>{readingTime}</span>
          </div>
        </header>

        {/* Main Content */}
        <article className="container mx-auto px-4 pb-20 max-w-4xl">
          {/* Introduction */}
          <section className="mb-16">
            <p className="text-lg text-foreground mb-6 leading-relaxed">
              Running a successful gym requires more than just great equipment and classes—you need a systematic way to
              convert leads into members and keep them engaged. That's where gym CRM (Customer Relationship Management)
              software comes in.
            </p>
            <p className="text-lg text-foreground mb-6 leading-relaxed">
              The right CRM software helps you track leads, automate follow-ups, manage your sales pipeline, and analyze
              conversion rates—all while integrating seamlessly with your existing gym management operations.
            </p>
            <p className="text-lg text-foreground mb-6 leading-relaxed">
              In this comprehensive guide, we've evaluated the top 4 gym CRM platforms for 2025 based on features, pricing,
              user reviews, and real-world performance. Whether you run a boutique studio or a multi-location fitness chain,
              you'll find the insights you need to choose the best CRM for your business.
            </p>
          </section>

          {/* Quick Comparison Table */}
          <section className="mb-16">
            <h2 className="text-3xl font-bold mb-8">Quick Comparison: Top Gym CRM Software</h2>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse bg-card rounded-lg overflow-hidden">
                <thead>
                  <tr className="bg-muted">
                    <th className="text-left p-4 font-semibold">Platform</th>
                    <th className="text-center p-4 font-semibold">Rating</th>
                    <th className="text-center p-4 font-semibold">Starting Price</th>
                    <th className="text-left p-4 font-semibold">Best For</th>
                  </tr>
                </thead>
                <tbody>
                  {crmPlatforms.map((platform, index) => (
                    <tr key={index} className={`border-t border-border ${index === 0 ? 'bg-primary/5' : ''}`}>
                      <td className="p-4 font-semibold">
                        <div className="flex items-center gap-2">
                          <Badge variant={index === 0 ? 'default' : 'outline'} className="text-xs">
                            #{platform.rank}
                          </Badge>
                          {platform.name}
                        </div>
                      </td>
                      <td className="p-4 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <Star className="h-4 w-4 fill-primary text-primary" />
                          <span className="font-semibold">{platform.rating}</span>
                        </div>
                      </td>
                      <td className="p-4 text-center font-semibold">{platform.price}</td>
                      <td className="p-4 text-muted-foreground">{platform.bestFor}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          {/* Essential CRM Features */}
          <section className="mb-16">
            <h2 className="text-3xl font-bold mb-8">6 Essential Features Every Gym CRM Should Have</h2>
            <p className="text-lg text-muted-foreground mb-8">
              Before diving into specific platforms, let's establish what makes a great gym CRM. These six features are
              non-negotiable for effective lead management and member acquisition:
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {essentialFeatures.map((feature, index) => (
                <Card key={index} className="gym-card">
                  <CardHeader>
                    <div className="flex items-center gap-3 mb-2">
                      <div className="p-2 bg-primary/10 rounded-lg">
                        <feature.icon className="h-5 w-5 text-primary" />
                      </div>
                      <CardTitle className="text-lg">{feature.title}</CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground mb-3">{feature.description}</p>
                    <p className="text-sm text-foreground">
                      <strong>Why it matters:</strong> {feature.why}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>

          {/* Detailed Platform Reviews */}
          <section className="mb-16">
            <h2 className="text-3xl font-bold mb-8">Detailed Platform Reviews</h2>

            {crmPlatforms.map((platform, index) => (
              <Card key={index} className="gym-card mb-8">
                <CardHeader>
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <div className="flex items-center gap-3 mb-2">
                        <Badge className="bg-primary text-white">#{platform.rank}</Badge>
                        <CardTitle className="text-2xl">{platform.name}</CardTitle>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Star className="h-4 w-4 fill-primary text-primary" />
                          {platform.rating} rating
                        </span>
                        <span className="flex items-center gap-1">
                          <DollarSign className="h-4 w-4" />
                          Starting at {platform.price}
                        </span>
                      </div>
                    </div>
                  </div>
                  <p className="text-foreground font-medium">
                    <strong>Best for:</strong> {platform.bestFor}
                  </p>
                </CardHeader>
                <CardContent>
                  <div className="grid md:grid-cols-2 gap-6 mb-6">
                    <div>
                      <h4 className="font-semibold text-success mb-3 flex items-center gap-2">
                        <Check className="h-4 w-4" />
                        Pros
                      </h4>
                      <ul className="space-y-2">
                        {platform.pros.map((pro, i) => (
                          <li key={i} className="text-sm text-muted-foreground flex items-start gap-2">
                            <Check className="h-4 w-4 text-success mt-0.5 flex-shrink-0" />
                            <span>{pro}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div>
                      <h4 className="font-semibold text-destructive mb-3">Cons</h4>
                      <ul className="space-y-2">
                        {platform.cons.map((con, i) => (
                          <li key={i} className="text-sm text-muted-foreground flex items-start gap-2">
                            <span className="text-destructive mt-0.5">✕</span>
                            <span>{con}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  <div className="bg-muted/50 p-4 rounded-lg">
                    <h4 className="font-semibold mb-3">Key Features</h4>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      {Object.entries(platform.features).map(([feature, available]) => (
                        <div key={feature} className="flex items-center gap-2 text-sm">
                          {available ? (
                            <Check className="h-4 w-4 text-success" />
                          ) : (
                            <span className="text-destructive">✕</span>
                          )}
                          <span className="text-muted-foreground capitalize">
                            {feature.replace(/([A-Z])/g, ' $1').trim()}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </section>

          {/* Head-to-Head Comparison */}
          <section className="mb-16">
            <h2 className="text-3xl font-bold mb-8">Head-to-Head: Who Wins Each Category?</h2>
            <div className="space-y-4">
              {comparisonCriteria.map((item, index) => (
                <Card key={index} className="gym-card">
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center justify-between">
                      <span>{item.criteria}</span>
                      <Badge className="bg-primary text-white">{item.winner}</Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground">{item.reason}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>

          {/* Final Recommendation */}
          <section className="mb-16">
            <h2 className="text-3xl font-bold mb-8">Our Final Recommendation</h2>
            <Card className="gym-card border-primary/50 bg-primary/5">
              <CardHeader>
                <CardTitle className="text-2xl flex items-center gap-2">
                  <Star className="h-6 w-6 fill-primary text-primary" />
                  Best Overall: Gym Unity Suite
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-lg text-foreground mb-4 leading-relaxed">
                  For most gym owners, <strong>Gym Unity Suite</strong> offers the best combination of features, value, and ease of use.
                  At $97/month with no hidden fees, you get a complete all-in-one platform that includes CRM, scheduling, billing,
                  and member management—eliminating the need for multiple tools and complex integrations.
                </p>
                <p className="text-lg text-foreground mb-6 leading-relaxed">
                  The automated lead nurturing, visual sales pipeline, and unlimited contacts make it ideal for gyms of all sizes.
                  Plus, the native integration with billing and scheduling means your CRM data is always up-to-date without manual
                  data entry or syncing issues.
                </p>
                <div className="flex flex-col sm:flex-row gap-4">
                  <Button size="lg" asChild className="bg-primary hover:bg-primary/90">
                    <Link to="/">
                      Try Gym Unity Suite Free <ArrowRight className="ml-2 h-5 w-5" />
                    </Link>
                  </Button>
                  <Button size="lg" variant="outline" asChild>
                    <Link to="/features">View All Features</Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </section>

          {/* FAQ Section */}
          <section className="mb-16">
            <h2 className="text-3xl font-bold mb-8">Frequently Asked Questions</h2>
            <FAQSection faqs={crmFAQs} />
          </section>

          {/* Bottom CTA */}
          <section className="bg-gradient-primary p-8 rounded-lg text-white text-center">
            <h2 className="text-2xl font-bold mb-4">Ready to Transform Your Gym's Sales Process?</h2>
            <p className="text-lg mb-6 opacity-90">
              Try Gym Unity Suite free for 30 days. No credit card required. Cancel anytime.
            </p>
            <Button size="lg" variant="secondary" asChild className="shadow-elevation-2">
              <Link to="/">
                Start Your Free Trial <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
          </section>
        </article>

        <Footer />
      </div>
    </>
  );
}
