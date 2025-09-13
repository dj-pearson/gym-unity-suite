import { useParams } from 'react-router-dom';
import { BlogPost } from '@/components/blog/BlogPost';
import NotFound from '@/pages/NotFound';
import { blogPosts } from '@/data/blogPosts';

export default function BlogPostPage() {
  const { slug } = useParams<{ slug: string }>();

  const post = blogPosts.find((p) => p.slug === slug);
  if (!post) {
    return <NotFound />;
  }

  const relatedPosts = blogPosts
    .filter((p) => p.category === post.category && p.slug !== post.slug)
    .slice(0, 2)
    .map((p) => ({
      slug: p.slug,
      title: p.title,
      excerpt: p.excerpt,
      featuredImage: p.featuredImage,
    }));

  return (
    <BlogPost
      title={post.title}
      content={post.content}
      excerpt={post.excerpt}
      publishedDate={post.publishedDate}
      readTime={post.readTime}
      category={post.category}
      tags={post.tags}
      featuredImage={post.featuredImage}
      relatedPosts={relatedPosts}
    />
  );
}
