import React from 'react';
import { Helmet } from 'react-helmet-async';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Footer } from '@/components/layout/Footer';
import { 
  Calendar, 
  CreditCard, 
  Users, 
  UserCheck,
  BarChart3,
  Smartphone,
  Shield,
  Zap,
  ArrowRight,
  Check,
  Star,
  Building2
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const features = [
  {
    icon: Calendar,
    title: 'Class Scheduling Software',
    description: 'Advanced class scheduling and booking system with automated waitlists, instructor assignments, and capacity management.',
    benefits: [
      'Automated class scheduling with recurring sessions',
      'Real-time booking availability and waitlist management', 
      'Instructor scheduling and substitute management',
      'Mobile-first booking experience for members',
      'Integration with payment processing'
    ],
    slug: 'scheduling'
  },
  {
    icon: CreditCard,
    title: 'Gym Billing Software',
    description: 'Automated recurring billing, payment processing, and financial management designed specifically for fitness businesses.',
    benefits: [
      'Automated recurring membership billing',
      'Multiple payment methods and processing',
      'Dunning management for failed payments',
      'Financial reporting and analytics',
      'PCI-compliant payment security'
    ],
    slug: 'billing'
  },
  {
    icon: Users,
    title: 'Gym CRM Software',
    description: 'Complete customer relationship management system with lead tracking, member communications, and retention tools.',
    benefits: [
      'Lead management and conversion tracking',
      'Automated member communication workflows',
      'Member retention and engagement analytics',
      'Referral program management',
      'Marketing campaign integration'
    ],
    slug: 'crm'
  },
  {
    icon: UserCheck,
    title: 'Member Management System',
    description: 'Comprehensive member profiles, check-in system, and membership tracking with real-time analytics.',
    benefits: [
      'Complete member profile management',
      'QR code and mobile check-in system',
      'Membership tier and benefit tracking',
      'Member communication preferences',
      'Real-time attendance analytics'
    ],
    slug: 'member-management'
  },
  {
    icon: BarChart3,
    title: 'Gym Analytics & Reporting',
    description: 'Advanced analytics and reporting suite providing insights into membership growth, revenue, and facility usage.',
    benefits: [
      'Revenue and membership growth analytics',
      'Class and facility utilization reports',
      'Member retention and churn analysis',
      'Staff performance tracking',
      'Custom dashboard creation'
    ],
    slug: 'reporting'
  },
  {
    icon: Building2,
    title: 'Staff & Payroll Management',
    description: 'Complete staff management system with scheduling, payroll processing, and performance tracking.',
    benefits: [
      'Staff scheduling and time tracking',
      'Automated payroll processing',
      'Commission and bonus calculations',
      'Performance metrics and reviews',
      'Certification tracking'
    ],
    slug: 'payroll'
  }
];

const testimonials = [
  {
    name: 'Sarah Johnson',
    role: 'Owner, FlexCore Fitness',
    content: 'Rep Club\'s scheduling system eliminated our double-bookings completely. Our class utilization increased 40% in the first month.',
    rating: 5,
    feature: 'Class Scheduling'
  },
  {
    name: 'Mike Chen', 
    role: 'Manager, PowerFit Gym',
    content: 'The automated billing saved us 15 hours per week. Failed payment recovery improved by 65% with their dunning system.',
    rating: 5,
    feature: 'Billing Automation'
  },
  {
    name: 'Emma Rodriguez',
    role: 'Owner, Zen Yoga Studio',
    content: 'Our member retention improved 30% using Rep Club\'s CRM features. The communication tools are game-changing.',
    rating: 5,
    feature: 'CRM & Member Management'
  }
];

export default function FeaturesPage() {
  const navigate = useNavigate();

  const structuredData = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    "name": "Gym Management Software Features - Complete Feature List",
    "description": "Comprehensive gym management software features including class scheduling, billing automation, member management, CRM, analytics, and staff management. See all features.",
    "url": "https://repclub.app/features/",
    "mainEntity": {
      "@type": "SoftwareApplication",
      "name": "Rep Club Gym Management Software",
      "featureList": features.map(f => f.title),
      "applicationCategory": "BusinessApplication"
    }
  };

  return (
    <>
      <Helmet>
        <title>Gym Management Software Features | Complete Feature List - Rep Club</title>
        <meta name="description" content="Comprehensive gym management software features including class scheduling, automated billing, member management, CRM, analytics & reporting. See all Rep Club features." />
        <meta name="keywords" content="gym management software features, fitness software features, gym scheduling software, gym billing software, gym CRM, member management system" />
        <link rel="canonical" href="https://repclub.app/features/" />
        <script type="application/ld+json">
          {JSON.stringify(structuredData)}
        </script>
      </Helmet>

      <div className="min-h-screen bg-background">
        {/* Navigation */}
        <nav className="bg-card/95 backdrop-blur-sm border-b border-border sticky top-0 z-50">
          <div className="container mx-auto px-4 py-4 flex items-center justify-between">
            <Button 
              variant="ghost"
              onClick={() => navigate('/')}
              className="text-foreground hover:text-primary font-medium"
            >
              ← Back to Home
            </Button>
            <Button 
              onClick={() => navigate('/auth')}
              className="bg-gradient-primary hover:opacity-90"
            >
              Start Free Trial
            </Button>
          </div>
        </nav>

        {/* Hero Section */}
        <section className="bg-gradient-subtle py-20">
          <div className="container mx-auto px-4 text-center">
            <Badge className="mb-6 bg-primary/10 text-primary border-primary/20">
              All-in-One Gym Management Features
            </Badge>
            <h1 className="text-4xl md:text-5xl font-bold mb-6">
              Complete Gym Management Software Features
            </h1>
            <p className="text-xl text-muted-foreground mb-8 max-w-3xl mx-auto">
              Everything you need to run your fitness business efficiently. From class scheduling to automated billing, 
              member management to advanced analytics - all integrated in one powerful platform.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center space-y-4 sm:space-y-0 sm:space-x-4">
              <Button 
                size="lg" 
                onClick={() => navigate('/auth')}
                className="bg-gradient-primary hover:opacity-90 px-8 py-4"
              >
                Start Free Trial
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
          </div>
        </section>

        {/* Features Grid */}
        <section className="container mx-auto px-4 py-20">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold mb-4">Powerful Features for Every Fitness Business</h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Built by fitness professionals, for fitness professionals. Each feature is designed to solve real gym management challenges.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-20">
            {features.map((feature, index) => (
              <Card key={index} className="gym-card group hover:shadow-elevation-3 transition-all duration-300">
                <CardHeader>
                  <div className="flex items-start space-x-4">
                    <div className="p-3 bg-gradient-primary rounded-lg group-hover:scale-110 transition-transform flex-shrink-0">
                      <feature.icon className="h-6 w-6 text-white" />
                    </div>
                    <div className="flex-1">
                      <CardTitle className="text-xl mb-2">{feature.title}</CardTitle>
                      <CardDescription className="text-base mb-4">
                        {feature.description}
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2 mb-6">
                    {feature.benefits.map((benefit, benefitIndex) => (
                      <li key={benefitIndex} className="flex items-start space-x-2">
                        <Check className="h-4 w-4 text-success mt-1 flex-shrink-0" />
                        <span className="text-sm text-muted-foreground">{benefit}</span>
                      </li>
                    ))}
                  </ul>
                  <Button 
                    variant="outline" 
                    onClick={() => navigate(`/features/${feature.slug}`)}
                    className="w-full group-hover:bg-primary group-hover:text-primary-foreground transition-colors"
                  >
                    Learn More About {feature.title.split(' ')[0]} Features
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* Testimonials */}
        <section className="bg-muted/50 py-20">
          <div className="container mx-auto px-4">
            <div className="text-center mb-16">
              <h2 className="text-3xl font-bold mb-4">Real Results from Real Gym Owners</h2>
              <p className="text-xl text-muted-foreground">
                See how our features are transforming fitness businesses across the country
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {testimonials.map((testimonial, index) => (
                <Card key={index} className="gym-card">
                  <CardHeader>
                    <div className="flex items-center mb-4">
                      {[...Array(testimonial.rating)].map((_, i) => (
                        <Star key={i} className="h-4 w-4 fill-primary text-primary" />
                      ))}
                    </div>
                    <Badge variant="outline" className="w-fit">
                      {testimonial.feature}
                    </Badge>
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

        {/* Integration Section */}
        <section className="container mx-auto px-4 py-20">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold mb-4">Everything Works Together Seamlessly</h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              Unlike other gym software that requires multiple tools, Rep Club integrates all features 
              into one cohesive platform that saves time and reduces complexity.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-secondary rounded-xl mb-6">
                <Shield className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-xl font-semibold mb-3">Unified Data</h3>
              <p className="text-muted-foreground">
                All your member data, payments, and analytics in one secure, integrated system.
              </p>
            </div>
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-primary rounded-xl mb-6">
                <Zap className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-xl font-semibold mb-3">Lightning Fast</h3>
              <p className="text-muted-foreground">
                Modern architecture ensures instant page loads and real-time updates across all features.
              </p>
            </div>
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-accent rounded-xl mb-6">
                <Smartphone className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-xl font-semibold mb-3">Mobile-First</h3>
              <p className="text-muted-foreground">
                Every feature is optimized for mobile use, ensuring great experience on any device.
              </p>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="bg-gradient-hero py-20 text-white">
          <div className="container mx-auto px-4 text-center">
            <h2 className="text-3xl font-bold mb-4">
              Ready to Experience All These Features?
            </h2>
            <p className="text-xl mb-8 opacity-90 max-w-2xl mx-auto">
              Start your free trial today and see how Rep Club's comprehensive feature set 
              can transform your fitness business operations.
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
                className="px-8 py-4 text-lg border-white/20 text-white hover:bg-white/10"
              >
                Schedule Demo
              </Button>
            </div>
          </div>
        </section>

        <Footer />
      </div>
    </>
  );
}