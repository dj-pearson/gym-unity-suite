/**
 * Centralized SEO Configuration
 *
 * This file contains all SEO-related data for programmatic page generation.
 * It enables scalable SEO by defining structured data for:
 * - Local SEO pages (cities/regions)
 * - Solution pages (industry verticals)
 * - Comparison pages (competitor alternatives)
 * - Feature pages
 * - Blog topics
 */

// Base site configuration
export const siteConfig = {
  name: 'Gym Unity Suite',
  domain: 'https://gymunitysuite.com',
  defaultTitle: 'Gym Management Software for Boutique Studios | Gym Unity Suite',
  defaultDescription: 'All-in-one gym management software with member management, automated billing, CRM, and branded mobile app. Starting at $97/month.',
  defaultImage: 'https://gymunitysuite.com/assets/og-image.jpg',
  twitterHandle: '@GymUnitySuite',
  locale: 'en_US',
};

// Type definitions for programmatic SEO
export interface LocalSEOPage {
  slug: string;
  city: string;
  state: string;
  stateAbbr: string;
  region: string;
  population: string;
  gymsCount: string;
  keywords: string[];
  nearbyAreas: string[];
}

export interface SolutionPage {
  slug: string;
  name: string;
  shortName: string;
  description: string;
  keywords: string[];
  icon: string;
  features: string[];
  benefits: string[];
  pricing: string;
  ctaText: string;
}

export interface ComparisonPage {
  slug: string;
  competitor: string;
  competitorUrl: string;
  keywords: string[];
  painPoints: string[];
  savings: string;
  features: { name: string; us: boolean | string; them: boolean | string }[];
}

export interface FeaturePage {
  slug: string;
  name: string;
  shortName: string;
  description: string;
  keywords: string[];
  benefits: string[];
}

