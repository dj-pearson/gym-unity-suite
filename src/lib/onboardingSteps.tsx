import { Step } from 'react-joyride';

export type OnboardingTourType =
  | 'dashboard'
  | 'members'
  | 'classes'
  | 'sales'
  | 'settings'
  | 'first-time';

// Tour steps by type
const tours: Record<OnboardingTourType, Step[]> = {
  'first-time': [
    {
      target: 'body',
      content: 'Welcome to Gym Unity Suite! Let\'s take a quick tour.',
      placement: 'center',
      disableBeacon: true,
    },
  ],
  dashboard: [
    {
      target: '[data-tour="dashboard-widgets"]',
      content: 'Your dashboard shows key metrics at a glance.',
      placement: 'top',
      disableBeacon: true,
    },
  ],
  members: [
    {
      target: '[data-tour="members-search"]',
      content: 'Quickly find any member by name, email, or membership status.',
      placement: 'bottom',
      disableBeacon: true,
    },
  ],
  classes: [
    {
      target: '[data-tour="classes-schedule"]',
      content: 'View and manage your class schedule here.',
      placement: 'top',
      disableBeacon: true,
    },
  ],
  sales: [
    {
      target: '[data-tour="sales-pipeline"]',
      content: 'Track your leads and manage your sales pipeline.',
      placement: 'top',
      disableBeacon: true,
    },
  ],
  settings: [
    {
      target: '[data-tour="settings-organization"]',
      content: 'Configure your organization settings here.',
      placement: 'top',
      disableBeacon: true,
    },
  ],
};

export function getTourSteps(tourType: OnboardingTourType): Step[] {
  return tours[tourType] || [];
}

export function getRecommendedToursForRole(role?: string): OnboardingTourType[] {
  if (role === 'gym_owner' || role === 'manager') {
    return ['first-time', 'dashboard', 'members', 'classes', 'sales'];
  }
  if (role === 'instructor') {
    return ['first-time', 'dashboard', 'classes'];
  }
  return ['first-time', 'dashboard'];
}
