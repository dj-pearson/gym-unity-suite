import { Step } from 'react-joyride';

export type OnboardingTourType =
  | 'dashboard'
  | 'members'
  | 'classes'
  | 'sales'
  | 'settings'
  | 'first-time';

/**
 * Onboarding tour steps for each section of the app
 */

// First-time user tour (runs once on initial login)
export const firstTimeTour: Step[] = [
  {
    target: 'body',
    content: (
      <div>
        <h2 className="text-lg font-bold mb-2">Welcome to Gym Unity Suite! 🎉</h2>
        <p>Let's take a quick tour to get you started. This will only take a minute.</p>
      </div>
    ),
    placement: 'center',
    disableBeacon: true,
  },
  {
    target: '[data-tour="sidebar"]',
    content: (
      <div>
        <h3 className="font-semibold mb-1">Navigation Sidebar</h3>
        <p>Access all features from here. Everything you need is just a click away.</p>
      </div>
    ),
    placement: 'right',
  },
  {
    target: '[data-tour="search"]',
    content: (
      <div>
        <h3 className="font-semibold mb-1">Quick Search (⌘K)</h3>
        <p>Press Command+K (or Ctrl+K) to quickly search members, navigate, and perform actions.</p>
      </div>
    ),
    placement: 'bottom',
  },
  {
    target: '[data-tour="notifications"]',
    content: (
      <div>
        <h3 className="font-semibold mb-1">Notifications</h3>
        <p>Stay updated with important alerts, check-ins, and member activities.</p>
      </div>
    ),
    placement: 'bottom',
  },
  {
    target: '[data-tour="dashboard-customize"]',
    content: (
      <div>
        <h3 className="font-semibold mb-1">Customize Your Dashboard</h3>
        <p>Drag widgets to reorder, add new ones, or remove what you don't need. Make it yours!</p>
      </div>
    ),
    placement: 'left',
  },
];

// Dashboard tour
export const dashboardTour: Step[] = [
  {
    target: '[data-tour="dashboard-widgets"]',
    content: (
      <div>
        <h3 className="font-semibold mb-1">Dashboard Widgets</h3>
        <p>Your dashboard shows key metrics at a glance. Each widget is interactive and updates in real-time.</p>
      </div>
    ),
    placement: 'top',
    disableBeacon: true,
  },
  {
    target: '[data-tour="dashboard-customize"]',
    content: (
      <div>
        <h3 className="font-semibold mb-1">Personalize Your View</h3>
        <p>Click here to add, remove, or reorder widgets. Your preferences are saved automatically.</p>
      </div>
    ),
    placement: 'left',
  },
  {
    target: '[data-tour="quick-actions"]',
    content: (
      <div>
        <h3 className="font-semibold mb-1">Quick Actions</h3>
        <p>Common tasks are just one click away. Add members, schedule classes, or check in members instantly.</p>
      </div>
    ),
    placement: 'top',
  },
];

// Members section tour
export const membersTour: Step[] = [
  {
    target: '[data-tour="members-search"]',
    content: (
      <div>
        <h3 className="font-semibold mb-1">Search Members</h3>
        <p>Quickly find any member by name, email, or membership status.</p>
      </div>
    ),
    placement: 'bottom',
    disableBeacon: true,
  },
  {
    target: '[data-tour="members-filter"]',
    content: (
      <div>
        <h3 className="font-semibold mb-1">Filter Options</h3>
        <p>Filter members by status, plan, or other criteria to focus on what matters.</p>
      </div>
    ),
    placement: 'bottom',
  },
  {
    target: '[data-tour="add-member"]',
    content: (
      <div>
        <h3 className="font-semibold mb-1">Add New Member</h3>
        <p>Click here to register a new gym member. The form saves drafts automatically.</p>
      </div>
    ),
    placement: 'left',
  },
  {
    target: '[data-tour="member-card"]',
    content: (
      <div>
        <h3 className="font-semibold mb-1">Member Details</h3>
        <p>Click any member card to view full details, edit information, or manage memberships.</p>
      </div>
    ),
    placement: 'top',
  },
];

