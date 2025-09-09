import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { PlusCircle, Edit, Trash2, Eye, Search, FileText, Calendar, Tag } from 'lucide-react';
import { SEOHead } from '@/components/seo/SEOHead';

interface BlogPost {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  content: string;
  author: {
    name: string;
    role: string;
  };
  publishedDate: string;
  status: 'draft' | 'published' | 'scheduled';
  readTime: number;
  category: string;
  tags: string[];
  featuredImage?: string;
  seoTitle?: string;
  seoDescription?: string;
  seoKeywords?: string;
}

const mockPosts: BlogPost[] = [
  {
    id: '1',
    slug: '10-ways-increase-member-retention',
    title: '10 Proven Ways to Increase Member Retention in Your Fitness Business',
    excerpt: 'Discover actionable strategies that successful gym owners use to keep members engaged and reduce churn rates.',
    content: 'Full blog post content would go here...',
    author: {
      name: 'Sarah Mitchell',
      role: 'Fitness Business Consultant'
    },
    publishedDate: '2024-01-15',
    status: 'published',
    readTime: 8,
    category: 'Member Retention',
    tags: ['retention', 'member engagement', 'business growth', 'customer success'],
    featuredImage: '/assets/member-retention.jpg',
    seoTitle: '10 Proven Member Retention Strategies for Fitness Businesses',
    seoDescription: 'Learn actionable member retention strategies that reduce churn rates and boost gym profitability. Expert tips from successful fitness business owners.',
    seoKeywords: 'member retention, gym churn rate, fitness business strategies, member engagement'
  }
];

