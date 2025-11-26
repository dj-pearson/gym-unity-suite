import { Helmet } from 'react-helmet-async';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Footer } from '@/components/layout/Footer';
import { Logo } from '@/components/ui/logo';
import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function TermsPage() {
  const navigate = useNavigate();
  const lastUpdated = 'November 26, 2025';

  return (
    <>
      <Helmet>
        <title>Terms of Service | Rep Club</title>
        <meta name="description" content="Rep Club Terms of Service - The terms and conditions governing use of our gym management platform." />
      </Helmet>

      <div className="min-h-screen bg-background">
        {/* Navigation */}
        <nav className="bg-card/95 backdrop-blur-sm border-b border-border sticky top-0 z-50">
          <div className="container mx-auto px-4 py-4 flex items-center justify-between">
            <Logo size="md" linkToHome={true} />
            <Button
              variant="ghost"
              onClick={() => navigate(-1)}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Back
            </Button>
          </div>
        </nav>

        {/* Content */}
        <div className="container mx-auto px-4 py-12 max-w-4xl">
          <h1 className="text-4xl font-bold mb-4">Terms of Service</h1>
          <p className="text-muted-foreground mb-8">Last updated: {lastUpdated}</p>

          <Card className="mb-8">
            <CardContent className="prose prose-neutral dark:prose-invert max-w-none p-8">
              <h2>1. Acceptance of Terms</h2>
              <p>
                By accessing or using Rep Club's gym management platform ("Service"), you agree to be bound
                by these Terms of Service ("Terms"). If you do not agree to these Terms, do not use the Service.
              </p>

              <h2>2. Description of Service</h2>
              <p>
                Rep Club provides a cloud-based gym management software platform that includes member management,
                class scheduling, billing automation, CRM tools, and related features for fitness businesses.
              </p>

              <h2>3. Account Registration</h2>
              <ul>
                <li>You must provide accurate and complete registration information</li>
                <li>You are responsible for maintaining the security of your account credentials</li>
                <li>You must be at least 18 years old to use the Service</li>
                <li>One person or legal entity may not maintain more than one free account</li>
              </ul>

              <h2>4. Subscription and Payments</h2>
              <h3>4.1 Pricing</h3>
              <p>
                Subscription fees are based on your selected plan (Studio, Professional, or Enterprise).
                Prices are subject to change with 30 days notice.
              </p>

              <h3>4.2 Billing</h3>
              <ul>
                <li>Subscriptions are billed monthly or annually in advance</li>
                <li>All fees are non-refundable except as required by law</li>
                <li>You authorize us to charge your payment method automatically</li>
              </ul>

              <h3>4.3 Cancellation</h3>
              <p>
                You may cancel your subscription at any time. Cancellation takes effect at the end of your
                current billing period. You will retain access until then.
              </p>

              <h2>5. Acceptable Use</h2>
              <p>You agree not to:</p>
              <ul>
                <li>Use the Service for any illegal purpose</li>
                <li>Violate any applicable laws or regulations</li>
                <li>Infringe on intellectual property rights</li>
                <li>Transmit malware or harmful code</li>
                <li>Attempt to gain unauthorized access to the Service</li>
                <li>Interfere with or disrupt the Service</li>
                <li>Resell or redistribute the Service without authorization</li>
              </ul>

              <h2>6. Data Ownership</h2>
              <h3>6.1 Your Data</h3>
              <p>
                You retain all rights to the data you upload to the Service ("Your Data"). You grant us
                a license to use Your Data solely to provide the Service.
              </p>

              <h3>6.2 Data Export</h3>
              <p>
                You may export Your Data at any time during your subscription. We will provide reasonable
                assistance with data export upon account termination.
              </p>

              <h2>7. Intellectual Property</h2>
              <p>
                The Service, including all software, designs, and content, is owned by Rep Club and protected
                by intellectual property laws. You may not copy, modify, or reverse engineer any part of the Service.
              </p>

              <h2>8. Limitation of Liability</h2>
              <p>
                TO THE MAXIMUM EXTENT PERMITTED BY LAW, REP CLUB SHALL NOT BE LIABLE FOR ANY INDIRECT,
                INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, OR ANY LOSS OF PROFITS OR REVENUES.
              </p>
              <p>
                Our total liability for any claims under these Terms shall not exceed the amount you paid
                us in the 12 months preceding the claim.
              </p>

              <h2>9. Indemnification</h2>
              <p>
                You agree to indemnify and hold harmless Rep Club from any claims, damages, or expenses
                arising from your use of the Service or violation of these Terms.
              </p>

              <h2>10. Service Availability</h2>
              <p>
                We strive for 99.9% uptime but do not guarantee uninterrupted access. We may perform
                scheduled maintenance with advance notice when possible.
              </p>

              <h2>11. Modifications to Terms</h2>
              <p>
                We may modify these Terms at any time. We will provide notice of material changes via
                email or through the Service. Continued use after changes constitutes acceptance.
              </p>

              <h2>12. Termination</h2>
              <p>
                We may suspend or terminate your account for violation of these Terms. Upon termination,
                your right to use the Service ceases immediately.
              </p>

              <h2>13. Governing Law</h2>
              <p>
                These Terms are governed by the laws of the State of California, without regard to
                conflict of law principles.
              </p>

              <h2>14. Dispute Resolution</h2>
              <p>
                Any disputes shall be resolved through binding arbitration in San Francisco, California,
                except for claims that may be brought in small claims court.
              </p>

              <h2>15. Contact</h2>
              <p>
                For questions about these Terms, contact us at:
              </p>
              <ul>
                <li>Email: <a href="mailto:legal@repclub.app">legal@repclub.app</a></li>
                <li>Address: Rep Club, San Francisco, CA</li>
              </ul>
            </CardContent>
          </Card>
        </div>

        <Footer />
      </div>
    </>
  );
}
