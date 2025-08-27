import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { User, Mail, Phone, Building, Target, Calendar } from 'lucide-react';
import { toast } from 'sonner';

interface LeadSource {
  id: string;
  name: string;
  category: string;
}

interface FormData {
  email: string;
  first_name: string;
  last_name: string;
  phone: string;
  company_name: string;
  job_title: string;
  annual_income: string;
  interest_level: 'cold' | 'warm' | 'hot';
  estimated_value: string;
  fitness_goals: string[];
  preferred_contact_method: 'email' | 'phone' | 'sms';
  best_contact_time: string;
  notes: string;
  source: string;
  lead_source_id: string;
  utm_source: string;
  utm_medium: string;
  utm_campaign: string;
  utm_content: string;
  utm_term: string;
}

interface EnhancedLeadFormProps {
  onSubmit: (data: any) => void;
  initialData?: Partial<FormData>;
  isSubmitting?: boolean;
}

const fitnessGoalOptions = [
  'Weight Loss',
  'Muscle Building',
  'General Fitness',
  'Strength Training',
  'Cardio Health',
  'Flexibility',
  'Sports Performance',
  'Rehabilitation',
  'Stress Relief',
  'Social/Community',
];

const incomeRanges = [
  'Under $25,000',
  '$25,000 - $50,000',
  '$50,000 - $75,000',
  '$75,000 - $100,000',
  '$100,000 - $150,000',
  'Over $150,000',
  'Prefer not to say',
];

