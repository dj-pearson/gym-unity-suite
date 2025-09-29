import React from 'react';
import { Helmet } from 'react-helmet-async';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Footer } from '@/components/layout/Footer';
import { 
  Calendar, 
  Clock, 
  Users, 
  UserPlus,
  Smartphone,
  BarChart3,
  ArrowRight,
  Check,
  Star,
  Zap,
  Shield
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Logo } from '@/components/ui/logo';

const schedulingFeatures = [
  {
    title: 'Automated Class Scheduling',
    description: 'Set up recurring classes with automatic scheduling that handles repeating sessions, instructor assignments, and capacity limits.',
    icon: Calendar
  },
  {
    title: 'Real-Time Booking System',
    description: 'Members can book classes instantly with real-time availability updates and automatic waitlist management.',
    icon: Clock
  },
  {
    title: 'Instructor Management',
    description: 'Assign instructors, manage substitutes, and track instructor availability with automated notifications.',
    icon: Users
  },
  {
    title: 'Mobile-First Booking',
    description: 'Optimized mobile booking experience allows members to book classes anytime, anywhere from their phones.',
    icon: Smartphone
  },
  {
    title: 'Waitlist Management',
    description: 'Automatic waitlist handling with smart notifications when spots become available.',
    icon: UserPlus
  },
  {
    title: 'Usage Analytics',
    description: 'Track class popularity, peak times, and utilization rates to optimize your schedule.',
    icon: BarChart3
  }
];

const benefits = [
  'Eliminate double-bookings and scheduling conflicts',
  'Reduce no-shows with automated reminders',
  'Increase class utilization by up to 40%',
  'Save 10+ hours per week on scheduling tasks',
  'Improve member satisfaction with easy booking',
  'Optimize instructor schedules and costs'
];

const testimonials = [
  {
    name: 'Sarah Johnson',
    role: 'Owner, FlexCore Fitness',
    content: 'Rep Club\'s scheduling system eliminated our double-bookings completely. Our class utilization increased 40% in the first month, and members love how easy it is to book.',
    rating: 5,
    gym: 'FlexCore Fitness - 800 members'
  },
  {
    name: 'Marcus Thompson',
    role: 'Manager, Urban Strength',
    content: 'The automated waitlist feature is brilliant. We went from having empty spots to full classes because members get notified instantly when spots open up.',
    rating: 5,
    gym: 'Urban Strength - 1,200 members'
  }
];

const comparisonData = [
  { feature: 'Real-time booking', repclub: true, mindbody: true, zenplanner: false, glofox: true },
  { feature: 'Automated waitlists', repclub: true, mindbody: true, zenplanner: false, glofox: false },
  { feature: 'Mobile-optimized', repclub: true, mindbody: false, zenplanner: false, glofox: true },
  { feature: 'Instructor substitutes', repclub: true, mindbody: true, zenplanner: true, glofox: false },
  { feature: 'Class analytics', repclub: true, mindbody: true, zenplanner: false, glofox: false },
  { feature: 'Unlimited classes', repclub: true, mindbody: false, zenplanner: false, glofox: false }
];

