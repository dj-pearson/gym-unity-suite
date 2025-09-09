import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { SEOHead } from '@/components/seo/SEOHead';
import { Calendar, Clock, User, ArrowLeft, Share2, BookmarkPlus } from 'lucide-react';
import { Link } from 'react-router-dom';

interface BlogPostProps {
  title: string;
  content: string;
  excerpt: string;
  author: {
    name: string;
    role: string;
    avatar?: string;
  };
  publishedDate: string;
  readTime: number;
  category: string;
  tags: string[];
  featuredImage?: string;
  relatedPosts?: Array<{
    slug: string;
    title: string;
    excerpt: string;
    featuredImage?: string;
  }>;
}

export function BlogPost({
  title,
  content,
  excerpt,
  author,
  publishedDate,
  readTime,
  category,
  tags,
  featuredImage,
  relatedPosts = []
}: BlogPostProps) {
  const publishedTime = new Date(publishedDate).toISOString();
  const keywords = `${tags.join(', ')}, fitness management, gym best practices, fitness business, ${category.toLowerCase()}`;
  
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    "headline": title,
    "description": excerpt,
    "image": featuredImage,
    "author": {
      "@type": "Person",
      "name": author.name,
      "jobTitle": author.role
    },
    "publisher": {
      "@type": "Organization",
      "name": "Rep Club",
      "logo": {
        "@type": "ImageObject",
        "url": "https://repclub.app/logo.png"
      }
    },
    "datePublished": publishedTime,
    "dateModified": publishedTime,
    "mainEntityOfPage": {
      "@type": "WebPage",
      "@id": window.location.href
    },
    "articleSection": category,
    "keywords": keywords,
    "wordCount": content.split(' ').length
  };

  return (
    <>
      <SEOHead
        title={title}
        description={excerpt}
        keywords={keywords}
        type="article"
        author={author.name}
        publishedTime={publishedTime}
        modifiedTime={publishedTime}
        category={category}
        tags={tags}
        image={featuredImage}
        structuredData={structuredData}
      />
      
      <article className="max-w-4xl mx-auto px-4 py-8">
        {/* Breadcrumb Navigation */}
        <nav className="mb-6" aria-label="Breadcrumb">
          <ol className="flex items-center space-x-2 text-sm text-muted-foreground">
            <li><Link to="/" className="hover:text-foreground">Home</Link></li>
            <li>/</li>
            <li><Link to="/blog" className="hover:text-foreground">Blog</Link></li>
            <li>/</li>
            <li><Link to={`/blog/category/${category.toLowerCase()}`} className="hover:text-foreground">{category}</Link></li>
            <li>/</li>
            <li className="text-foreground" aria-current="page">{title}</li>
          </ol>
        </nav>

        {/* Back Button */}
        <Button variant="ghost" asChild className="mb-6">
          <Link to="/blog">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Blog
          </Link>
        </Button>

        {/* Article Header */}
        <header className="mb-8">
          <div className="mb-4">
            <Badge variant="secondary" className="mb-2">{category}</Badge>
            <h1 className="text-4xl md:text-5xl font-bold leading-tight mb-4">
              {title}
            </h1>
            <p className="text-xl text-muted-foreground leading-relaxed">
              {excerpt}
            </p>
          </div>

          {/* Article Meta */}
          <div className="flex flex-wrap items-center gap-6 text-sm text-muted-foreground border-y border-border py-4">
            <div className="flex items-center gap-2">
              <User className="h-4 w-4" />
              <span>By <strong className="text-foreground">{author.name}</strong>, {author.role}</span>
            </div>
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              <time dateTime={publishedTime}>
                {new Date(publishedDate).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
              </time>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4" />
              <span>{readTime} min read</span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-3 mt-4">
            <Button variant="outline" size="sm">
              <Share2 className="mr-2 h-4 w-4" />
              Share
            </Button>
            <Button variant="outline" size="sm">
              <BookmarkPlus className="mr-2 h-4 w-4" />
              Save
            </Button>
          </div>
        </header>

        {/* Featured Image */}
        {featuredImage && (
          <figure className="mb-8">
            <img
              src={featuredImage}
              alt={title}
              className="w-full rounded-lg shadow-elevation-2"
              loading="lazy"
            />
          </figure>
        )}

        {/* Article Content */}
        <div className="prose prose-lg max-w-none mb-12">
          <div dangerouslySetInnerHTML={{ __html: content }} />
        </div>

        {/* Tags */}
        <section className="mb-12" aria-labelledby="tags-heading">
          <h3 id="tags-heading" className="text-lg font-semibold mb-4">Tags</h3>
          <div className="flex flex-wrap gap-2">
            {tags.map(tag => (
              <Link key={tag} to={`/blog/tag/${tag.toLowerCase().replace(/\s+/g, '-')}`}>
                <Badge variant="outline" className="hover:bg-accent transition-colors">
                  {tag}
                </Badge>
              </Link>
            ))}
          </div>
        </section>

        {/* Author Bio */}
        <Card className="mb-12">
          <CardHeader>
            <h3 className="text-xl font-semibold">About the Author</h3>
          </CardHeader>
          <CardContent>
            <div className="flex items-start gap-4">
              {author.avatar && (
                <img
                  src={author.avatar}
                  alt={author.name}
                  className="w-16 h-16 rounded-full"
                  loading="lazy"
                />
              )}
              <div>
                <h4 className="font-semibold text-lg">{author.name}</h4>
                <p className="text-muted-foreground mb-2">{author.role}</p>
                <p className="text-sm">
                  {author.name} is a fitness industry expert with years of experience helping gym owners 
                  optimize their operations and grow their businesses.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Related Posts */}
        {relatedPosts.length > 0 && (
          <section aria-labelledby="related-posts-heading">
            <h3 id="related-posts-heading" className="text-2xl font-bold mb-6">Related Articles</h3>
            <div className="grid md:grid-cols-2 gap-6">
              {relatedPosts.map(post => (
                <Card key={post.slug} className="gym-card">
                  <CardContent className="p-0">
                    <Link to={`/blog/${post.slug}`}>
                      {post.featuredImage && (
                        <img
                          src={post.featuredImage}
                          alt={post.title}
                          className="w-full h-48 object-cover rounded-t-lg"
                          loading="lazy"
                        />
                      )}
                      <div className="p-6">
                        <h4 className="font-semibold text-lg mb-2 hover:text-primary transition-colors">
                          {post.title}
                        </h4>
                        <p className="text-muted-foreground text-sm">
                          {post.excerpt}
                        </p>
                      </div>
                    </Link>
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>
        )}
      </article>
    </>
  );
}