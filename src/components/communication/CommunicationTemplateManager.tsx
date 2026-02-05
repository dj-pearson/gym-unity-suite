import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { 
  FileText, 
  Plus, 
  Edit, 
  Trash2, 
  Copy, 
  MessageSquare, 
  Mail, 
  Phone,
  Eye,
  Tag
} from 'lucide-react';

interface CommunicationTemplate {
  id: string;
  organization_id: string;
  name: string;
  template_type: 'sms' | 'email';
  category: string;
  subject?: string;
  content: string;
  variables: string[];
  is_active: boolean;
  created_by: string;
  created_at: string;
  updated_at: string;
}

const TEMPLATE_CATEGORIES = [
  { value: 'general', label: 'General' },
  { value: 'welcome', label: 'Welcome' },
  { value: 'reminder', label: 'Reminder' },
  { value: 'promotion', label: 'Promotion' },
  { value: 'notification', label: 'Notification' },
  { value: 'billing', label: 'Billing' },
  { value: 'class', label: 'Class Related' },
  { value: 'membership', label: 'Membership' },
  { value: 'support', label: 'Support' }
];

const AVAILABLE_VARIABLES = [
  '{{first_name}}',
  '{{last_name}}',
  '{{full_name}}',
  '{{email}}',
  '{{phone}}',
  '{{membership_type}}',
  '{{gym_name}}',
  '{{class_name}}',
  '{{class_date}}',
  '{{class_time}}',
  '{{instructor_name}}',
  '{{amount}}',
  '{{due_date}}'
];

const SAMPLE_TEMPLATES = {
  email: {
    welcome: {
      subject: 'Welcome to {{gym_name}}!',
      content: `Hi {{first_name}},

Welcome to {{gym_name}}! We're excited to have you as part of our fitness community.

Your membership details:
- Membership Type: {{membership_type}}
- Start Date: {{start_date}}

If you have any questions, don't hesitate to reach out to our team.

Best regards,
The {{gym_name}} Team`
    },
    reminder: {
      subject: 'Class Reminder: {{class_name}}',
      content: `Hi {{first_name}},

This is a friendly reminder about your upcoming class:

Class: {{class_name}}
Date: {{class_date}}
Time: {{class_time}}
Instructor: {{instructor_name}}

We look forward to seeing you there!

Best regards,
{{gym_name}}`
    }
  },
  sms: {
    welcome: {
      content: `Hi {{first_name}}! Welcome to {{gym_name}}. We're excited to have you join our fitness community. Your {{membership_type}} membership is now active!`
    },
    reminder: {
      content: `Hi {{first_name}}, reminder: {{class_name}} class tomorrow at {{class_time}} with {{instructor_name}}. See you there! - {{gym_name}}`
    }
  }
};