export const EnhancedLeadForm: React.FC<EnhancedLeadFormProps> = ({
  onSubmit,
  initialData,
  isSubmitting = false,
}) => {
  const { profile } = useAuth();
  const [leadSources, setLeadSources] = useState<LeadSource[]>([]);
  const [formData, setFormData] = useState<FormData>({
    email: '',
    first_name: '',
    last_name: '',
    phone: '',
    company_name: '',
    job_title: '',
    annual_income: '',
    interest_level: 'warm',
    estimated_value: '',
    fitness_goals: [],
    preferred_contact_method: 'email',
    best_contact_time: '',
    notes: '',
    source: '',
    lead_source_id: '',
    utm_source: '',
    utm_medium: '',
    utm_campaign: '',
    utm_content: '',
    utm_term: '',
    ...initialData,
  });

  useEffect(() => {
    fetchLeadSources();
    
    // Auto-populate UTM parameters from URL if available
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      setFormData(prev => ({
        ...prev,
        utm_source: urlParams.get('utm_source') || prev.utm_source,
        utm_medium: urlParams.get('utm_medium') || prev.utm_medium,
        utm_campaign: urlParams.get('utm_campaign') || prev.utm_campaign,
        utm_content: urlParams.get('utm_content') || prev.utm_content,
        utm_term: urlParams.get('utm_term') || prev.utm_term,
      }));
    }
  }, []);

  const fetchLeadSources = async () => {
    try {
      const { data, error } = await supabase
        .from('lead_sources')
        .select('id, name, category')
        .eq('organization_id', profile?.organization_id)
        .eq('is_active', true)
        .order('name');

      if (error) throw error;
      setLeadSources(data || []);
    } catch (error) {
      console.error('Error fetching lead sources:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const submitData = {
      ...formData,
      organization_id: profile?.organization_id,
      estimated_value: formData.estimated_value ? parseFloat(formData.estimated_value) : null,
      fitness_goals: formData.fitness_goals.length > 0 ? formData.fitness_goals : null,
    };

    onSubmit(submitData);
  };

  const handleFitnessGoalChange = (goal: string, checked: boolean) => {
    setFormData(prev => ({
      ...prev,
      fitness_goals: checked
        ? [...prev.fitness_goals, goal]
        : prev.fitness_goals.filter(g => g !== goal),
    }));
  };

  const getInterestLevelColor = (level: string) => {
    switch (level) {
      case 'hot': return 'bg-red-100 text-red-800';
      case 'warm': return 'bg-yellow-100 text-yellow-800';
      case 'cold': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <User className="w-5 h-5 mr-2" />
            Contact Information
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="first_name">First Name *</Label>
              <Input
                id="first_name"
                value={formData.first_name}
                onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                required
              />
            </div>
            <div>
              <Label htmlFor="last_name">Last Name *</Label>
              <Input
                id="last_name"
                value={formData.last_name}
                onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="email">Email *</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  id="email"
                  type="email"
                  className="pl-10"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  required
                />
              </div>
            </div>
            <div>
              <Label htmlFor="phone">Phone Number</Label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  id="phone"
                  type="tel"
                  className="pl-10"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="(555) 123-4567"
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="company_name">Company Name</Label>
              <div className="relative">
                <Building className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  id="company_name"
                  className="pl-10"
                  value={formData.company_name}
                  onChange={(e) => setFormData({ ...formData, company_name: e.target.value })}
                />
              </div>
            </div>
            <div>
              <Label htmlFor="job_title">Job Title</Label>
              <Input
                id="job_title"
                value={formData.job_title}
                onChange={(e) => setFormData({ ...formData, job_title: e.target.value })}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Target className="w-5 h-5 mr-2" />
            Lead Details
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="interest_level">Interest Level</Label>
              <Select
                value={formData.interest_level}
                onValueChange={(value: 'cold' | 'warm' | 'hot') =>
                  setFormData({ ...formData, interest_level: value })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="cold">
                    <div className="flex items-center">
                      <Badge className={`mr-2 ${getInterestLevelColor('cold')}`}>Cold</Badge>
                      Initial Interest
                    </div>
                  </SelectItem>
                  <SelectItem value="warm">
                    <div className="flex items-center">
                      <Badge className={`mr-2 ${getInterestLevelColor('warm')}`}>Warm</Badge>
                      Moderate Interest
                    </div>
                  </SelectItem>
                  <SelectItem value="hot">
                    <div className="flex items-center">
                      <Badge className={`mr-2 ${getInterestLevelColor('hot')}`}>Hot</Badge>
                      High Interest
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label htmlFor="estimated_value">Estimated Value ($)</Label>
              <Input
                id="estimated_value"
                type="number"
                step="0.01"
                value={formData.estimated_value}
                onChange={(e) => setFormData({ ...formData, estimated_value: e.target.value })}
                placeholder="0.00"
              />
            </div>

            <div>
              <Label htmlFor="annual_income">Annual Income</Label>
              <Select
                value={formData.annual_income}
                onValueChange={(value) =>
                  setFormData({ ...formData, annual_income: value })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select range" />
                </SelectTrigger>
                <SelectContent>
                  {incomeRanges.map((range) => (
                    <SelectItem key={range} value={range}>
                      {range}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label htmlFor="lead_source_id">Lead Source</Label>
            <Select
              value={formData.lead_source_id}
              onValueChange={(value) => {
                const source = leadSources.find(s => s.id === value);
                setFormData({ 
                  ...formData, 
                  lead_source_id: value,
                  source: source?.name || '',
                });
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select lead source" />
              </SelectTrigger>
              <SelectContent>
                {leadSources.map((source) => (
                  <SelectItem key={source.id} value={source.id}>
                    {source.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>Fitness Goals (Select all that apply)</Label>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mt-2">
              {fitnessGoalOptions.map((goal) => (
                <div key={goal} className="flex items-center space-x-2">
                  <Checkbox
                    id={goal}
                    checked={formData.fitness_goals.includes(goal)}
                    onCheckedChange={(checked) => 
                      handleFitnessGoalChange(goal, checked as boolean)
                    }
                  />
                  <Label htmlFor={goal} className="text-sm font-normal">
                    {goal}
                  </Label>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Calendar className="w-5 h-5 mr-2" />
            Communication Preferences
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="preferred_contact_method">Preferred Contact Method</Label>
              <Select
                value={formData.preferred_contact_method}
                onValueChange={(value: 'email' | 'phone' | 'sms') =>
                  setFormData({ ...formData, preferred_contact_method: value })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="email">Email</SelectItem>
                  <SelectItem value="phone">Phone Call</SelectItem>
                  <SelectItem value="sms">Text Message</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label htmlFor="best_contact_time">Best Time to Contact</Label>
              <Input
                id="best_contact_time"
                value={formData.best_contact_time}
                onChange={(e) => setFormData({ ...formData, best_contact_time: e.target.value })}
                placeholder="e.g., Mornings, Evenings, Weekends"
              />
            </div>
          </div>

          <div>
            <Label htmlFor="notes">Additional Notes</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Any additional information about this lead..."
              rows={3}
            />
          </div>
        </CardContent>
      </Card>

      {/* UTM Parameters - Hidden section for tracking */}
      {(formData.utm_source || formData.utm_medium || formData.utm_campaign) && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm text-gray-600">Tracking Information</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {formData.utm_source && (
                <div>
                  <Label className="text-xs">UTM Source</Label>
                  <Input
                    value={formData.utm_source}
                    onChange={(e) => setFormData({ ...formData, utm_source: e.target.value })}
                    className="text-sm"
                  />
                </div>
              )}
              {formData.utm_medium && (
                <div>
                  <Label className="text-xs">UTM Medium</Label>
                  <Input
                    value={formData.utm_medium}
                    onChange={(e) => setFormData({ ...formData, utm_medium: e.target.value })}
                    className="text-sm"
                  />
                </div>
              )}
              {formData.utm_campaign && (
                <div>
                  <Label className="text-xs">UTM Campaign</Label>
                  <Input
                    value={formData.utm_campaign}
                    onChange={(e) => setFormData({ ...formData, utm_campaign: e.target.value })}
                    className="text-sm"
                  />
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      <div className="flex justify-end space-x-4">
        <Button type="button" variant="outline">
          Cancel
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Saving...' : 'Save Lead'}
        </Button>
      </div>
    </form>
  );
};