// Classes section tour
export const classesTour: Step[] = [
  {
    target: '[data-tour="class-calendar"]',
    content: (
      <div>
        <h3 className="font-semibold mb-1">Class Calendar</h3>
        <p>View all scheduled classes in calendar or list view.</p>
      </div>
    ),
    placement: 'bottom',
    disableBeacon: true,
  },
  {
    target: '[data-tour="schedule-class"]',
    content: (
      <div>
        <h3 className="font-semibold mb-1">Schedule a Class</h3>
        <p>Create recurring or one-time classes with instructor assignment and capacity limits.</p>
      </div>
    ),
    placement: 'left',
  },
  {
    target: '[data-tour="class-bookings"]',
    content: (
      <div>
        <h3 className="font-semibold mb-1">Manage Bookings</h3>
        <p>View who's registered, manage waitlists, and send class reminders.</p>
      </div>
    ),
    placement: 'top',
  },
];

// Sales/CRM tour (for sales role)
export const salesTour: Step[] = [
  {
    target: '[data-tour="leads-pipeline"]',
    content: (
      <div>
        <h3 className="font-semibold mb-1">Sales Pipeline</h3>
        <p>Track leads through your sales process from inquiry to membership.</p>
      </div>
    ),
    placement: 'bottom',
    disableBeacon: true,
  },
  {
    target: '[data-tour="add-lead"]',
    content: (
      <div>
        <h3 className="font-semibold mb-1">Add New Lead</h3>
        <p>Capture new leads quickly with automated follow-up workflows.</p>
      </div>
    ),
    placement: 'left',
  },
  {
    target: '[data-tour="lead-activities"]',
    content: (
      <div>
        <h3 className="font-semibold mb-1">Activity Timeline</h3>
        <p>See all interactions, calls, emails, and visits with prospects.</p>
      </div>
    ),
    placement: 'top',
  },
];

// Settings tour
export const settingsTour: Step[] = [
  {
    target: '[data-tour="org-settings"]',
    content: (
      <div>
        <h3 className="font-semibold mb-1">Organization Settings</h3>
        <p>Configure your gym's profile, billing, and general settings.</p>
      </div>
    ),
    placement: 'right',
    disableBeacon: true,
  },
  {
    target: '[data-tour="membership-plans"]',
    content: (
      <div>
        <h3 className="font-semibold mb-1">Membership Plans</h3>
        <p>Create and manage membership tiers, pricing, and access levels.</p>
      </div>
    ),
    placement: 'right',
  },
  {
    target: '[data-tour="user-management"]',
    content: (
      <div>
        <h3 className="font-semibold mb-1">User Management</h3>
        <p>Invite staff, assign roles, and manage permissions.</p>
      </div>
    ),
    placement: 'right',
  },
];

/**
 * Get tour steps based on tour type
 */
export function getTourSteps(tourType: OnboardingTourType): Step[] {
  switch (tourType) {
    case 'first-time':
      return firstTimeTour;
    case 'dashboard':
      return dashboardTour;
    case 'members':
      return membersTour;
    case 'classes':
      return classesTour;
    case 'sales':
      return salesTour;
    case 'settings':
      return settingsTour;
    default:
      return [];
  }
}

/**
 * Get recommended tours for a role
 */
export function getRecommendedToursForRole(role: string): OnboardingTourType[] {
  switch (role) {
    case 'owner':
    case 'admin':
      return ['first-time', 'dashboard', 'members', 'classes', 'settings'];
    case 'staff':
      return ['first-time', 'dashboard', 'members', 'classes'];
    case 'sales':
      return ['first-time', 'dashboard', 'members', 'sales'];
    case 'instructor':
      return ['first-time', 'classes'];
    case 'member':
      return ['first-time'];
    default:
      return ['first-time'];
  }
}