export default function CommunicationTemplateManager() {
  const { profile } = useAuth();
  const [templates, setTemplates] = useState<CommunicationTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<CommunicationTemplate | null>(null);
  const [previewTemplate, setPreviewTemplate] = useState<CommunicationTemplate | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedType, setSelectedType] = useState<string>('all');

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    template_type: 'email' as 'sms' | 'email',
    category: 'general',
    subject: '',
    content: '',
    is_active: true
  });

  useEffect(() => {
    fetchTemplates();
  }, [profile?.organization_id]);

  const fetchTemplates = async () => {
    if (!profile?.organization_id) return;

    try {
      const { data, error } = await supabase
        .from('communication_templates')
        .select('*')
        .eq('organization_id', profile.organization_id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setTemplates(data || []);
    } catch (error: any) {
      console.error('Error fetching templates:', error);
      toast.error('Failed to load communication templates');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      // Extract variables from content
      const variables = extractVariables(formData.content + (formData.subject || ''));

      const templateData = {
        ...formData,
        variables,
        organization_id: profile?.organization_id,
        created_by: profile?.id,
      };

      if (editingTemplate) {
        const { error } = await supabase
          .from('communication_templates')
          .update(templateData)
          .eq('id', editingTemplate.id);

        if (error) throw error;
        toast.success('Template updated successfully');
      } else {
        const { error } = await supabase
          .from('communication_templates')
          .insert([templateData]);

        if (error) throw error;
        toast.success('Template created successfully');
      }

      resetForm();
      setShowAddDialog(false);
      fetchTemplates();
    } catch (error: any) {
      console.error('Error saving template:', error);
      toast.error('Failed to save template');
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const { error } = await supabase
        .from('communication_templates')
        .delete()
        .eq('id', id);

      if (error) throw error;
      toast.success('Template deleted successfully');
      fetchTemplates();
    } catch (error: any) {
      console.error('Error deleting template:', error);
      toast.error('Failed to delete template');
    }
  };

  const handleEdit = (template: CommunicationTemplate) => {
    setEditingTemplate(template);
    setFormData({
      name: template.name,
      template_type: template.template_type,
      category: template.category,
      subject: template.subject || '',
      content: template.content,
      is_active: template.is_active
    });
    setShowAddDialog(true);
  };

  const handleDuplicate = async (template: CommunicationTemplate) => {
    const duplicateData = {
      name: `${template.name} (Copy)`,
      template_type: template.template_type,
      category: template.category,
      subject: template.subject,
      content: template.content,
      variables: template.variables,
      organization_id: profile?.organization_id,
      created_by: profile?.id,
      is_active: false
    };

    try {
      const { error } = await supabase
        .from('communication_templates')
        .insert([duplicateData]);

      if (error) throw error;
      toast.success('Template duplicated successfully');
      fetchTemplates();
    } catch (error: any) {
      console.error('Error duplicating template:', error);
      toast.error('Failed to duplicate template');
    }
  };

  const extractVariables = (text: string): string[] => {
    const variableRegex = /\{\{([^}]+)\}\}/g;
    const variables: string[] = [];
    let match;

    while ((match = variableRegex.exec(text)) !== null) {
      const variable = `{{${match[1]}}}`;
      if (!variables.includes(variable)) {
        variables.push(variable);
      }
    }

    return variables;
  };

  const loadSampleTemplate = (category: string) => {
    const sample = SAMPLE_TEMPLATES[formData.template_type]?.[category as keyof typeof SAMPLE_TEMPLATES[typeof formData.template_type]];
    if (sample) {
      setFormData(prev => ({
        ...prev,
        subject: ('subject' in sample ? sample.subject : prev.subject) || prev.subject,
        content: sample.content
      }));
    }
  };

  const insertVariable = (variable: string) => {
    setFormData(prev => ({
      ...prev,
      content: prev.content + variable
    }));
  };

  const resetForm = () => {
    setFormData({
      name: '',
      template_type: 'email',
      category: 'general',
      subject: '',
      content: '',
      is_active: true
    });
    setEditingTemplate(null);
  };

  const filteredTemplates = templates.filter(template => {
    const categoryMatch = selectedCategory === 'all' || template.category === selectedCategory;
    const typeMatch = selectedType === 'all' || template.template_type === selectedType;
    return categoryMatch && typeMatch;
  });

  const renderPreviewDialog = () => (
    <Dialog open={!!previewTemplate} onOpenChange={() => setPreviewTemplate(null)}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Template Preview</DialogTitle>
        </DialogHeader>
        {previewTemplate && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div><strong>Name:</strong> {previewTemplate.name}</div>
              <div><strong>Type:</strong> {previewTemplate.template_type.toUpperCase()}</div>
              <div><strong>Category:</strong> {previewTemplate.category}</div>
              <div><strong>Status:</strong> {previewTemplate.is_active ? 'Active' : 'Inactive'}</div>
            </div>
            
            {previewTemplate.subject && (
              <div>
                <Label className="font-medium">Subject:</Label>
                <div className="mt-1 p-2 bg-muted rounded border">
                  {previewTemplate.subject}
                </div>
              </div>
            )}
            
            <div>
              <Label className="font-medium">Content:</Label>
              <div className="mt-1 p-3 bg-muted rounded border whitespace-pre-wrap">
                {previewTemplate.content}
              </div>
            </div>
            
            {previewTemplate.variables.length > 0 && (
              <div>
                <Label className="font-medium">Variables Used:</Label>
                <div className="flex flex-wrap gap-1 mt-2">
                  {previewTemplate.variables.map(variable => (
                    <Badge key={variable} variant="secondary" className="text-xs">
                      {variable}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );

  if (loading) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-6">
              <div className="h-4 bg-muted rounded w-48 mb-2"></div>
              <div className="h-3 bg-muted rounded w-full"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Communication Templates</h2>
          <p className="text-muted-foreground">Create and manage SMS and email templates</p>
        </div>
        
        <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
          <DialogTrigger asChild>
            <Button onClick={resetForm}>
              <Plus className="mr-2 h-4 w-4" />
              Create Template
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingTemplate ? 'Edit Template' : 'Create Communication Template'}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Template Name</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({...prev, name: e.target.value}))}
                    placeholder="e.g., Welcome Email"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="template_type">Type</Label>
                  <Select 
                    value={formData.template_type} 
                    onValueChange={(value: 'sms' | 'email') => setFormData(prev => ({...prev, template_type: value}))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="email">Email</SelectItem>
                      <SelectItem value="sms">SMS</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="category">Category</Label>
                  <Select 
                    value={formData.category} 
                    onValueChange={(value) => setFormData(prev => ({...prev, category: value}))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {TEMPLATE_CATEGORIES.map(cat => (
                        <SelectItem key={cat.value} value={cat.value}>
                          {cat.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="flex gap-2">
                <Button 
                  type="button" 
                  size="sm" 
                  variant="outline"
                  onClick={() => loadSampleTemplate('welcome')}
                >
                  Load Welcome Sample
                </Button>
                <Button 
                  type="button" 
                  size="sm" 
                  variant="outline"
                  onClick={() => loadSampleTemplate('reminder')}
                >
                  Load Reminder Sample
                </Button>
              </div>

              {formData.template_type === 'email' && (
                <div className="space-y-2">
                  <Label htmlFor="subject">Subject Line</Label>
                  <Input
                    id="subject"
                    value={formData.subject}
                    onChange={(e) => setFormData(prev => ({...prev, subject: e.target.value}))}
                    placeholder="e.g., Welcome to {{gym_name}}!"
                  />
                </div>
              )}

              <div className="grid grid-cols-3 gap-4">
                <div className="col-span-2 space-y-2">
                  <Label htmlFor="content">
                    Content {formData.template_type === 'sms' && '(160 chars recommended)'}
                  </Label>
                  <Textarea
                    id="content"
                    value={formData.content}
                    onChange={(e) => setFormData(prev => ({...prev, content: e.target.value}))}
                    rows={12}
                    placeholder="Enter your template content here..."
                    required
                  />
                  {formData.template_type === 'sms' && (
                    <div className="text-xs text-muted-foreground">
                      Character count: {formData.content.length}
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <Label>Available Variables</Label>
                  <div className="space-y-1 max-h-64 overflow-y-auto">
                    {AVAILABLE_VARIABLES.map(variable => (
                      <Button
                        key={variable}
                        type="button"
                        size="sm"
                        variant="ghost"
                        className="w-full justify-start text-xs p-1 h-auto"
                        onClick={() => insertVariable(variable)}
                      >
                        {variable}
                      </Button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="is_active"
                  checked={formData.is_active}
                  onCheckedChange={(checked) => setFormData(prev => ({...prev, is_active: checked}))}
                />
                <Label htmlFor="is_active">Active</Label>
              </div>

              <div className="flex justify-end space-x-2">
                <Button type="button" variant="outline" onClick={() => {
                  setShowAddDialog(false);
                  resetForm();
                }}>
                  Cancel
                </Button>
                <Button type="submit">
                  {editingTemplate ? 'Update' : 'Create'} Template
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-4">
        <Select value={selectedType} onValueChange={setSelectedType}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="All Types" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            <SelectItem value="email">Email</SelectItem>
            <SelectItem value="sms">SMS</SelectItem>
          </SelectContent>
        </Select>

        <Select value={selectedCategory} onValueChange={setSelectedCategory}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="All Categories" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            {TEMPLATE_CATEGORIES.map(cat => (
              <SelectItem key={cat.value} value={cat.value}>
                {cat.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {filteredTemplates.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <FileText className="mx-auto h-12 w-12 text-muted-foreground opacity-50 mb-4" />
            <h3 className="text-lg font-medium text-foreground mb-2">No Templates Found</h3>
            <p className="text-muted-foreground mb-4">
              Create your first communication template to get started
            </p>
            <Button onClick={() => setShowAddDialog(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Create Template
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
          {filteredTemplates.map((template) => (
            <Card key={template.id} className="gym-card">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    {template.template_type === 'sms' ? <Phone className="w-4 h-4" /> : <Mail className="w-4 h-4" />}
                    <div>
                      <CardTitle className="text-base">{template.name}</CardTitle>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant="outline" className="text-xs">
                          {template.template_type.toUpperCase()}
                        </Badge>
                        <Badge variant="secondary" className="text-xs">
                          {TEMPLATE_CATEGORIES.find(c => c.value === template.category)?.label}
                        </Badge>
                      </div>
                    </div>
                  </div>
                  <Badge 
                    variant={template.is_active ? "default" : "secondary"}
                    className="text-xs"
                  >
                    {template.is_active ? 'Active' : 'Inactive'}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="text-sm text-muted-foreground line-clamp-3">
                  {template.content}
                </div>

                {template.variables.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {template.variables.slice(0, 3).map(variable => (
                      <Badge key={variable} variant="outline" className="text-xs">
                        {variable}
                      </Badge>
                    ))}
                    {template.variables.length > 3 && (
                      <Badge variant="outline" className="text-xs">
                        +{template.variables.length - 3} more
                      </Badge>
                    )}
                  </div>
                )}

                <div className="flex justify-between items-center pt-2">
                  <div className="flex gap-1">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setPreviewTemplate(template)}
                      className="h-8 w-8 p-0"
                    >
                      <Eye className="w-3 h-3" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleEdit(template)}
                      className="h-8 w-8 p-0"
                    >
                      <Edit className="w-3 h-3" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleDuplicate(template)}
                      className="h-8 w-8 p-0"
                    >
                      <Copy className="w-3 h-3" />
                    </Button>
                  </div>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleDelete(template.id)}
                    className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                  >
                    <Trash2 className="w-3 h-3" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {renderPreviewDialog()}
    </div>
  );
}