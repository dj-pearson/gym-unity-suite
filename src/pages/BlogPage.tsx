import { BlogGrid } from '@/components/blog/BlogGrid';
import { Footer } from '@/components/layout/Footer';

// Sample blog posts data - in a real app, this would come from your CMS or API
const sampleBlogPosts = [
  {
    slug: '10-ways-increase-member-retention',
    title: '10 Proven Ways to Increase Member Retention in Your Fitness Business',
    excerpt: 'Discover actionable strategies that successful gym owners use to keep members engaged and reduce churn rates.',
    publishedDate: '2024-01-15',
    readTime: 8,
    category: 'Member Retention',
    tags: ['retention', 'member engagement', 'business growth', 'customer success'],
    featuredImage: '/assets/member-retention.jpg'
  },
  {
    slug: 'equipment-maintenance-guide',
    title: 'The Ultimate Equipment Maintenance Guide for Gym Owners',
    excerpt: 'Keep your equipment running smoothly and extend its lifespan with this comprehensive maintenance checklist.',
    publishedDate: '2024-01-12',
    readTime: 12,
    category: 'Equipment Management',
    tags: ['equipment', 'maintenance', 'safety', 'operations'],
    featuredImage: '/assets/equipment-maintenance.jpg'
  },
  {
    slug: 'fitness-class-scheduling-best-practices',
    title: 'Fitness Class Scheduling: Best Practices for Maximum Attendance',
    excerpt: 'Learn how to optimize your class schedule to boost attendance and member satisfaction.',
    publishedDate: '2024-01-10',
    readTime: 6,
    category: 'Class Management',
    tags: ['scheduling', 'classes', 'attendance', 'optimization'],
    featuredImage: '/assets/class-scheduling.jpg'
  },
  {
    slug: 'gym-marketing-strategies-2024',
    title: 'Top Gym Marketing Strategies That Actually Work in 2024',
    excerpt: 'Modern marketing tactics to attract new members and build a strong fitness community.',
    publishedDate: '2024-01-08',
    readTime: 10,
    category: 'Marketing',
    tags: ['marketing', 'lead generation', 'social media', 'growth'],
    featuredImage: '/assets/gym-marketing.jpg'
  },
  {
    slug: 'staff-training-customer-service',
    title: 'Training Your Staff for Exceptional Customer Service',
    excerpt: 'Build a team that delivers outstanding member experiences and drives business success.',
    publishedDate: '2024-01-05',
    readTime: 7,
    category: 'Staff Management',
    tags: ['staff training', 'customer service', 'team building', 'member experience'],
    featuredImage: '/assets/staff-training.jpg'
  },
  {
    slug: 'fitness-technology-trends',
    title: 'Fitness Technology Trends Shaping the Industry',
    excerpt: 'Stay ahead of the curve with the latest tech innovations transforming fitness businesses.',
    publishedDate: '2024-01-03',
    readTime: 9,
    category: 'Technology',
    tags: ['technology', 'innovation', 'trends', 'digital transformation'],
    featuredImage: '/assets/fitness-tech.jpg'
  }
];

export default function BlogPage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Page Header */}
      <header className="bg-gradient-primary text-white">
        <div className="container mx-auto px-4 py-16 text-center">
          <h1 className="text-4xl md:text-6xl font-bold mb-4">
            Fitness Business Blog
          </h1>
          <p className="text-xl md:text-2xl text-white/90 max-w-3xl mx-auto">
            Expert insights, best practices, and strategies to help you build and grow a successful fitness business. 
            From member retention to equipment management, we cover it all.
          </p>
        </div>
      </header>

      <BlogGrid 
        posts={sampleBlogPosts}
        title="Latest Articles"
        description="Stay updated with the latest trends and best practices in the fitness industry."
      />
      
      <Footer />
    </div>
  );
}