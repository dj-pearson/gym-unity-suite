-- Create blog tables for public-facing content with RLS and policies

-- Function to auto-update updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Categories
CREATE TABLE IF NOT EXISTS public.blog_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TRIGGER trg_blog_categories_updated
BEFORE UPDATE ON public.blog_categories
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Tags
CREATE TABLE IF NOT EXISTS public.blog_tags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TRIGGER trg_blog_tags_updated
BEFORE UPDATE ON public.blog_tags
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Posts
CREATE TABLE IF NOT EXISTS public.blog_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  excerpt TEXT,
  content TEXT NOT NULL,
  featured_image TEXT,
  category_id UUID REFERENCES public.blog_categories(id) ON DELETE SET NULL,
  read_time INTEGER,
  status TEXT NOT NULL DEFAULT 'draft', -- 'draft' | 'published' | 'archived'
  published_at TIMESTAMPTZ,
  created_by UUID, -- auth user id (optional)
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_blog_posts_status_published_at ON public.blog_posts(status, published_at DESC);

CREATE TRIGGER trg_blog_posts_updated
BEFORE UPDATE ON public.blog_posts
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Post <-> Tags (many-to-many)
CREATE TABLE IF NOT EXISTS public.blog_post_tags (
  post_id UUID NOT NULL REFERENCES public.blog_posts(id) ON DELETE CASCADE,
  tag_id UUID NOT NULL REFERENCES public.blog_tags(id) ON DELETE CASCADE,
  PRIMARY KEY (post_id, tag_id)
);

-- Enable RLS
ALTER TABLE public.blog_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.blog_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.blog_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.blog_post_tags ENABLE ROW LEVEL SECURITY;

-- Policies: Public can read published posts; staff can manage
DO $$ BEGIN
  -- blog_posts
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'blog_posts' AND policyname = 'Public can view published posts'
  ) THEN
    CREATE POLICY "Public can view published posts" ON public.blog_posts
      FOR SELECT
      USING (status = 'published' AND published_at IS NOT NULL AND published_at <= now());
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'blog_posts' AND policyname = 'Staff can manage blog posts'
  ) THEN
    CREATE POLICY "Staff can manage blog posts" ON public.blog_posts
      FOR ALL
      USING (EXISTS (
        SELECT 1 FROM public.profiles p
        WHERE p.id = auth.uid() AND p.role IN ('owner','manager','staff')
      ))
      WITH CHECK (EXISTS (
        SELECT 1 FROM public.profiles p
        WHERE p.id = auth.uid() AND p.role IN ('owner','manager','staff')
      ));
  END IF;

  -- blog_categories
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'blog_categories' AND policyname = 'Categories are publicly readable'
  ) THEN
    CREATE POLICY "Categories are publicly readable" ON public.blog_categories FOR SELECT USING (true);
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'blog_categories' AND policyname = 'Staff can manage categories'
  ) THEN
    CREATE POLICY "Staff can manage categories" ON public.blog_categories FOR ALL
    USING (EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role IN ('owner','manager','staff')))
    WITH CHECK (EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role IN ('owner','manager','staff')));
  END IF;

  -- blog_tags
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'blog_tags' AND policyname = 'Tags are publicly readable'
  ) THEN
    CREATE POLICY "Tags are publicly readable" ON public.blog_tags FOR SELECT USING (true);
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'blog_tags' AND policyname = 'Staff can manage tags'
  ) THEN
    CREATE POLICY "Staff can manage tags" ON public.blog_tags FOR ALL
    USING (EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role IN ('owner','manager','staff')))
    WITH CHECK (EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role IN ('owner','manager','staff')));
  END IF;

  -- blog_post_tags
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'blog_post_tags' AND policyname = 'Post tags are publicly readable'
  ) THEN
    CREATE POLICY "Post tags are publicly readable" ON public.blog_post_tags FOR SELECT USING (true);
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'blog_post_tags' AND policyname = 'Staff can manage post tags'
  ) THEN
    CREATE POLICY "Staff can manage post tags" ON public.blog_post_tags FOR ALL
    USING (EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role IN ('owner','manager','staff')))
    WITH CHECK (EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role IN ('owner','manager','staff')));
  END IF;
END $$;