export default function SchedulingPage() {
  const navigate = useNavigate();

  const structuredData = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    "name": "Rep Club Gym Scheduling Software",
    "description": "Advanced gym and fitness class scheduling software with real-time booking, automated waitlists, and mobile-first design. Perfect for gyms, yoga studios, and fitness centers.",
    "url": "https://repclub.net/features/scheduling",
    "applicationCategory": "BusinessApplication",
    "operatingSystem": "Web Browser, iOS, Android",
    "featureList": schedulingFeatures.map(f => f.title),
    "offers": {
      "@type": "Offer",
      "name": "Free Trial",
      "price": "0",
      "priceCurrency": "USD",
      "description": "14-day free trial of gym scheduling software"
    }
  };

  const faqData = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": [
      {
        "@type": "Question",
        "name": "How does gym scheduling software save time?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Gym scheduling software automates recurring class creation, handles member bookings automatically, manages waitlists, and sends automated reminders. This eliminates manual scheduling tasks that typically take 10+ hours per week."
        }
      },
      {
        "@type": "Question",
        "name": "Can members book classes from their phones?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Yes, Rep Club's gym scheduling software is mobile-first, allowing members to easily book classes, join waitlists, and receive notifications directly from their smartphones."
        }
      },
      {
        "@type": "Question",
        "name": "Does the system handle instructor substitutes?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Yes, our gym scheduling software includes instructor management features that handle substitutes, track availability, and automatically notify members of instructor changes."
        }
      }
    ]
  };

  return (
    <>
      <Helmet>
        <title>Gym Scheduling Software | Class Booking System for Fitness Centers - Rep Club</title>
        <meta name="description" content="Advanced gym scheduling software with real-time class booking, automated waitlists & mobile optimization. Perfect for gyms, yoga studios & fitness centers. Try free!" />
        <meta name="keywords" content="gym scheduling software, fitness class booking system, gym class scheduling, fitness studio booking software, yoga class scheduling, gym booking app" />
        <link rel="canonical" href="https://repclub.net/features/scheduling" />
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
            <Logo size="md" showText={true} linkToHome={true} />
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
                Gym Scheduling Software
              </Badge>
              <h1 className="text-4xl md:text-5xl font-bold mb-6">
                Advanced Gym & Fitness Class Scheduling Software
              </h1>
              <p className="text-xl text-muted-foreground mb-8 max-w-3xl mx-auto">
                Automate your class scheduling with real-time booking, intelligent waitlists, and mobile-first design. 
                Save 10+ hours per week while increasing class utilization by up to 40%.
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center space-y-4 sm:space-y-0 sm:space-x-4 mb-12">
                <Button 
                  size="lg" 
                  onClick={() => navigate('/auth')}
                  className="bg-gradient-primary hover:opacity-90 px-8 py-4"
                >
                  Try Scheduling Software Free
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
                  <div className="text-3xl font-bold text-primary">10+ hrs</div>
                  <div className="text-sm text-muted-foreground">Saved per week</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-primary">40%</div>
                  <div className="text-sm text-muted-foreground">Higher utilization</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-primary">0</div>
                  <div className="text-sm text-muted-foreground">Double bookings</div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="container mx-auto px-4 py-20">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold mb-4">Complete Class Scheduling Features</h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Everything you need to manage class schedules efficiently and keep your members happy.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {schedulingFeatures.map((feature, index) => (
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
                <h2 className="text-3xl font-bold mb-4">Why Gym Owners Choose Rep Club Scheduling</h2>
                <p className="text-xl text-muted-foreground">
                  Real benefits that impact your bottom line and member satisfaction.
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
                  <h3 className="text-2xl font-semibold mb-4">ROI Calculator</h3>
                  <div className="space-y-4">
                    <div className="flex justify-between">
                      <span>Time saved per week:</span>
                      <span className="font-semibold">10 hours</span>
                    </div>
                    <div className="flex justify-between">
                      <span>At $25/hour labor cost:</span>
                      <span className="font-semibold">$250/week</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Monthly savings:</span>
                      <span className="font-semibold">$1,000</span>
                    </div>
                    <div className="border-t border-white/20 pt-4">
                      <div className="flex justify-between text-lg">
                        <span>Annual ROI:</span>
                        <span className="font-bold">$12,000+</span>
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
            <h2 className="text-3xl font-bold mb-4">How Rep Club Compares to Other Gym Software</h2>
            <p className="text-xl text-muted-foreground">
              See why fitness professionals choose Rep Club over Mindbody, ZenPlanner, and Glofox.
            </p>
          </div>

          <div className="max-w-4xl mx-auto">
            <div className="overflow-x-auto">
              <table className="w-full border-collapse bg-card rounded-lg overflow-hidden">
                <thead>
                  <tr className="bg-muted">
                    <th className="text-left p-4 font-semibold">Feature</th>
                    <th className="text-center p-4 font-semibold">Rep Club</th>
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
                        {row.repclub ? (
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
        </section>

        {/* Testimonials */}
        <section className="bg-muted/50 py-20">
          <div className="container mx-auto px-4">
            <div className="text-center mb-16">
              <h2 className="text-3xl font-bold mb-4">Real Results from Gym Owners</h2>
              <p className="text-xl text-muted-foreground">
                See how our scheduling software is transforming fitness businesses.
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
              Common questions about gym scheduling software.
            </p>
          </div>
          
          <div className="max-w-3xl mx-auto space-y-6">
            <Card className="gym-card">
              <CardHeader>
                <CardTitle>How does gym scheduling software save time?</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Gym scheduling software automates recurring class creation, handles member bookings automatically, 
                  manages waitlists, and sends automated reminders. This eliminates manual scheduling tasks that 
                  typically take 10+ hours per week.
                </p>
              </CardContent>
            </Card>
            
            <Card className="gym-card">
              <CardHeader>
                <CardTitle>Can members book classes from their phones?</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Yes, Rep Club's gym scheduling software is mobile-first, allowing members to easily book classes, 
                  join waitlists, and receive notifications directly from their smartphones.
                </p>
              </CardContent>
            </Card>
            
            <Card className="gym-card">
              <CardHeader>
                <CardTitle>Does the system handle instructor substitutes?</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Yes, our gym scheduling software includes instructor management features that handle substitutes, 
                  track availability, and automatically notify members of instructor changes.
                </p>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* CTA Section */}
        <section className="bg-gradient-hero py-20 text-white">
          <div className="container mx-auto px-4 text-center">
            <h2 className="text-3xl font-bold mb-4">
              Ready to Streamline Your Class Scheduling?
            </h2>
            <p className="text-xl mb-8 opacity-90 max-w-2xl mx-auto">
              Join hundreds of gym owners who have eliminated scheduling headaches with Rep Club. 
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