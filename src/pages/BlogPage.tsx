import { BlogGrid } from '@/components/blog/BlogGrid';
import { Footer } from '@/components/layout/Footer';
import { blogPosts } from '@/data/blogPosts';

// Use shared content for consistency between list and detail pages
const sampleBlogPosts = blogPosts.map(({ content, ...rest }) => rest);

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