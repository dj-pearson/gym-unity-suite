-- Create blog_posts table
CREATE TABLE public.blog_posts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  slug TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  excerpt TEXT,
  content TEXT NOT NULL,
  featured_image TEXT,
  read_time INTEGER DEFAULT 5,
  published_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  status TEXT NOT NULL DEFAULT 'draft',
  category_id UUID REFERENCES blog_categories(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create blog_tags table
CREATE TABLE public.blog_tags (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  slug TEXT NOT NULL UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on blog tables
ALTER TABLE public.blog_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.blog_tags ENABLE ROW LEVEL SECURITY;

-- Create policies for blog_posts
CREATE POLICY "Blog posts are publicly readable when published" 
ON public.blog_posts 
FOR SELECT 
USING (status = 'published' AND published_at <= now());

CREATE POLICY "Staff can manage blog posts" 
ON public.blog_posts 
FOR ALL 
USING (EXISTS (
  SELECT 1 FROM profiles p 
  WHERE p.id = auth.uid() 
  AND p.role = ANY(ARRAY['owner'::user_role, 'manager'::user_role, 'staff'::user_role])
))
WITH CHECK (EXISTS (
  SELECT 1 FROM profiles p 
  WHERE p.id = auth.uid() 
  AND p.role = ANY(ARRAY['owner'::user_role, 'manager'::user_role, 'staff'::user_role])
));

-- Create policies for blog_tags  
CREATE POLICY "Blog tags are publicly readable" 
ON public.blog_tags 
FOR SELECT 
USING (true);

CREATE POLICY "Staff can manage blog tags" 
ON public.blog_tags 
FOR ALL 
USING (EXISTS (
  SELECT 1 FROM profiles p 
  WHERE p.id = auth.uid() 
  AND p.role = ANY(ARRAY['owner'::user_role, 'manager'::user_role, 'staff'::user_role])
))
WITH CHECK (EXISTS (
  SELECT 1 FROM profiles p 
  WHERE p.id = auth.uid() 
  AND p.role = ANY(ARRAY['owner'::user_role, 'manager'::user_role, 'staff'::user_role])
));

-- Create trigger for updated_at
CREATE TRIGGER update_blog_posts_updated_at
BEFORE UPDATE ON public.blog_posts
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Insert sample blog posts
INSERT INTO blog_categories (name, slug, description) VALUES
('Fitness Tips', 'fitness-tips', 'Expert advice on fitness and exercise'),
('Nutrition', 'nutrition', 'Nutritional guidance and meal planning'),
('Business', 'business', 'Gym management and business strategies')
ON CONFLICT (slug) DO NOTHING;

INSERT INTO blog_tags (name, slug) VALUES
('Cardio', 'cardio'),
('Strength Training', 'strength-training'),
('Weight Loss', 'weight-loss'),
('Muscle Building', 'muscle-building'),
('Nutrition', 'nutrition'),
('Business Tips', 'business-tips')
ON CONFLICT (slug) DO NOTHING;

INSERT INTO blog_posts (
  slug, title, excerpt, content, category_id, status, published_at, read_time
) VALUES (
  'effective-cardio-workouts',
  'The Ultimate Guide to Effective Cardio Workouts',
  'Discover the most effective cardio exercises to boost your fitness and burn calories efficiently.',
  '<h2>Introduction</h2><p>Cardiovascular exercise is essential for heart health and weight management. In this comprehensive guide, we''ll explore the most effective cardio workouts that will help you achieve your fitness goals.</p><h2>High-Intensity Interval Training (HIIT)</h2><p>HIIT involves short bursts of intense exercise followed by brief recovery periods. This method is incredibly effective for burning calories and improving cardiovascular health.</p><h2>Benefits of Regular Cardio</h2><ul><li>Improves heart health</li><li>Burns calories effectively</li><li>Boosts mood and energy</li><li>Enhances endurance</li></ul>',
  (SELECT id FROM blog_categories WHERE slug = 'fitness-tips' LIMIT 1),
  'published',
  now() - INTERVAL '2 days',
  8
), (
  'nutrition-for-muscle-growth',
  'Nutrition Strategies for Maximum Muscle Growth',
  'Learn how proper nutrition can accelerate your muscle-building journey with these proven strategies.',
  '<h2>The Foundation of Muscle Growth</h2><p>Building muscle requires more than just lifting weights. Proper nutrition plays a crucial role in providing your body with the nutrients it needs to repair and grow muscle tissue.</p><h2>Key Nutrients for Muscle Building</h2><h3>Protein</h3><p>Protein is the building block of muscle. Aim for 1.6-2.2 grams per kilogram of body weight daily.</p><h3>Carbohydrates</h3><p>Carbs fuel your workouts and help with recovery. Include complex carbohydrates in your diet.</p><h3>Healthy Fats</h3><p>Essential for hormone production and overall health.</p>',
  (SELECT id FROM blog_categories WHERE slug = 'nutrition' LIMIT 1),
  'published',
  now() - INTERVAL '1 day',
  6
), (
  'growing-your-gym-business',
  'Proven Strategies for Growing Your Gym Business',
  'Discover actionable strategies to attract new members and increase retention in your fitness facility.',
  '<h2>Understanding Your Market</h2><p>Success in the fitness industry starts with understanding your local market and target demographic.</p><h2>Member Retention Strategies</h2><p>Keeping existing members is more cost-effective than acquiring new ones. Focus on:</p><ul><li>Exceptional customer service</li><li>Diverse class offerings</li><li>Clean and well-maintained facilities</li><li>Community building events</li></ul><h2>Marketing Your Gym</h2><p>Effective marketing combines digital presence with community engagement.</p>',
  (SELECT id FROM blog_categories WHERE slug = 'business' LIMIT 1),
  'published',
  now(),
  10
);

-- Link posts with tags
INSERT INTO blog_post_tags (post_id, tag_id) VALUES
((SELECT id FROM blog_posts WHERE slug = 'effective-cardio-workouts'), (SELECT id FROM blog_tags WHERE slug = 'cardio')),
((SELECT id FROM blog_posts WHERE slug = 'effective-cardio-workouts'), (SELECT id FROM blog_tags WHERE slug = 'weight-loss')),
((SELECT id FROM blog_posts WHERE slug = 'nutrition-for-muscle-growth'), (SELECT id FROM blog_tags WHERE slug = 'nutrition')),
((SELECT id FROM blog_posts WHERE slug = 'nutrition-for-muscle-growth'), (SELECT id FROM blog_tags WHERE slug = 'muscle-building')),
((SELECT id FROM blog_posts WHERE slug = 'growing-your-gym-business'), (SELECT id FROM blog_tags WHERE slug = 'business-tips'));