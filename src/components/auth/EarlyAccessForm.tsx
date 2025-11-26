import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Calendar, Sparkles, CheckCircle, AlertCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { z } from 'zod';

const earlyAccessSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(100, "Name must be less than 100 characters"),
  email: z.string().trim().email("Invalid email address").max(255, "Email must be less than 255 characters"),
  company: z.string().trim().max(100, "Company name must be less than 100 characters").optional(),
  phone: z.string().trim().max(20, "Phone number must be less than 20 characters").optional(),
  businessType: z.string().trim().max(50, "Business type must be less than 50 characters"),
  currentMembers: z.string().trim().max(20, "Current members must be less than 20 characters"),
  message: z.string().trim().max(1000, "Message must be less than 1000 characters").optional()
});

interface EarlyAccessFormProps {
  onSuccess?: () => void;
}

export function EarlyAccessForm({ onSuccess }: EarlyAccessFormProps) {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    company: '',
    phone: '',
    businessType: '',
    currentMembers: '',
    message: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const { toast } = useToast();

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const validatedData = earlyAccessSchema.parse(formData);
      setIsSubmitting(true);

      const { error } = await supabase
        .from('early_access_requests')
        .insert({
          name: validatedData.name,
          email: validatedData.email,
          company: validatedData.company || null,
          phone: validatedData.phone || null,
          business_type: validatedData.businessType,
          current_members: validatedData.currentMembers,
          message: validatedData.message || null,
          status: 'pending'
        });

      if (error) {
        if (error.code === '23505') { // Unique violation
          toast({
            title: "Already Registered",
            description: "You've already requested early access with this email address.",
            variant: "default"
          });
        } else {
          throw error;
        }
      } else {
        setIsSubmitted(true);
        toast({
          title: "Early Access Requested!",
          description: "We'll be in touch soon with your access details.",
          variant: "default"
        });
        onSuccess?.();
      }
    } catch (error) {
      if (error instanceof z.ZodError) {
        const firstError = error.errors[0];
        toast({
          title: "Invalid Input",
          description: firstError.message,
          variant: "destructive"
        });
      } else {
        toast({
          title: "Something went wrong",
          description: "Please try again later or contact support.",
          variant: "destructive"
        });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSubmitted) {
    return (
      <Card className="gym-card max-w-2xl mx-auto">
        <CardContent className="p-8">
          <div className="text-center mb-8">
            <div className="w-20 h-20 bg-success/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-10 h-10 text-success" />
            </div>
            <h3 className="text-2xl font-bold mb-2">You're on the List!</h3>
            <p className="text-muted-foreground">
              Welcome to the Rep Club founding members community. Here's what happens next:
            </p>
          </div>

          {/* Timeline */}
          <div className="space-y-4 mb-8">
            {[
              { step: '1', title: 'Confirmation Email', desc: 'Check your inbox for a welcome email with more details', done: true },
              { step: '2', title: 'Early Access Invite', desc: 'We\'ll send your login credentials before November 1st', done: false },
              { step: '3', title: 'Onboarding Call', desc: 'Optional 1-on-1 setup assistance with our team', done: false },
            ].map((item, i) => (
              <div key={i} className="flex items-start gap-4">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                  item.done ? 'bg-success text-white' : 'bg-muted text-muted-foreground'
                }`}>
                  {item.done ? <CheckCircle className="w-4 h-4" /> : item.step}
                </div>
                <div>
                  <p className="font-medium">{item.title}</p>
                  <p className="text-sm text-muted-foreground">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Benefits reminder */}
          <div className="bg-muted/50 rounded-lg p-4 mb-6">
            <p className="font-medium mb-2">🎁 Your Founding Member Benefits:</p>
            <ul className="text-sm text-muted-foreground space-y-1">
              <li>• Priority onboarding support</li>
              <li>• Exclusive founding member pricing (locked in forever)</li>
              <li>• Direct line to our product team for feedback</li>
              <li>• Early access to new features</li>
            </ul>
          </div>

          <div className="text-center">
            <Badge className="bg-primary/10 text-primary border-primary/20 mb-4">
              Launching November 1st, 2025
            </Badge>
            <p className="text-sm text-muted-foreground">
              Questions? Email us at{' '}
              <a href="mailto:hello@repclub.app" className="text-primary hover:underline">
                hello@repclub.app
              </a>
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="gym-card max-w-2xl mx-auto">
      <CardHeader className="text-center">
        <div className="flex items-center justify-center gap-2 mb-2">
          <Calendar className="w-5 h-5 text-primary" />
          <Badge className="bg-primary/10 text-primary border-primary/20">
            Launching November 1st, 2025
          </Badge>
        </div>
        <CardTitle className="text-2xl">Request Early Access</CardTitle>
        <CardDescription>
          Be among the first to experience Rep Club's premium fitness management platform
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Full Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                placeholder="Your full name"
                required
                maxLength={100}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email Address *</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => handleInputChange('email', e.target.value)}
                placeholder="your.email@example.com"
                required
                maxLength={255}
              />
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="company">Company/Studio Name</Label>
              <Input
                id="company"
                value={formData.company}
                onChange={(e) => handleInputChange('company', e.target.value)}
                placeholder="Your fitness business"
                maxLength={100}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Phone Number</Label>
              <Input
                id="phone"
                type="tel"
                value={formData.phone}
                onChange={(e) => handleInputChange('phone', e.target.value)}
                placeholder="(555) 123-4567"
                maxLength={20}
              />
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="businessType">Business Type *</Label>
              <Input
                id="businessType"
                value={formData.businessType}
                onChange={(e) => handleInputChange('businessType', e.target.value)}
                placeholder="e.g., Boutique Studio, Gym, Yoga Studio"
                required
                maxLength={50}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="currentMembers">Current Members *</Label>
              <Input
                id="currentMembers"
                value={formData.currentMembers}
                onChange={(e) => handleInputChange('currentMembers', e.target.value)}
                placeholder="e.g., 50-100, 200+, New business"
                required
                maxLength={20}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="message">Tell us about your needs (optional)</Label>
            <Textarea
              id="message"
              value={formData.message}
              onChange={(e) => handleInputChange('message', e.target.value)}
              placeholder="What features are most important to you? Any specific requirements?"
              rows={3}
              maxLength={1000}
            />
          </div>

          <div className="bg-muted/50 p-4 rounded-lg">
            <div className="flex items-start gap-3">
              <Sparkles className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
              <div className="text-sm">
                <p className="font-medium text-foreground mb-1">Early Access Benefits:</p>
                <ul className="text-muted-foreground space-y-1">
                  <li>• Priority onboarding and setup assistance</li>
                  <li>• Exclusive access before November 1st launch</li>
                  <li>• Direct feedback channel to our development team</li>
                  <li>• Special founding member pricing</li>
                </ul>
              </div>
            </div>
          </div>

          <Button 
            type="submit" 
            className="w-full bg-gradient-primary hover:opacity-90 transition-smooth"
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <>
                <AlertCircle className="mr-2 h-4 w-4 animate-spin" />
                Submitting Request...
              </>
            ) : (
              <>
                <Sparkles className="mr-2 h-4 w-4" />
                Request Early Access
              </>
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}