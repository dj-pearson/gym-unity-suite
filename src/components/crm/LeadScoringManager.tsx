import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Plus, Edit2, Trash2, Target, TrendingUp, Calculator } from 'lucide-react';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

interface LeadScoringRule {
  id: string;
  rule_name: string;
  criteria_type: 'demographic' | 'behavioral' | 'engagement' | 'source';
  criteria_field: string;
  criteria_operator: 'equals' | 'contains' | 'greater_than' | 'less_than' | 'exists';
  criteria_value: string | null;
  score_points: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

interface ScoreDistribution {
  range: string;
  count: number;
  percentage: number;
  qualification: string;
}

const criteriaTypeOptions = [
  { value: 'demographic', label: 'Demographic' },
  { value: 'behavioral', label: 'Behavioral' },
  { value: 'engagement', label: 'Engagement' },
  { value: 'source', label: 'Source' },
];

const criteriaFieldOptions = {
  demographic: [
    { value: 'phone', label: 'Phone Number' },
    { value: 'company_name', label: 'Company Name' },
    { value: 'job_title', label: 'Job Title' },
    { value: 'annual_income', label: 'Annual Income' },
  ],
  behavioral: [
    { value: 'interest_level', label: 'Interest Level' },
    { value: 'estimated_value', label: 'Estimated Value' },
    { value: 'fitness_goals', label: 'Fitness Goals' },
  ],
  engagement: [
    { value: 'last_contact_date', label: 'Last Contact Date' },
    { value: 'activities_count', label: 'Activity Count' },
  ],
  source: [
    { value: 'source', label: 'Lead Source' },
    { value: 'utm_source', label: 'UTM Source' },
    { value: 'utm_campaign', label: 'UTM Campaign' },
  ],
};

const operatorOptions = [
  { value: 'equals', label: 'Equals' },
  { value: 'contains', label: 'Contains' },
  { value: 'greater_than', label: 'Greater Than' },
  { value: 'less_than', label: 'Less Than' },
  { value: 'exists', label: 'Has Value' },
];

export const LeadScoringManager: React.FC = () => {
  const { user, profile } = useAuth();
  const [rules, setRules] = useState<LeadScoringRule[]>([]);
  const [scoreDistribution, setScoreDistribution] = useState<ScoreDistribution[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingRule, setEditingRule] = useState<LeadScoringRule | null>(null);
  const [formData, setFormData] = useState({
    rule_name: '',
    criteria_type: 'demographic' as LeadScoringRule['criteria_type'],
    criteria_field: '',
    criteria_operator: 'equals' as LeadScoringRule['criteria_operator'],
    criteria_value: '',
    score_points: '10',
    is_active: true,
  });

  useEffect(() => {
    if (profile?.organization_id) {
      fetchScoringRules();
      fetchScoreDistribution();
    }
  }, [profile?.organization_id]);

  const fetchScoringRules = async () => {
    try {
      const { data, error } = await supabase
        .from('lead_scoring_rules')
        .select('*')
        .eq('organization_id', profile?.organization_id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setRules(data || []);
    } catch (error) {
      console.error('Error fetching scoring rules:', error);
      toast.error('Failed to load scoring rules');
    }
  };

  const fetchScoreDistribution = async () => {
    try {
      const { data: leadsData, error } = await supabase
        .from('leads')
        .select('lead_score, qualification_status')
        .eq('organization_id', profile?.organization_id);

      if (error) throw error;

      // Calculate score distribution
      const distribution = {
        '0-25': 0,
        '26-50': 0,
        '51-75': 0,
        '76-100': 0,
        '100+': 0,
      };

      const qualificationCounts = {
        unqualified: 0,
        marketing_qualified: 0,
        sales_qualified: 0,
        opportunity: 0,
      };

      leadsData?.forEach((lead) => {
        const score = lead.lead_score || 0;
        if (score <= 25) distribution['0-25']++;
        else if (score <= 50) distribution['26-50']++;
        else if (score <= 75) distribution['51-75']++;
        else if (score <= 100) distribution['76-100']++;
        else distribution['100+']++;

        if (lead.qualification_status) {
          qualificationCounts[lead.qualification_status as keyof typeof qualificationCounts]++;
        }
      });

      const totalLeads = leadsData?.length || 0;
      const distributionArray: ScoreDistribution[] = Object.entries(distribution).map(([range, count]) => ({
        range,
        count,
        percentage: totalLeads > 0 ? (count / totalLeads) * 100 : 0,
        qualification: getQualificationForRange(range),
      }));

      setScoreDistribution(distributionArray);
    } catch (error) {
      console.error('Error fetching score distribution:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getQualificationForRange = (range: string): string => {
    switch (range) {
      case '0-25': return 'Unqualified';
      case '26-50': return 'Marketing Qualified';
      case '51-75': return 'Marketing Qualified';
      case '76-100': return 'Sales Qualified';
      case '100+': return 'Opportunity';
      default: return 'Unknown';
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const ruleData = {
        organization_id: profile?.organization_id,
        rule_name: formData.rule_name,
        criteria_type: formData.criteria_type,
        criteria_field: formData.criteria_field,
        criteria_operator: formData.criteria_operator,
        criteria_value: formData.criteria_value || null,
        score_points: parseInt(formData.score_points),
        is_active: formData.is_active,
      };

      let error;
      if (editingRule) {
        const result = await supabase
          .from('lead_scoring_rules')
          .update(ruleData)
          .eq('id', editingRule.id);
        error = result.error;
      } else {
        const result = await supabase
          .from('lead_scoring_rules')
          .insert([ruleData]);
        error = result.error;
      }

      if (error) throw error;

      toast.success(editingRule ? 'Scoring rule updated!' : 'Scoring rule created!');
      setIsDialogOpen(false);
      setEditingRule(null);
      resetForm();
      fetchScoringRules();
    } catch (error) {
      console.error('Error saving scoring rule:', error);
      toast.error('Failed to save scoring rule');
    } finally {
      setIsLoading(false);
    }
  };

  const handleEdit = (rule: LeadScoringRule) => {
    setEditingRule(rule);
    setFormData({
      rule_name: rule.rule_name,
      criteria_type: rule.criteria_type,
      criteria_field: rule.criteria_field,
      criteria_operator: rule.criteria_operator,
      criteria_value: rule.criteria_value || '',
      score_points: rule.score_points.toString(),
      is_active: rule.is_active,
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async (ruleId: string) => {
    if (!confirm('Are you sure you want to delete this scoring rule?')) return;

    try {
      const { error } = await supabase
        .from('lead_scoring_rules')
        .delete()
        .eq('id', ruleId);

      if (error) throw error;

      toast.success('Scoring rule deleted!');
      fetchScoringRules();
    } catch (error) {
      console.error('Error deleting scoring rule:', error);
      toast.error('Failed to delete scoring rule');
    }
  };

  const recalculateAllScores = async () => {
    setIsLoading(true);
    try {
      // This would call a Supabase function to recalculate all lead scores
      const { data: leads, error: fetchError } = await supabase
        .from('leads')
        .select('id')
        .eq('organization_id', profile?.organization_id);

      if (fetchError) throw fetchError;

      // Call the calculate_lead_score function for each lead
      for (const lead of leads || []) {
        const { error } = await supabase.rpc('calculate_lead_score', {
          lead_uuid: lead.id
        });
        if (error) {
          console.error('Error calculating score for lead:', lead.id, error);
        }
      }

      toast.success('All lead scores recalculated!');
      fetchScoreDistribution();
    } catch (error) {
      console.error('Error recalculating scores:', error);
      toast.error('Failed to recalculate scores');
    } finally {
      setIsLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      rule_name: '',
      criteria_type: 'demographic',
      criteria_field: '',
      criteria_operator: 'equals',
      criteria_value: '',
      score_points: '10',
      is_active: true,
    });
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="h-8 bg-gray-200 rounded w-1/4 animate-pulse" />
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-16 bg-gray-200 rounded animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  const currentFieldOptions = criteriaFieldOptions[formData.criteria_type] || [];
  const showValueField = formData.criteria_operator !== 'exists';

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Lead Scoring</h2>
          <p className="text-gray-600">Configure automated lead scoring rules and thresholds</p>
        </div>
        <div className="flex space-x-2">
          <Button variant="outline" onClick={recalculateAllScores}>
            <Calculator className="w-4 h-4 mr-2" />
            Recalculate All
          </Button>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => {
                resetForm();
                setEditingRule(null);
              }}>
                <Plus className="w-4 h-4 mr-2" />
                Add Rule
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>
                  {editingRule ? 'Edit Scoring Rule' : 'Add Scoring Rule'}
                </DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="rule_name">Rule Name</Label>
                  <Input
                    id="rule_name"
                    value={formData.rule_name}
                    onChange={(e) => setFormData({ ...formData, rule_name: e.target.value })}
                    placeholder="e.g., Has Phone Number"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="criteria_type">Criteria Type</Label>
                  <Select
                    value={formData.criteria_type}
                    onValueChange={(value: LeadScoringRule['criteria_type']) => 
                      setFormData({ ...formData, criteria_type: value, criteria_field: '' })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {criteriaTypeOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="criteria_field">Field</Label>
                  <Select
                    value={formData.criteria_field}
                    onValueChange={(value) => 
                      setFormData({ ...formData, criteria_field: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select field" />
                    </SelectTrigger>
                    <SelectContent>
                      {currentFieldOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="criteria_operator">Operator</Label>
                  <Select
                    value={formData.criteria_operator}
                    onValueChange={(value: LeadScoringRule['criteria_operator']) => 
                      setFormData({ ...formData, criteria_operator: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {operatorOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {showValueField && (
                  <div className="space-y-2">
                    <Label htmlFor="criteria_value">Value</Label>
                    <Input
                      id="criteria_value"
                      value={formData.criteria_value}
                      onChange={(e) => setFormData({ ...formData, criteria_value: e.target.value })}
                      placeholder="Comparison value"
                    />
                  </div>
                )}

                <div className="space-y-2">
                  <Label htmlFor="score_points">Points</Label>
                  <Input
                    id="score_points"
                    type="number"
                    value={formData.score_points}
                    onChange={(e) => setFormData({ ...formData, score_points: e.target.value })}
                    placeholder="10"
                    required
                  />
                </div>

                <div className="flex items-center space-x-2">
                  <Switch
                    id="is_active"
                    checked={formData.is_active}
                    onCheckedChange={(checked) => 
                      setFormData({ ...formData, is_active: checked })
                    }
                  />
                  <Label htmlFor="is_active">Active</Label>
                </div>

                <div className="flex justify-end space-x-2 pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setIsDialogOpen(false);
                      setEditingRule(null);
                      resetForm();
                    }}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" disabled={isLoading}>
                    {editingRule ? 'Update' : 'Create'}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Score Distribution */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        {scoreDistribution.map((dist) => (
          <Card key={dist.range}>
            <CardContent className="p-6">
              <div className="text-center">
                <div className="flex items-center justify-center mb-2">
                  <Target className="w-8 h-8 text-blue-600" />
                </div>
                <p className="text-sm font-medium text-gray-600">{dist.range} Points</p>
                <p className="text-2xl font-bold text-gray-900">{dist.count}</p>
                <p className="text-xs text-gray-500">{dist.percentage.toFixed(1)}%</p>
                <Badge className="mt-1 text-xs" variant="outline">
                  {dist.qualification}
                </Badge>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Scoring Rules Table */}
      <Card>
        <CardHeader>
          <CardTitle>Scoring Rules</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Rule Name</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Field</TableHead>
                <TableHead>Condition</TableHead>
                <TableHead>Points</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rules.map((rule) => (
                <TableRow key={rule.id}>
                  <TableCell className="font-medium">{rule.rule_name}</TableCell>
                  <TableCell>
                    <Badge variant="outline">
                      {rule.criteria_type.replace('_', ' ')}
                    </Badge>
                  </TableCell>
                  <TableCell>{rule.criteria_field}</TableCell>
                  <TableCell>
                    <span className="text-sm">
                      {rule.criteria_operator} {rule.criteria_value && `"${rule.criteria_value}"`}
                    </span>
                  </TableCell>
                  <TableCell>
                    <Badge variant={rule.score_points > 0 ? 'default' : 'destructive'}>
                      {rule.score_points > 0 ? '+' : ''}{rule.score_points}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant={rule.is_active ? 'default' : 'secondary'}>
                      {rule.is_active ? 'Active' : 'Inactive'}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end space-x-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEdit(rule)}
                      >
                        <Edit2 className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(rule.id)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {rules.length === 0 && (
            <div className="text-center py-8">
              <Target className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">No scoring rules configured yet</p>
              <p className="text-sm text-gray-400 mb-4">
                Create rules to automatically score your leads
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};