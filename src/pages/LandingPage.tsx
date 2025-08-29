import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Dumbbell, 
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
      category: "Boutique Studio",
      plans: [
        {
          name: "Starter",
          price: 99,
          interval: "month",
          members: "Up to 200 members",
          popular: false,
          icon: Users,
          features: [
            "Essential class scheduling",
            "Basic payment processing", 
            "Mobile member app",
            "Email support",
            "Member management",
            "Basic reporting"
          ],
          savings: "30% vs competitors"
        },
        {
          name: "Professional", 
          price: 299,
          interval: "month",
          members: "Up to 1,000 members",
          popular: true,
          icon: Building2,
          features: [
            "Everything in Starter",
            "Advanced reporting & analytics",
            "Marketing automation",
            "Branded mobile app", 
            "Priority support",
            "Custom integrations"
          ],
          savings: "Best value"
        },
        {
          name: "Premium",
          price: 599, 
          interval: "month",
          members: "Unlimited members",
          popular: false,
          icon: Crown,
          features: [
            "Everything in Professional",
            "Multi-location support",
            "Complete custom branding",
            "API access",
            "Dedicated success manager",
            "White-label options"
          ],
          savings: "Enterprise features"
        }
      ]
    },
    {
      category: "Mid-Market Fitness",
      plans: [
        {
          name: "Growth",
          price: 199,
          interval: "month", 
          members: "Up to 500 members",
          popular: false,
          icon: BarChart3,
          features: [
            "Equipment management",
            "Staff scheduling",
            "Basic business intelligence",
            "Member retention tools",
            "Multi-location ready",
            "Advanced reporting"
          ],
          savings: "Operational focus"
        },
        {
          name: "Pro",
          price: 399,
          interval: "month",
          members: "Up to 2,000 members", 
          popular: true,
          icon: Sparkles,
          features: [
            "Everything in Growth",
            "Advanced retention tools",
            "Corporate wellness features",
            "Full multi-location support",
            "Custom dashboards",
            "Premium integrations"
          ],
          savings: "Most popular"
        }
      ]
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

  return (
    <div className="min-h-screen bg-gradient-subtle">
      {/* Navigation - stays on top, separate from parallax */}
      <nav className="bg-card/95 backdrop-blur-sm border-b border-border sticky top-0 z-50 relative">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="flex items-center justify-center w-10 h-10 bg-gradient-primary rounded-lg">
              <Dumbbell className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-foreground">Rep Club</h1>
              <p className="text-xs text-muted-foreground">Elite Fitness Management</p>
            </div>
          </div>
          <Button 
            onClick={() => navigate('/auth')}
            className="bg-gradient-primary hover:opacity-90"
          >
            Get Started
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
      </nav>

      {/* Parallax background with integrated content */}
      <InteractiveHeroBackground className="relative w-full z-0">
        {/* Hero Section - integrated into parallax */}
        <section className="relative container mx-auto px-4 py-20 text-center flex items-center min-h-[80vh] z-10">
          <div className="relative z-10 max-w-4xl mx-auto">
            <Badge className="mb-6 bg-secondary/10 text-primary border-secondary/20">
              Elite Fitness Management Platform
            </Badge>
            <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold mb-6 text-white leading-tight drop-shadow-lg">
              Elevate Your 
              <br />
              <span className="relative text-gradient-primary">
                Fitness Experience
              </span>
            </h1>
            <p className="text-xl md:text-2xl text-white/90 mb-8 max-w-2xl mx-auto leading-relaxed drop-shadow-md">
              Premium management solutions for discerning fitness professionals. From exclusive boutiques 
              to luxury fitness clubs, Rep Club delivers unparalleled sophistication and performance.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center space-y-4 sm:space-y-0 sm:space-x-4">
              <Button 
                size="lg" 
                onClick={() => navigate('/auth')}
                className="bg-gradient-primary hover:opacity-90 px-8 py-4 text-lg shadow-glow hover:shadow-elevation-3 transition-all duration-300"
              >
                Start Free Trial
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

        {/* Features Grid - integrated into parallax */}
        <section className="container mx-auto px-4 py-20 z-10">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4 text-white drop-shadow-lg">Everything You Need to Manage Your Gym</h2>
            <p className="text-xl text-white/80 max-w-2xl mx-auto">
              Powerful features designed specifically for fitness businesses of all sizes
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <Card key={index} className="gym-card group hover:shadow-elevation-3 transition-all duration-300 bg-white/10 backdrop-blur-sm border-white/20">
                <CardHeader>
                  <div className="flex items-center space-x-4">
                    <div className="p-3 bg-gradient-primary rounded-lg group-hover:scale-110 transition-transform">
                      <feature.icon className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <CardTitle className="text-lg text-white">{feature.title}</CardTitle>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-base text-white/80">
                    {feature.description}
                  </CardDescription>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>
      </InteractiveHeroBackground>

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
      <section className="container mx-auto px-4 py-20">
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

        {pricingPlans.map((category, categoryIndex) => (
          <div key={categoryIndex} className="mb-16">
            <div className="text-center mb-12">
              <h3 className="text-2xl font-bold text-foreground mb-2">{category.category}</h3>
              <p className="text-muted-foreground">
                {category.category === "Boutique Studio" 
                  ? "Perfect for specialty fitness studios and boutique operations" 
                  : "Designed for established fitness centers with advanced needs"
                }
              </p>
            </div>

            <div className={`grid gap-8 ${category.plans.length === 3 ? 'grid-cols-1 lg:grid-cols-3' : 'grid-cols-1 md:grid-cols-2'} max-w-6xl mx-auto`}>
              {category.plans.map((plan, index) => (
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
                      <p className="text-sm text-muted-foreground mt-2">{plan.members}</p>
                      <Badge variant="outline" className="mt-2 text-xs">
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
                          plan_category: category.category,
                          member_limit: plan.members,
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
          </div>
        ))}

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

      {/* Footer */}
      <footer className="bg-card border-t border-border py-12">
        <div className="container mx-auto px-4 text-center">
          <div className="flex items-center justify-center space-x-3 mb-6">
            <div className="flex items-center justify-center w-8 h-8 bg-gradient-primary rounded-lg">
              <Dumbbell className="w-5 h-5 text-white" />
            </div>
            <span className="text-lg font-bold text-foreground">Rep Club</span>
          </div>
          <p className="text-muted-foreground mb-4">
            Elite fitness management solutions for discerning professionals.
          </p>
          <p className="text-sm text-muted-foreground">
            © 2025 Rep Club. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}