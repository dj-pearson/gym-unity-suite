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
  Settings, 
  Plus, 
  Edit, 
  Trash2, 
  MessageSquare, 
  Mail, 
  Phone, 
  CheckCircle,
  AlertCircle
} from 'lucide-react';

interface CommunicationProvider {
  id: string;
  organization_id: string;
  provider_type: 'sms' | 'email';
  provider_name: string;
  configuration: Record<string, any>;
  is_active: boolean;
  is_default: boolean;
  created_at: string;
  updated_at: string;
}

const PROVIDER_CONFIGS = {
  sms: {
    twilio: {
      name: 'Twilio SMS',
      fields: [
        { key: 'account_sid', label: 'Account SID', type: 'text', required: true },
        { key: 'auth_token', label: 'Auth Token', type: 'password', required: true },
        { key: 'from_number', label: 'From Phone Number', type: 'tel', required: true }
      ]
    },
    textmagic: {
      name: 'TextMagic',
      fields: [
        { key: 'username', label: 'Username', type: 'text', required: true },
        { key: 'api_key', label: 'API Key', type: 'password', required: true }
      ]
    }
  },
  email: {
    resend: {
      name: 'Resend',
      fields: [
        { key: 'api_key', label: 'API Key', type: 'password', required: true },
        { key: 'from_email', label: 'From Email', type: 'email', required: true },
        { key: 'from_name', label: 'From Name', type: 'text', required: false }
      ]
    },
    sendgrid: {
      name: 'SendGrid',
      fields: [
        { key: 'api_key', label: 'API Key', type: 'password', required: true },
        { key: 'from_email', label: 'From Email', type: 'email', required: true },
        { key: 'from_name', label: 'From Name', type: 'text', required: false }
      ]
    }
  }
};