// Local SEO Pages Data - Scalable city pages
export const localSEOPages: LocalSEOPage[] = [
  {
    slug: 'new-york-gym-software',
    city: 'New York',
    state: 'New York',
    stateAbbr: 'NY',
    region: 'Northeast',
    population: '8.3M',
    gymsCount: '3,500+',
    keywords: ['gym software new york', 'nyc gym management', 'fitness software new york city', 'gym billing software nyc'],
    nearbyAreas: ['Brooklyn', 'Queens', 'Manhattan', 'Bronx', 'Staten Island', 'Long Island'],
  },
  {
    slug: 'los-angeles-gym-software',
    city: 'Los Angeles',
    state: 'California',
    stateAbbr: 'CA',
    region: 'West Coast',
    population: '3.9M',
    gymsCount: '2,800+',
    keywords: ['gym software los angeles', 'la gym management', 'fitness software california', 'gym billing software la'],
    nearbyAreas: ['Santa Monica', 'Hollywood', 'Beverly Hills', 'Pasadena', 'Burbank', 'Long Beach'],
  },
  {
    slug: 'chicago-gym-software',
    city: 'Chicago',
    state: 'Illinois',
    stateAbbr: 'IL',
    region: 'Midwest',
    population: '2.7M',
    gymsCount: '1,800+',
    keywords: ['gym software chicago', 'chicago gym management', 'fitness software illinois', 'gym billing software chicago'],
    nearbyAreas: ['Evanston', 'Oak Park', 'Naperville', 'Schaumburg', 'Skokie', 'Waukegan'],
  },
  {
    slug: 'houston-gym-software',
    city: 'Houston',
    state: 'Texas',
    stateAbbr: 'TX',
    region: 'South',
    population: '2.3M',
    gymsCount: '1,600+',
    keywords: ['gym software houston', 'houston gym management', 'fitness software texas', 'gym billing software houston'],
    nearbyAreas: ['The Woodlands', 'Sugar Land', 'Katy', 'Pearland', 'Pasadena', 'Galveston'],
  },
  {
    slug: 'phoenix-gym-software',
    city: 'Phoenix',
    state: 'Arizona',
    stateAbbr: 'AZ',
    region: 'Southwest',
    population: '1.6M',
    gymsCount: '1,200+',
    keywords: ['gym software phoenix', 'phoenix gym management', 'fitness software arizona', 'gym billing software phoenix'],
    nearbyAreas: ['Scottsdale', 'Tempe', 'Mesa', 'Chandler', 'Glendale', 'Gilbert'],
  },
  {
    slug: 'philadelphia-gym-software',
    city: 'Philadelphia',
    state: 'Pennsylvania',
    stateAbbr: 'PA',
    region: 'Northeast',
    population: '1.6M',
    gymsCount: '1,100+',
    keywords: ['gym software philadelphia', 'philly gym management', 'fitness software pennsylvania', 'gym billing software philadelphia'],
    nearbyAreas: ['King of Prussia', 'Cherry Hill', 'Wilmington', 'Camden', 'Chester', 'Norristown'],
  },
  {
    slug: 'san-antonio-gym-software',
    city: 'San Antonio',
    state: 'Texas',
    stateAbbr: 'TX',
    region: 'South',
    population: '1.5M',
    gymsCount: '900+',
    keywords: ['gym software san antonio', 'san antonio gym management', 'fitness software texas', 'gym billing software san antonio'],
    nearbyAreas: ['New Braunfels', 'Boerne', 'Seguin', 'Universal City', 'Schertz', 'Cibolo'],
  },
  {
    slug: 'san-diego-gym-software',
    city: 'San Diego',
    state: 'California',
    stateAbbr: 'CA',
    region: 'West Coast',
    population: '1.4M',
    gymsCount: '1,100+',
    keywords: ['gym software san diego', 'san diego gym management', 'fitness software california', 'gym billing software san diego'],
    nearbyAreas: ['La Jolla', 'Del Mar', 'Carlsbad', 'Chula Vista', 'El Cajon', 'Oceanside'],
  },
  {
    slug: 'dallas-gym-software',
    city: 'Dallas',
    state: 'Texas',
    stateAbbr: 'TX',
    region: 'South',
    population: '1.3M',
    gymsCount: '1,200+',
    keywords: ['gym software dallas', 'dallas gym management', 'fitness software texas', 'gym billing software dallas'],
    nearbyAreas: ['Fort Worth', 'Arlington', 'Plano', 'Irving', 'Frisco', 'McKinney'],
  },
  {
    slug: 'austin-gym-software',
    city: 'Austin',
    state: 'Texas',
    stateAbbr: 'TX',
    region: 'South',
    population: '1.0M',
    gymsCount: '950+',
    keywords: ['gym software austin', 'austin gym management', 'fitness software texas', 'gym billing software austin'],
    nearbyAreas: ['Round Rock', 'Cedar Park', 'Georgetown', 'Pflugerville', 'San Marcos', 'Leander'],
  },
  {
    slug: 'denver-gym-software',
    city: 'Denver',
    state: 'Colorado',
    stateAbbr: 'CO',
    region: 'Mountain',
    population: '715K',
    gymsCount: '800+',
    keywords: ['gym software denver', 'denver gym management', 'fitness software colorado', 'gym billing software denver'],
    nearbyAreas: ['Boulder', 'Aurora', 'Lakewood', 'Littleton', 'Arvada', 'Westminster'],
  },
  {
    slug: 'seattle-gym-software',
    city: 'Seattle',
    state: 'Washington',
    stateAbbr: 'WA',
    region: 'Pacific Northwest',
    population: '750K',
    gymsCount: '700+',
    keywords: ['gym software seattle', 'seattle gym management', 'fitness software washington', 'gym billing software seattle'],
    nearbyAreas: ['Bellevue', 'Tacoma', 'Redmond', 'Kirkland', 'Everett', 'Renton'],
  },
  {
    slug: 'miami-gym-software',
    city: 'Miami',
    state: 'Florida',
    stateAbbr: 'FL',
    region: 'Southeast',
    population: '450K',
    gymsCount: '1,000+',
    keywords: ['gym software miami', 'miami gym management', 'fitness software florida', 'gym billing software miami'],
    nearbyAreas: ['Miami Beach', 'Fort Lauderdale', 'Boca Raton', 'Coral Gables', 'Hialeah', 'Hollywood'],
  },
  {
    slug: 'atlanta-gym-software',
    city: 'Atlanta',
    state: 'Georgia',
    stateAbbr: 'GA',
    region: 'Southeast',
    population: '500K',
    gymsCount: '900+',
    keywords: ['gym software atlanta', 'atlanta gym management', 'fitness software georgia', 'gym billing software atlanta'],
    nearbyAreas: ['Buckhead', 'Marietta', 'Alpharetta', 'Decatur', 'Sandy Springs', 'Roswell'],
  },
  {
    slug: 'boston-gym-software',
    city: 'Boston',
    state: 'Massachusetts',
    stateAbbr: 'MA',
    region: 'Northeast',
    population: '675K',
    gymsCount: '650+',
    keywords: ['gym software boston', 'boston gym management', 'fitness software massachusetts', 'gym billing software boston'],
    nearbyAreas: ['Cambridge', 'Brookline', 'Newton', 'Somerville', 'Quincy', 'Worcester'],
  },
];

