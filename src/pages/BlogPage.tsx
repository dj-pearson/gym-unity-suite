import { useQuery } from '@tanstack/react-query';
import { BlogGrid } from '@/components/blog/BlogGrid';
import { Footer } from '@/components/layout/Footer';
import { supabase } from '@/integrations/supabase/client';

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

  if (postsQuery.isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-pulse text-lg text-muted-foreground">Loading articles…</div>
      </div>
    );
  }

  if (postsQuery.isError) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-lg text-destructive">Failed to load posts.</div>
      </div>
    );
  }

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
        posts={posts}
        title="Latest Articles"
        description="Stay updated with the latest trends and best practices in the fitness industry."
      />
      
      <Footer />
    </div>
  );
}