export default function CommunicationProviderManager() {
  const { profile } = useAuth();
  const [providers, setProviders] = useState<CommunicationProvider[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [editingProvider, setEditingProvider] = useState<CommunicationProvider | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    provider_type: 'email' as 'sms' | 'email',
    provider_name: '',
    configuration: {} as Record<string, any>,
    is_active: true,
    is_default: false
  });

  useEffect(() => {
    fetchProviders();
  }, [profile?.organization_id]);

  const fetchProviders = async () => {
    if (!profile?.organization_id) return;

    try {
      const { data, error } = await supabase
        .from('communication_providers')
        .select('*')
        .eq('organization_id', profile.organization_id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setProviders(data || []);
    } catch (error: any) {
      console.error('Error fetching providers:', error);
      toast.error('Failed to load communication providers');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const providerData = {
        ...formData,
        organization_id: profile?.organization_id,
      };

      if (editingProvider) {
        const { error } = await supabase
          .from('communication_providers')
          .update(providerData)
          .eq('id', editingProvider.id);

        if (error) throw error;
        toast.success('Provider updated successfully');
      } else {
        const { error } = await supabase
          .from('communication_providers')
          .insert([providerData]);

        if (error) throw error;
        toast.success('Provider added successfully');
      }

      setFormData({
        provider_type: 'email',
        provider_name: '',
        configuration: {},
        is_active: true,
        is_default: false
      });
      setEditingProvider(null);
      setShowAddDialog(false);
      fetchProviders();
    } catch (error: any) {
      console.error('Error saving provider:', error);
      toast.error('Failed to save provider');
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const { error } = await supabase
        .from('communication_providers')
        .delete()
        .eq('id', id);

      if (error) throw error;
      toast.success('Provider deleted successfully');
      fetchProviders();
    } catch (error: any) {
      console.error('Error deleting provider:', error);
      toast.error('Failed to delete provider');
    }
  };

  const handleEdit = (provider: CommunicationProvider) => {
    setEditingProvider(provider);
    setFormData({
      provider_type: provider.provider_type,
      provider_name: provider.provider_name,
      configuration: provider.configuration,
      is_active: provider.is_active,
      is_default: provider.is_default
    });
    setShowAddDialog(true);
  };

  const setAsDefault = async (id: string, providerType: 'sms' | 'email') => {
    try {
      // First, unset all defaults for this provider type
      const { error: unsetError } = await supabase
        .from('communication_providers')
        .update({ is_default: false })
        .eq('organization_id', profile?.organization_id)
        .eq('provider_type', providerType);

      if (unsetError) throw unsetError;

      // Then set this one as default
      const { error: setError } = await supabase
        .from('communication_providers')
        .update({ is_default: true })
        .eq('id', id);

      if (setError) throw setError;

      toast.success(`Set as default ${providerType} provider`);
      fetchProviders();
    } catch (error: any) {
      console.error('Error setting default provider:', error);
      toast.error('Failed to set default provider');
    }
  };

  const getProviderIcon = (type: 'sms' | 'email') => {
    return type === 'sms' ? <Phone className="w-4 h-4" /> : <Mail className="w-4 h-4" />;
  };

  const getProviderDisplayName = (provider: CommunicationProvider) => {
    const providerConfigs = PROVIDER_CONFIGS[provider.provider_type];
    const config = providerConfigs?.[provider.provider_name as keyof typeof providerConfigs];
    return (config as any)?.name || provider.provider_name;
  };

  const getCurrentConfig = () => {
    if (!formData.provider_name || !formData.provider_type) return null;
    return PROVIDER_CONFIGS[formData.provider_type]?.[formData.provider_name as keyof typeof PROVIDER_CONFIGS[typeof formData.provider_type]];
  };

  const updateConfigurationField = (key: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      configuration: {
        ...prev.configuration,
        [key]: value
      }
    }));
  };

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
          <h2 className="text-2xl font-bold text-foreground">Communication Providers</h2>
          <p className="text-muted-foreground">Configure SMS and email providers for your communications</p>
        </div>
        
        <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
          <DialogTrigger asChild>
            <Button onClick={() => { 
              setEditingProvider(null); 
              setFormData({
                provider_type: 'email',
                provider_name: '',
                configuration: {},
                is_active: true,
                is_default: false
              }); 
            }}>
              <Plus className="mr-2 h-4 w-4" />
              Add Provider
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>
                {editingProvider ? 'Edit Provider' : 'Add Communication Provider'}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="provider_type">Provider Type</Label>
                  <Select 
                    value={formData.provider_type} 
                    onValueChange={(value: 'sms' | 'email') => setFormData(prev => ({...prev, provider_type: value, provider_name: '', configuration: {}}))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="email">Email</SelectItem>
                      <SelectItem value="sms">SMS</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="provider_name">Provider</Label>
                  <Select 
                    value={formData.provider_name} 
                    onValueChange={(value) => setFormData(prev => ({...prev, provider_name: value, configuration: {}}))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select provider" />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(PROVIDER_CONFIGS[formData.provider_type] || {}).map(([key, config]) => (
                        <SelectItem key={key} value={key}>
                          {config.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {getCurrentConfig() && (
                <div className="space-y-4">
                  <Label className="text-sm font-medium">Configuration</Label>
                  {getCurrentConfig()!.fields.map((field) => (
                    <div key={field.key} className="space-y-2">
                      <Label htmlFor={field.key}>{field.label}</Label>
                      <Input
                        id={field.key}
                        type={field.type}
                        value={formData.configuration[field.key] || ''}
                        onChange={(e) => updateConfigurationField(field.key, e.target.value)}
                        required={field.required}
                        placeholder={`Enter ${field.label.toLowerCase()}`}
                      />
                    </div>
                  ))}
                </div>
              )}

              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2">
                  <Switch
                    id="is_active"
                    checked={formData.is_active}
                    onCheckedChange={(checked) => setFormData(prev => ({...prev, is_active: checked}))}
                  />
                  <Label htmlFor="is_active">Active</Label>
                </div>

                <div className="flex items-center space-x-2">
                  <Switch
                    id="is_default"
                    checked={formData.is_default}
                    onCheckedChange={(checked) => setFormData(prev => ({...prev, is_default: checked}))}
                  />
                  <Label htmlFor="is_default">Set as Default</Label>
                </div>
              </div>

              <div className="flex justify-end space-x-2">
                <Button type="button" variant="outline" onClick={() => {
                  setShowAddDialog(false);
                  setEditingProvider(null);
                }}>
                  Cancel
                </Button>
                <Button type="submit">
                  {editingProvider ? 'Update' : 'Add'} Provider
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {providers.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <Settings className="mx-auto h-12 w-12 text-muted-foreground opacity-50 mb-4" />
            <h3 className="text-lg font-medium text-foreground mb-2">No Providers Configured</h3>
            <p className="text-muted-foreground mb-4">
              Add SMS or email providers to start sending communications
            </p>
            <Button onClick={() => setShowAddDialog(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Add Your First Provider
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {providers.map((provider) => (
            <Card key={provider.id} className="gym-card">
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {getProviderIcon(provider.provider_type)}
                    <div>
                      <CardTitle className="text-base">
                        {getProviderDisplayName(provider)}
                      </CardTitle>
                      <p className="text-sm text-muted-foreground capitalize">
                        {provider.provider_type} Provider
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {provider.is_default && (
                      <Badge variant="default" className="text-xs">Default</Badge>
                    )}
                    <Badge 
                      variant={provider.is_active ? "default" : "secondary"}
                      className="text-xs"
                    >
                      {provider.is_active ? 'Active' : 'Inactive'}
                    </Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-sm space-y-1">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    {provider.is_active ? (
                      <CheckCircle className="w-3 h-3 text-success" />
                    ) : (
                      <AlertCircle className="w-3 h-3 text-destructive" />
                    )}
                    Status: {provider.is_active ? 'Ready to send' : 'Inactive'}
                  </div>
                  <div className="text-muted-foreground">
                    Configured: {new Date(provider.created_at).toLocaleDateString()}
                  </div>
                </div>

                <div className="flex justify-between items-center">
                  <div className="space-x-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleEdit(provider)}
                    >
                      <Edit className="w-3 h-3 mr-1" />
                      Edit
                    </Button>
                    {!provider.is_default && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setAsDefault(provider.id, provider.provider_type)}
                      >
                        Set Default
                      </Button>
                    )}
                  </div>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleDelete(provider.id)}
                    className="text-destructive hover:text-destructive"
                  >
                    <Trash2 className="w-3 h-3" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}