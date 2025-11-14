import React, { useCallback } from 'react';
import Joyride, { CallBackProps, STATUS, EVENTS, ACTIONS } from 'react-joyride';
import { getTourSteps, type OnboardingTourType } from '@/lib/onboardingSteps';

interface OnboardingTourProps {
  tourType: OnboardingTourType;
  run: boolean;
  onComplete: () => void;
  onSkip: () => void;
}

/**
 * OnboardingTour - Interactive product tour component
 *
 * Wraps react-joyride with custom styling and behavior
 * Guides users through features with step-by-step tooltips
 *
 * @param tourType - Which tour to show (dashboard, members, etc.)
 * @param run - Whether the tour is currently running
 * @param onComplete - Callback when tour is completed
 * @param onSkip - Callback when tour is skipped
 */
export function OnboardingTour({
  tourType,
  run,
  onComplete,
  onSkip,
}: OnboardingTourProps) {
  const steps = getTourSteps(tourType);

  const handleJoyrideCallback = useCallback(
    (data: CallBackProps) => {
      const { status, type, action } = data;

      // Tour finished (completed all steps)
      if (status === STATUS.FINISHED) {
        onComplete();
      }

      // Tour skipped (user clicked skip or close)
      if (status === STATUS.SKIPPED) {
        onSkip();
      }

      // Handle close action
      if (action === ACTIONS.CLOSE && type === EVENTS.STEP_AFTER) {
        onSkip();
      }
    },
    [onComplete, onSkip]
  );

  return (
    <Joyride
      steps={steps}
      run={run}
      continuous
      showProgress
      showSkipButton
      scrollToFirstStep
      disableOverlayClose
      spotlightPadding={4}
      styles={{
        options: {
          arrowColor: 'hsl(var(--popover))',
          backgroundColor: 'hsl(var(--popover))',
          overlayColor: 'rgba(0, 0, 0, 0.5)',
          primaryColor: 'hsl(var(--primary))',
          textColor: 'hsl(var(--popover-foreground))',
          width: 380,
          zIndex: 10000,
        },
        tooltip: {
          borderRadius: 'var(--radius)',
          padding: 20,
        },
        tooltipContainer: {
          textAlign: 'left',
        },
        tooltipTitle: {
          fontSize: '1.125rem',
          fontWeight: 600,
          marginBottom: '0.5rem',
        },
        tooltipContent: {
          padding: '0.5rem 0',
          fontSize: '0.875rem',
          lineHeight: 1.5,
        },
        buttonNext: {
          backgroundColor: 'hsl(var(--primary))',
          color: 'hsl(var(--primary-foreground))',
          borderRadius: 'var(--radius)',
          padding: '0.5rem 1rem',
          fontSize: '0.875rem',
          fontWeight: 500,
        },
        buttonBack: {
          color: 'hsl(var(--muted-foreground))',
          marginRight: '0.5rem',
        },
        buttonSkip: {
          color: 'hsl(var(--muted-foreground))',
        },
        buttonClose: {
          display: 'none', // Hide close button, use skip instead
        },
      }}
      locale={{
        back: 'Back',
        close: 'Close',
        last: 'Finish',
        next: 'Next',
        open: 'Open',
        skip: 'Skip Tour',
      }}
      callback={handleJoyrideCallback}
    />
  );
}
