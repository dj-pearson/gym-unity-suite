import { Helmet } from 'react-helmet-async';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Footer } from '@/components/layout/Footer';
import { Logo } from '@/components/ui/logo';
import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function PrivacyPage() {
  const navigate = useNavigate();
  const lastUpdated = 'November 26, 2025';

  return (
    <>
      <Helmet>
        <title>Privacy Policy | Rep Club</title>
        <meta name="description" content="Rep Club Privacy Policy - Learn how we collect, use, and protect your personal information." />
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
          <h1 className="text-4xl font-bold mb-4">Privacy Policy</h1>
          <p className="text-muted-foreground mb-8">Last updated: {lastUpdated}</p>

          <Card className="mb-8">
            <CardContent className="prose prose-neutral dark:prose-invert max-w-none p-8">
              <h2>1. Introduction</h2>
              <p>
                Rep Club ("we," "our," or "us") is committed to protecting your privacy. This Privacy Policy
                explains how we collect, use, disclose, and safeguard your information when you use our
                gym management software platform.
              </p>

              <h2>2. Information We Collect</h2>
              <h3>2.1 Information You Provide</h3>
              <ul>
                <li><strong>Account Information:</strong> Name, email address, phone number, business name</li>
                <li><strong>Billing Information:</strong> Payment card details (processed securely via Stripe)</li>
                <li><strong>Member Data:</strong> Information about gym members you add to the platform</li>
                <li><strong>Communications:</strong> Messages you send through our platform</li>
              </ul>

              <h3>2.2 Information Collected Automatically</h3>
              <ul>
                <li>Device and browser information</li>
                <li>IP address and location data</li>
                <li>Usage patterns and feature interactions</li>
                <li>Cookies and similar tracking technologies</li>
              </ul>

              <h2>3. How We Use Your Information</h2>
              <p>We use the collected information to:</p>
              <ul>
                <li>Provide and maintain our gym management services</li>
                <li>Process transactions and send related information</li>
                <li>Send administrative messages and updates</li>
                <li>Respond to your comments, questions, and support requests</li>
                <li>Improve our platform and develop new features</li>
                <li>Protect against fraudulent or unauthorized activity</li>
              </ul>

              <h2>4. Data Sharing and Disclosure</h2>
              <p>We do not sell your personal information. We may share data with:</p>
              <ul>
                <li><strong>Service Providers:</strong> Third parties that help us operate our platform (e.g., Stripe for payments, Supabase for data storage)</li>
                <li><strong>Legal Requirements:</strong> When required by law or to protect our rights</li>
                <li><strong>Business Transfers:</strong> In connection with a merger, acquisition, or sale of assets</li>
              </ul>

              <h2>5. Data Security</h2>
              <p>
                We implement industry-standard security measures including encryption, secure data centers,
                and regular security audits. However, no method of transmission over the Internet is 100% secure.
              </p>

              <h2>6. Your Rights</h2>
              <p>Depending on your location, you may have the right to:</p>
              <ul>
                <li>Access your personal data</li>
                <li>Correct inaccurate data</li>
                <li>Delete your data</li>
                <li>Export your data</li>
                <li>Opt out of marketing communications</li>
              </ul>

              <h2>7. Data Retention</h2>
              <p>
                We retain your information for as long as your account is active or as needed to provide
                services. We may retain certain information as required by law or for legitimate business purposes.
              </p>

              <h2>8. Children's Privacy</h2>
              <p>
                Our services are not intended for children under 13. We do not knowingly collect personal
                information from children under 13.
              </p>

              <h2>9. Changes to This Policy</h2>
              <p>
                We may update this Privacy Policy from time to time. We will notify you of any changes by
                posting the new policy on this page and updating the "Last updated" date.
              </p>

              <h2>10. Contact Us</h2>
              <p>
                If you have questions about this Privacy Policy, please contact us at:
              </p>
              <ul>
                <li>Email: <a href="mailto:privacy@repclub.app">privacy@repclub.app</a></li>
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
