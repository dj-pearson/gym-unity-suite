import { Link } from 'react-router-dom';
import { Mail, Phone, MapPin, Twitter, Facebook, Instagram, Linkedin } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';

export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="glass border-t border-white/10 relative z-10" role="contentinfo">
      <div className="container mx-auto px-4 py-12">
        {/* Main Footer Content */}
        <div className="grid md:grid-cols-2 lg:grid-cols-5 gap-8 mb-8">
          {/* Company Info */}
          <div className="lg:col-span-2">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 bg-gradient-primary rounded-lg flex items-center justify-center" aria-hidden="true">
                <span className="text-white font-bold text-sm">RC</span>
              </div>
              <span className="text-xl font-bold">Rep Club</span>
            </div>
            <p className="text-muted-foreground mb-4 max-w-md">
              The complete gym management platform designed to help fitness businesses grow,
              engage members, and streamline operations with powerful tools and insights.
            </p>
            <address className="space-y-2 text-sm not-italic">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Mail className="h-4 w-4" aria-hidden="true" />
                <a href="mailto:hello@repclub.app" className="hover:text-foreground transition-colors">
                  hello@repclub.app
                </a>
              </div>
              <div className="flex items-center gap-2 text-muted-foreground">
                <Phone className="h-4 w-4" aria-hidden="true" />
                <a href="tel:+1-555-0123" className="hover:text-foreground transition-colors">
                  +1 (555) 012-3456
                </a>
              </div>
              <div className="flex items-center gap-2 text-muted-foreground">
                <MapPin className="h-4 w-4" aria-hidden="true" />
                <span>San Francisco, CA</span>
              </div>
            </address>
          </div>

          {/* Product Links */}
          <div>
            <h3 className="font-semibold mb-4">Product</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link to="/features" className="text-muted-foreground hover:text-foreground transition-colors">
                  Features
                </Link>
              </li>
              <li>
                <a href="/#pricing" className="text-muted-foreground hover:text-foreground transition-colors">
                  Pricing
                </a>
              </li>
              <li>
                <Link to="/features/scheduling" className="text-muted-foreground hover:text-foreground transition-colors">
                  Class Scheduling
                </Link>
              </li>
              <li>
                <Link to="/solutions/yoga-studios" className="text-muted-foreground hover:text-foreground transition-colors">
                  For Yoga Studios
                </Link>
              </li>
              <li>
                <Link to="/solutions/crossfit-gyms" className="text-muted-foreground hover:text-foreground transition-colors">
                  For CrossFit Gyms
                </Link>
              </li>
            </ul>
          </div>

          {/* Resources */}
          <div>
            <h3 className="font-semibold mb-4">Resources</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link to="/blog" className="text-muted-foreground hover:text-foreground transition-colors">
                  Blog
                </Link>
              </li>
              <li>
                <Link to="/compare/mindbody-alternative" className="text-muted-foreground hover:text-foreground transition-colors">
                  Mindbody Alternative
                </Link>
              </li>
              <li>
                <Link to="/compare/glofox-alternative" className="text-muted-foreground hover:text-foreground transition-colors">
                  Glofox Alternative
                </Link>
              </li>
              <li>
                <Link to="/compare/zen-planner-alternative" className="text-muted-foreground hover:text-foreground transition-colors">
                  Zen Planner Alternative
                </Link>
              </li>
              <li>
                <a href="/#early-access" className="text-muted-foreground hover:text-foreground transition-colors">
                  Request Early Access
                </a>
              </li>
            </ul>
          </div>

          {/* Company */}
          <div>
            <h3 className="font-semibold mb-4">Company</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <a href="mailto:hello@repclub.app" className="text-muted-foreground hover:text-foreground transition-colors">
                  Contact Us
                </a>
              </li>
              <li>
                <Link to="/auth" className="text-muted-foreground hover:text-foreground transition-colors">
                  Sign In
                </Link>
              </li>
              <li>
                <Link to="/local/new-york-gym-software" className="text-muted-foreground hover:text-foreground transition-colors">
                  NYC Gym Software
                </Link>
              </li>
              <li>
                <Link to="/privacy" className="text-muted-foreground hover:text-foreground transition-colors">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link to="/terms" className="text-muted-foreground hover:text-foreground transition-colors">
                  Terms of Service
                </Link>
              </li>
              <li>
                <Link to="/accessibility" className="text-muted-foreground hover:text-foreground transition-colors">
                  Accessibility
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Newsletter Signup */}
        <div className="bg-card border rounded-lg p-6 mb-8">
          <div className="max-w-md">
            <h3 id="newsletter-heading" className="font-semibold mb-2">Stay Updated</h3>
            <p id="newsletter-description" className="text-sm text-muted-foreground mb-4">
              Get the latest fitness business tips and Rep Club updates delivered to your inbox.
            </p>
            <form className="flex gap-2" aria-labelledby="newsletter-heading" aria-describedby="newsletter-description">
              <label htmlFor="newsletter-email" className="sr-only">Email address</label>
              <Input
                id="newsletter-email"
                type="email"
                placeholder="Enter your email"
                className="flex-1"
                aria-required="true"
                autoComplete="email"
              />
              <Button type="submit">Subscribe</Button>
            </form>
          </div>
        </div>

        <Separator className="mb-8" />

        {/* Bottom Footer */}
        <div className="flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="text-sm text-muted-foreground">
            © {currentYear} Rep Club. All rights reserved.
          </div>

          {/* Social Links */}
          <nav className="flex items-center gap-4" aria-label="Social media links">
            <a
              href="https://twitter.com/repclub"
              target="_blank"
              rel="noopener noreferrer"
              className="text-muted-foreground hover:text-foreground transition-colors"
              aria-label="Follow us on Twitter"
            >
              <Twitter className="h-5 w-5" aria-hidden="true" />
            </a>
            <a
              href="https://facebook.com/repclub"
              target="_blank"
              rel="noopener noreferrer"
              className="text-muted-foreground hover:text-foreground transition-colors"
              aria-label="Follow us on Facebook"
            >
              <Facebook className="h-5 w-5" aria-hidden="true" />
            </a>
            <a
              href="https://instagram.com/repclub"
              target="_blank"
              rel="noopener noreferrer"
              className="text-muted-foreground hover:text-foreground transition-colors"
              aria-label="Follow us on Instagram"
            >
              <Instagram className="h-5 w-5" aria-hidden="true" />
            </a>
            <a
              href="https://linkedin.com/company/repclub"
              target="_blank"
              rel="noopener noreferrer"
              className="text-muted-foreground hover:text-foreground transition-colors"
              aria-label="Follow us on LinkedIn"
            >
              <Linkedin className="h-5 w-5" aria-hidden="true" />
            </a>
          </nav>
        </div>
      </div>
    </footer>
  );
}