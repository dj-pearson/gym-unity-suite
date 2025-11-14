import React, { useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { ChevronLeft, ChevronRight, Check } from 'lucide-react';

export interface FormStep {
  id: string;
  title: string;
  description?: string;
  content: React.ReactNode;
  validate?: () => boolean | Promise<boolean>;
}

interface FormWizardProps {
  steps: FormStep[];
  onComplete: () => void | Promise<void>;
  onCancel?: () => void;
  className?: string;
  showProgress?: boolean;
  saveButtonText?: string;
  cancelButtonText?: string;
}

/**
 * FormWizard - Multi-step form component with progress tracking
 *
 * Breaks complex forms into manageable steps with navigation and validation
 *
 * @param steps - Array of form steps with content and validation
 * @param onComplete - Callback when user completes all steps
 * @param onCancel - Optional cancel callback
 * @param showProgress - Show progress bar (default: true)
 * @param saveButtonText - Custom text for save button (default: "Complete")
 * @param cancelButtonText - Custom text for cancel button (default: "Cancel")
 *
 * @example
 * ```tsx
 * const steps: FormStep[] = [
 *   {
 *     id: 'personal',
 *     title: 'Personal Information',
 *     description: 'Enter your basic details',
 *     content: <PersonalInfoForm />,
 *     validate: () => validatePersonalInfo()
 *   },
 *   {
 *     id: 'contact',
 *     title: 'Contact Details',
 *     content: <ContactForm />
 *   }
 * ];
 *
 * <FormWizard
 *   steps={steps}
 *   onComplete={handleSubmit}
 *   onCancel={handleCancel}
 * />
 * ```
 */
export function FormWizard({
  steps,
  onComplete,
  onCancel,
  className = '',
  showProgress = true,
  saveButtonText = 'Complete',
  cancelButtonText = 'Cancel',
}: FormWizardProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [completedSteps, setCompletedSteps] = useState<Set<number>>(new Set());
  const [isValidating, setIsValidating] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const progress = ((currentStep + 1) / steps.length) * 100;
  const isFirstStep = currentStep === 0;
  const isLastStep = currentStep === steps.length - 1;
  const currentStepData = steps[currentStep];

  const handleNext = useCallback(async () => {
    // Validate current step if validation function exists
    if (currentStepData.validate) {
      setIsValidating(true);
      try {
        const isValid = await currentStepData.validate();
        if (!isValid) {
          setIsValidating(false);
          return;
        }
      } catch (error) {
        console.error('Validation error:', error);
        setIsValidating(false);
        return;
      }
      setIsValidating(false);
    }

    // Mark current step as completed
    setCompletedSteps((prev) => new Set(prev).add(currentStep));

    if (isLastStep) {
      // Submit form
      setIsSubmitting(true);
      try {
        await onComplete();
      } catch (error) {
        console.error('Form submission error:', error);
      } finally {
        setIsSubmitting(false);
      }
    } else {
      // Move to next step
      setCurrentStep((prev) => prev + 1);
    }
  }, [currentStep, currentStepData, isLastStep, onComplete]);

  const handlePrevious = useCallback(() => {
    if (!isFirstStep) {
      setCurrentStep((prev) => prev - 1);
    }
  }, [isFirstStep]);

  const handleStepClick = useCallback((stepIndex: number) => {
    // Only allow clicking on completed steps or next step
    if (stepIndex <= currentStep || completedSteps.has(stepIndex - 1)) {
      setCurrentStep(stepIndex);
    }
  }, [currentStep, completedSteps]);

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Progress Bar */}
      {showProgress && (
        <div className="space-y-2">
          <div className="flex justify-between text-sm text-muted-foreground">
            <span>Step {currentStep + 1} of {steps.length}</span>
            <span>{Math.round(progress)}% Complete</span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>
      )}

      {/* Step Indicators */}
      <div className="flex items-center justify-between">
        {steps.map((step, index) => {
          const isCompleted = completedSteps.has(index);
          const isCurrent = index === currentStep;
          const isClickable = index <= currentStep || completedSteps.has(index - 1);

          return (
            <React.Fragment key={step.id}>
              <button
                onClick={() => handleStepClick(index)}
                disabled={!isClickable}
                className={`flex flex-col items-center gap-2 ${
                  isClickable ? 'cursor-pointer' : 'cursor-not-allowed opacity-50'
                }`}
              >
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center font-medium transition-colors ${
                    isCurrent
                      ? 'bg-primary text-primary-foreground'
                      : isCompleted
                      ? 'bg-success text-white'
                      : 'bg-muted text-muted-foreground'
                  }`}
                >
                  {isCompleted ? <Check className="h-5 w-5" /> : index + 1}
                </div>
                <span
                  className={`text-xs font-medium ${
                    isCurrent ? 'text-foreground' : 'text-muted-foreground'
                  }`}
                >
                  {step.title}
                </span>
              </button>
              {index < steps.length - 1 && (
                <div
                  className={`flex-1 h-0.5 mx-2 ${
                    completedSteps.has(index) ? 'bg-success' : 'bg-muted'
                  }`}
                />
              )}
            </React.Fragment>
          );
        })}
      </div>

      {/* Current Step Content */}
      <Card>
        <CardHeader>
          <CardTitle>{currentStepData.title}</CardTitle>
          {currentStepData.description && (
            <p className="text-sm text-muted-foreground">
              {currentStepData.description}
            </p>
          )}
        </CardHeader>
        <CardContent>{currentStepData.content}</CardContent>
        <CardFooter className="flex justify-between gap-4">
          <div className="flex gap-2">
            {!isFirstStep && (
              <Button
                type="button"
                variant="outline"
                onClick={handlePrevious}
                disabled={isValidating || isSubmitting}
              >
                <ChevronLeft className="h-4 w-4 mr-2" />
                Previous
              </Button>
            )}
            {onCancel && (
              <Button
                type="button"
                variant="ghost"
                onClick={onCancel}
                disabled={isValidating || isSubmitting}
              >
                {cancelButtonText}
              </Button>
            )}
          </div>

          <Button
            type="button"
            onClick={handleNext}
            disabled={isValidating || isSubmitting}
            className="bg-gradient-primary hover:opacity-90"
          >
            {isValidating
              ? 'Validating...'
              : isSubmitting
              ? 'Submitting...'
              : isLastStep
              ? saveButtonText
              : 'Next'}
            {!isLastStep && !isValidating && !isSubmitting && (
              <ChevronRight className="h-4 w-4 ml-2" />
            )}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
