import { useQuery } from '@tanstack/react-query';
import { BlogGrid } from '@/components/blog/BlogGrid';
import { Footer } from '@/components/layout/Footer';
import { SEOHead } from '@/components/seo/SEOHead';
import { BlogPageSkeleton } from '@/components/ui/skeleton';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { RefreshCw } from 'lucide-react';

// SEO metadata for the blog page - rendered immediately for crawlers
const blogSEOData = {
  title: "Fitness Business Blog - Expert Gym Management Tips & Strategies",
  description: "Expert insights, best practices, and strategies to help you build and grow a successful fitness business. Learn about member retention, gym software, scheduling, and more.",
  keywords: "gym management blog, fitness business tips, gym software guide, member retention strategies, fitness industry insights, gym owner resources",
  type: "blog" as const,
};

export default function BlogPage() {
  const postsQuery = useQuery<any>({
    queryKey: ['blog-posts'] as const,
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from('blog_posts')
        .select(`
          slug,
          title,
          excerpt,
          featured_image,
          read_time,
          published_at,
          category:blog_categories(name,slug),
          tags:blog_post_tags(tag:blog_tags(name,slug))
        `)
        .eq('status', 'published')
        .lte('published_at', new Date().toISOString())
        .order('published_at', { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });

  const posts = (postsQuery.data ?? []).map((p: any) => ({
    slug: p.slug,
    title: p.title,
    excerpt: p.excerpt ?? '',
    featuredImage: p.featured_image ?? undefined,
    readTime: p.read_time ?? 0,
    publishedDate: p.published_at ?? new Date().toISOString(),
    category: p.category?.name ?? 'General',
    tags: (p.tags ?? []).map((t: any) => t?.tag?.name).filter(Boolean),
  }));

  // Always render SEO head first - this ensures crawlers see meta tags immediately
  const seoHead = (
    <SEOHead
      title={blogSEOData.title}
      description={blogSEOData.description}
      keywords={blogSEOData.keywords}
      type={blogSEOData.type}
      structuredData={{
        "@context": "https://schema.org",
        "@type": "Blog",
        "name": "Gym Unity Suite Fitness Business Blog",
        "description": blogSEOData.description,
        "url": "https://gymunitysuite.com/blog",
        "publisher": {
          "@type": "Organization",
          "name": "Gym Unity Suite",
          "url": "https://gymunitysuite.com"
        }
      }}
    />
  );

  if (postsQuery.isLoading) {
    return (
      <>
        {seoHead}
        <BlogPageSkeleton />
      </>
    );
  }

  if (postsQuery.isError) {
    return (
      <>
        {seoHead}
        <div className="min-h-screen bg-background">
          <header className="bg-gradient-primary text-white">
            <div className="container mx-auto px-4 py-16 text-center">
              <h1 className="text-4xl md:text-6xl font-bold mb-4">
                Fitness Business Blog
              </h1>
            </div>
          </header>
          <div className="container mx-auto px-4 py-16 text-center">
            <p className="text-lg text-destructive mb-4">Failed to load articles</p>
            <Button onClick={() => postsQuery.refetch()} variant="outline">
              <RefreshCw className="w-4 h-4 mr-2" />
              Try Again
            </Button>
          </div>
          <Footer />
        </div>
      </>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {seoHead}
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
        posts={posts}
        title="Latest Articles"
        description="Stay updated with the latest trends and best practices in the fitness industry."
      />

      <Footer />
    </div>
  );
}