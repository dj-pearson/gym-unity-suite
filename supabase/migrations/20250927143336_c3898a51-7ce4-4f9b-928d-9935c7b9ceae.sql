-- First, check if blog_posts table exists and add missing SEO columns if needed
DO $$
BEGIN
  -- Add meta_title column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'blog_posts' AND column_name = 'meta_title'
  ) THEN
    ALTER TABLE blog_posts ADD COLUMN meta_title text;
  END IF;

  -- Add meta_description column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'blog_posts' AND column_name = 'meta_description'
  ) THEN
    ALTER TABLE blog_posts ADD COLUMN meta_description text;
  END IF;

  -- Add meta_keywords column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'blog_posts' AND column_name = 'meta_keywords'
  ) THEN
    ALTER TABLE blog_posts ADD COLUMN meta_keywords text;
  END IF;
END $$;

-- Now insert SEO-rich blog articles for Rep Club

-- First, let's ensure we have blog categories
INSERT INTO blog_categories (name, slug, description) VALUES
  ('Gym Management', 'gym-management', 'Best practices for running a successful fitness facility'),
  ('Member Retention', 'member-retention', 'Strategies to keep members engaged and reduce churn'),
  ('Equipment & Maintenance', 'equipment-maintenance', 'Equipment care, safety, and facility management'),
  ('Staff Training', 'staff-training', 'Training and development for gym staff'),
  ('Marketing & Growth', 'marketing-growth', 'Marketing strategies and business growth tips'),
  ('Technology & Innovation', 'technology-innovation', 'Latest tech trends in fitness industry')
ON CONFLICT (slug) DO NOTHING;

