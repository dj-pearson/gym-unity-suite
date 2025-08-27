import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { CheckCircle, Clock, User, FileText, Goal, Calendar } from 'lucide-react';
import { MemberInformationStep } from '@/components/crm/conversion/MemberInformationStep';
import { AgreementStep } from '@/components/crm/conversion/AgreementStep';
import { MemberCardStep } from '@/components/crm/conversion/MemberCardStep';
import { FitnessAssessmentStep } from '@/components/onboarding/FitnessAssessmentStep';
import { OrientationSchedulingStep } from '@/components/onboarding/OrientationSchedulingStep';
import { WelcomeStep } from '@/components/onboarding/WelcomeStep';

const ONBOARDING_STEPS = [
  { id: 'welcome', title: 'Welcome', icon: User, description: 'Welcome to your fitness journey' },
  { id: 'information', title: 'Profile Setup', icon: User, description: 'Complete your member profile' },
  { id: 'agreement', title: 'Agreements', icon: FileText, description: 'Digital waivers and agreements' },
  { id: 'assessment', title: 'Fitness Goals', icon: Goal, description: 'Set your fitness goals and assessment' },
  { id: 'orientation', title: 'Orientation', icon: Calendar, description: 'Schedule your gym orientation' },
  { id: 'member-card', title: 'Member Card', icon: CheckCircle, description: 'Get your digital member card' }
];

export default function OnboardingPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const leadId = searchParams.get('leadId');
  const [currentStep, setCurrentStep] = useState(0);
  const [completedSteps, setCompletedSteps] = useState<string[]>([]);

  const currentStepData = ONBOARDING_STEPS[currentStep];
  const progress = ((currentStep + 1) / ONBOARDING_STEPS.length) * 100;

  const handleStepComplete = (stepId: string) => {
    if (!completedSteps.includes(stepId)) {
      setCompletedSteps([...completedSteps, stepId]);
    }
    
    if (currentStep < ONBOARDING_STEPS.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      // Onboarding complete, redirect to member dashboard
      navigate('/profile');
    }
  };

  const renderStepContent = () => {
    switch (currentStepData.id) {
      case 'welcome':
        return <WelcomeStep leadId={leadId} onComplete={() => handleStepComplete('welcome')} />;
      case 'information':
        return <MemberInformationStep leadId={leadId} onComplete={() => handleStepComplete('information')} />;
      case 'agreement':
        return <AgreementStep onComplete={() => handleStepComplete('agreement')} />;
      case 'assessment':
        return <FitnessAssessmentStep onComplete={() => handleStepComplete('assessment')} />;
      case 'orientation':
        return <OrientationSchedulingStep onComplete={() => handleStepComplete('orientation')} />;
      case 'member-card':
        return <MemberCardStep onComplete={() => handleStepComplete('member-card')} />;
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-background py-8">
      <div className="max-w-4xl mx-auto px-4">
        {/* Header */}
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-foreground mb-2">Member Onboarding</h1>
          <p className="text-muted-foreground">Welcome! Let's get you set up in just a few steps.</p>
        </div>

        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-medium text-muted-foreground">
              Step {currentStep + 1} of {ONBOARDING_STEPS.length}
            </span>
            <span className="text-sm font-medium text-muted-foreground">
              {Math.round(progress)}% Complete
            </span>
          </div>
          <Progress value={progress} className="w-full h-2" />
        </div>

        {/* Step Navigation */}
        <div className="mb-8">
          <div className="flex flex-wrap justify-center gap-4">
            {ONBOARDING_STEPS.map((step, index) => {
              const Icon = step.icon;
              const isCompleted = completedSteps.includes(step.id);
              const isCurrent = index === currentStep;
              const isAccessible = index <= currentStep;

              return (
                <div
                  key={step.id}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg border transition-smooth ${
                    isCurrent 
                      ? 'bg-primary text-primary-foreground border-primary' 
                      : isCompleted
                      ? 'bg-green-50 text-green-700 border-green-200'
                      : isAccessible
                      ? 'bg-muted text-muted-foreground border-border cursor-pointer hover:bg-accent'
                      : 'bg-muted/50 text-muted-foreground/50 border-border/50'
                  }`}
                  onClick={() => isAccessible && setCurrentStep(index)}
                >
                  {isCompleted ? (
                    <CheckCircle className="w-4 h-4" />
                  ) : isCurrent ? (
                    <Clock className="w-4 h-4" />
                  ) : (
                    <Icon className="w-4 h-4" />
                  )}
                  <span className="text-sm font-medium hidden sm:inline">{step.title}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Main Content */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-lg ${
                completedSteps.includes(currentStepData.id) 
                  ? 'bg-green-100 text-green-600'
                  : 'bg-primary/10 text-primary'
              }`}>
                <currentStepData.icon className="w-5 h-5" />
              </div>
              <div>
                <CardTitle>{currentStepData.title}</CardTitle>
                <CardDescription>{currentStepData.description}</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {renderStepContent()}
          </CardContent>
        </Card>

        {/* Navigation Buttons */}
        <div className="flex justify-between items-center mt-6">
          <Button
            variant="outline"
            onClick={() => setCurrentStep(Math.max(0, currentStep - 1))}
            disabled={currentStep === 0}
          >
            Previous
          </Button>
          
          <div className="text-sm text-muted-foreground">
            Questions? Contact our support team for assistance.
          </div>
          
          <Button
            onClick={() => setCurrentStep(Math.min(ONBOARDING_STEPS.length - 1, currentStep + 1))}
            disabled={currentStep === ONBOARDING_STEPS.length - 1}
          >
            Skip Step
          </Button>
        </div>
      </div>
    </div>
  );
}