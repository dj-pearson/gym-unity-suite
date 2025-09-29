import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { SEOHead } from '@/components/seo/SEOHead';
import { Footer } from '@/components/layout/Footer';
import { 
  Users, 
  Calendar, 
  CreditCard, 
  BarChart3,
  UserCheck,
  Smartphone,
  Shield,
  Zap,
  Clock,
  ArrowRight,
  Star,
  Check,
  Building2,
  Crown,
  Sparkles
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { InteractiveHeroBackground } from '@/components/backgrounds/InteractiveHeroBackground';
import OneTimePaymentButton from '@/components/membership/OneTimePaymentButton';
import { EarlyAccessForm } from '@/components/auth/EarlyAccessForm';
import { Logo } from '@/components/ui/logo';

export default function LandingPage() {
  const navigate = useNavigate();

  const features = [
    {
      icon: Users,
      title: 'Member Management',
      description: 'Complete member profiles, membership tracking, and automated billing'
    },
    {
      icon: Calendar,
      title: 'Class Scheduling',
      description: 'Easy class scheduling with instructor assignments and capacity management'
    },
    {
      icon: UserCheck,
      title: 'Check-in System',
      description: 'Quick member check-ins with QR codes and real-time attendance tracking'
    },
    {
      icon: CreditCard,
      title: 'Billing & Payments',
      description: 'Automated recurring billing, payment processing, and financial reporting'
    },
    {
      icon: BarChart3,
      title: 'Analytics & Reports',
      description: 'Comprehensive insights into membership growth, revenue, and facility usage'
    },
    {
      icon: Smartphone,
      title: 'Mobile-First Design',
      description: 'Responsive interface works perfectly on desktop, tablet, and mobile devices'
    }
  ];

  const benefits = [
    {
      icon: Shield,
      title: 'Enterprise Security',
      description: 'Bank-level security with multi-tenant architecture and role-based access control'
    },
    {
      icon: Zap,
      title: 'Lightning Fast',
      description: 'Built with modern technology for instant page loads and real-time updates'
    },
    {
      icon: Clock,
      title: 'Save Time Daily',
      description: 'Automate routine tasks and focus on what matters - your members'
    }
  ];

  const pricingPlans = [
    {
      name: "Studio",
      price: 149,
      interval: "month",
      members: "Up to 500 members",
      team: "Up to 5 team members",
      popular: false,
      icon: Users,
      features: [
        "Complete member management",
        "Class scheduling & booking",
        "Mobile check-in system", 
        "Automated billing & payments",
        "Basic reporting & analytics",
        "Email & SMS notifications",
        "Member mobile app",
        "Standard support"
      ],
      savings: "Perfect for single studios"
    },
    {
      name: "Professional", 
      price: 349,
      interval: "month",
      members: "Up to 2,000 members",
      team: "Up to 15 team members",
      popular: true,
      icon: Building2,
      features: [
        "Everything in Studio",
        "Advanced analytics & reporting",
        "Marketing automation tools",
        "Equipment management",
        "Staff scheduling & payroll",
        "Multi-location support (up to 3)",
        "Custom branding",
        "Priority support"
      ],
      savings: "Most popular choice"
    },
    {
      name: "Enterprise",
      price: 649, 
      interval: "month",
      members: "Unlimited members",
      team: "Unlimited team members",
      popular: false,
      icon: Crown,
      features: [
        "Everything in Professional",
        "Unlimited locations",
        "Advanced CRM & lead management",
        "Custom integrations & API access",
        "White-label solutions",
        "Dedicated success manager",
        "24/7 premium support",
        "Custom training & onboarding"
      ],
      savings: "Scale without limits"
    }
  ];

  const testimonials = [
    {
      name: 'Sarah Johnson',
      role: 'Studio Owner, FlexCore Fitness',
      content: 'This platform transformed how we manage our studio. Member check-ins are seamless and our billing is completely automated.',
      rating: 5
    },
    {
      name: 'Mike Chen',
      role: 'Manager, PowerFit Gym',
      content: 'The analytics help us make data-driven decisions. We increased member retention by 30% using the insights provided.',
      rating: 5
    },
    {
      name: 'Emma Rodriguez',
      role: 'Owner, Zen Yoga Studio',
      content: 'Our members love the mobile experience. Class bookings increased significantly since we started using this system.',
      rating: 5
    }
  ];

  const structuredData = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    "name": "Rep Club",
    "description": "Premium fitness management solutions for discerning professionals. Elite member management, luxury class scheduling, and sophisticated analytics.",
    "url": "https://repclub.app",
    "applicationCategory": "BusinessApplication",
    "operatingSystem": "Web Browser",
    "offers": [
      {
        "@type": "Offer",
        "name": "Studio Plan",
        "price": "149.00",
        "priceCurrency": "USD"
      },
      {
        "@type": "Offer", 
        "name": "Professional Plan",
        "price": "349.00",
        "priceCurrency": "USD"
      },
      {
        "@type": "Offer",
        "name": "Enterprise Plan", 
        "price": "649.00",
        "priceCurrency": "USD"
      }
    ],
    "provider": {
      "@type": "Organization",
      "name": "Rep Club",
      "url": "https://repclub.app"
    },
    "featureList": [
      "Member Management",
      "Class Scheduling",
      "Check-in System", 
      "Billing & Payments",
      "Analytics & Reports",
      "Mobile-First Design"
    ]
  };

  return (
    <>
      <SEOHead
        title="Gym Management Software | All-in-One Fitness Management System - Rep Club"
        description="#1 gym management software for fitness studios, gyms & boutique fitness centers. Complete member management, class scheduling, billing automation & analytics. Try free today!"
        keywords="gym management software, fitness management system, gym scheduling software, fitness studio management, gym billing software, fitness business software, gym CRM, fitness analytics, member management software, all-in-one gym software"
        structuredData={structuredData}
      />
      <div className="min-h-screen bg-gradient-subtle">
        {/* Navigation - stays on top, separate from parallax */}
        <nav className="bg-card/95 backdrop-blur-sm border-b border-border sticky top-0 z-50 relative">
          <div className="container mx-auto px-4 py-4 flex items-center justify-between">
            <Logo size="md" linkToHome={true} />
            
            {/* Navigation Links */}
            <div className="hidden md:flex items-center space-x-8">
              <a href="#features" className="text-foreground hover:text-primary transition-colors font-medium">
                Features
              </a>
              <a href="#pricing" className="text-foreground hover:text-primary transition-colors font-medium">
                Pricing
              </a>
              <Button 
                variant="ghost"
                onClick={() => navigate('/blog')}
                className="text-foreground hover:text-primary font-medium"
              >
                Blog
              </Button>
              <Button 
                onClick={() => {
                  document.getElementById('early-access')?.scrollIntoView({ behavior: 'smooth' });
                }}
                className="bg-gradient-primary hover:opacity-90 shadow-md"
              >
                Request Early Access
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
            
            {/* Mobile Navigation */}
            <div className="md:hidden flex items-center space-x-2">
              <Button 
                variant="ghost"
                size="sm"
                onClick={() => navigate('/blog')}
                className="text-foreground hover:text-primary"
              >
                Blog
              </Button>
              <Button 
                size="sm"
                onClick={() => {
                  document.getElementById('early-access')?.scrollIntoView({ behavior: 'smooth' });
                }}
                className="bg-gradient-primary hover:opacity-90"
              >
                Request Early Access
              </Button>
            </div>
          </div>
        </nav>

        {/* Parallax background with hero content only */}
        <InteractiveHeroBackground className="relative w-full z-0">
        {/* Hero Section - integrated into parallax */}
        <section className="relative container mx-auto px-4 py-20 text-center flex items-center min-h-[80vh] z-10">
          <div className="relative z-10 max-w-4xl mx-auto">
            <Badge className="mb-6 bg-secondary/10 text-primary border-secondary/20">
              Elite Fitness Management Platform
            </Badge>
            <div className="mb-4">
              <Badge className="bg-primary/20 text-primary border-primary/30 backdrop-blur-sm">
                🚀 Launching November 1st, 2025
              </Badge>
            </div>
            <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold mb-6 text-white leading-tight drop-shadow-lg">
              #1 Gym Management 
              <br />
              <span className="relative text-gradient-primary">
                Software
              </span>
            </h1>
            <p className="text-xl md:text-2xl text-white/90 mb-8 max-w-2xl mx-auto leading-relaxed drop-shadow-md">
              All-in-one fitness management system for gyms, studios & fitness centers. Automate scheduling, 
              billing, member management & more. Launching November 1st - join the waitlist!
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center space-y-4 sm:space-y-0 sm:space-x-4">
              <Button 
                size="lg" 
                onClick={() => {
                  document.getElementById('early-access')?.scrollIntoView({ behavior: 'smooth' });
                }}
                className="bg-gradient-primary hover:opacity-90 px-8 py-4 text-lg shadow-glow hover:shadow-elevation-3 transition-all duration-300"
              >
                Request Early Access
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
              <Button 
                variant="outline" 
                size="lg"
                className="px-8 py-4 text-lg border-white/30 text-white hover:bg-white/10 transition-all duration-300"
              >
                Watch Demo
              </Button>
            </div>
          </div>
        </section>
      </InteractiveHeroBackground>

      {/* Features Grid - separate section with standard background */}
      <section id="features" className="container mx-auto px-4 py-20">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold mb-4">Complete Gym Management Software Features</h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            All-in-one fitness management system with member management, class scheduling, billing automation, 
            and analytics designed for gyms, yoga studios, and fitness centers
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <Card key={index} className="gym-card group hover:shadow-elevation-3 transition-all duration-300">
              <CardHeader>
                <div className="flex items-center space-x-4">
                  <div className="p-3 bg-gradient-primary rounded-lg group-hover:scale-110 transition-transform">
                    <feature.icon className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">{feature.title}</CardTitle>
                  </div>
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
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold mb-4">Why Choose Rep Club?</h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Crafted by elite fitness professionals for the most discerning standards
          </p>
        </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {benefits.map((benefit, index) => (
              <div key={index} className="text-center group">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-secondary rounded-xl mb-6 group-hover:scale-110 transition-transform">
                  <benefit.icon className="h-8 w-8 text-white" />
                </div>
                <h3 className="text-xl font-semibold mb-3">{benefit.title}</h3>
                <p className="text-muted-foreground">{benefit.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="container mx-auto px-4 py-20">
        <div className="text-center mb-16">
          <Badge className="mb-4 bg-primary/10 text-primary border-primary/20">
            Transparent Pricing
          </Badge>
          <h2 className="text-4xl font-bold mb-4">Choose Your Rep Club Plan</h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Premium fitness management solutions with transparent, value-based pricing. 
            No hidden fees, no surprises - just elite software for discerning professionals.
          </p>
        </div>

        <div className="grid gap-8 grid-cols-1 lg:grid-cols-3 max-w-6xl mx-auto">
          {pricingPlans.map((plan, index) => (
            <Card 
              key={index} 
              className={`gym-card relative ${plan.popular ? 'ring-2 ring-primary shadow-elevation-3 scale-105' : ''} hover:shadow-elevation-2 transition-all duration-300`}
            >
              {plan.popular && (
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                  <Badge className="bg-primary text-primary-foreground px-4 py-1">
                    Most Popular
                  </Badge>
                </div>
              )}
              
              <CardHeader className="text-center pb-8">
                <div className="flex items-center justify-center mb-4">
                  <div className={`p-3 rounded-xl ${plan.popular ? 'bg-gradient-primary' : 'bg-gradient-secondary'}`}>
                    <plan.icon className="h-6 w-6 text-white" />
                  </div>
                </div>
                <CardTitle className="text-2xl font-bold">{plan.name}</CardTitle>
                <div className="mt-4">
                  <div className="text-4xl font-bold text-foreground">
                    ${plan.price}
                    <span className="text-lg text-muted-foreground font-normal">/{plan.interval}</span>
                  </div>
                  <div className="mt-3 space-y-1">
                    <p className="text-sm text-muted-foreground">{plan.members}</p>
                    <p className="text-sm text-muted-foreground">{plan.team}</p>
                  </div>
                  <Badge variant="outline" className="mt-3 text-xs">
                    {plan.savings}
                  </Badge>
                </div>
              </CardHeader>

              <CardContent className="space-y-6">
                <ul className="space-y-3">
                  {plan.features.map((feature, featureIndex) => (
                    <li key={featureIndex} className="flex items-center space-x-3">
                      <div className="flex-shrink-0">
                        <div className="w-5 h-5 bg-success/10 rounded-full flex items-center justify-center">
                          <Check className="h-3 w-3 text-success" />
                        </div>
                      </div>
                      <span className="text-sm text-muted-foreground">{feature}</span>
                    </li>
                  ))}
                </ul>

                <div className="pt-6">
                  <OneTimePaymentButton
                    amount={plan.price}
                    description={`Rep Club ${plan.name} Plan - Monthly Subscription`}
                    orderType="subscription_setup"
                    metadata={{
                      plan_name: plan.name,
                      member_limit: plan.members,
                      team_limit: plan.team,
                      billing_interval: plan.interval
                    }}
                    className="w-full"
                    variant={plan.popular ? "default" : "outline"}
                  >
                    Get Started with {plan.name}
                  </OneTimePaymentButton>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Early Access Section */}
        <section id="early-access" className="mt-20 text-center">
          <div className="mb-12">
            <Badge className="mb-4 bg-primary/10 text-primary border-primary/20">
              🎯 Early Access Program
            </Badge>
            <h2 className="text-3xl font-bold mb-4">Join the Elite Preview</h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Get exclusive early access to Rep Club before our November 1st launch. Limited spots available for founding members.
            </p>
          </div>
          
          <EarlyAccessForm />
        </section>

        {/* Enterprise Pricing */}
        <Card className="gym-card bg-gradient-hero text-white max-w-4xl mx-auto">
          <CardHeader className="text-center">
            <div className="flex items-center justify-center mb-4">
              <div className="p-4 bg-white/10 rounded-xl backdrop-blur-sm">
                <Building2 className="h-8 w-8 text-white" />
              </div>
            </div>
            <CardTitle className="text-3xl font-bold">Enterprise Solutions</CardTitle>
            <CardDescription className="text-white/80 text-lg mt-4">
              Custom solutions for large chains and franchises with 10+ locations
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
                <div className="text-2xl font-bold">$2,000+</div>
                <div className="text-sm opacity-80">Starting monthly</div>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
                <div className="text-2xl font-bold">$150-300</div>
                <div className="text-sm opacity-80">Per location</div>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
                <div className="text-2xl font-bold">Volume</div>
                <div className="text-sm opacity-80">Discounts available</div>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm mb-8">
              <div className="flex items-center space-x-2">
                <Check className="h-4 w-4 text-success" />
                <span>Implementation & training included</span>
              </div>
              <div className="flex items-center space-x-2">
                <Check className="h-4 w-4 text-success" />
                <span>SLA agreements</span>
              </div>
              <div className="flex items-center space-x-2">
                <Check className="h-4 w-4 text-success" />
                <span>Dedicated enterprise support</span>
              </div>
              <div className="flex items-center space-x-2">
                <Check className="h-4 w-4 text-success" />
                <span>Custom integrations</span>
              </div>
            </div>

            <Button 
              variant="secondary" 
              size="lg"
              className="px-8"
              onClick={() => navigate('/contact')}
            >
              Contact Enterprise Sales
            </Button>
          </CardContent>
        </Card>
      </section>

      {/* Testimonials */}
      <section className="container mx-auto px-4 py-20">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold mb-4">Trusted by Fitness Professionals</h2>
          <p className="text-xl text-muted-foreground">
            See what gym owners are saying about our platform
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {testimonials.map((testimonial, index) => (
            <Card key={index} className="gym-card">
              <CardContent className="p-6">
                <div className="flex items-center mb-4">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <Star key={i} className="h-5 w-5 fill-primary text-primary" />
                  ))}
                </div>
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
      </section>

      {/* CTA Section */}
      <section className="bg-gradient-hero py-20 text-white">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-4xl font-bold mb-4">
            Ready to Transform Your Gym?
          </h2>
          <p className="text-xl mb-8 opacity-90 max-w-2xl mx-auto">
            Join the elite community of fitness professionals already using Rep Club. 
            Experience excellence today - no credit card required.
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
              Contact Sales
            </Button>
          </div>
        </div>
      </section>

      <Footer />
    </div></>
  );
}