-- Insert high-quality, SEO-optimized blog posts
INSERT INTO blog_posts (
  title, 
  slug, 
  excerpt, 
  content, 
  featured_image,
  status, 
  published_at, 
  read_time,
  meta_title,
  meta_description,
  meta_keywords,
  category_id
) VALUES 
(
  'The Complete Guide to Gym Management Software in 2024',
  'complete-guide-gym-management-software-2024',
  'Discover how modern gym management software can revolutionize your fitness business operations, boost member satisfaction, and increase revenue by up to 30%.',
  '<h2>Why Gym Management Software is Essential for Modern Fitness Businesses</h2>
<p>Running a successful gym in 2024 requires more than just great equipment and trainers. With competition fierce and member expectations higher than ever, gym management software has become the backbone of profitable fitness businesses.</p>

<h2>Key Features Every Gym Management System Should Have</h2>
<h3>Member Management & CRM</h3>
<p>A robust member management system tracks member information, visit history, and engagement patterns. This data helps you identify at-risk members and create targeted retention campaigns.</p>

<h3>Billing & Payment Processing</h3>
<p>Automated billing reduces administrative overhead and ensures consistent cash flow. Look for systems that support multiple payment methods and handle failed payments gracefully.</p>

<h3>Class Scheduling & Booking</h3>
<p>Online class booking increases member satisfaction and reduces front desk workload. Members can book classes 24/7, and you can track capacity and popularity.</p>

<h3>Staff Management</h3>
<p>Track staff schedules, certifications, and performance metrics. Good staff management features help reduce turnover and ensure proper coverage.</p>

<h2>ROI: How Management Software Pays for Itself</h2>
<p>Studies show that gyms using comprehensive management software see:</p>
<ul>
<li>25-30% reduction in member churn</li>
<li>40% decrease in administrative tasks</li>
<li>20% increase in personal training sales</li>
<li>15% improvement in overall member satisfaction</li>
</ul>

<h2>Implementation Best Practices</h2>
<p>Successfully implementing gym management software requires careful planning. Start with staff training, migrate data gradually, and maintain clear communication with members throughout the transition.</p>

<h2>Choosing the Right Platform</h2>
<p>Consider factors like scalability, integration capabilities, customer support, and pricing structure. The best system grows with your business and adapts to changing needs.</p>',
  'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=800&h=400&fit=crop',
  'published',
  '2024-01-15 10:00:00'::timestamp,
  8,
  'Complete Guide to Gym Management Software 2024 | Rep Club',
  'Discover how gym management software revolutionizes fitness businesses. Boost member satisfaction, reduce churn by 30%, and streamline operations. Free guide.',
  'gym management software, fitness business software, gym CRM, member management, gym billing, class scheduling, fitness center technology',
  (SELECT id FROM blog_categories WHERE slug = 'gym-management')
),
(
  '10 Proven Strategies to Reduce Gym Member Churn in 2024',
  '10-proven-strategies-reduce-gym-member-churn-2024',
  'Learn the top 10 evidence-based strategies that successful gyms use to reduce member churn rates by up to 40% and build long-term member loyalty.',
  '<h2>The Hidden Cost of Member Churn</h2>
<p>Member churn is the silent profit killer in the fitness industry. With average churn rates between 30-40% annually, retaining existing members is 5x more cost-effective than acquiring new ones.</p>

<h2>Strategy 1: Implement a Comprehensive Onboarding Program</h2>
<p>New members who complete a structured onboarding program are 80% more likely to stay beyond their first year. Your onboarding should include:</p>
<ul>
<li>Fitness assessment and goal setting</li>
<li>Equipment orientation and safety training</li>
<li>Introduction to staff and trainers</li>
<li>Customized workout plan creation</li>
</ul>

<h2>Strategy 2: Use Predictive Analytics to Identify At-Risk Members</h2>
<p>Track key indicators like visit frequency, class attendance, and engagement metrics. Members who show declining activity patterns are prime candidates for retention interventions.</p>

<h2>Strategy 3: Create a Strong Community Culture</h2>
<p>Members who feel connected to your gym community are 60% less likely to cancel. Foster community through:</p>
<ul>
<li>Group challenges and competitions</li>
<li>Social events and member appreciation days</li>
<li>Member Facebook groups or forums</li>
<li>Partner workout programs</li>
</ul>

<h2>Strategy 4: Personalize the Member Experience</h2>
<p>Use member data to create personalized experiences. Send customized workout suggestions, celebrate fitness milestones, and offer relevant services based on member preferences.</p>

<h2>Strategy 5: Optimize Your Cancellation Process</h2>
<p>Don''t make cancellation difficult, but do make it productive. Use exit interviews to understand reasons for leaving and offer alternatives like membership freezes or plan downgrades.</p>

<h2>Strategy 6: Implement Regular Check-ins</h2>
<p>Proactive communication prevents problems from escalating. Schedule regular check-ins with members, especially during their first 90 days.</p>

<h2>Strategy 7: Offer Flexible Membership Options</h2>
<p>Life circumstances change. Offer membership pause options, flexible contracts, and seasonal memberships to accommodate member needs.</p>

<h2>Strategy 8: Maintain Exceptional Facility Standards</h2>
<p>Clean, well-maintained facilities with modern equipment create positive experiences that keep members coming back.</p>

<h2>Strategy 9: Invest in Staff Training</h2>
<p>Friendly, knowledgeable staff significantly impact member satisfaction. Invest in customer service training and create a culture of member-first thinking.</p>

<h2>Strategy 10: Track and Act on Member Feedback</h2>
<p>Regular surveys and feedback collection help you address issues before they lead to cancellations. Act quickly on legitimate concerns and communicate changes to members.</p>

<h2>Measuring Success</h2>
<p>Track key metrics like monthly churn rate, lifetime value, and Net Promoter Score to measure the effectiveness of your retention strategies.</p>',
  'https://images.unsplash.com/photo-1549476464-37392f717541?w=800&h=400&fit=crop',
  'published',
  '2024-01-20 09:00:00'::timestamp,
  12,
  '10 Proven Strategies to Reduce Gym Member Churn | Rep Club',
  'Reduce gym member churn by 40% with these proven strategies. Expert tips for member retention, onboarding, and building gym community. Free guide.',
  'gym member retention, reduce gym churn, member loyalty, fitness member retention, gym business strategies, member satisfaction',
  (SELECT id FROM blog_categories WHERE slug = 'member-retention')
);

-- Insert blog tags if table exists
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'blog_tags') THEN
    INSERT INTO blog_tags (name, slug) VALUES
      ('Gym Management', 'gym-management'),
      ('Member Retention', 'member-retention'),
      ('Equipment Maintenance', 'equipment-maintenance'),
      ('Staff Training', 'staff-training'),
      ('Digital Marketing', 'digital-marketing'),
      ('Fitness Technology', 'fitness-technology'),
      ('Business Growth', 'business-growth'),
      ('Customer Service', 'customer-service'),
      ('Safety Protocols', 'safety-protocols'),
      ('ROI Optimization', 'roi-optimization')
    ON CONFLICT (slug) DO NOTHING;
  END IF;
END $$;