// Solution/Vertical Pages Data
export const solutionPages: SolutionPage[] = [
  {
    slug: 'yoga-studios',
    name: 'Yoga Studios',
    shortName: 'Yoga',
    description: 'Complete yoga studio management software with class scheduling, instructor management, and branded mobile app.',
    keywords: ['yoga studio software', 'yoga scheduling software', 'yoga studio management', 'yoga class booking'],
    icon: 'Flower2',
    features: ['Class packs & punch cards', 'Instructor scheduling', 'Waitlist management', 'Workshop events', 'Private sessions'],
    benefits: ['Reduce admin time by 10+ hours/week', 'Increase class attendance 25%', 'Improve student retention 40%'],
    pricing: '$149/mo',
    ctaText: 'Start Free Yoga Studio Trial',
  },
  {
    slug: 'crossfit-gyms',
    name: 'CrossFit Boxes',
    shortName: 'CrossFit',
    description: 'CrossFit box management software with WOD tracking, competition management, and athlete performance analytics.',
    keywords: ['crossfit software', 'crossfit gym management', 'wodify alternative', 'crossfit box software'],
    icon: 'Dumbbell',
    features: ['WOD programming', 'Performance tracking', 'Competition management', 'Open Gym scheduling', 'Athlete leaderboards'],
    benefits: ['Track athlete progress automatically', 'Manage competitions easily', 'Build community engagement'],
    pricing: '$149/mo',
    ctaText: 'Start Free CrossFit Box Trial',
  },
  {
    slug: 'martial-arts-schools',
    name: 'Martial Arts Schools',
    shortName: 'Martial Arts',
    description: 'Martial arts school management with belt progression tracking, family plans, and curriculum management.',
    keywords: ['martial arts software', 'martial arts school management', 'dojo software', 'karate school software'],
    icon: 'Swords',
    features: ['Belt progression tracking', 'Family billing plans', 'Curriculum management', 'Testing schedules', 'Tournament registration'],
    benefits: ['Track student progression', 'Manage family accounts easily', 'Automate belt testing'],
    pricing: '$149/mo',
    ctaText: 'Start Free Martial Arts Trial',
  },
  {
    slug: 'pilates-studios',
    name: 'Pilates Studios',
    shortName: 'Pilates',
    description: 'Pilates studio software for reformer scheduling, private sessions, and equipment management.',
    keywords: ['pilates studio software', 'pilates scheduling', 'reformer booking software', 'pilates studio management'],
    icon: 'Sparkles',
    features: ['Reformer scheduling', 'Equipment tracking', 'Private session packages', 'Duet sessions', 'Instructor certifications'],
    benefits: ['Maximize reformer utilization', 'Manage equipment maintenance', 'Streamline private bookings'],
    pricing: '$149/mo',
    ctaText: 'Start Free Pilates Studio Trial',
  },
  {
    slug: 'personal-training',
    name: 'Personal Training Studios',
    shortName: 'Personal Training',
    description: 'Personal training studio software for session scheduling, client tracking, and trainer management.',
    keywords: ['personal training software', 'pt studio software', 'personal trainer management', 'fitness coach software'],
    icon: 'UserCheck',
    features: ['Session packages', 'Client assessments', 'Progress tracking', 'Trainer schedules', 'Commission tracking'],
    benefits: ['Track client progress visually', 'Manage trainer schedules', 'Automate session packages'],
    pricing: '$149/mo',
    ctaText: 'Start Free Personal Training Trial',
  },
  {
    slug: 'boutique-fitness',
    name: 'Boutique Fitness Studios',
    shortName: 'Boutique Fitness',
    description: 'All-in-one boutique fitness studio software for spin, barre, HIIT, and specialty fitness classes.',
    keywords: ['boutique fitness software', 'spin studio software', 'barre studio software', 'hiit studio management'],
    icon: 'Bike',
    features: ['Class booking', 'Bike/station assignment', 'Performance tracking', 'Leaderboards', 'Retail POS'],
    benefits: ['Create immersive class experiences', 'Build member community', 'Track performance metrics'],
    pricing: '$149/mo',
    ctaText: 'Start Free Boutique Fitness Trial',
  },
  {
    slug: 'boxing-gyms',
    name: 'Boxing & MMA Gyms',
    shortName: 'Boxing/MMA',
    description: 'Boxing and MMA gym software for class scheduling, fighter management, and event coordination.',
    keywords: ['boxing gym software', 'mma gym management', 'fight gym software', 'boxing studio software'],
    icon: 'Swords',
    features: ['Class scheduling', 'Sparring sessions', 'Fighter records', 'Event management', 'Equipment rentals'],
    benefits: ['Manage class capacity', 'Track fighter development', 'Coordinate fight events'],
    pricing: '$149/mo',
    ctaText: 'Start Free Boxing Gym Trial',
  },
  {
    slug: 'dance-studios',
    name: 'Dance Studios',
    shortName: 'Dance',
    description: 'Dance studio management software for class scheduling, recital planning, and costume tracking.',
    keywords: ['dance studio software', 'dance school management', 'dance studio booking', 'ballet studio software'],
    icon: 'Music',
    features: ['Class scheduling', 'Recital management', 'Costume tracking', 'Practice room booking', 'Video sharing'],
    benefits: ['Plan recitals seamlessly', 'Track costume inventory', 'Manage multiple dance styles'],
    pricing: '$149/mo',
    ctaText: 'Start Free Dance Studio Trial',
  },
];

