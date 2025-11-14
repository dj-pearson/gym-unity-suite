import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Check, ArrowRight, Sparkles } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

interface SetupWizardProps {
  open: boolean;
  onComplete: () => void;
}

/**
 * SetupWizard - Initial setup experience for new users
 *
 * Guides new users through basic setup and introduces key features
 * Simple, non-intrusive onboarding flow
 */
export function SetupWizard({ open, onComplete }: SetupWizardProps) {
  const { profile, organization } = useAuth();
  const [step, setStep] = useState(0);

  const steps = [
    {
      title: `Welcome to Gym Unity Suite!`,
      description: `Hi ${profile?.first_name || 'there'}! We're excited to have you at ${
        organization?.name || 'your gym'
      }.`,
      content: (
        <div className="space-y-4">
          <div className="flex items-center justify-center py-8">
            <Sparkles className="h-20 w-20 text-primary animate-pulse" />
          </div>
          <p className="text-center text-muted-foreground">
            Let's get you set up in just a few seconds. This is a quick introduction
            to help you get started.
          </p>
        </div>
      ),
    },
    {
      title: 'Your Personalized Dashboard',
      description: 'Everything you need, tailored to your role',
      content: (
        <div className="space-y-4">
          <ul className="space-y-3">
            <li className="flex items-start gap-3">
              <div className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center mt-0.5">
                <Check className="h-4 w-4 text-primary" />
              </div>
              <div>
                <p className="font-medium">Role-specific widgets</p>
                <p className="text-sm text-muted-foreground">
                  See only what matters for your role
                </p>
              </div>
            </li>
            <li className="flex items-start gap-3">
              <div className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center mt-0.5">
                <Check className="h-4 w-4 text-primary" />
              </div>
              <div>
                <p className="font-medium">Drag & drop customization</p>
                <p className="text-sm text-muted-foreground">
                  Arrange your dashboard however you like
                </p>
              </div>
            </li>
            <li className="flex items-start gap-3">
              <div className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center mt-0.5">
                <Check className="h-4 w-4 text-primary" />
              </div>
              <div>
                <p className="font-medium">Real-time updates</p>
                <p className="text-sm text-muted-foreground">
                  Stats and activities update automatically
                </p>
              </div>
            </li>
          </ul>
        </div>
      ),
    },
    {
      title: 'Powerful Features at Your Fingertips',
      description: 'Everything you need to run your gym efficiently',
      content: (
        <div className="space-y-4">
          <ul className="space-y-3">
            <li className="flex items-start gap-3">
              <div className="flex-shrink-0 w-6 h-6 rounded-full bg-success/20 flex items-center justify-center mt-0.5">
                <Check className="h-4 w-4 text-success" />
              </div>
              <div>
                <p className="font-medium">Quick Search (⌘K)</p>
                <p className="text-sm text-muted-foreground">
                  Find members, navigate, and perform actions instantly
                </p>
              </div>
            </li>
            <li className="flex items-start gap-3">
              <div className="flex-shrink-0 w-6 h-6 rounded-full bg-success/20 flex items-center justify-center mt-0.5">
                <Check className="h-4 w-4 text-success" />
              </div>
              <div>
                <p className="font-medium">Offline Support</p>
                <p className="text-sm text-muted-foreground">
                  Works even without internet connection
                </p>
              </div>
            </li>
            <li className="flex items-start gap-3">
              <div className="flex-shrink-0 w-6 h-6 rounded-full bg-success/20 flex items-center justify-center mt-0.5">
                <Check className="h-4 w-4 text-success" />
              </div>
              <div>
                <p className="font-medium">Real-time Collaboration</p>
                <p className="text-sm text-muted-foreground">
                  See who's viewing and editing records
                </p>
              </div>
            </li>
          </ul>
        </div>
      ),
    },
    {
      title: "You're All Set!",
      description: 'Ready to explore?',
      content: (
        <div className="space-y-4">
          <div className="text-center py-4">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-success/20 mb-4">
              <Check className="h-8 w-8 text-success" />
            </div>
            <p className="text-muted-foreground">
              We'll show you a quick tour of the dashboard to help you get oriented.
              You can always access tours later from the help menu.
            </p>
          </div>
        </div>
      ),
    },
  ];

  const currentStep = steps[step];
  const progress = ((step + 1) / steps.length) * 100;
  const isLastStep = step === steps.length - 1;

  const handleNext = () => {
    if (isLastStep) {
      onComplete();
    } else {
      setStep(step + 1);
    }
  };

  const handleSkip = () => {
    onComplete();
  };

  return (
    <Dialog open={open} onOpenChange={() => {}}>
      <DialogContent
        className="sm:max-w-md"
        onPointerDownOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
      >
        <DialogHeader>
          <DialogTitle>{currentStep.title}</DialogTitle>
          <DialogDescription>{currentStep.description}</DialogDescription>
        </DialogHeader>

        {/* Progress bar */}
        <div className="space-y-2 mb-4">
          <Progress value={progress} className="h-1" />
          <p className="text-xs text-center text-muted-foreground">
            Step {step + 1} of {steps.length}
          </p>
        </div>

        {/* Step content */}
        <div className="py-4">{currentStep.content}</div>

        {/* Actions */}
        <div className="flex items-center justify-between gap-3 pt-4">
          {step > 0 ? (
            <Button
              variant="ghost"
              onClick={() => setStep(step - 1)}
            >
              Back
            </Button>
          ) : (
            <Button
              variant="ghost"
              onClick={handleSkip}
            >
              Skip Setup
            </Button>
          )}

          <Button
            onClick={handleNext}
            className="bg-gradient-primary hover:opacity-90 gap-2"
          >
            {isLastStep ? 'Start Tour' : 'Next'}
            <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
