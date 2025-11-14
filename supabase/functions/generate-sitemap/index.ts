import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

serve(async (req) => {
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  );

  // Fetch all blog posts
  const { data: posts } = await supabase
    .from('blog_posts')
    .select('slug, updated_at, priority')
    .eq('published', true)
    .order('updated_at', { ascending: false });

  // Fetch all case studies
  const { data: caseStudies } = await supabase
    .from('case_studies')
    .select('slug, updated_at')
    .eq('published', true);

  // Fetch all pages from CMS
  const { data: pages } = await supabase
    .from('pages')
    .select('slug, updated_at, priority')
    .eq('published', true);

  // Static pages
  const staticPages = [
    { url: '/', priority: 1.0, changefreq: 'weekly' },
    { url: '/pricing', priority: 0.9, changefreq: 'monthly' },
    { url: '/features', priority: 0.8, changefreq: 'weekly' },
    { url: '/solutions', priority: 0.8, changefreq: 'weekly' },
    { url: '/compare', priority: 0.7, changefreq: 'monthly' },
    { url: '/resources', priority: 0.7, changefreq: 'daily' },
    { url: '/demo', priority: 0.9, changefreq: 'monthly' },
    { url: '/contact', priority: 0.6, changefreq: 'yearly' },
  ];

  // Generate XML sitemap
  const baseUrl = 'https://gymunitysuite.com';

  let sitemap = '<?xml version="1.0" encoding="UTF-8"?>\n';
  sitemap += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n';

  // Add static pages
  staticPages.forEach(page => {
    sitemap += `  <url>\n`;
    sitemap += `    <loc>${baseUrl}${page.url}</loc>\n`;
    sitemap += `    <changefreq>${page.changefreq}</changefreq>\n`;
    sitemap += `    <priority>${page.priority}</priority>\n`;
    sitemap += `  </url>\n`;
  });

  // Add blog posts
  posts?.forEach(post => {
    sitemap += `  <url>\n`;
    sitemap += `    <loc>${baseUrl}/blog/${post.slug}</loc>\n`;
    sitemap += `    <lastmod>${post.updated_at}</lastmod>\n`;
    sitemap += `    <changefreq>monthly</changefreq>\n`;
    sitemap += `    <priority>${post.priority || 0.6}</priority>\n`;
    sitemap += `  </url>\n`;
  });

  // Add case studies
  caseStudies?.forEach(study => {
    sitemap += `  <url>\n`;
    sitemap += `    <loc>${baseUrl}/resources/case-studies/${study.slug}</loc>\n`;
    sitemap += `    <lastmod>${study.updated_at}</lastmod>\n`;
    sitemap += `    <changefreq>monthly</changefreq>\n`;
    sitemap += `    <priority>0.7</priority>\n`;
    sitemap += `  </url>\n`;
  });

  // Add dynamic pages
  pages?.forEach(page => {
    sitemap += `  <url>\n`;
    sitemap += `    <loc>${baseUrl}/${page.slug}</loc>\n`;
    sitemap += `    <lastmod>${page.updated_at}</lastmod>\n`;
    sitemap += `    <changefreq>monthly</changefreq>\n`;
    sitemap += `    <priority>${page.priority || 0.5}</priority>\n`;
    sitemap += `  </url>\n`;
  });

  sitemap += '</urlset>';

  return new Response(sitemap, {
    headers: {
      'Content-Type': 'application/xml',
      'Cache-Control': 'public, max-age=3600'
    }
  });
});
