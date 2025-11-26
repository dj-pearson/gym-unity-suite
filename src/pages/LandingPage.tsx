import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { SEOHead } from '@/components/seo/SEOHead';
import { Footer } from '@/components/layout/Footer';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
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
  Sparkles,
  Play,
  X
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { InteractiveHeroBackground } from '@/components/backgrounds/InteractiveHeroBackground';
import { EarlyAccessForm } from '@/components/auth/EarlyAccessForm';
import { Logo } from '@/components/ui/logo';
import { useGSAP } from '@gsap/react';
import gsap from 'gsap';

export default function LandingPage() {
  const navigate = useNavigate();
  const heroContainerRef = React.useRef(null);
  const [showDemoModal, setShowDemoModal] = useState(false);

  useGSAP(() => {
    const tl = gsap.timeline({ defaults: { ease: "power3.out" } });

    tl.from(".hero-badge", {
      y: -20,
      opacity: 0,
      duration: 0.8,
      stagger: 0.2
    })
      .from(".hero-title", {
        y: 50,
        opacity: 0,
        duration: 1,
        skewY: 2
      }, "-=0.4")
      .from(".hero-description", {
        y: 30,
        opacity: 0,
        duration: 0.8
      }, "-=0.6")
      .from(".hero-buttons", {
        y: 20,
        opacity: 0,
        duration: 0.8,
        scale: 0.95
      }, "-=0.6");
  }, { scope: heroContainerRef });

  // Auto-scroll to pricing section if /pricing route
  React.useEffect(() => {
    if (window.location.hash.includes('/pricing')) {
      setTimeout(() => {
        document.getElementById('pricing')?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    }
  }, []);

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
    "description": "All-in-one gym management software for boutique fitness studios. Complete member management, class scheduling, billing automation, CRM & sales pipeline, and branded mobile apps.",
    "url": "https://repclub.app",
    "applicationCategory": "BusinessApplication",
    "operatingSystem": "Web Browser, iOS, Android",
    "offers": {
      "@type": "AggregateOffer",
      "lowPrice": "149",
      "highPrice": "649",
      "priceCurrency": "USD",
      "priceValidUntil": "2026-12-31",
      "availability": "https://schema.org/InStock"
    },
    "provider": {
      "@type": "Organization",
      "name": "Rep Club",
      "url": "https://repclub.app"
    },
    "featureList": [
      "Member Management",
      "Class Scheduling & Booking",
      "CRM & Sales Pipeline",
      "Automated Billing",
      "Branded Mobile App",
      "Real-time Analytics"
    ],
    "aggregateRating": {
      "@type": "AggregateRating",
      "ratingValue": "4.8",
      "reviewCount": "127",
      "bestRating": "5",
      "worstRating": "1"
    }
  };

  return (
    <>
      <SEOHead
        title="Gym Management Software for Small Studios | Rep Club"
        description="All-in-one gym management software for boutique fitness studios. Member management, automated billing, CRM, and branded mobile app. Join the waitlist for early access."
        keywords="gym management software, fitness studio software, boutique gym software, yoga studio software, gym CRM, gym billing software, gym membership software, affordable gym software, small gym software"
        structuredData={structuredData}
      />
      <div className="min-h-screen bg-gradient-subtle">
        {/* Navigation - stays on top, separate from parallax */}
        <nav className="bg-card/95 backdrop-blur-sm border-b border-border sticky top-0 z-50 relative">
          <div className="container mx-auto px-4 py-4 flex items-center justify-between">
            <Logo size="xl" linkToHome={true} />

            {/* Navigation Links */}
            <div className="hidden md:flex items-center space-x-6">
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
                variant="ghost"
                onClick={() => navigate('/auth')}
                className="text-foreground hover:text-primary font-medium"
              >
                Sign In
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
            <div className="md:hidden flex items-center space-x-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate('/auth')}
                className="text-foreground hover:text-primary"
              >
                Sign In
              </Button>
              <Button
                size="sm"
                onClick={() => {
                  document.getElementById('early-access')?.scrollIntoView({ behavior: 'smooth' });
                }}
                className="bg-gradient-primary hover:opacity-90"
              >
                Early Access
              </Button>
            </div>
          </div>
        </nav>

        {/* Parallax background with hero content only */}
        <InteractiveHeroBackground className="relative w-full z-0">
          {/* Hero Section - integrated into parallax */}
          <section ref={heroContainerRef} className="relative container mx-auto px-4 py-20 text-center flex items-center min-h-[80vh] z-10">
            <div className="relative z-10 max-w-4xl mx-auto">
              <div className="hero-badge">
                <Badge className="mb-6 bg-secondary/10 text-primary border-secondary/20">
                  Elite Fitness Management Platform
                </Badge>
              </div>
              <div className="mb-4 hero-badge">
                <Badge className="bg-primary/20 text-primary border-primary/30 backdrop-blur-sm">
                  🚀 Launching November 1st, 2025
                </Badge>
              </div>
              <h1 className="hero-title text-5xl md:text-6xl lg:text-7xl font-bold mb-6 text-white leading-tight drop-shadow-lg">
                #1 Gym Management
                <br />
                <span className="relative text-gradient-primary">
                  Software
                </span>
              </h1>
              <p className="hero-description text-xl md:text-2xl text-white/90 mb-8 max-w-2xl mx-auto leading-relaxed drop-shadow-md">
                All-in-one fitness management system for gyms, studios & fitness centers. Automate scheduling,
                billing, member management & more. Launching November 1st - join the waitlist!
              </p>
              <div className="hero-buttons flex flex-col sm:flex-row items-center justify-center space-y-4 sm:space-y-0 sm:space-x-4">
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
                  variant="secondary"
                  size="lg"
                  onClick={() => setShowDemoModal(true)}
                  className="px-8 py-4 text-lg bg-white/95 text-foreground border-white/30 hover:bg-white transition-all duration-300"
                >
                  <Play className="mr-2 h-5 w-5" />
                  Watch Demo
                </Button>
              </div>

              {/* Social Proof */}
              <div className="hero-buttons mt-10 flex flex-col items-center">
                <div className="flex items-center gap-2 mb-3">
                  <div className="flex -space-x-2">
                    {[1, 2, 3, 4, 5].map((i) => (
                      <div
                        key={i}
                        className="w-8 h-8 rounded-full bg-gradient-secondary border-2 border-white flex items-center justify-center text-white text-xs font-bold"
                      >
                        {String.fromCharCode(64 + i)}
                      </div>
                    ))}
                  </div>
                  <div className="flex items-center gap-1 ml-2">
                    {[1, 2, 3, 4, 5].map((i) => (
                      <Star key={i} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                    ))}
                  </div>
                </div>
                <p className="text-white/80 text-sm">
                  <span className="font-semibold text-white">500+ fitness businesses</span> on our early access waitlist
                </p>
                <p className="text-white/60 text-xs mt-1 italic">
                  "Finally, software built by people who actually run gyms." — Sarah J., Studio Owner
                </p>
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
                Built by fitness industry veterans who understand what gyms actually need
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
                    <Button
                      onClick={() => {
                        document.getElementById('early-access')?.scrollIntoView({ behavior: 'smooth' });
                      }}
                      className={`w-full ${plan.popular ? 'bg-gradient-primary hover:opacity-90' : ''}`}
                      variant={plan.popular ? "default" : "outline"}
                    >
                      Join Waitlist for {plan.name}
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                    <p className="text-xs text-muted-foreground text-center mt-2">
                      Available November 1st, 2025
                    </p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Trust Badges */}
          <div className="mt-12 flex flex-wrap items-center justify-center gap-6 text-muted-foreground">
            <div className="flex items-center gap-2">
              <Shield className="w-5 h-5 text-green-600" />
              <span className="text-sm font-medium">256-bit SSL Encryption</span>
            </div>
            <div className="flex items-center gap-2">
              <CreditCard className="w-5 h-5 text-blue-600" />
              <span className="text-sm font-medium">Powered by Stripe</span>
            </div>
            <div className="flex items-center gap-2">
              <Shield className="w-5 h-5 text-purple-600" />
              <span className="text-sm font-medium">SOC 2 Compliant</span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-orange-600" />
              <span className="text-sm font-medium">99.9% Uptime SLA</span>
            </div>
          </div>

          <p className="text-center text-sm text-muted-foreground mt-4">
            Cancel anytime. No long-term contracts. 30-day money-back guarantee.
          </p>

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

        {/* Member App Showcase */}
        <section className="bg-muted/50 py-20">
          <div className="container mx-auto px-4">
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              <div>
                <Badge className="mb-4 bg-primary/10 text-primary border-primary/20">
                  Member Experience
                </Badge>
                <h2 className="text-4xl font-bold mb-4">
                  Your Members Will Love It Too
                </h2>
                <p className="text-xl text-muted-foreground mb-8">
                  Rep Club isn't just for gym owners. Give your members a premium mobile experience
                  with easy class booking, digital check-in, and workout tracking.
                </p>

                <div className="space-y-4">
                  {[
                    { title: 'QR Code Check-in', desc: 'Members scan to check in - no front desk needed' },
                    { title: 'Easy Class Booking', desc: 'Browse and book classes in seconds from any device' },
                    { title: 'Workout Tracking', desc: 'Log workouts and track progress over time' },
                    { title: 'Digital Member Card', desc: 'No more plastic cards - everything on their phone' },
                  ].map((feature, i) => (
                    <div key={i} className="flex items-start gap-3">
                      <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <Check className="w-4 h-4 text-primary" />
                      </div>
                      <div>
                        <p className="font-medium">{feature.title}</p>
                        <p className="text-sm text-muted-foreground">{feature.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>

                <Button
                  className="mt-8 bg-gradient-primary hover:opacity-90"
                  onClick={() => {
                    document.getElementById('early-access')?.scrollIntoView({ behavior: 'smooth' });
                  }}
                >
                  Get Early Access
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>

              {/* Mobile App Mockup */}
              <div className="relative flex justify-center">
                <div className="relative">
                  {/* Phone frame */}
                  <div className="w-72 h-[580px] bg-gradient-to-b from-card to-muted rounded-[3rem] p-3 shadow-elevation-3 border border-border">
                    <div className="w-full h-full bg-background rounded-[2.5rem] overflow-hidden">
                      {/* Status bar */}
                      <div className="h-8 bg-primary/5 flex items-center justify-center">
                        <div className="w-20 h-1 bg-foreground/20 rounded-full" />
                      </div>
                      {/* App content mockup */}
                      <div className="p-4 space-y-4">
                        <div className="text-center">
                          <div className="w-16 h-16 bg-gradient-primary rounded-2xl mx-auto mb-2 flex items-center justify-center">
                            <span className="text-white font-bold text-xl">RC</span>
                          </div>
                          <p className="font-semibold">Welcome back, Sarah!</p>
                          <p className="text-xs text-muted-foreground">FlexCore Fitness</p>
                        </div>

                        {/* Quick actions */}
                        <div className="grid grid-cols-2 gap-2">
                          <div className="bg-primary/10 rounded-xl p-3 text-center">
                            <UserCheck className="w-6 h-6 text-primary mx-auto mb-1" />
                            <p className="text-xs font-medium">Check In</p>
                          </div>
                          <div className="bg-muted rounded-xl p-3 text-center">
                            <Calendar className="w-6 h-6 text-muted-foreground mx-auto mb-1" />
                            <p className="text-xs font-medium">Book Class</p>
                          </div>
                        </div>

                        {/* Upcoming class */}
                        <div className="bg-muted/50 rounded-xl p-3">
                          <p className="text-xs text-muted-foreground mb-1">NEXT CLASS</p>
                          <p className="font-medium text-sm">HIIT Training</p>
                          <p className="text-xs text-muted-foreground">Today at 6:00 PM • Studio A</p>
                        </div>

                        {/* Stats */}
                        <div className="grid grid-cols-3 gap-2 text-center">
                          <div>
                            <p className="text-lg font-bold text-primary">12</p>
                            <p className="text-xs text-muted-foreground">This Month</p>
                          </div>
                          <div>
                            <p className="text-lg font-bold">🔥 8</p>
                            <p className="text-xs text-muted-foreground">Day Streak</p>
                          </div>
                          <div>
                            <p className="text-lg font-bold text-primary">Gold</p>
                            <p className="text-xs text-muted-foreground">Status</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Floating badges */}
                  <div className="absolute -left-4 top-20 bg-card rounded-lg p-3 shadow-elevation-2 border border-border">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center">
                        <Check className="w-4 h-4 text-green-600" />
                      </div>
                      <div>
                        <p className="text-xs font-medium">Checked In!</p>
                        <p className="text-xs text-muted-foreground">2 sec ago</p>
                      </div>
                    </div>
                  </div>

                  <div className="absolute -right-4 bottom-32 bg-card rounded-lg p-3 shadow-elevation-2 border border-border">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                        <Calendar className="w-4 h-4 text-primary" />
                      </div>
                      <div>
                        <p className="text-xs font-medium">Class Booked</p>
                        <p className="text-xs text-muted-foreground">Yoga Flow</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
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

        {/* FAQ Section */}
        <section className="container mx-auto px-4 py-20">
          <div className="text-center mb-16">
            <Badge className="mb-4 bg-primary/10 text-primary border-primary/20">
              FAQ
            </Badge>
            <h2 className="text-4xl font-bold mb-4">Frequently Asked Questions</h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Got questions? We've got answers.
            </p>
          </div>

          <div className="max-w-3xl mx-auto space-y-4">
            {[
              {
                q: "When does Rep Club launch?",
                a: "Rep Club officially launches November 1st, 2025. Join our early access waitlist to be among the first to use the platform and get special founding member pricing."
              },
              {
                q: "Can I migrate my data from another gym software?",
                a: "Yes! We offer free data migration assistance for all Professional and Enterprise plans. Our team will help you transfer members, classes, and billing information seamlessly."
              },
              {
                q: "Is there a free trial?",
                a: "Absolutely. All plans come with a 30-day free trial, no credit card required. You'll have full access to test all features before committing."
              },
              {
                q: "Do my members need to download an app?",
                a: "No app download required! Rep Club works as a Progressive Web App (PWA) that members can access from any browser. They can also add it to their home screen for an app-like experience."
              },
              {
                q: "What payment processors do you support?",
                a: "We use Stripe for all payment processing, which supports credit cards, debit cards, and ACH bank transfers. We handle PCI compliance so you don't have to worry about security."
              },
              {
                q: "Can I cancel anytime?",
                a: "Yes, you can cancel your subscription at any time with no penalties. We offer a 30-day money-back guarantee if you're not satisfied."
              }
            ].map((faq, i) => (
              <Card key={i} className="gym-card">
                <CardContent className="p-6">
                  <h3 className="font-semibold text-lg mb-2">{faq.q}</h3>
                  <p className="text-muted-foreground">{faq.a}</p>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="text-center mt-8">
            <p className="text-muted-foreground mb-4">
              Still have questions?
            </p>
            <Button variant="outline" onClick={() => window.location.href = 'mailto:hello@repclub.app'}>
              Contact Support
            </Button>
          </div>
        </section>

        {/* CTA Section */}
        <section className="bg-gradient-hero py-20 text-white">
          <div className="container mx-auto px-4 text-center">
            <h2 className="text-4xl font-bold mb-4">
              Ready to Transform Your Gym?
            </h2>
            <p className="text-xl mb-8 opacity-90 max-w-2xl mx-auto">
              Join the founding members getting early access to Rep Club before our November 1st launch.
              Limited spots available.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center space-y-4 sm:space-y-0 sm:space-x-4">
              <Button
                size="lg"
                onClick={() => {
                  document.getElementById('early-access')?.scrollIntoView({ behavior: 'smooth' });
                }}
                variant="secondary"
                className="px-8 py-4 text-lg shadow-elevation-2"
              >
                Request Early Access
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
              <Button
                variant="secondary"
                size="lg"
                onClick={() => navigate('/auth')}
                className="px-8 py-4 text-lg bg-white/95 text-foreground border-white/30 hover:bg-white"
              >
                Existing User? Sign In
              </Button>
            </div>
          </div>
        </section>

        <Footer />
      </div>

      {/* Demo Video Modal */}
      <Dialog open={showDemoModal} onOpenChange={setShowDemoModal}>
        <DialogContent className="max-w-4xl p-0 overflow-hidden">
          <DialogHeader className="p-6 pb-0">
            <DialogTitle className="text-2xl">See Rep Club in Action</DialogTitle>
            <DialogDescription>
              Watch how Rep Club streamlines gym management from member check-in to billing automation
            </DialogDescription>
          </DialogHeader>
          <div className="p-6">
            {/* Video placeholder - replace with actual video embed */}
            <div className="aspect-video bg-muted rounded-lg flex items-center justify-center border-2 border-dashed border-border">
              <div className="text-center space-y-4">
                <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
                  <Play className="w-10 h-10 text-primary" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold mb-1">Demo Video Coming Soon</h3>
                  <p className="text-muted-foreground text-sm max-w-md">
                    We're putting the finishing touches on our product demo.
                    Request early access to be the first to see it!
                  </p>
                </div>
                <Button
                  onClick={() => {
                    setShowDemoModal(false);
                    setTimeout(() => {
                      document.getElementById('early-access')?.scrollIntoView({ behavior: 'smooth' });
                    }, 100);
                  }}
                  className="bg-gradient-primary hover:opacity-90"
                >
                  Request Early Access Instead
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Feature highlights */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
              {[
                { icon: Users, label: 'Member Management' },
                { icon: Calendar, label: 'Class Scheduling' },
                { icon: CreditCard, label: 'Automated Billing' },
                { icon: BarChart3, label: 'Analytics Dashboard' },
              ].map((feature, i) => (
                <div key={i} className="flex items-center gap-2 p-3 rounded-lg bg-muted/50">
                  <feature.icon className="h-5 w-5 text-primary" />
                  <span className="text-sm font-medium">{feature.label}</span>
                </div>
              ))}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}