/**
 * PilatesStudiosPage - Pilates studio management software landing page
 */

import React from 'react';
import { SolutionPageTemplate } from '@/components/seo/SolutionPageTemplate';
import { getSolutionPageBySlug } from '@/config/seo.config';

// Pilates-specific FAQs
const pilatesFAQs = [
  {
    question: 'What is the best software for Pilates studios?',
    answer: 'Gym Unity Suite is designed specifically for Pilates studios with features like reformer scheduling, equipment tracking, private session packages, and duet session management. Starting at $149/month, it offers more value than competitors like Mindbody while being easier to use.',
  },
  {
    question: 'Can I manage reformer and equipment booking?',
    answer: 'Yes, Gym Unity Suite includes comprehensive equipment scheduling. You can assign specific reformers or other equipment to classes, track availability, schedule maintenance, and prevent double-booking. Members can even request their preferred equipment.',
  },
  {
    question: 'How do I handle private and duet Pilates sessions?',
    answer: 'Gym Unity Suite supports flexible session types including private 1-on-1 sessions, duet sessions (2 clients), and small group training. You can create session packages, set different pricing, and allow clients to book through the mobile app.',
  },
  {
    question: 'Can instructors track certifications and specializations?',
    answer: 'Yes, the platform tracks instructor certifications including STOTT, Balanced Body, Polestar, and other Pilates certifications. You can set expiration reminders, track continuing education, and display instructor specializations to clients.',
  },
  {
    question: 'Does the software integrate with my existing booking system?',
    answer: 'Gym Unity Suite can replace your existing booking system or integrate with it. We offer free data migration from platforms like Mindbody, MindBody Go, Acuity, and others. Most studios complete the switch within 1-2 weeks.',
  },
  {
    question: 'What about retail and merchandise sales?',
    answer: 'Gym Unity Suite includes a full retail POS for selling Pilates props, grippy socks, water bottles, and merchandise. Track inventory, set up member discounts, and process sales directly through the platform.',
  },
];

// Testimonial
const testimonial = {
  quote: 'The reformer scheduling feature alone saved us hours every week. Our clients love being able to book their favorite equipment, and the instructor portal makes managing our team so much easier.',
  author: 'Sarah Mitchell',
  role: 'Owner, Core Pilates Studio',
  rating: 5,
};

const PilatesStudiosPage = () => {
  const pageData = getSolutionPageBySlug('pilates-studios');

  if (!pageData) {
    return null;
  }

  return (
    <SolutionPageTemplate
      pageData={pageData}
      faqs={pilatesFAQs}
      testimonial={testimonial}
    />
  );
};

export default PilatesStudiosPage;