// Comparison/Alternative Pages Data
export const comparisonPages: ComparisonPage[] = [
  {
    slug: 'mindbody-alternative',
    competitor: 'Mindbody',
    competitorUrl: 'https://mindbody.com',
    keywords: ['mindbody alternative', 'mindbody competitor', 'better than mindbody', 'switch from mindbody'],
    painPoints: ['High monthly costs', 'Hidden transaction fees', 'Long contracts', 'Outdated interface', 'Poor mobile experience'],
    savings: '$3,200/year',
    features: [
      { name: 'Monthly Cost (200 members)', us: '$197/mo', them: '$329/mo' },
      { name: 'Setup Fees', us: '$0', them: '$1,499' },
      { name: 'Transaction Fees', us: 'Standard only', them: '2.5% + processing' },
      { name: 'Branded Mobile App', us: true, them: 'Enterprise only' },
      { name: 'CRM Included', us: true, them: '$99/mo add-on' },
      { name: 'Support Response', us: '<2 hours', them: '24-48 hours' },
    ],
  },
  {
    slug: 'glofox-alternative',
    competitor: 'Glofox',
    competitorUrl: 'https://glofox.com',
    keywords: ['glofox alternative', 'glofox competitor', 'better than glofox', 'switch from glofox'],
    painPoints: ['Limited CRM', 'High setup costs', 'Basic marketing tools', 'Slow support'],
    savings: '$2,500/year',
    features: [
      { name: 'Monthly Cost', us: '$149/mo', them: '$299/mo' },
      { name: 'Setup Fees', us: '$0', them: '$999+' },
      { name: 'Full CRM Suite', us: true, them: false },
      { name: 'Lead Scoring', us: true, them: false },
      { name: 'Marketing Automation', us: true, them: 'Basic' },
      { name: 'Support Response', us: '<2 hours', them: '24-48 hours' },
    ],
  },
  {
    slug: 'zen-planner-alternative',
    competitor: 'Zen Planner',
    competitorUrl: 'https://zenplanner.com',
    keywords: ['zen planner alternative', 'zenplanner competitor', 'better than zen planner', 'switch from zenplanner'],
    painPoints: ['Dated interface', 'Long contracts', 'App costs extra', 'Limited automation'],
    savings: '$1,800/year',
    features: [
      { name: 'Monthly Cost', us: '$149/mo', them: '$217/mo' },
      { name: 'Branded App', us: 'Included', them: '$50/mo extra' },
      { name: 'Contract Length', us: 'Month-to-month', them: '12 months' },
      { name: 'Modern Interface', us: true, them: false },
      { name: 'Mobile-First Design', us: true, them: false },
      { name: 'WOD Tracking', us: true, them: true },
    ],
  },
  {
    slug: 'wodify-alternative',
    competitor: 'Wodify',
    competitorUrl: 'https://wodify.com',
    keywords: ['wodify alternative', 'wodify competitor', 'better than wodify', 'switch from wodify'],
    painPoints: ['CrossFit-focused only', 'Limited general features', 'High per-athlete pricing'],
    savings: '$2,000/year',
    features: [
      { name: 'Monthly Cost (200 members)', us: '$197/mo', them: '$359/mo' },
      { name: 'All Fitness Types', us: true, them: 'CrossFit focused' },
      { name: 'CRM & Marketing', us: true, them: false },
      { name: 'Performance Tracking', us: true, them: true },
      { name: 'Branded App', us: true, them: true },
      { name: 'Retail POS', us: true, them: false },
    ],
  },
  {
    slug: 'pushpress-alternative',
    competitor: 'PushPress',
    competitorUrl: 'https://pushpress.com',
    keywords: ['pushpress alternative', 'pushpress competitor', 'better than pushpress', 'switch from pushpress'],
    painPoints: ['Limited to gyms', 'Basic reporting', 'No marketing automation'],
    savings: '$1,500/year',
    features: [
      { name: 'Monthly Cost', us: '$149/mo', them: '$159/mo' },
      { name: 'Marketing Automation', us: true, them: false },
      { name: 'Advanced Analytics', us: true, them: 'Basic' },
      { name: 'CRM with Lead Scoring', us: true, them: false },
      { name: 'Multi-Location', us: true, them: true },
      { name: 'Equipment Tracking', us: true, them: false },
    ],
  },
  {
    slug: 'clubready-alternative',
    competitor: 'ClubReady',
    competitorUrl: 'https://clubready.com',
    keywords: ['clubready alternative', 'clubready competitor', 'better than clubready', 'switch from clubready'],
    painPoints: ['Complex pricing', 'Outdated design', 'Poor user experience'],
    savings: '$2,800/year',
    features: [
      { name: 'Monthly Cost', us: '$149/mo', them: '$250+/mo' },
      { name: 'Modern Interface', us: true, them: false },
      { name: 'Easy Setup', us: true, them: false },
      { name: 'Mobile Experience', us: true, them: 'Limited' },
      { name: 'Transparent Pricing', us: true, them: false },
      { name: 'No Long Contracts', us: true, them: false },
    ],
  },
];