-- Seed initial categories/tags and two published posts (optional for initial content). If you prefer no seed, you can remove below.
INSERT INTO public.blog_categories (name, slug)
VALUES
 ('Member Retention','member-retention'),
 ('Equipment Management','equipment-management'),
 ('Class Management','class-management'),
 ('Marketing','marketing'),
 ('Staff Management','staff-management'),
 ('Technology','technology')
ON CONFLICT (slug) DO NOTHING;

INSERT INTO public.blog_tags (name, slug)
VALUES
 ('retention','retention'),
 ('member engagement','member-engagement'),
 ('business growth','business-growth'),
 ('customer success','customer-success'),
 ('equipment','equipment'),
 ('maintenance','maintenance'),
 ('safety','safety'),
 ('operations','operations'),
 ('marketing','marketing'),
 ('lead generation','lead-generation'),
 ('social media','social-media'),
 ('growth','growth')
ON CONFLICT (slug) DO NOTHING;

-- Insert posts if not existing
WITH cat_equipment AS (
  SELECT id FROM public.blog_categories WHERE slug = 'equipment-management'
), cat_marketing AS (
  SELECT id FROM public.blog_categories WHERE slug = 'marketing'
)
INSERT INTO public.blog_posts (slug, title, excerpt, content, featured_image, category_id, read_time, status, published_at)
SELECT
  'equipment-maintenance-guide',
  'The Ultimate Equipment Maintenance Guide for Gym Owners',
  'Keep your equipment running smoothly and extend its lifespan with this comprehensive maintenance checklist.',
  '<p>Proper equipment maintenance is crucial for member safety, satisfaction, and your bottom line...</p>',
  '/assets/equipment-maintenance.jpg',
  (SELECT id FROM cat_equipment),
  12,
  'published',
  now() - interval '120 days'
WHERE NOT EXISTS (SELECT 1 FROM public.blog_posts WHERE slug = 'equipment-maintenance-guide');

INSERT INTO public.blog_posts (slug, title, excerpt, content, featured_image, category_id, read_time, status, published_at)
SELECT
  'gym-marketing-strategies-2024',
  'Top Gym Marketing Strategies That Actually Work in 2024',
  'Modern marketing tactics to attract new members and build a strong fitness community.',
  '<p>The fitness marketing landscape has evolved dramatically...</p>',
  '/assets/gym-marketing.jpg',
  (SELECT id FROM cat_marketing),
  10,
  'published',
  now() - interval '110 days'
WHERE NOT EXISTS (SELECT 1 FROM public.blog_posts WHERE slug = 'gym-marketing-strategies-2024');

-- Attach tags to posts
WITH p1 AS (SELECT id FROM public.blog_posts WHERE slug = 'equipment-maintenance-guide'),
     p2 AS (SELECT id FROM public.blog_posts WHERE slug = 'gym-marketing-strategies-2024'),
     t AS (SELECT id, slug FROM public.blog_tags)
INSERT INTO public.blog_post_tags (post_id, tag_id)
SELECT (SELECT id FROM p1), (SELECT id FROM t WHERE slug = 'equipment') WHERE NOT EXISTS (
  SELECT 1 FROM public.blog_post_tags WHERE post_id = (SELECT id FROM p1) AND tag_id = (SELECT id FROM t WHERE slug = 'equipment')
);

INSERT INTO public.blog_post_tags (post_id, tag_id)
SELECT (SELECT id FROM p1), (SELECT id FROM t WHERE slug = 'maintenance') WHERE NOT EXISTS (
  SELECT 1 FROM public.blog_post_tags WHERE post_id = (SELECT id FROM p1) AND tag_id = (SELECT id FROM t WHERE slug = 'maintenance')
);

INSERT INTO public.blog_post_tags (post_id, tag_id)
SELECT (SELECT id FROM p2), (SELECT id FROM t WHERE slug = 'marketing') WHERE NOT EXISTS (
  SELECT 1 FROM public.blog_post_tags WHERE post_id = (SELECT id FROM p2) AND tag_id = (SELECT id FROM t WHERE slug = 'marketing')
);

INSERT INTO public.blog_post_tags (post_id, tag_id)
SELECT (SELECT id FROM p2), (SELECT id FROM t WHERE slug = 'social-media') WHERE NOT EXISTS (
  SELECT 1 FROM public.blog_post_tags WHERE post_id = (SELECT id FROM p2) AND tag_id = (SELECT id FROM t WHERE slug = 'social-media')
);
