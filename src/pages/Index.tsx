import { SEOHead } from "@/components/seo/SEOHead";
import { FAQSection, gymSoftwareFAQs } from "@/components/seo/FAQSection";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Check, ArrowRight, Star, Users, TrendingUp, Zap } from "lucide-react";
import { Link } from "react-router-dom";

const Index = () => {
  return (
    <>
      {/* SEO Meta Tags */}
      <SEOHead
        title="Gym Management Software for Small Studios | $97/mo"
        description="All-in-one gym management software for boutique fitness studios. Member management, automated billing, CRM, and branded mobile app. Starts at $97/month. Try free for 30 days."
        keywords="gym management software, fitness studio software, boutique gym software, yoga studio software, gym CRM, gym billing software, affordable gym software, small gym software"
        url="https://gymunitysuite.com/"
        type="website"
        structuredData={{
          "@context": "https://schema.org",
          "@type": "SoftwareApplication",
          "name": "Gym Unity Suite",
          "description": "All-in-one gym management software for boutique fitness studios",
          "applicationCategory": "BusinessApplication",
          "operatingSystem": "Web, iOS, Android",
          "offers": {
            "@type": "AggregateOffer",
            "lowPrice": "97",
            "highPrice": "497",
            "priceCurrency": "USD"
          },
          "aggregateRating": {
            "@type": "AggregateRating",
            "ratingValue": "4.8",
            "reviewCount": "127"
          }
        }}
      />

      <div className="min-h-screen bg-background">
        {/* Hero Section */}
        <section className="relative overflow-hidden bg-gradient-to-br from-primary/5 via-background to-primary/10 py-20 md:py-32">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto text-center">
              {/* Trust Badge */}
              <div className="inline-flex items-center gap-2 bg-primary/10 rounded-full px-4 py-2 mb-6">
                <Star className="h-4 w-4 fill-primary text-primary" />
                <span className="text-sm font-medium">4.8/5 from 127+ fitness studios</span>
              </div>

              {/* Main Headline - H1 with primary keywords */}
              <h1 className="text-4xl md:text-6xl font-bold tracking-tight mb-6">
                All-in-One Gym Management Software for{" "}
                <span className="text-primary">Boutique Studios</span>
              </h1>

              {/* Subheadline with value prop and pain points */}
              <p className="text-xl md:text-2xl text-muted-foreground mb-8 leading-relaxed">
                Run your fitness studio with less stress and more profit.
                Gym Unity Suite combines member management, automated billing,
                CRM, and a branded mobile app—starting at just <strong className="text-foreground">$97/month</strong>.
              </p>

              {/* Social Proof Stats */}
              <div className="flex flex-wrap justify-center gap-8 mb-10">
                <div className="flex items-center gap-2">
                  <Users className="h-5 w-5 text-primary" />
                  <div className="text-left">
                    <div className="font-bold text-2xl">500+</div>
                    <div className="text-sm text-muted-foreground">Studios Trust Us</div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-primary" />
                  <div className="text-left">
                    <div className="font-bold text-2xl">$50M+</div>
                    <div className="text-sm text-muted-foreground">Revenue Managed</div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Zap className="h-5 w-5 text-primary" />
                  <div className="text-left">
                    <div className="font-bold text-2xl">40%</div>
                    <div className="text-sm text-muted-foreground">Better Retention</div>
                  </div>
                </div>
              </div>

              {/* CTA Buttons */}
              <div className="flex flex-col sm:flex-row gap-4 justify-center mb-6">
                <Button size="lg" className="text-lg px-8 py-6" asChild>
                  <Link to="/register">
                    Start Free 30-Day Trial <ArrowRight className="ml-2 h-5 w-5" />
                  </Link>
                </Button>
                <Button size="lg" variant="outline" className="text-lg px-8 py-6" asChild>
                  <Link to="/demo">
                    Watch 2-Min Demo
                  </Link>
                </Button>
              </div>

              {/* Trust Signals */}
              <p className="text-sm text-muted-foreground">
                No credit card required • Cancel anytime • Free onboarding included
              </p>
            </div>
          </div>
        </section>

        {/* Built for Your Type of Studio */}
        <section className="py-20 bg-muted/50">
          <div className="container mx-auto px-4">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">
                Built for Your Type of Fitness Business
              </h2>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                Tailored features for every fitness niche—from yoga studios to CrossFit boxes
              </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
              {[
                {
                  title: "Yoga Studios",
                  description: "Class packs, workshops, instructor management",
                  link: "/solutions/yoga-studios"
                },
                {
                  title: "CrossFit Boxes",
                  description: "WOD tracking, Open Gym, competition management",
                  link: "/solutions/crossfit-gyms"
                },
                {
                  title: "Martial Arts Schools",
                  description: "Belt progression, family plans, curriculum",
                  link: "/solutions/martial-arts-schools"
                },
                {
                  title: "Pilates Studios",
                  description: "Reformer scheduling, private sessions, packages",
                  link: "/solutions/pilates-studios"
                },
                {
                  title: "Personal Training",
                  description: "Session packages, client tracking, assessments",
                  link: "/solutions/personal-training"
                },
                {
                  title: "24/7 Access Gyms",
                  description: "Door access, unstaffed hours, security",
                  link: "/features"
                }
              ].map((vertical, idx) => (
                <Card key={idx} className="hover:shadow-lg transition-shadow">
                  <CardContent className="pt-6">
                    <h3 className="font-semibold text-lg mb-2">{vertical.title}</h3>
                    <p className="text-muted-foreground mb-4">{vertical.description}</p>
                    <Link to={vertical.link} className="text-primary hover:underline inline-flex items-center">
                      Learn more <ArrowRight className="ml-1 h-4 w-4" />
                    </Link>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Key Features Section */}
        <section className="py-20">
          <div className="container mx-auto px-4">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">
                Everything You Need in One Platform
              </h2>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                Stop juggling multiple tools. Get all enterprise-grade features at a fraction of the cost.
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
              {[
                {
                  title: "Member Management",
                  description: "Complete member profiles, check-in tracking, attendance history, and automated engagement"
                },
                {
                  title: "Automated Billing",
                  description: "Recurring payments, failed payment recovery, flexible pricing, and payment analytics"
                },
                {
                  title: "CRM & Sales Pipeline",
                  description: "Lead tracking, automated follow-ups, conversion analytics, and lead scoring"
                },
                {
                  title: "Class Scheduling",
                  description: "Online booking, waitlists, recurring classes, and instructor management"
                },
                {
                  title: "Branded Mobile App",
                  description: "Your logo, your colors. Members book classes and manage accounts on-the-go"
                },
                {
                  title: "Analytics & Reports",
                  description: "Revenue tracking, retention metrics, member insights, and growth forecasting"
                }
              ].map((feature, idx) => (
                <div key={idx} className="flex gap-4">
                  <div className="flex-shrink-0">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                      <Check className="h-5 w-5 text-primary" />
                    </div>
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg mb-2">{feature.title}</h3>
                    <p className="text-muted-foreground">{feature.description}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="text-center mt-12">
              <Button size="lg" asChild>
                <Link to="/features">
                  See All Features <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </div>
          </div>
        </section>

        {/* Why Switch Section - Comparison */}
        <section className="py-20 bg-muted/50">
          <div className="container mx-auto px-4">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">
                Why Gym Owners Switch to Gym Unity Suite
              </h2>
              <p className="text-lg text-muted-foreground">
                Save money, get better features, and enjoy faster support
              </p>
            </div>

            <div className="max-w-4xl mx-auto">
              <div className="bg-card rounded-lg shadow-lg overflow-hidden">
                <table className="w-full">
                  <thead className="bg-muted">
                    <tr>
                      <th className="py-4 px-6 text-left font-semibold">Feature</th>
                      <th className="py-4 px-6 text-center font-semibold">Mindbody</th>
                      <th className="py-4 px-6 text-center font-semibold bg-primary/10">
                        Gym Unity Suite
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {[
                      { feature: "Monthly Cost (200 members)", competitor: "$329/mo", us: "$197/mo" },
                      { feature: "Setup Fees", competitor: "$1,499", us: "$0" },
                      { feature: "CRM Included", competitor: "❌ Add-on ($99/mo)", us: "✅ Included" },
                      { feature: "Custom Branding", competitor: "❌ Enterprise only", us: "✅ All plans" },
                      { feature: "Support Response Time", competitor: "24-48 hours", us: "<2 hours" }
                    ].map((row, idx) => (
                      <tr key={idx} className="hover:bg-muted/50">
                        <td className="py-4 px-6 font-medium">{row.feature}</td>
                        <td className="py-4 px-6 text-center text-muted-foreground">{row.competitor}</td>
                        <td className="py-4 px-6 text-center font-semibold text-primary bg-primary/5">
                          {row.us}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="text-center mt-8">
                <Link to="/compare/mindbody-alternative" className="text-primary hover:underline inline-flex items-center">
                  See Full Comparison <ArrowRight className="ml-1 h-4 w-4" />
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* FAQ Section with Schema Markup */}
        <FAQSection
          title="Frequently Asked Questions"
          subtitle="Everything you need to know about gym management software"
          faqs={gymSoftwareFAQs}
          className="bg-background"
        />

        {/* Final CTA Section */}
        <section className="py-20 bg-primary text-primary-foreground">
          <div className="container mx-auto px-4 text-center">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Ready to Transform Your Fitness Business?
            </h2>
            <p className="text-xl mb-8 opacity-90 max-w-2xl mx-auto">
              Join 500+ studios that have simplified their operations and boosted revenue with Gym Unity Suite
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" variant="secondary" className="text-lg px-8 py-6" asChild>
                <Link to="/register">
                  Start Free 30-Day Trial <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" className="text-lg px-8 py-6 bg-transparent border-primary-foreground text-primary-foreground hover:bg-primary-foreground hover:text-primary" asChild>
                <Link to="/contact">
                  Talk to Sales
                </Link>
              </Button>
            </div>
            <p className="mt-6 text-sm opacity-75">
              Questions? Email us at hello@gymunitysuite.com or call (555) 123-4567
            </p>
          </div>
        </section>
      </div>
    </>
  );
};

export default Index;
