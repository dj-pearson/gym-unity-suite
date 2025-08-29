import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import { Loader2, User, Mail, Phone, MapPin } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

const tabletSignupSchema = z.object({
  first_name: z.string().min(1, 'First name is required'),
  last_name: z.string().min(1, 'Last name is required'),
  email: z.string().email('Valid email is required'),
  phone: z.string().min(10, 'Phone number is required'),
  date_of_birth: z.string().min(1, 'Date of birth is required'),
  emergency_contact_name: z.string().min(1, 'Emergency contact is required'),
  emergency_contact_phone: z.string().min(10, 'Emergency contact phone is required'),
  fitness_goals: z.array(z.string()).min(1, 'Select at least one fitness goal'),
  marketing_consent: z.boolean(),
  waiver_signed: z.boolean().refine(val => val === true, 'Waiver must be signed'),
});

type TabletSignupFormData = z.infer<typeof tabletSignupSchema>;

interface TabletSignupFormProps {
  onSignupComplete: (memberId: string) => void;
}

const FITNESS_GOALS = [
  'Weight Loss',
  'Muscle Building',
  'Cardio Fitness',
  'Strength Training',
  'Flexibility',
  'General Health',
  'Sport Performance',
  'Rehabilitation'
];

export function TabletSignupForm({ onSignupComplete }: TabletSignupFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [selectedGoals, setSelectedGoals] = useState<string[]>([]);
  const { toast } = useToast();
  const { organization } = useAuth();

  const form = useForm<TabletSignupFormData>({
    resolver: zodResolver(tabletSignupSchema),
    defaultValues: {
      fitness_goals: [],
      marketing_consent: false,
      waiver_signed: false,
    },
  });

  const onSubmit = async (data: TabletSignupFormData) => {
    setIsLoading(true);
    try {
      // First create a lead record 
      const { data: lead, error: leadError } = await supabase
        .from('leads')
        .insert({
          first_name: data.first_name,
          last_name: data.last_name,
          email: data.email,
          phone: data.phone,
          notes: `Tablet signup - Goals: ${data.fitness_goals.join(', ')}`,
          organization_id: organization?.id,
          status: 'converted',
        })
        .select()
        .single();

      if (leadError) throw leadError;

      // Create fitness assessment (simulated for now)
      // Note: This would require creating the fitness_assessments table
      console.log('Fitness assessment would be created for:', {
        member_email: data.email,
        fitness_goals: data.fitness_goals,
        experience_level: 'beginner',
        workout_frequency: '2-3 times per week',
      });

      // Get first available location for check-in
      const { data: locations, error: locationError } = await supabase
        .from('locations')
        .select('id')
        .eq('organization_id', organization?.id)
        .limit(1);

      if (!locationError && locations && locations.length > 0) {
        // Create initial check-in (simulated for now)
        console.log('Check-in would be created for location:', locations[0].id);
      }

      toast({
        title: 'Welcome to the gym!',
        description: 'Your membership has been activated successfully.',
      });

      onSignupComplete(lead.id);
    } catch (error: any) {
      toast({
        title: 'Signup failed',
        description: error.message || 'An error occurred during signup.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoalToggle = (goal: string) => {
    const updatedGoals = selectedGoals.includes(goal)
      ? selectedGoals.filter(g => g !== goal)
      : [...selectedGoals, goal];
    
    setSelectedGoals(updatedGoals);
    form.setValue('fitness_goals', updatedGoals);
  };

  return (
    <div className="max-w-2xl mx-auto p-6">
      <Card className="border-2">
        <CardHeader className="text-center pb-6">
          <CardTitle className="text-2xl font-bold flex items-center justify-center gap-3">
            <User className="w-8 h-8 text-primary" />
            Join {organization?.name || 'Our Gym'}
          </CardTitle>
          <p className="text-muted-foreground">
            Quick registration to get you started today
          </p>
        </CardHeader>
        
        <CardContent>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Personal Information */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="first_name" className="text-base font-medium">
                  First Name *
                </Label>
                <Input
                  id="first_name"
                  {...form.register('first_name')}
                  className="mt-2 text-lg h-12"
                  placeholder="Enter first name"
                />
                {form.formState.errors.first_name && (
                  <p className="text-destructive text-sm mt-1">
                    {form.formState.errors.first_name.message}
                  </p>
                )}
              </div>

              <div>
                <Label htmlFor="last_name" className="text-base font-medium">
                  Last Name *
                </Label>
                <Input
                  id="last_name"
                  {...form.register('last_name')}
                  className="mt-2 text-lg h-12"
                  placeholder="Enter last name"
                />
                {form.formState.errors.last_name && (
                  <p className="text-destructive text-sm mt-1">
                    {form.formState.errors.last_name.message}
                  </p>
                )}
              </div>
            </div>

            {/* Contact Information */}
            <div className="space-y-4">
              <div>
                <Label htmlFor="email" className="text-base font-medium flex items-center gap-2">
                  <Mail className="w-4 h-4" />
                  Email Address *
                </Label>
                <Input
                  id="email"
                  type="email"
                  {...form.register('email')}
                  className="mt-2 text-lg h-12"
                  placeholder="your.email@example.com"
                />
                {form.formState.errors.email && (
                  <p className="text-destructive text-sm mt-1">
                    {form.formState.errors.email.message}
                  </p>
                )}
              </div>

              <div>
                <Label htmlFor="phone" className="text-base font-medium flex items-center gap-2">
                  <Phone className="w-4 h-4" />
                  Phone Number *
                </Label>
                <Input
                  id="phone"
                  type="tel"
                  {...form.register('phone')}
                  className="mt-2 text-lg h-12"
                  placeholder="(555) 123-4567"
                />
                {form.formState.errors.phone && (
                  <p className="text-destructive text-sm mt-1">
                    {form.formState.errors.phone.message}
                  </p>
                )}
              </div>

              <div>
                <Label htmlFor="date_of_birth" className="text-base font-medium">
                  Date of Birth *
                </Label>
                <Input
                  id="date_of_birth"
                  type="date"
                  {...form.register('date_of_birth')}
                  className="mt-2 text-lg h-12"
                />
                {form.formState.errors.date_of_birth && (
                  <p className="text-destructive text-sm mt-1">
                    {form.formState.errors.date_of_birth.message}
                  </p>
                )}
              </div>
            </div>

            {/* Emergency Contact */}
            <div className="bg-muted/30 p-4 rounded-lg space-y-4">
              <h3 className="font-semibold text-lg">Emergency Contact</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="emergency_contact_name" className="text-base font-medium">
                    Name *
                  </Label>
                  <Input
                    id="emergency_contact_name"
                    {...form.register('emergency_contact_name')}
                    className="mt-2 h-12"
                    placeholder="Contact name"
                  />
                  {form.formState.errors.emergency_contact_name && (
                    <p className="text-destructive text-sm mt-1">
                      {form.formState.errors.emergency_contact_name.message}
                    </p>
                  )}
                </div>

                <div>
                  <Label htmlFor="emergency_contact_phone" className="text-base font-medium">
                    Phone *
                  </Label>
                  <Input
                    id="emergency_contact_phone"
                    type="tel"
                    {...form.register('emergency_contact_phone')}
                    className="mt-2 h-12"
                    placeholder="Contact phone"
                  />
                  {form.formState.errors.emergency_contact_phone && (
                    <p className="text-destructive text-sm mt-1">
                      {form.formState.errors.emergency_contact_phone.message}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Fitness Goals */}
            <div>
              <Label className="text-base font-medium">Fitness Goals *</Label>
              <p className="text-sm text-muted-foreground mt-1 mb-3">
                Select all that apply to help us personalize your experience
              </p>
              <div className="grid grid-cols-2 gap-3">
                {FITNESS_GOALS.map((goal) => (
                  <div
                    key={goal}
                    className={`p-3 border rounded-lg cursor-pointer transition-smooth hover:bg-accent ${
                      selectedGoals.includes(goal) 
                        ? 'border-primary bg-primary/5 text-primary font-medium' 
                        : 'border-border'
                    }`}
                    onClick={() => handleGoalToggle(goal)}
                  >
                    <div className="flex items-center space-x-2">
                      <Checkbox 
                        checked={selectedGoals.includes(goal)}
                        onChange={() => {}} // Handled by parent click
                      />
                      <span>{goal}</span>
                    </div>
                  </div>
                ))}
              </div>
              {form.formState.errors.fitness_goals && (
                <p className="text-destructive text-sm mt-2">
                  {form.formState.errors.fitness_goals.message}
                </p>
              )}
            </div>

            {/* Agreements */}
            <div className="space-y-4 bg-muted/20 p-4 rounded-lg">
              <div className="flex items-start space-x-3">
                <Checkbox
                  id="waiver_signed"
                  checked={form.watch('waiver_signed')}
                  onCheckedChange={(checked) => form.setValue('waiver_signed', !!checked)}
                />
                <div className="flex-1">
                  <Label htmlFor="waiver_signed" className="text-base font-medium cursor-pointer">
                    I agree to the liability waiver and terms of service *
                  </Label>
                  <p className="text-sm text-muted-foreground mt-1">
                    By checking this box, I acknowledge that I have read and agree to the gym's liability waiver, terms of service, and membership agreement.
                  </p>
                </div>
              </div>
              {form.formState.errors.waiver_signed && (
                <p className="text-destructive text-sm">
                  {form.formState.errors.waiver_signed.message}
                </p>
              )}

              <div className="flex items-start space-x-3">
                <Checkbox
                  id="marketing_consent"
                  checked={form.watch('marketing_consent')}
                  onCheckedChange={(checked) => form.setValue('marketing_consent', !!checked)}
                />
                <Label htmlFor="marketing_consent" className="text-base cursor-pointer">
                  I consent to receive marketing communications (optional)
                </Label>
              </div>
            </div>

            <Button 
              type="submit" 
              className="w-full h-14 text-lg font-semibold"
              disabled={isLoading}
            >
              {isLoading && <Loader2 className="w-5 h-5 mr-2 animate-spin" />}
              Complete Registration & Check In
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}