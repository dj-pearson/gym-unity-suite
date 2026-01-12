import React from 'react';
import { Helmet } from 'react-helmet-async';
import { Link } from 'react-router-dom';
import { Footer } from '@/components/layout/Footer';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import {
  CheckCircle2,
  Keyboard,
  Eye,
  Volume2,
  Monitor,
  Smartphone,
  Mail,
  Phone,
  MessageSquare,
  ArrowLeft,
} from 'lucide-react';
import { SkipLink } from '@/components/accessibility/SkipLink';

/**
 * AccessibilityPage
 *
 * Comprehensive accessibility statement and information page.
 * Required for ADA compliance to document accessibility commitment,
 * conformance level, and provide contact information for accessibility issues.
 */
const AccessibilityPage: React.FC = () => {
  const currentDate = new Date().toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return (
    <>
      <Helmet>
        <title>Accessibility Statement | Rep Club - Gym Management Software</title>
        <meta
          name="description"
          content="Rep Club is committed to digital accessibility. Learn about our WCAG 2.1 AA compliance, accessibility features, and how to request accommodations."
        />
      </Helmet>

      <SkipLink />

      <div className="min-h-screen bg-background">
        {/* Header */}
        <header className="border-b border-border">
          <div className="container mx-auto px-4 py-4">
            <nav aria-label="Breadcrumb navigation">
              <Link
                to="/"
                className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
              >
                <ArrowLeft className="h-4 w-4" aria-hidden="true" />
                <span>Back to Home</span>
              </Link>
            </nav>
          </div>
        </header>

        {/* Main Content */}
        <main id="main-content" className="container mx-auto px-4 py-12">
          <div className="max-w-4xl mx-auto">
            {/* Page Header */}
            <header className="mb-12">
              <Badge variant="outline" className="mb-4">
                ADA Compliant
              </Badge>
              <h1 className="text-4xl font-bold mb-4">Accessibility Statement</h1>
              <p className="text-xl text-muted-foreground">
                Rep Club is committed to ensuring digital accessibility for people with
                disabilities. We continually improve the user experience for everyone
                and apply the relevant accessibility standards.
              </p>
              <p className="text-sm text-muted-foreground mt-4">
                Last updated: {currentDate}
              </p>
            </header>

            {/* Conformance Status */}
            <section aria-labelledby="conformance-heading" className="mb-12">
              <Card>
                <CardHeader>
                  <CardTitle id="conformance-heading" className="flex items-center gap-2">
                    <CheckCircle2 className="h-5 w-5 text-success" aria-hidden="true" />
                    Conformance Status
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p>
                    The Web Content Accessibility Guidelines (WCAG) defines requirements
                    for designers and developers to improve accessibility for people with
                    disabilities. It defines three levels of conformance: Level A, Level AA,
                    and Level AAA.
                  </p>
                  <div className="bg-muted p-4 rounded-lg">
                    <p className="font-semibold mb-2">
                      Rep Club is partially conformant with WCAG 2.1 Level AA.
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Partially conformant means that some parts of the content do not fully
                      conform to the accessibility standard. We are actively working to
                      achieve full conformance.
                    </p>
                  </div>
                  <div className="grid md:grid-cols-3 gap-4 mt-6">
                    <div className="text-center p-4 border rounded-lg">
                      <Badge variant="default" className="mb-2">Level A</Badge>
                      <p className="text-sm text-muted-foreground">Fully Conformant</p>
                    </div>
                    <div className="text-center p-4 border rounded-lg bg-primary/5">
                      <Badge variant="default" className="mb-2">Level AA</Badge>
                      <p className="text-sm text-muted-foreground">Partially Conformant</p>
                    </div>
                    <div className="text-center p-4 border rounded-lg">
                      <Badge variant="secondary" className="mb-2">Level AAA</Badge>
                      <p className="text-sm text-muted-foreground">In Progress</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </section>

            {/* Accessibility Features */}
            <section aria-labelledby="features-heading" className="mb-12">
              <h2 id="features-heading" className="text-2xl font-bold mb-6">
                Accessibility Features
              </h2>
              <div className="grid md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <Keyboard className="h-5 w-5 text-primary" aria-hidden="true" />
                      Keyboard Navigation
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2 text-sm">
                      <li className="flex items-start gap-2">
                        <CheckCircle2 className="h-4 w-4 text-success mt-0.5" aria-hidden="true" />
                        <span>Full keyboard accessibility for all interactive elements</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle2 className="h-4 w-4 text-success mt-0.5" aria-hidden="true" />
                        <span>Skip-to-main-content links on all pages</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle2 className="h-4 w-4 text-success mt-0.5" aria-hidden="true" />
                        <span>Visible focus indicators for keyboard users</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle2 className="h-4 w-4 text-success mt-0.5" aria-hidden="true" />
                        <span>Logical tab order throughout the application</span>
                      </li>
                    </ul>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <Eye className="h-5 w-5 text-primary" aria-hidden="true" />
                      Visual Accessibility
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2 text-sm">
                      <li className="flex items-start gap-2">
                        <CheckCircle2 className="h-4 w-4 text-success mt-0.5" aria-hidden="true" />
                        <span>WCAG 2.1 AA compliant color contrast ratios</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle2 className="h-4 w-4 text-success mt-0.5" aria-hidden="true" />
                        <span>Resizable text up to 200% without loss of functionality</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle2 className="h-4 w-4 text-success mt-0.5" aria-hidden="true" />
                        <span>Dark mode support for reduced eye strain</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle2 className="h-4 w-4 text-success mt-0.5" aria-hidden="true" />
                        <span>No content relies solely on color for meaning</span>
                      </li>
                    </ul>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <Volume2 className="h-5 w-5 text-primary" aria-hidden="true" />
                      Screen Reader Support
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2 text-sm">
                      <li className="flex items-start gap-2">
                        <CheckCircle2 className="h-4 w-4 text-success mt-0.5" aria-hidden="true" />
                        <span>Semantic HTML structure with proper landmarks</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle2 className="h-4 w-4 text-success mt-0.5" aria-hidden="true" />
                        <span>ARIA labels for interactive elements</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle2 className="h-4 w-4 text-success mt-0.5" aria-hidden="true" />
                        <span>Live regions for dynamic content updates</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle2 className="h-4 w-4 text-success mt-0.5" aria-hidden="true" />
                        <span>Descriptive alt text for all images</span>
                      </li>
                    </ul>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <Monitor className="h-5 w-5 text-primary" aria-hidden="true" />
                      Motion & Animation
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2 text-sm">
                      <li className="flex items-start gap-2">
                        <CheckCircle2 className="h-4 w-4 text-success mt-0.5" aria-hidden="true" />
                        <span>Respects prefers-reduced-motion settings</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle2 className="h-4 w-4 text-success mt-0.5" aria-hidden="true" />
                        <span>No auto-playing videos or audio</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle2 className="h-4 w-4 text-success mt-0.5" aria-hidden="true" />
                        <span>Animations can be paused or disabled</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle2 className="h-4 w-4 text-success mt-0.5" aria-hidden="true" />
                        <span>No content that flashes more than 3 times per second</span>
                      </li>
                    </ul>
                  </CardContent>
                </Card>
              </div>
            </section>

            {/* Keyboard Shortcuts */}
            <section aria-labelledby="shortcuts-heading" className="mb-12">
              <h2 id="shortcuts-heading" className="text-2xl font-bold mb-6">
                Keyboard Shortcuts
              </h2>
              <Card>
                <CardContent className="pt-6">
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <caption className="sr-only">
                        Available keyboard shortcuts in the Rep Club application
                      </caption>
                      <thead>
                        <tr className="border-b">
                          <th scope="col" className="text-left py-3 px-4 font-semibold">
                            Action
                          </th>
                          <th scope="col" className="text-left py-3 px-4 font-semibold">
                            Windows/Linux
                          </th>
                          <th scope="col" className="text-left py-3 px-4 font-semibold">
                            macOS
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr className="border-b">
                          <td className="py-3 px-4">Open Command Palette</td>
                          <td className="py-3 px-4">
                            <kbd className="px-2 py-1 bg-muted rounded text-sm">Ctrl</kbd>
                            {' + '}
                            <kbd className="px-2 py-1 bg-muted rounded text-sm">K</kbd>
                          </td>
                          <td className="py-3 px-4">
                            <kbd className="px-2 py-1 bg-muted rounded text-sm">⌘</kbd>
                            {' + '}
                            <kbd className="px-2 py-1 bg-muted rounded text-sm">K</kbd>
                          </td>
                        </tr>
                        <tr className="border-b">
                          <td className="py-3 px-4">Toggle Sidebar</td>
                          <td className="py-3 px-4">
                            <kbd className="px-2 py-1 bg-muted rounded text-sm">B</kbd>
                          </td>
                          <td className="py-3 px-4">
                            <kbd className="px-2 py-1 bg-muted rounded text-sm">B</kbd>
                          </td>
                        </tr>
                        <tr className="border-b">
                          <td className="py-3 px-4">Close Modal/Dialog</td>
                          <td className="py-3 px-4">
                            <kbd className="px-2 py-1 bg-muted rounded text-sm">Esc</kbd>
                          </td>
                          <td className="py-3 px-4">
                            <kbd className="px-2 py-1 bg-muted rounded text-sm">Esc</kbd>
                          </td>
                        </tr>
                        <tr className="border-b">
                          <td className="py-3 px-4">Navigate List Items</td>
                          <td className="py-3 px-4">
                            <kbd className="px-2 py-1 bg-muted rounded text-sm">↑</kbd>
                            {' / '}
                            <kbd className="px-2 py-1 bg-muted rounded text-sm">↓</kbd>
                          </td>
                          <td className="py-3 px-4">
                            <kbd className="px-2 py-1 bg-muted rounded text-sm">↑</kbd>
                            {' / '}
                            <kbd className="px-2 py-1 bg-muted rounded text-sm">↓</kbd>
                          </td>
                        </tr>
                        <tr>
                          <td className="py-3 px-4">Submit Form</td>
                          <td className="py-3 px-4">
                            <kbd className="px-2 py-1 bg-muted rounded text-sm">Enter</kbd>
                          </td>
                          <td className="py-3 px-4">
                            <kbd className="px-2 py-1 bg-muted rounded text-sm">Enter</kbd>
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            </section>

            {/* Compatibility */}
            <section aria-labelledby="compatibility-heading" className="mb-12">
              <h2 id="compatibility-heading" className="text-2xl font-bold mb-6">
                Compatibility
              </h2>
              <div className="grid md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Supported Browsers</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2 text-sm">
                      <li>Chrome (latest 2 versions)</li>
                      <li>Firefox (latest 2 versions)</li>
                      <li>Safari (latest 2 versions)</li>
                      <li>Edge (latest 2 versions)</li>
                    </ul>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Assistive Technologies</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2 text-sm">
                      <li>NVDA (Windows)</li>
                      <li>JAWS (Windows)</li>
                      <li>VoiceOver (macOS/iOS)</li>
                      <li>TalkBack (Android)</li>
                    </ul>
                  </CardContent>
                </Card>
              </div>
            </section>

            {/* Known Limitations */}
            <section aria-labelledby="limitations-heading" className="mb-12">
              <h2 id="limitations-heading" className="text-2xl font-bold mb-6">
                Known Limitations
              </h2>
              <Card>
                <CardContent className="pt-6">
                  <p className="mb-4 text-muted-foreground">
                    Despite our best efforts, some areas may have accessibility limitations.
                    We are actively working to address these:
                  </p>
                  <Accordion type="single" collapsible className="w-full">
                    <AccordionItem value="item-1">
                      <AccordionTrigger>Third-party content</AccordionTrigger>
                      <AccordionContent>
                        Some content from third-party providers (such as embedded maps or
                        payment processors) may not be fully accessible. We work with our
                        partners to improve accessibility where possible.
                      </AccordionContent>
                    </AccordionItem>
                    <AccordionItem value="item-2">
                      <AccordionTrigger>PDF documents</AccordionTrigger>
                      <AccordionContent>
                        Some older PDF documents may not be fully accessible. We are working
                        to update all documents to accessible formats. Alternative formats
                        are available upon request.
                      </AccordionContent>
                    </AccordionItem>
                    <AccordionItem value="item-3">
                      <AccordionTrigger>Complex data visualizations</AccordionTrigger>
                      <AccordionContent>
                        Some charts and graphs may be challenging for screen reader users.
                        We provide data tables as alternatives where possible and are
                        working on improved descriptions.
                      </AccordionContent>
                    </AccordionItem>
                  </Accordion>
                </CardContent>
              </Card>
            </section>

            {/* Feedback and Contact */}
            <section aria-labelledby="contact-heading" className="mb-12">
              <h2 id="contact-heading" className="text-2xl font-bold mb-6">
                Feedback & Assistance
              </h2>
              <Card className="bg-primary/5 border-primary/20">
                <CardContent className="pt-6">
                  <p className="mb-6">
                    We welcome your feedback on the accessibility of Rep Club. Please let
                    us know if you encounter accessibility barriers or need assistance:
                  </p>
                  <div className="grid md:grid-cols-3 gap-6">
                    <div className="flex items-start gap-3">
                      <Mail className="h-5 w-5 text-primary mt-0.5" aria-hidden="true" />
                      <div>
                        <h3 className="font-semibold mb-1">Email</h3>
                        <a
                          href="mailto:accessibility@repclub.app"
                          className="text-primary hover:underline"
                        >
                          accessibility@repclub.app
                        </a>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <Phone className="h-5 w-5 text-primary mt-0.5" aria-hidden="true" />
                      <div>
                        <h3 className="font-semibold mb-1">Phone</h3>
                        <a href="tel:+1-555-0123" className="text-primary hover:underline">
                          +1 (555) 012-3456
                        </a>
                        <p className="text-sm text-muted-foreground">
                          TTY: +1 (555) 012-3457
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <MessageSquare className="h-5 w-5 text-primary mt-0.5" aria-hidden="true" />
                      <div>
                        <h3 className="font-semibold mb-1">Response Time</h3>
                        <p className="text-sm text-muted-foreground">
                          We aim to respond within 2 business days
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="mt-6 pt-6 border-t">
                    <h3 className="font-semibold mb-2">When contacting us, please include:</h3>
                    <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
                      <li>The URL of the page where you encountered the issue</li>
                      <li>A description of the accessibility barrier</li>
                      <li>The assistive technology you are using (if applicable)</li>
                      <li>Your contact information so we can follow up</li>
                    </ul>
                  </div>
                </CardContent>
              </Card>
            </section>

            {/* Formal Complaint Procedure */}
            <section aria-labelledby="complaint-heading" className="mb-12">
              <h2 id="complaint-heading" className="text-2xl font-bold mb-6">
                Formal Complaint Procedure
              </h2>
              <Card>
                <CardContent className="pt-6 space-y-4">
                  <p>
                    If you are not satisfied with our response to your accessibility
                    feedback, you may escalate your concern through our formal complaint
                    procedure:
                  </p>
                  <ol className="list-decimal list-inside space-y-2 text-sm">
                    <li>
                      Submit a written complaint to{' '}
                      <a
                        href="mailto:accessibility-complaints@repclub.app"
                        className="text-primary hover:underline"
                      >
                        accessibility-complaints@repclub.app
                      </a>
                    </li>
                    <li>
                      Our Accessibility Coordinator will review and respond within 5 business
                      days
                    </li>
                    <li>
                      If the issue remains unresolved, you may request escalation to our
                      executive team
                    </li>
                    <li>
                      External mediation may be available through the{' '}
                      <a
                        href="https://www.ada.gov/file-a-complaint/"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary hover:underline"
                      >
                        U.S. Department of Justice ADA portal
                      </a>
                    </li>
                  </ol>
                </CardContent>
              </Card>
            </section>

            {/* Technical Specifications */}
            <section aria-labelledby="technical-heading" className="mb-12">
              <h2 id="technical-heading" className="text-2xl font-bold mb-6">
                Technical Specifications
              </h2>
              <Card>
                <CardContent className="pt-6">
                  <p className="mb-4">
                    This accessibility statement applies to{' '}
                    <strong>https://repclub.app</strong> and all associated subdomains.
                  </p>
                  <div className="grid md:grid-cols-2 gap-6">
                    <div>
                      <h3 className="font-semibold mb-2">Technologies Used</h3>
                      <ul className="text-sm text-muted-foreground space-y-1">
                        <li>HTML5</li>
                        <li>WAI-ARIA</li>
                        <li>CSS3</li>
                        <li>JavaScript (React)</li>
                        <li>SVG</li>
                      </ul>
                    </div>
                    <div>
                      <h3 className="font-semibold mb-2">Assessment Methods</h3>
                      <ul className="text-sm text-muted-foreground space-y-1">
                        <li>Automated testing (axe-core, Playwright)</li>
                        <li>Manual keyboard testing</li>
                        <li>Screen reader testing</li>
                        <li>Color contrast analysis</li>
                        <li>User feedback</li>
                      </ul>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </section>

            {/* Mobile Accessibility */}
            <section aria-labelledby="mobile-heading" className="mb-12">
              <h2 id="mobile-heading" className="text-2xl font-bold mb-6">
                <Smartphone className="inline-block h-6 w-6 mr-2" aria-hidden="true" />
                Mobile Accessibility
              </h2>
              <Card>
                <CardContent className="pt-6">
                  <p className="mb-4">
                    Rep Club is designed with mobile accessibility in mind:
                  </p>
                  <ul className="space-y-2 text-sm">
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="h-4 w-4 text-success mt-0.5" aria-hidden="true" />
                      <span>
                        Touch targets meet WCAG 2.5.5 minimum size requirements (44x44 CSS
                        pixels)
                      </span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="h-4 w-4 text-success mt-0.5" aria-hidden="true" />
                      <span>Responsive design adapts to all screen sizes</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="h-4 w-4 text-success mt-0.5" aria-hidden="true" />
                      <span>Compatible with mobile screen readers (VoiceOver, TalkBack)</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="h-4 w-4 text-success mt-0.5" aria-hidden="true" />
                      <span>Supports pinch-to-zoom and text scaling</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="h-4 w-4 text-success mt-0.5" aria-hidden="true" />
                      <span>Safe area support for notched devices</span>
                    </li>
                  </ul>
                </CardContent>
              </Card>
            </section>

            {/* Call to Action */}
            <section className="text-center py-8">
              <h2 className="text-2xl font-bold mb-4">Need Assistance?</h2>
              <p className="text-muted-foreground mb-6 max-w-2xl mx-auto">
                Our team is here to help. If you have any questions about accessibility
                or need assistance using Rep Club, please don't hesitate to reach out.
              </p>
              <div className="flex flex-wrap justify-center gap-4">
                <Button asChild size="lg">
                  <a href="mailto:accessibility@repclub.app">Contact Accessibility Team</a>
                </Button>
                <Button variant="outline" size="lg" asChild>
                  <Link to="/">Return to Home</Link>
                </Button>
              </div>
            </section>
          </div>
        </main>

        <Footer />
      </div>
    </>
  );
};

export default AccessibilityPage;