// Feature Pages Data
export const featurePages: FeaturePage[] = [
  {
    slug: 'scheduling',
    name: 'Class Scheduling Software',
    shortName: 'Scheduling',
    description: 'Powerful class scheduling with online booking, waitlists, and recurring classes.',
    keywords: ['gym class scheduling', 'fitness class booking', 'gym scheduling software'],
    benefits: ['Online booking 24/7', 'Automatic waitlists', 'Recurring class templates', 'Instructor management'],
  },
  {
    slug: 'billing-software',
    name: 'Gym Billing Software',
    shortName: 'Billing',
    description: 'Automated recurring billing with failed payment recovery and flexible pricing.',
    keywords: ['gym billing software', 'fitness payment processing', 'gym membership billing'],
    benefits: ['Automated recurring payments', 'Failed payment recovery', 'Flexible pricing options', 'Payment analytics'],
  },
  {
    slug: 'member-management',
    name: 'Member Management Software',
    shortName: 'Members',
    description: 'Complete member profiles with check-in tracking and engagement tools.',
    keywords: ['gym member management', 'fitness member software', 'gym membership software'],
    benefits: ['Complete member profiles', 'Check-in tracking', 'Attendance history', 'Engagement automation'],
  },
  {
    slug: 'crm',
    name: 'Gym CRM Software',
    shortName: 'CRM',
    description: 'Full CRM with lead tracking, sales pipeline, and automated follow-ups.',
    keywords: ['gym crm', 'fitness crm software', 'gym sales software', 'lead management gym'],
    benefits: ['Lead tracking', 'Sales pipeline', 'Automated follow-ups', 'Conversion analytics'],
  },
  {
    slug: 'mobile-app',
    name: 'Branded Gym Mobile App',
    shortName: 'Mobile App',
    description: 'White-label mobile app with your branding for member booking and engagement.',
    keywords: ['gym mobile app', 'fitness studio app', 'branded gym app', 'member app'],
    benefits: ['Your branding', 'Class booking', 'Account management', 'Push notifications'],
  },
  {
    slug: 'analytics',
    name: 'Gym Analytics & Reporting',
    shortName: 'Analytics',
    description: 'Comprehensive analytics with revenue tracking, retention metrics, and growth insights.',
    keywords: ['gym analytics', 'fitness reporting', 'gym business intelligence', 'gym metrics'],
    benefits: ['Revenue tracking', 'Retention metrics', 'Member insights', 'Growth forecasting'],
  },
];