export function BlogManager() {
  const [posts, setPosts] = useState<BlogPost[]>(mockPosts);
  const [selectedPost, setSelectedPost] = useState<BlogPost | null>(null);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const filteredPosts = posts.filter(post => {
    const matchesSearch = post.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         post.content.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || post.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleCreatePost = () => {
    const newPost: BlogPost = {
      id: Date.now().toString(),
      slug: '',
      title: 'New Blog Post',
      excerpt: '',
      content: '',
      author: {
        name: 'Admin User',
        role: 'Content Manager'
      },
      publishedDate: new Date().toISOString().split('T')[0],
      status: 'draft',
      readTime: 5,
      category: 'General',
      tags: [],
      seoTitle: '',
      seoDescription: '',
      seoKeywords: ''
    };
    setPosts([newPost, ...posts]);
    setSelectedPost(newPost);
    setIsCreateDialogOpen(false);
  };

  const handleDeletePost = (postId: string) => {
    setPosts(posts.filter(p => p.id !== postId));
    if (selectedPost?.id === postId) {
      setSelectedPost(null);
    }
  };

  const handleUpdatePost = (updatedPost: BlogPost) => {
    setPosts(posts.map(p => p.id === updatedPost.id ? updatedPost : p));
    setSelectedPost(updatedPost);
  };

  return (
    <>
      <SEOHead
        title="Blog Management - Admin Dashboard"
        description="Manage blog posts, SEO settings, and content publishing for your fitness business website."
        keywords="blog management, content management, SEO, fitness blog admin"
      />
      
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Blog Management</h1>
            <p className="text-muted-foreground">Create and manage blog content for your fitness business.</p>
          </div>
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <PlusCircle className="h-4 w-4" />
                New Post
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create New Blog Post</DialogTitle>
                <DialogDescription>
                  Start creating a new blog post for your fitness business.
                </DialogDescription>
              </DialogHeader>
              <Button onClick={handleCreatePost}>Create Post</Button>
            </DialogContent>
          </Dialog>
        </div>

        <Tabs defaultValue="posts" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="posts">All Posts</TabsTrigger>
            <TabsTrigger value="categories">Categories</TabsTrigger>
            <TabsTrigger value="seo">SEO Settings</TabsTrigger>
          </TabsList>

          <TabsContent value="posts" className="space-y-6">
            {/* Filters */}
            <div className="flex items-center gap-4">
              <div className="flex-1 max-w-sm">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                  <Input
                    placeholder="Search posts..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="published">Published</SelectItem>
                  <SelectItem value="draft">Draft</SelectItem>
                  <SelectItem value="scheduled">Scheduled</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
              {/* Posts List */}
              <div className="space-y-4">
                <h2 className="text-xl font-semibold">Blog Posts ({filteredPosts.length})</h2>
                {filteredPosts.map((post) => (
                  <Card 
                    key={post.id} 
                    className={`cursor-pointer transition-colors ${
                      selectedPost?.id === post.id ? 'ring-2 ring-primary' : ''
                    }`}
                    onClick={() => setSelectedPost(post)}
                  >
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <Badge variant={post.status === 'published' ? 'default' : 'secondary'}>
                          {post.status}
                        </Badge>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              window.open(`/blog/${post.slug}`, '_blank');
                            }}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeletePost(post.id);
                            }}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                      <CardTitle className="text-lg leading-tight">{post.title}</CardTitle>
                      <CardDescription>{post.excerpt}</CardDescription>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {new Date(post.publishedDate).toLocaleDateString()}
                        </div>
                        <div className="flex items-center gap-1">
                          <FileText className="h-3 w-3" />
                          {post.readTime} min read
                        </div>
                        <div className="flex items-center gap-1">
                          <Tag className="h-3 w-3" />
                          {post.category}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {/* Post Editor */}
              <div>
                {selectedPost ? (
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Edit className="h-5 w-5" />
                        Edit Post
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div>
                        <Label htmlFor="title">Title</Label>
                        <Input
                          id="title"
                          value={selectedPost.title}
                          onChange={(e) => handleUpdatePost({
                            ...selectedPost,
                            title: e.target.value
                          })}
                        />
                      </div>
                      
                      <div>
                        <Label htmlFor="slug">Slug</Label>
                        <Input
                          id="slug"
                          value={selectedPost.slug}
                          onChange={(e) => handleUpdatePost({
                            ...selectedPost,
                            slug: e.target.value
                          })}
                        />
                      </div>

                      <div>
                        <Label htmlFor="excerpt">Excerpt</Label>
                        <Textarea
                          id="excerpt"
                          value={selectedPost.excerpt}
                          onChange={(e) => handleUpdatePost({
                            ...selectedPost,
                            excerpt: e.target.value
                          })}
                          rows={3}
                        />
                      </div>

                      <div>
                        <Label htmlFor="content">Content</Label>
                        <Textarea
                          id="content"
                          value={selectedPost.content}
                          onChange={(e) => handleUpdatePost({
                            ...selectedPost,
                            content: e.target.value
                          })}
                          rows={8}
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="category">Category</Label>
                          <Select
                            value={selectedPost.category}
                            onValueChange={(value) => handleUpdatePost({
                              ...selectedPost,
                              category: value
                            })}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="Member Retention">Member Retention</SelectItem>
                              <SelectItem value="Equipment Management">Equipment Management</SelectItem>
                              <SelectItem value="Class Management">Class Management</SelectItem>
                              <SelectItem value="Marketing">Marketing</SelectItem>
                              <SelectItem value="Staff Management">Staff Management</SelectItem>
                              <SelectItem value="Technology">Technology</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        <div>
                          <Label htmlFor="status">Status</Label>
                          <Select
                            value={selectedPost.status}
                            onValueChange={(value: 'draft' | 'published' | 'scheduled') => handleUpdatePost({
                              ...selectedPost,
                              status: value
                            })}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="draft">Draft</SelectItem>
                              <SelectItem value="published">Published</SelectItem>
                              <SelectItem value="scheduled">Scheduled</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      <div>
                        <Label htmlFor="tags">Tags (comma separated)</Label>
                        <Input
                          id="tags"
                          value={selectedPost.tags.join(', ')}
                          onChange={(e) => handleUpdatePost({
                            ...selectedPost,
                            tags: e.target.value.split(',').map(tag => tag.trim()).filter(Boolean)
                          })}
                        />
                      </div>

                      <div className="pt-4 border-t">
                        <h3 className="font-semibold mb-4">SEO Settings</h3>
                        
                        <div className="space-y-4">
                          <div>
                            <Label htmlFor="seoTitle">SEO Title</Label>
                            <Input
                              id="seoTitle"
                              value={selectedPost.seoTitle || ''}
                              onChange={(e) => handleUpdatePost({
                                ...selectedPost,
                                seoTitle: e.target.value
                              })}
                              placeholder="SEO optimized title (60 chars max)"
                            />
                          </div>

                          <div>
                            <Label htmlFor="seoDescription">SEO Description</Label>
                            <Textarea
                              id="seoDescription"
                              value={selectedPost.seoDescription || ''}
                              onChange={(e) => handleUpdatePost({
                                ...selectedPost,
                                seoDescription: e.target.value
                              })}
                              placeholder="SEO meta description (160 chars max)"
                              rows={3}
                            />
                          </div>

                          <div>
                            <Label htmlFor="seoKeywords">SEO Keywords</Label>
                            <Input
                              id="seoKeywords"
                              value={selectedPost.seoKeywords || ''}
                              onChange={(e) => handleUpdatePost({
                                ...selectedPost,
                                seoKeywords: e.target.value
                              })}
                              placeholder="Comma separated keywords"
                            />
                          </div>
                        </div>
                      </div>

                      <div className="flex gap-2 pt-4">
                        <Button onClick={() => handleUpdatePost(selectedPost)}>
                          Save Changes
                        </Button>
                        <Button variant="outline" onClick={() => setSelectedPost(null)}>
                          Cancel
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ) : (
                  <Card>
                    <CardContent className="flex items-center justify-center py-12">
                      <div className="text-center">
                        <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                        <p className="text-muted-foreground">Select a post to edit</p>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="categories">
            <Card>
              <CardHeader>
                <CardTitle>Blog Categories</CardTitle>
                <CardDescription>Manage your blog post categories</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {[
                    'Member Retention',
                    'Equipment Management',
                    'Class Management',
                    'Marketing',
                    'Staff Management',
                    'Technology'
                  ].map((category) => (
                    <div key={category} className="flex items-center justify-between p-3 border rounded-lg">
                      <span className="font-medium">{category}</span>
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary">
                          {posts.filter(p => p.category === category).length} posts
                        </Badge>
                        <Button variant="ghost" size="sm">
                          <Edit className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="seo">
            <Card>
              <CardHeader>
                <CardTitle>Global SEO Settings</CardTitle>
                <CardDescription>Configure SEO settings for your blog</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <Label htmlFor="blogTitle">Blog Title</Label>
                  <Input
                    id="blogTitle"
                    defaultValue="Fitness Business Blog"
                    placeholder="Your blog's main title"
                  />
                </div>

                <div>
                  <Label htmlFor="blogDescription">Blog Description</Label>
                  <Textarea
                    id="blogDescription"
                    defaultValue="Expert insights, best practices, and strategies for gym owners and fitness professionals."
                    placeholder="Default blog description for SEO"
                    rows={3}
                  />
                </div>

                <div>
                  <Label htmlFor="defaultKeywords">Default Keywords</Label>
                  <Input
                    id="defaultKeywords"
                    defaultValue="fitness blog, gym management tips, fitness business advice"
                    placeholder="Default keywords for blog posts"
                  />
                </div>

                <Button>Save SEO Settings</Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </>
  );
}