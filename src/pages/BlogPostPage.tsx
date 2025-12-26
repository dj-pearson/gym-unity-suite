import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { BlogPost } from '@/components/blog/BlogPost';
import NotFound from '@/pages/NotFound';
import { SEOHead } from '@/components/seo/SEOHead';
import { BlogArticleSkeleton } from '@/components/ui/skeleton';
import { supabase } from '@/integrations/supabase/client';

export default function BlogPostPage() {
  const { slug } = useParams<{ slug: string }>();

  const postQuery = useQuery({
    queryKey: ['blog-post', slug],
    enabled: !!slug,
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from('blog_posts')
        .select(`
          id,
          slug,
          title,
          excerpt,
          content,
          featured_image,
          read_time,
          published_at,
          category_id,
          category:blog_categories(name,slug),
          tags:blog_post_tags(tag:blog_tags(name,slug))
        `)
        .eq('slug', slug as string)
        .eq('status', 'published')
        .lte('published_at', new Date().toISOString())
        .maybeSingle();
      if (error) throw error;
      return data as any | null;
    }
  });

  const relatedQuery = useQuery({
    queryKey: ['related-posts', postQuery.data?.category_id, slug],
    enabled: !!postQuery.data?.category_id && !!slug,
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from('blog_posts')
        .select('slug,title,excerpt,featured_image')
        .eq('category_id', postQuery.data?.category_id as string)
        .eq('status', 'published')
        .neq('slug', slug as string)
        .lte('published_at', new Date().toISOString())
        .order('published_at', { ascending: false })
        .limit(2);
      if (error) throw error;
      return data ?? [];
    }
  });

  // Show skeleton with generic SEO during loading
  if (postQuery.isLoading) {
    return (
      <>
        <SEOHead
          title="Loading Article... - Gym Unity Suite Blog"
          description="Loading fitness business article from Gym Unity Suite blog."
          type="article"
        />
        <BlogArticleSkeleton />
      </>
    );
  }

  if (!postQuery.data) {
    return <NotFound />;
  }

  const p: any = postQuery.data;
  const relatedPosts = (relatedQuery.data ?? []).map((r: any) => ({
    slug: r.slug,
    title: r.title,
    excerpt: r.excerpt ?? '',
    featuredImage: r.featured_image ?? undefined,
  }));

  return (
    <BlogPost
      title={p.title}
      content={p.content}
      excerpt={p.excerpt ?? ''}
      publishedDate={p.published_at ?? new Date().toISOString()}
      readTime={p.read_time ?? 0}
      category={p.category?.name ?? 'General'}
      tags={(p.tags ?? []).map((t: any) => t?.tag?.name).filter(Boolean)}
      featuredImage={p.featured_image ?? undefined}
      relatedPosts={relatedPosts}
    />
  );
}
