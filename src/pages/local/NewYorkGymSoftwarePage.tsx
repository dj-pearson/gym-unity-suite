import React from 'react';
import { Helmet } from 'react-helmet-async';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Footer } from '@/components/layout/Footer';
import { 
  MapPin,
  Building2,
  Users,
  TrendingUp,
  ArrowRight,
  Check,
  Star,
  Phone,
  Clock
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Logo } from '@/components/ui/logo';

const localStats = [
  { label: 'NYC Gyms Served', value: '150+' },
  { label: 'Local Members Managed', value: '85,000+' },
  { label: 'Average Revenue Increase', value: '32%' },
  { label: 'Local Support Response', value: '<2 hours' }
];

const nycGyms = [
  {
    name: 'Manhattan Strength Studio',
    neighborhood: 'Upper East Side',
    memberCount: '1,200 members',
    testimonial: 'Rep Club transformed our member experience. Class bookings increased 40% and our retention is the highest it\'s ever been.',
    owner: 'Jessica Chen, Owner',
    result: '40% increase in bookings'
  },
  {
    name: 'Brooklyn Fitness Collective', 
    neighborhood: 'Williamsburg',
    memberCount: '800 members',
    testimonial: 'The mobile-first design was crucial for our NYC members. Everyone books on their phone during commutes.',
    owner: 'Mike Rodriguez, Manager',
    result: '85% mobile bookings'
  },
  {
    name: 'Tribeca Wellness Center',
    neighborhood: 'Tribeca',
    memberCount: '1,500 members', 
    testimonial: 'Rep Club\'s analytics helped us optimize our class schedule for NYC\'s unique traffic patterns and work schedules.',
    owner: 'Sarah Kim, Owner',
    result: '28% higher utilization'
  }
];

const nycNeighborhoods = [
  'Manhattan', 'Brooklyn', 'Queens', 'Bronx', 'Staten Island',
  'Upper East Side', 'Upper West Side', 'Midtown', 'Downtown',
  'Williamsburg', 'DUMBO', 'Park Slope', 'Long Island City',
  'Astoria', 'Flushing', 'Forest Hills', 'Bay Ridge'
];

const nycFeatures = [
  {
    title: 'Mobile-First for NYC Commuters',
    description: 'Perfect for NYC\'s mobile-first lifestyle. Members book classes during subway rides and lunch breaks.',
    icon: Users,
    stat: '85% of NYC bookings happen on mobile'
  },
  {
    title: 'Peak Time Optimization',
    description: 'Smart scheduling that adapts to NYC\'s unique traffic patterns and work schedules.',
    icon: Clock,
    stat: 'Handle 6am and 7pm rush crowds'
  },
  {
    title: 'Multi-Location Management',
    description: 'Manage multiple NYC locations from one dashboard. Perfect for growing NYC fitness brands.',
    icon: Building2,
    stat: 'Support for unlimited locations'
  },
  {
    title: 'Local Payment Processing',
    description: 'Optimized payment processing for NYC market with support for all major payment methods.',
    icon: TrendingUp,
    stat: '99.9% payment success rate'
  }
];

