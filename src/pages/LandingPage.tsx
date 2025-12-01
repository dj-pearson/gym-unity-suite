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

import { EarlyAccessForm } from '@/components/auth/EarlyAccessForm';
import { Logo } from '@/components/ui/logo';
import { InteractiveHeroBackground } from '@/components/backgrounds/InteractiveHeroBackground';
import { OneTimePaymentButton } from '@/components/membership/OneTimePaymentButton';
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
    "name": "Gym Unity Suite",
    "description": "All-in-one gym management software for boutique fitness studios. Complete member management, class scheduling, billing automation, CRM & sales pipeline, and branded mobile apps.",
    "url": "https://gymunitysuite.com",
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
      "name": "Gym Unity Suite",
      "url": "https://gymunitysuite.com"
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
        title="Gym Management Software for Small Studios | Gym Unity Suite"
        description="All-in-one gym management software for boutique fitness studios. Member management, automated billing, CRM, and branded mobile app. Join the waitlist for early access."
        keywords="gym management software, fitness studio software, boutique gym software, yoga studio software, gym CRM, gym billing software, gym membership software, affordable gym software, small gym software"
        structuredData={structuredData}
      />
      <div className="min-h-screen bg-background selection:bg-primary selection:text-primary-foreground">
        {/* Navigation - Glassmorphism */}
        <nav className="fixed top-0 w-full z-50 glass border-b border-white/10">
          <div className="container mx-auto px-6 py-4 flex items-center justify-between">
            <Logo size="xl" linkToHome={true} />

            {/* Navigation Links */}
            <div className="hidden md:flex items-center space-x-8">
              <a href="#features" className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors">
                Features
              </a>
              <a href="#pricing" className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors">
                Pricing
              </a>
              <Button
                variant="ghost"
                onClick={() => navigate('/blog')}
                className="text-sm font-medium text-muted-foreground hover:text-primary"
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
                className="btn-primary"
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
                onClick={() => navigate('/blog')}
                className="text-muted-foreground hover:text-primary"
              >
                Sign In
              </Button>
              <Button
                size="sm"
                onClick={() => {
                  document.getElementById('early-access')?.scrollIntoView({ behavior: 'smooth' });
                }}
                className="btn-primary"
              >
                Access
              </Button>
            </div>
          </div>
        </nav>

        {/* Parallax background with hero content only */}
        <InteractiveHeroBackground className="relative w-full z-0 pt-20">
          {/* Hero Section - integrated into parallax */}
          <section ref={heroContainerRef} className="relative container mx-auto px-4 py-32 text-center flex flex-col items-center justify-center min-h-[90vh] z-10">
            <div className="relative z-10 max-w-5xl mx-auto">
              <div className="hero-badge flex justify-center mb-8">
                <Badge className="px-4 py-2 bg-primary/10 text-primary border-primary/20 backdrop-blur-md rounded-full text-sm font-medium tracking-wide uppercase">
                  <Sparkles className="w-4 h-4 mr-2" />
                  Elite Fitness Management Platform
                </Badge>
              </div>

              <h1 className="hero-title text-6xl md:text-7xl lg:text-8xl font-bold mb-8 text-white leading-tight tracking-tight drop-shadow-2xl">
                The Gold Standard in
                <br />
                <span className="text-gradient-primary relative inline-block">
                  Gym Management
                  <div className="absolute -bottom-2 left-0 w-full h-2 bg-primary/30 blur-lg rounded-full"></div>
                </span>
              </h1>

              <p className="hero-description text-xl md:text-2xl text-muted-foreground mb-12 max-w-3xl mx-auto leading-relaxed font-light">
                Elevate your fitness business with the most sophisticated management suite.
                Automate scheduling, billing, and member experiences with <span className="text-white font-medium">unrivaled elegance</span>.
              </p>

              <div className="hero-buttons flex flex-col sm:flex-row items-center justify-center space-y-4 sm:space-y-0 sm:space-x-6">
                <Button
                  size="lg"
                  onClick={() => {
                    document.getElementById('early-access')?.scrollIntoView({ behavior: 'smooth' });
                  }}
                  className="btn-primary px-10 py-7 text-lg rounded-full"
                >
                  Request Early Access
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
                <Button
                  variant="outline"
                  size="lg"
                  className="px-10 py-7 text-lg glass text-white border-white/10 hover:bg-white/10 rounded-full backdrop-blur-md transition-all duration-300"
                >
                  Watch Demo
                </Button>
              </div>
            </div>
          </section>
        </InteractiveHeroBackground>

        {/* Features Grid - Glassmorphism */}
        <section id="features" className="relative py-32 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-subtle opacity-50 pointer-events-none"></div>
          <div className="container mx-auto px-4 relative z-10">
            <div className="text-center mb-20">
              <h2 className="text-4xl md:text-5xl font-bold mb-6 text-white">
                Engineered for <span className="text-gradient-primary">Excellence</span>
              </h2>
              <p className="text-xl text-muted-foreground max-w-2xl mx-auto font-light">
                A complete ecosystem of tools designed to streamline your operations and elevate your member experience.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {features.map((feature, index) => (
                <Card key={index} className="gym-card group border-white/5 bg-white/5 hover:bg-white/10">
                  <CardHeader>
                    <div className="flex items-center space-x-4">
                      <div className="p-3 bg-gradient-primary rounded-xl shadow-lg shadow-primary/20 group-hover:scale-110 transition-transform duration-300">
                        <feature.icon className="h-6 w-6 text-black" />
                      </div>
                      <div>
                        <CardTitle className="text-xl text-white">{feature.title}</CardTitle>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <CardDescription className="text-base text-muted-foreground leading-relaxed">
                      {feature.description}
                    </CardDescription>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Benefits Section */}
        <section className="py-32 relative">
          <div className="container mx-auto px-4">
            <div className="text-center mb-20">
              <h2 className="text-4xl md:text-5xl font-bold mb-6 text-white">Why Choose Rep Club?</h2>
              <p className="text-xl text-muted-foreground max-w-2xl mx-auto font-light">
                Crafted by elite fitness professionals for the most discerning standards.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
              {benefits.map((benefit, index) => (
                <div key={index} className="text-center group p-8 rounded-3xl hover:bg-white/5 transition-colors duration-300">
                  <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-secondary rounded-2xl mb-8 group-hover:scale-110 transition-transform duration-300 shadow-xl shadow-black/50 border border-white/5">
                    <benefit.icon className="h-10 w-10 text-primary" />
                  </div>
                  <h3 className="text-2xl font-semibold mb-4 text-white">{benefit.title}</h3>
                  <p className="text-muted-foreground text-lg leading-relaxed">{benefit.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Pricing Section - Glass Cards */}
        <section id="pricing" className="py-32 relative overflow-hidden">
          {/* Background Glow */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-primary/5 rounded-full blur-[120px] pointer-events-none"></div>

          <div className="container mx-auto px-4 relative z-10">
            <div className="text-center mb-20">
              <Badge className="mb-6 bg-primary/10 text-primary border-primary/20 px-4 py-1.5">
                Transparent Pricing
              </Badge>
              <h2 className="text-4xl md:text-5xl font-bold mb-6 text-white">Choose Your Tier</h2>
              <p className="text-xl text-muted-foreground max-w-3xl mx-auto font-light">
                Premium fitness management solutions with transparent, value-based pricing.
                No hidden fees, just elite software.
              </p>
            </div>

            <div className="grid gap-8 grid-cols-1 lg:grid-cols-3 max-w-7xl mx-auto">
              {pricingPlans.map((plan, index) => (
                <Card
                  key={index}
                  className={`gym-card relative border-white/5 ${plan.popular ? 'bg-white/10 border-primary/50 shadow-glow scale-105 z-10' : 'bg-white/5'} hover:bg-white/10`}
                >
                  {plan.popular && (
                    <div className="absolute -top-5 left-1/2 transform -translate-x-1/2">
                      <Badge className="bg-primary text-black font-bold px-6 py-2 shadow-lg shadow-primary/25 border-none text-sm uppercase tracking-wide">
                        Most Popular
                      </Badge>
                    </div>
                  )}

                  <CardHeader className="text-center pb-8 pt-10">
                    <div className="flex items-center justify-center mb-6">
                      <div className={`p-4 rounded-2xl ${plan.popular ? 'bg-gradient-primary shadow-lg shadow-primary/20' : 'bg-white/5 border border-white/10'}`}>
                        <plan.icon className={`h-8 w-8 ${plan.popular ? 'text-black' : 'text-primary'}`} />
                      </div>
                    </div>
                    <CardTitle className="text-3xl font-bold text-white mb-2">{plan.name}</CardTitle>
                    <div className="mt-6">
                      <div className="text-5xl font-bold text-white tracking-tight">
                        ${plan.price}
                        <span className="text-lg text-muted-foreground font-normal ml-1">/{plan.interval}</span>
                      </div>
                      <div className="mt-4 space-y-1">
                        <p className="text-sm font-medium text-white/80">{plan.members}</p>
                        <p className="text-sm text-muted-foreground">{plan.team}</p>
                      </div>
                      <Badge variant="outline" className="mt-4 text-xs border-white/10 text-primary bg-primary/5">
                        {plan.savings}
                      </Badge>
                    </div>
                  </CardHeader>

                  <CardContent className="space-y-8">
                    <div className="h-px w-full bg-gradient-to-r from-transparent via-white/10 to-transparent"></div>
                    <ul className="space-y-4">
                      {plan.features.map((feature, featureIndex) => (
                        <li key={featureIndex} className="flex items-start space-x-3">
                          <div className="flex-shrink-0 mt-0.5">
                            <div className="w-5 h-5 bg-primary/20 rounded-full flex items-center justify-center">
                              <Check className="h-3 w-3 text-primary" />
                            </div>
                          </div>
                          <span className="text-sm text-muted-foreground">{feature}</span>
                        </li>
                      ))}
                    </ul>

                    <div className="pt-4">
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
                        className={`w-full py-6 text-lg rounded-xl ${plan.popular ? 'btn-primary' : 'glass hover:bg-white/10 border-white/10'}`}
                        variant={plan.popular ? "default" : "outline"}
                      >
                        Get Started
                      </OneTimePaymentButton>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Early Access Section */}
            <section id="early-access" className="mt-32 text-center relative z-10">
              <div className="mb-16">
                <Badge className="mb-6 bg-primary/10 text-primary border-primary/20 px-4 py-1.5">
                  🎯 Early Access Program
                </Badge>
                <h2 className="text-4xl md:text-5xl font-bold mb-6 text-white">Join the Elite Preview</h2>
                <p className="text-xl text-muted-foreground max-w-2xl mx-auto font-light">
                  Get exclusive early access to Rep Club before our official launch. Limited spots available for founding members.
                </p>
              </div>

              <div className="max-w-md mx-auto glass p-8 rounded-3xl border-white/10">
                <EarlyAccessForm />
              </div>
            </section>

            {/* Enterprise Pricing */}
            <div className="mt-20">
              <Card className="gym-card bg-gradient-to-br from-zinc-900 to-black border-white/10 max-w-5xl mx-auto overflow-hidden relative">
                <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-[80px] -mr-32 -mt-32"></div>

                <CardHeader className="text-center pt-12">
                  <div className="flex items-center justify-center mb-6">
                    <div className="p-4 bg-white/5 rounded-2xl backdrop-blur-sm border border-white/10">
                      <Building2 className="h-10 w-10 text-primary" />
                    </div>
                  </div>
                  <CardTitle className="text-3xl font-bold text-white">Enterprise Solutions</CardTitle>
                  <CardDescription className="text-muted-foreground text-lg mt-4 max-w-2xl mx-auto">
                    Custom solutions for large chains and franchises with 10+ locations.
                    Tailored infrastructure for scale.
                  </CardDescription>
                </CardHeader>
                <CardContent className="text-center space-y-10 pb-12">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-3xl mx-auto">
                    <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-6 border border-white/5">
                      <div className="text-3xl font-bold text-white mb-1">$2,000+</div>
                      <div className="text-sm text-muted-foreground">Starting monthly</div>
                    </div>
                    <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-6 border border-white/5">
                      <div className="text-3xl font-bold text-white mb-1">$150-300</div>
                      <div className="text-sm text-muted-foreground">Per location</div>
                    </div>
                    <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-6 border border-white/5">
                      <div className="text-3xl font-bold text-white mb-1">Volume</div>
                      <div className="text-sm text-muted-foreground">Discounts available</div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-y-4 gap-x-12 text-sm max-w-2xl mx-auto text-left">
                    <div className="flex items-center space-x-3">
                      <div className="w-5 h-5 bg-primary/20 rounded-full flex items-center justify-center">
                        <Check className="h-3 w-3 text-primary" />
                      </div>
                      <span className="text-white/80">Implementation & training included</span>
                    </div>
                    <div className="flex items-center space-x-3">
                      <div className="w-5 h-5 bg-primary/20 rounded-full flex items-center justify-center">
                        <Check className="h-3 w-3 text-primary" />
                      </div>
                      <span className="text-white/80">SLA agreements</span>
                    </div>
                    <div className="flex items-center space-x-3">
                      <div className="w-5 h-5 bg-primary/20 rounded-full flex items-center justify-center">
                        <Check className="h-3 w-3 text-primary" />
                      </div>
                      <span className="text-white/80">Dedicated enterprise support</span>
                    </div>
                    <div className="flex items-center space-x-3">
                      <div className="w-5 h-5 bg-primary/20 rounded-full flex items-center justify-center">
                        <Check className="h-3 w-3 text-primary" />
                      </div>
                      <span className="text-white/80">Custom integrations</span>
                    </div>
                  </div>

                  <Button
                    variant="outline"
                    size="lg"
                    className="px-10 py-6 text-lg glass border-white/10 hover:bg-white/10 rounded-xl"
                    onClick={() => navigate('/contact')}
                  >
                    Contact Enterprise Sales
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* Testimonials */}
        <section className="py-32 relative">
          <div className="container mx-auto px-4">
            <div className="text-center mb-20">
              <h2 className="text-4xl md:text-5xl font-bold mb-6 text-white">Trusted by Professionals</h2>
              <p className="text-xl text-muted-foreground font-light">
                See what gym owners are saying about our platform
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {testimonials.map((testimonial, index) => (
                <Card key={index} className="gym-card bg-white/5 border-white/5 hover:bg-white/10">
                  <CardContent className="p-8">
                    <div className="flex items-center mb-6">
                      {[...Array(testimonial.rating)].map((_, i) => (
                        <Star key={i} className="h-5 w-5 fill-primary text-primary" />
                      ))}
                    </div>
                    <blockquote className="text-white/90 mb-6 italic text-lg leading-relaxed">
                      "{testimonial.content}"
                    </blockquote>
                    <div className="flex items-center space-x-4">
                      <div className="w-10 h-10 rounded-full bg-gradient-secondary flex items-center justify-center text-white font-bold">
                        {testimonial.name.charAt(0)}
                      </div>
                      <div>
                        <div className="font-semibold text-white">{testimonial.name}</div>
                        <div className="text-sm text-muted-foreground">{testimonial.role}</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
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
        <section className="py-32 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-hero opacity-20"></div>
          <div className="container mx-auto px-4 text-center relative z-10">
            <h2 className="text-5xl md:text-6xl font-bold mb-8 text-white tracking-tight">
              Ready to Transform Your Gym?
            </h2>
            <p className="text-xl md:text-2xl mb-12 text-muted-foreground max-w-3xl mx-auto font-light">
              Join the elite community of fitness professionals already using Rep Club.
              Experience excellence today.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center space-y-4 sm:space-y-0 sm:space-x-6">
              <Button
                size="lg"
                onClick={() => navigate('/auth')}
                className="btn-primary px-12 py-8 text-xl rounded-full"
              >
                Start Free Trial
                <ArrowRight className="ml-2 h-6 w-6" />
              </Button>
              <Button
                variant="outline"
                size="lg"
                className="px-12 py-8 text-xl glass text-white border-white/10 hover:bg-white/10 rounded-full"
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


