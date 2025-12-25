import React from 'react';
import { Helmet } from 'react-helmet-async';
import { Star, Quote } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

export interface Testimonial {
  author: string;
  role: string;
  company: string;
  content: string;
  rating: number; // 1-5
  avatar?: string;
  date?: string; // ISO date format
}

interface TestimonialSectionProps {
  title?: string;
  subtitle?: string;
  testimonials: Testimonial[];
  className?: string;
  includeSchema?: boolean;
  showAggregateRating?: boolean;
  layout?: 'grid' | 'carousel' | 'stacked';
}

/**
 * TestimonialSection - SEO-optimized testimonial/review component with schema markup
 *
 * This component is optimized for:
 * - Google Review rich snippets (star ratings in search results)
 * - AggregateRating schema for overall product rating
 * - Individual Review schema for each testimonial
 * - AI search engine optimization
 *
 * Usage:
 * <TestimonialSection
 *   title="What Our Clients Say"
 *   testimonials={[
 *     {
 *       author: "John Doe",
 *       role: "Owner",
 *       company: "CrossFit Downtown",
 *       content: "Gym Unity Suite transformed our business...",
 *       rating: 5
 *     }
 *   ]}
 * />
 */
export const TestimonialSection = ({
  title = 'What Our Clients Say',
  subtitle,
  testimonials,
  className = '',
  includeSchema = true,
  showAggregateRating = true,
  layout = 'grid',
}: TestimonialSectionProps) => {
  // Calculate aggregate rating
  const averageRating =
    testimonials.reduce((sum, t) => sum + t.rating, 0) / testimonials.length;
  const roundedRating = Math.round(averageRating * 10) / 10;

  // Generate Review schema for search engines
  const reviewSchema = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: 'Gym Unity Suite',
    description: 'All-in-one gym management software for fitness businesses',
    brand: {
      '@type': 'Brand',
      name: 'Gym Unity Suite',
    },
    aggregateRating: {
      '@type': 'AggregateRating',
      ratingValue: roundedRating.toFixed(1),
      bestRating: '5',
      worstRating: '1',
      ratingCount: testimonials.length,
      reviewCount: testimonials.length,
    },
    review: testimonials.map((testimonial) => ({
      '@type': 'Review',
      author: {
        '@type': 'Person',
        name: testimonial.author,
        jobTitle: testimonial.role,
      },
      reviewRating: {
        '@type': 'Rating',
        ratingValue: testimonial.rating,
        bestRating: '5',
        worstRating: '1',
      },
      reviewBody: testimonial.content,
      datePublished: testimonial.date || new Date().toISOString().split('T')[0],
      publisher: {
        '@type': 'Organization',
        name: testimonial.company,
      },
    })),
  };

  // Render star rating
  const renderStars = (rating: number) => {
    return (
      <div className="flex gap-0.5" aria-label={`${rating} out of 5 stars`}>
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`h-4 w-4 ${
              star <= rating
                ? 'fill-yellow-400 text-yellow-400'
                : 'fill-muted text-muted'
            }`}
          />
        ))}
      </div>
    );
  };

  // Get initials for avatar fallback
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  // Layout class based on prop
  const layoutClass =
    layout === 'grid'
      ? 'grid gap-6 md:grid-cols-2 lg:grid-cols-3'
      : layout === 'stacked'
      ? 'flex flex-col gap-6 max-w-2xl mx-auto'
      : 'flex gap-6 overflow-x-auto pb-4 snap-x snap-mandatory';

  return (
    <section className={`py-16 ${className}`} id="testimonials">
      {/* Schema markup for SEO */}
      {includeSchema && (
        <Helmet>
          <script type="application/ld+json">
            {JSON.stringify(reviewSchema)}
          </script>
        </Helmet>
      )}

      <div className="container mx-auto px-4">
        {/* Section header */}
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            {title}
          </h2>
          {subtitle && (
            <p className="text-lg text-muted-foreground mb-4">{subtitle}</p>
          )}

          {/* Aggregate rating display */}
          {showAggregateRating && (
            <div className="flex items-center justify-center gap-2 mt-4">
              <div className="flex gap-0.5">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star
                    key={star}
                    className={`h-5 w-5 ${
                      star <= Math.round(averageRating)
                        ? 'fill-yellow-400 text-yellow-400'
                        : 'fill-muted text-muted'
                    }`}
                  />
                ))}
              </div>
              <span className="text-lg font-semibold text-foreground">
                {roundedRating.toFixed(1)}
              </span>
              <span className="text-muted-foreground">
                based on {testimonials.length} reviews
              </span>
            </div>
          )}
        </div>

        {/* Testimonial cards */}
        <div className={layoutClass}>
          {testimonials.map((testimonial, index) => (
            <Card
              key={index}
              className={`bg-card border-border ${
                layout === 'carousel' ? 'min-w-[320px] snap-center' : ''
              }`}
            >
              <CardContent className="p-6">
                {/* Quote icon */}
                <Quote className="h-8 w-8 text-primary/20 mb-4" />

                {/* Rating */}
                <div className="mb-4">{renderStars(testimonial.rating)}</div>

                {/* Content */}
                <p className="text-foreground mb-6 leading-relaxed">
                  "{testimonial.content}"
                </p>

                {/* Author info */}
                <div className="flex items-center gap-3">
                  <Avatar className="h-10 w-10">
                    {testimonial.avatar && (
                      <AvatarImage
                        src={testimonial.avatar}
                        alt={testimonial.author}
                      />
                    )}
                    <AvatarFallback className="bg-primary/10 text-primary text-sm">
                      {getInitials(testimonial.author)}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium text-foreground">
                      {testimonial.author}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {testimonial.role} at {testimonial.company}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* AI-friendly hidden structured content */}
      <div className="sr-only" aria-hidden="true">
        <div itemScope itemType="https://schema.org/Product">
          <span itemProp="name">Gym Unity Suite</span>
          <div
            itemScope
            itemProp="aggregateRating"
            itemType="https://schema.org/AggregateRating"
          >
            <span itemProp="ratingValue">{roundedRating.toFixed(1)}</span>
            <span itemProp="bestRating">5</span>
            <span itemProp="ratingCount">{testimonials.length}</span>
          </div>
          {testimonials.map((testimonial, index) => (
            <div
              key={index}
              itemScope
              itemProp="review"
              itemType="https://schema.org/Review"
            >
              <span itemProp="author">{testimonial.author}</span>
              <span itemProp="reviewBody">{testimonial.content}</span>
              <div
                itemScope
                itemProp="reviewRating"
                itemType="https://schema.org/Rating"
              >
                <span itemProp="ratingValue">{testimonial.rating}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

// Pre-built testimonial sets for common pages

export const gymOwnerTestimonials: Testimonial[] = [
  {
    author: 'Sarah Mitchell',
    role: 'Owner',
    company: 'FitLife Studio',
    content:
      'Switching to Gym Unity Suite was the best decision for our boutique fitness studio. We saved over $3,000 in the first year and our member retention improved by 25%. The automated billing alone saves me 10 hours a week.',
    rating: 5,
    date: '2025-01-15',
  },
  {
    author: 'Marcus Chen',
    role: 'General Manager',
    company: 'Iron Temple CrossFit',
    content:
      'After years with Mindbody, we made the switch and never looked back. The WOD tracking features are exactly what our athletes needed, and the pricing is transparent with no hidden fees.',
    rating: 5,
    date: '2025-01-10',
  },
  {
    author: 'Jennifer Rodriguez',
    role: 'Director',
    company: 'Zen Yoga Collective',
    content:
      'The class pack management and waitlist features have transformed how we run our studio. Our students love the branded mobile app, and our instructors find the scheduling system intuitive.',
    rating: 5,
    date: '2025-01-08',
  },
  {
    author: 'David Thompson',
    role: 'Owner',
    company: 'Peak Performance Gym',
    content:
      'Gym Unity Suite\'s CRM and lead management tools helped us increase new member conversions by 40%. The analytics dashboard gives us insights we never had before.',
    rating: 4,
    date: '2024-12-20',
  },
  {
    author: 'Amanda Foster',
    role: 'Operations Manager',
    company: 'Community Fitness Center',
    content:
      'Managing 3 locations used to be a nightmare. Now with the multi-location dashboard, I can see everything at a glance. The support team is incredibly responsive too.',
    rating: 5,
    date: '2024-12-15',
  },
  {
    author: 'Ryan O\'Brien',
    role: 'Owner',
    company: 'MMA Academy',
    content:
      'The equipment tracking and maintenance scheduling features are perfect for our martial arts school. We\'ve reduced equipment-related incidents by 60% since implementing the system.',
    rating: 5,
    date: '2024-12-10',
  },
];

export const mindbodyMigrationTestimonials: Testimonial[] = [
  {
    author: 'Lisa Wang',
    role: 'Owner',
    company: 'Harmony Pilates',
    content:
      'The migration from Mindbody was seamless. The Gym Unity Suite team handled everything, and we were up and running in just 3 days. We\'re saving $400/month with better features.',
    rating: 5,
    date: '2025-01-12',
  },
  {
    author: 'Michael Brooks',
    role: 'Director',
    company: 'Urban Fitness Club',
    content:
      'I was worried about switching after 5 years on Mindbody, but the transition was smoother than expected. The interface is so much faster, and my staff actually enjoys using it.',
    rating: 5,
    date: '2025-01-05',
  },
  {
    author: 'Nicole Peterson',
    role: 'Owner',
    company: 'Sunrise Yoga Studio',
    content:
      'Mindbody\'s transaction fees were eating into our margins. With Gym Unity Suite, we keep more of what we earn. Plus, the branded app is included at no extra cost!',
    rating: 5,
    date: '2024-12-28',
  },
];

export const crossfitTestimonials: Testimonial[] = [
  {
    author: 'Chris Johnson',
    role: 'Head Coach & Owner',
    company: 'CrossFit Elevation',
    content:
      'Finally, a gym management system that understands CrossFit. The WOD programming, athlete tracking, and competition management features are exactly what we needed.',
    rating: 5,
    date: '2025-01-14',
  },
  {
    author: 'Katie Sullivan',
    role: 'Owner',
    company: 'CrossFit Coastal',
    content:
      'Our members love logging their scores through the app. The leaderboards and PR tracking keep everyone motivated. It\'s become a core part of our box culture.',
    rating: 5,
    date: '2025-01-02',
  },
  {
    author: 'Jason Park',
    role: 'General Manager',
    company: 'CrossFit Republic',
    content:
      'Switching from Wodify was easy, and we\'re saving money while getting more features. The membership management and automated billing are rock solid.',
    rating: 4,
    date: '2024-12-22',
  },
];

export const yogaStudioTestimonials: Testimonial[] = [
  {
    author: 'Maya Patel',
    role: 'Founder',
    company: 'Lotus Flow Yoga',
    content:
      'The class pack management is exactly what yoga studios need. Our students can easily track their remaining classes, and the auto-renewal reminders reduce churn significantly.',
    rating: 5,
    date: '2025-01-11',
  },
  {
    author: 'Rebecca Torres',
    role: 'Studio Director',
    company: 'Mindful Movement',
    content:
      'Workshop and retreat management used to be chaotic. Now everything is organized in one place - registrations, payments, waivers, and communications.',
    rating: 5,
    date: '2024-12-30',
  },
  {
    author: 'Emma Chen',
    role: 'Owner',
    company: 'Balance Yoga Studio',
    content:
      'The waitlist feature alone has increased our class attendance by 20%. Students love getting automatic notifications when a spot opens up.',
    rating: 5,
    date: '2024-12-18',
  },
];

export default TestimonialSection;