// Helper functions for generating SEO metadata
export const generateLocalPageMeta = (page: LocalSEOPage) => ({
  title: `Gym Management Software in ${page.city}, ${page.stateAbbr} | Gym Unity Suite`,
  description: `Best gym management software for ${page.city} fitness studios. Member management, billing, scheduling & branded app. Serving ${page.gymsCount} gyms in the ${page.city} area.`,
  canonical: `${siteConfig.domain}/local/${page.slug}`,
  keywords: page.keywords.join(', '),
});

export const generateSolutionPageMeta = (page: SolutionPage) => ({
  title: `${page.name} Software | ${page.pricing} | Gym Unity Suite`,
  description: page.description,
  canonical: `${siteConfig.domain}/solutions/${page.slug}`,
  keywords: page.keywords.join(', '),
});

export const generateComparisonPageMeta = (page: ComparisonPage) => ({
  title: `${page.competitor} Alternative | Save ${page.savings}/Year | Gym Unity Suite`,
  description: `Looking for a ${page.competitor} alternative? Switch to Gym Unity Suite and save ${page.savings}/year with better features, no hidden fees, and faster support.`,
  canonical: `${siteConfig.domain}/compare/${page.slug}`,
  keywords: page.keywords.join(', '),
});

export const generateFeaturePageMeta = (page: FeaturePage) => ({
  title: `${page.name} | Gym Unity Suite`,
  description: page.description,
  canonical: `${siteConfig.domain}/features/${page.slug}`,
  keywords: page.keywords.join(', '),
});

// Get page data by slug
export const getLocalPageBySlug = (slug: string) =>
  localSEOPages.find(p => p.slug === slug);

export const getSolutionPageBySlug = (slug: string) =>
  solutionPages.find(p => p.slug === slug);

export const getComparisonPageBySlug = (slug: string) =>
  comparisonPages.find(p => p.slug === slug);

export const getFeaturePageBySlug = (slug: string) =>
  featurePages.find(p => p.slug === slug);