export default function NewYorkGymSoftwarePage() {
  const navigate = useNavigate();

  const structuredData = {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    "name": "Rep Club - New York Gym Management Software",
    "description": "Leading gym management software for New York City fitness centers. Trusted by 150+ NYC gyms across Manhattan, Brooklyn, Queens, and more.",
    "url": "https://repclub.app/local/new-york-gym-software",
    "address": {
      "@type": "PostalAddress",
      "addressLocality": "New York",
      "addressRegion": "NY",
      "addressCountry": "US"
    },
    "areaServed": [
      "New York City",
      "Manhattan",
      "Brooklyn", 
      "Queens",
      "Bronx",
      "Staten Island"
    ],
    "serviceType": "Gym Management Software",
    "aggregateRating": {
      "@type": "AggregateRating",
      "ratingValue": "4.9",
      "reviewCount": "150"
    }
  };

  const faqData = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": [
      {
        "@type": "Question",
        "name": "Which New York gyms use Rep Club?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Rep Club serves over 150 fitness centers across NYC including Manhattan, Brooklyn, Queens, and the Bronx. Our clients range from boutique studios to large multi-location gym chains."
        }
      },
      {
        "@type": "Question",
        "name": "Does Rep Club work well for NYC's mobile-first culture?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Yes, Rep Club is built mobile-first which is perfect for NYC members who book classes during commutes. 85% of bookings in NYC happen on mobile devices."
        }
      },
      {
        "@type": "Question",
        "name": "Can Rep Club handle NYC peak hours and high volume?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Absolutely. Rep Club's infrastructure is designed to handle high-volume periods like NYC's 6am and 7pm rush times with real-time booking and waitlist management."
        }
      }
    ]
  };

  return (
    <>
      <Helmet>
        <title>New York Gym Management Software | NYC Fitness Centers - Rep Club</title>
        <meta name="description" content="Leading gym management software for New York City fitness centers. Trusted by 150+ NYC gyms across Manhattan, Brooklyn, Queens & more. Mobile-first design perfect for NYC." />
        <meta name="keywords" content="New York gym software, NYC fitness management, Manhattan gym management, Brooklyn fitness software, Queens gym system, gym software NYC" />
        <link rel="canonical" href="https://repclub.net/local/new-york-gym-software" />
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
              <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                <Phone className="h-4 w-4" />
                <span>NYC: (212) 555-CLUB</span>
              </div>
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
            <div className="max-w-5xl mx-auto text-center">
              <div className="flex items-center justify-center space-x-2 mb-6">
                <MapPin className="h-6 w-6 text-primary" />
                <Badge className="bg-primary/10 text-primary border-primary/20">
                  New York City's #1 Choice
                </Badge>
              </div>
              <h1 className="text-4xl md:text-5xl font-bold mb-6">
                New York Gym Management Software
              </h1>
              <p className="text-xl text-muted-foreground mb-8 max-w-3xl mx-auto">
                Trusted by 150+ NYC fitness centers across Manhattan, Brooklyn, Queens, and the Bronx. 
                Built for the fast-paced NYC lifestyle with mobile-first design and instant booking.
              </p>
              
              {/* Local Stats */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6 max-w-4xl mx-auto mb-12">
                {localStats.map((stat, index) => (
                  <div key={index} className="bg-card/80 backdrop-blur-sm rounded-lg p-6 border border-border">
                    <div className="text-3xl font-bold text-primary">{stat.value}</div>
                    <div className="text-sm text-muted-foreground">{stat.label}</div>
                  </div>
                ))}
              </div>
              
              <div className="flex flex-col sm:flex-row items-center justify-center space-y-4 sm:space-y-0 sm:space-x-4">
                <Button 
                  size="lg" 
                  onClick={() => navigate('/auth')}
                  className="bg-gradient-primary hover:opacity-90 px-8 py-4"
                >
                  Join 150+ NYC Gyms
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

        {/* NYC-Specific Features */}
        <section className="container mx-auto px-4 py-20">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold mb-4">Built for NYC's Unique Fitness Culture</h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Features designed specifically for New York's fast-paced, mobile-first fitness environment.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-16">
            {nycFeatures.map((feature, index) => (
              <Card key={index} className="gym-card group hover:shadow-elevation-3 transition-all duration-300">
                <CardHeader>
                  <div className="flex items-start space-x-4">
                    <div className="p-3 bg-gradient-primary rounded-lg group-hover:scale-110 transition-transform flex-shrink-0">
                      <feature.icon className="h-6 w-6 text-white" />
                    </div>
                    <div className="flex-1">
                      <CardTitle className="text-xl mb-2">{feature.title}</CardTitle>
                      <CardDescription className="text-base mb-3">
                        {feature.description}
                      </CardDescription>
                      <Badge variant="outline" className="bg-success/10 text-success border-success/20">
                        {feature.stat}
                      </Badge>
                    </div>
                  </div>
                </CardHeader>
              </Card>
            ))}
          </div>
        </section>

        {/* NYC Success Stories */}
        <section className="bg-muted/50 py-20">
          <div className="container mx-auto px-4">
            <div className="text-center mb-16">
              <h2 className="text-3xl font-bold mb-4">NYC Gyms Using Rep Club</h2>
              <p className="text-xl text-muted-foreground">
                Real success stories from fitness centers across the five boroughs.
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
              {nycGyms.map((gym, index) => (
                <Card key={index} className="gym-card">
                  <CardHeader>
                    <div className="flex items-start space-x-3">
                      <MapPin className="h-5 w-5 text-primary mt-1 flex-shrink-0" />
                      <div className="flex-1">
                        <CardTitle className="text-lg">{gym.name}</CardTitle>
                        <p className="text-sm text-muted-foreground">{gym.neighborhood}</p>
                        <p className="text-xs text-muted-foreground">{gym.memberCount}</p>
                      </div>
                    </div>
                    <Badge className="w-fit bg-success/10 text-success border-success/20">
                      {gym.result}
                    </Badge>
                  </CardHeader>
                  <CardContent>
                    <blockquote className="text-sm text-foreground mb-4 italic">
                      "{gym.testimonial}"
                    </blockquote>
                    <div className="text-xs text-muted-foreground">
                      — {gym.owner}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* NYC Neighborhoods */}
        <section className="container mx-auto px-4 py-20">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold mb-4">Serving Fitness Centers Across NYC</h2>
            <p className="text-xl text-muted-foreground">
              Rep Club powers gyms and studios in every NYC neighborhood.
            </p>
          </div>

          <div className="max-w-4xl mx-auto">
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {nycNeighborhoods.map((neighborhood, index) => (
                <div key={index} className="text-center p-4 bg-card rounded-lg border border-border hover:shadow-md transition-shadow">
                  <div className="text-sm font-medium">{neighborhood}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Local Support */}
        <section className="bg-gradient-primary py-20 text-white">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto text-center">
              <h2 className="text-3xl font-bold mb-4">Local NYC Support Team</h2>
              <p className="text-xl mb-8 opacity-90">
                Dedicated New York support team that understands the local fitness market. 
                Get help when you need it, from people who know NYC.
              </p>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
                <div className="text-center">
                  <Clock className="h-8 w-8 mx-auto mb-4 opacity-90" />
                  <h3 className="text-lg font-semibold mb-2">Fast Response</h3>
                  <p className="text-sm opacity-80">Average response time under 2 hours during NYC business hours</p>
                </div>
                <div className="text-center">
                  <MapPin className="h-8 w-8 mx-auto mb-4 opacity-90" />
                  <h3 className="text-lg font-semibold mb-2">Local Expertise</h3>
                  <p className="text-sm opacity-80">Team members who understand NYC fitness market and regulations</p>
                </div>
                <div className="text-center">
                  <Users className="h-8 w-8 mx-auto mb-4 opacity-90" />
                  <h3 className="text-lg font-semibold mb-2">Onsite Training</h3>
                  <p className="text-sm opacity-80">Available for onsite training and setup at your NYC location</p>
                </div>
              </div>
              
              <div className="bg-white/10 rounded-lg p-6 backdrop-blur-sm">
                <h3 className="text-xl font-semibold mb-4">Contact Our NYC Team</h3>
                <div className="flex flex-col sm:flex-row items-center justify-center space-y-2 sm:space-y-0 sm:space-x-6 text-sm">
                  <div className="flex items-center space-x-2">
                    <Phone className="h-4 w-4" />
                    <span>(212) 555-CLUB</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <MapPin className="h-4 w-4" />
                    <span>nyc@repclub.app</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* FAQ Section */}
        <section className="container mx-auto px-4 py-20">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold mb-4">NYC Gym Software FAQ</h2>
            <p className="text-xl text-muted-foreground">
              Common questions from New York fitness center owners.
            </p>
          </div>
          
          <div className="max-w-3xl mx-auto space-y-6">
            <Card className="gym-card">
              <CardHeader>
                <CardTitle>Which New York gyms use Rep Club?</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Rep Club serves over 150 fitness centers across NYC including Manhattan, Brooklyn, Queens, 
                  and the Bronx. Our clients range from boutique studios to large multi-location gym chains.
                </p>
              </CardContent>
            </Card>
            
            <Card className="gym-card">
              <CardHeader>
                <CardTitle>Does Rep Club work well for NYC's mobile-first culture?</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Yes, Rep Club is built mobile-first which is perfect for NYC members who book classes during 
                  commutes. 85% of bookings in NYC happen on mobile devices.
                </p>
              </CardContent>
            </Card>
            
            <Card className="gym-card">
              <CardHeader>
                <CardTitle>Can Rep Club handle NYC peak hours and high volume?</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Absolutely. Rep Club's infrastructure is designed to handle high-volume periods like NYC's 6am 
                  and 7pm rush times with real-time booking and waitlist management.
                </p>
              </CardContent>
            </Card>

            <Card className="gym-card">
              <CardHeader>
                <CardTitle>Do you offer onsite setup in NYC?</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Yes, our NYC team provides onsite training and setup throughout the five boroughs. 
                  We'll come to your location to ensure smooth implementation.
                </p>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* CTA Section */}
        <section className="bg-gradient-hero py-20 text-white">
          <div className="container mx-auto px-4 text-center">
            <h2 className="text-3xl font-bold mb-4">
              Ready to Join NYC's Top Fitness Centers?
            </h2>
            <p className="text-xl mb-8 opacity-90 max-w-2xl mx-auto">
              Start your free trial today and see why 150+ NYC gyms choose Rep Club. 
              Local support, mobile-first design, and features built for New York.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center space-y-4 sm:space-y-0 sm:space-x-4">
              <Button 
                size="lg" 
                onClick={() => navigate('/auth')}
                variant="secondary"
                className="px-8 py-4 text-lg shadow-elevation-2"
              >
                Start Free Trial in NYC
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
              <Button 
                variant="outline" 
                size="lg"
                onClick={() => navigate('/demo')}
                className="px-8 py-4 text-lg border-white/20 text-white hover:bg-white/10"
              >
                Schedule NYC Demo
              </Button>
            </div>
            <p className="text-sm opacity-75 mt-6">
              Free setup • Local support • NYC-based training team
            </p>
          </div>
        </section>

        <Footer />
      </div>
    </>
  );
}