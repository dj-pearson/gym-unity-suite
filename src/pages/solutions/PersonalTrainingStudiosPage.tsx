/**
 * PersonalTrainingStudiosPage - Personal training studio management software landing page
 */

import React from 'react';
import { SolutionPageTemplate } from '@/components/seo/SolutionPageTemplate';
import { getSolutionPageBySlug } from '@/config/seo.config';

// Personal training-specific FAQs
const personalTrainingFAQs = [
  {
    question: 'What is the best software for personal trainers?',
    answer: 'Gym Unity Suite is ideal for personal trainers and PT studios with features like session package management, client progress tracking, automated scheduling, and commission tracking. Starting at $149/month for studios, or $49/month for independent trainers.',
  },
  {
    question: 'How do I manage session packages and credits?',
    answer: 'Create unlimited session packages (5-packs, 10-packs, monthly sessions). The system automatically tracks remaining sessions, sends expiration reminders, and allows clients to book using their credits through the mobile app.',
  },
  {
    question: 'Can I track client progress and assessments?',
    answer: 'Yes, Gym Unity Suite includes comprehensive client tracking: body measurements, fitness assessments, progress photos, workout history, and personal records. Clients can view their progress in the app, boosting motivation and retention.',
  },
  {
    question: 'How does trainer scheduling and commission work?',
    answer: 'Set individual trainer schedules, availability windows, and booking buffers. Track sessions completed, calculate commissions automatically (flat rate or percentage), and generate payroll reports. Trainers get their own portal to manage their clients.',
  },
  {
    question: 'Can clients book sessions through an app?',
    answer: 'Yes, your branded mobile app allows clients to view trainer availability, book sessions, purchase packages, track their progress, and receive push notifications. It works on iOS and Android with your studio branding.',
  },
  {
    question: 'What about gym floor vs. personal training studio?',
    answer: 'Gym Unity Suite works for both gym floor trainers and dedicated PT studios. For gym trainers, track floor hours, personal training sessions, and member interactions. For studios, manage rooms, equipment, and multiple trainers seamlessly.',
  },
];

// Testimonial
const testimonial = {
  quote: 'Finally, software that understands how personal training studios work. The session package tracking and client progress features have helped us increase client retention by over 35%.',
  author: 'Mike Chen',
  role: 'Owner, Elite Personal Training',
  rating: 5,
};

const PersonalTrainingStudiosPage = () => {
  const pageData = getSolutionPageBySlug('personal-training');

  if (!pageData) {
    return null;
  }

  return (
    <SolutionPageTemplate
      pageData={pageData}
      faqs={personalTrainingFAQs}
      testimonial={testimonial}
    />
  );
};

export default PersonalTrainingStudiosPage;
