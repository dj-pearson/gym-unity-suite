import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import OneTimePaymentButton from '@/components/membership/OneTimePaymentButton';
import SubscriptionButton from '@/components/membership/SubscriptionButton';
import { CreditCard, Zap, Calendar, Users } from 'lucide-react';

export default function PaymentDemoPage() {
  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground mb-2">Payment System Demo</h1>
        <p className="text-muted-foreground">
          Test both one-time payments and subscription processing with Stripe integration.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* One-Time Payments */}
        <Card className="gym-card">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <CreditCard className="h-5 w-5 text-primary" />
              <span>One-Time Payments</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-4">
              <div>
                <h3 className="font-semibold mb-2">Day Pass</h3>
                <p className="text-sm text-muted-foreground mb-3">
                  Single day access to all gym facilities
                </p>
                <OneTimePaymentButton 
                  amount={25}
                  description="Single Day Pass"
                  orderType="day_pass"
                  metadata={{ validity_days: 1 }}
                />
              </div>

              <Separator />

              <div>
                <h3 className="font-semibold mb-2">Personal Training Session</h3>
                <p className="text-sm text-muted-foreground mb-3">
                  One-on-one training session with certified trainer
                </p>
                <OneTimePaymentButton 
                  amount={75}
                  description="Personal Training Session"
                  orderType="personal_training"
                  metadata={{ session_duration: 60 }}
                  variant="secondary"
                />
              </div>

              <Separator />

              <div>
                <h3 className="font-semibold mb-2">Guest Pass (3 Days)</h3>
                <p className="text-sm text-muted-foreground mb-3">
                  Three-day trial access for new members
                </p>
                <OneTimePaymentButton 
                  amount={45}
                  description="3-Day Guest Pass"
                  orderType="guest_pass"
                  metadata={{ validity_days: 3 }}
                  variant="outline"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Subscription Payments */}
        <Card className="gym-card">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Zap className="h-5 w-5 text-primary" />
              <span>Subscription Plans</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-4">
              <div className="bg-gradient-primary rounded-lg p-4 text-white">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-semibold">Basic Plan</h3>
                  <Calendar className="h-4 w-4" />
                </div>
                <p className="text-sm opacity-90 mb-4">
                  Access to gym facilities and group classes
                </p>
                <div className="text-2xl font-bold mb-4">$49.99/month</div>
                <div className="space-y-2 text-sm opacity-90">
                  <div className="flex items-center space-x-2">
                    <Users className="h-3 w-3" />
                    <span>Unlimited gym access</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Users className="h-3 w-3" />
                    <span>Group fitness classes</span>
                  </div>
                </div>
              </div>

              <div className="bg-gradient-secondary rounded-lg p-4 text-white">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-semibold">Premium Plan</h3>
                  <Calendar className="h-4 w-4" />
                </div>
                <p className="text-sm opacity-90 mb-4">
                  Everything in Basic plus personal training
                </p>
                <div className="text-2xl font-bold mb-4">$99.99/month</div>
                <div className="space-y-2 text-sm opacity-90">
                  <div className="flex items-center space-x-2">
                    <Users className="h-3 w-3" />
                    <span>All Basic features</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Users className="h-3 w-3" />
                    <span>2 personal training sessions</span>
                  </div>
                </div>
              </div>

              <div className="text-center">
                <p className="text-sm text-muted-foreground mb-4">
                  Note: Subscription buttons require actual membership plan IDs from your database.
                  Create membership plans in the admin panel to test.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="gym-card mt-6">
        <CardHeader>
          <CardTitle>Payment Processing Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-muted/50 rounded-lg p-4">
            <h4 className="font-semibold mb-2">How it works:</h4>
            <ul className="text-sm text-muted-foreground space-y-1">
              <li>• One-time payments use Stripe Checkout in "payment" mode</li>
              <li>• Subscriptions use Stripe Checkout in "subscription" mode</li>
              <li>• All payments open in a new tab for security</li>
              <li>• Payment status is verified after completion</li>
              <li>• Order records are stored in Supabase</li>
            </ul>
          </div>
          
          <div className="bg-blue-50 dark:bg-blue-950/20 rounded-lg p-4">
            <h4 className="font-semibold mb-2 text-blue-800 dark:text-blue-200">Test Mode:</h4>
            <p className="text-sm text-blue-700 dark:text-blue-300">
              Use Stripe test card numbers (4242 4242 4242 4242) for testing payments.
              No real charges will be made in test mode.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}