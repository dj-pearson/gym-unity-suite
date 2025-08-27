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
  Star
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import ModernHeroElements from '@/components/ui/ModernHeroElements';

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
      {/* Navigation */}
      <nav className="bg-card/95 backdrop-blur-sm border-b border-border sticky top-0 z-50">
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

      {/* Hero Section */}
      <section className="relative container mx-auto px-4 py-20 text-center overflow-hidden">
        <ModernHeroElements />
        <div className="relative z-10 max-w-4xl mx-auto">
          <Badge className="mb-6 bg-secondary/10 text-primary border-secondary/20">
            Elite Fitness Management Platform
          </Badge>
          <h1 className="text-5xl md:text-6xl font-bold mb-6 text-foreground leading-tight">
            Elevate Your 
            <br />
            <span className="relative">
              Fitness Experience
            </span>
          </h1>
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            Premium management solutions for discerning fitness professionals. From exclusive boutiques 
            to luxury fitness clubs, Rep Club delivers unparalleled sophistication and performance.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center space-y-4 sm:space-y-0 sm:space-x-4">
            <Button 
              size="lg" 
              onClick={() => navigate('/auth')}
              className="bg-gradient-primary hover:opacity-90 px-8 py-4 text-lg shadow-glow"
            >
              Start Free Trial
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
            <Button 
              variant="outline" 
              size="lg"
              className="px-8 py-4 text-lg"
            >
              Watch Demo
            </Button>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="container mx-auto px-4 py-20">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold mb-4">Everything You Need to Manage Your Gym</h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Powerful features designed specifically for fitness businesses of all sizes
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