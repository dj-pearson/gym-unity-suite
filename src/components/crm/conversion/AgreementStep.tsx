import React, { useState, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { 
  FileText, 
  Edit, 
  Eye, 
  Download, 
  Signature, 
  User,
  Calendar,
  DollarSign
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

interface AgreementStepProps {
  templates: any[];
  lead: any;
  plan: any;
  onAgreementSigned: (agreementData: any) => void;
}

export const AgreementStep: React.FC<AgreementStepProps> = ({
  templates,
  lead,
  plan,
  onAgreementSigned
}) => {
  const { profile } = useAuth();
  const [selectedTemplate, setSelectedTemplate] = useState(templates.find(t => t.is_default) || templates[0]);
  const [customizedContent, setCustomizedContent] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [signature, setSignature] = useState('');
  const [loading, setLoading] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  React.useEffect(() => {
    if (selectedTemplate) {
      const content = fillTemplate(selectedTemplate.content);
      setCustomizedContent(content);
    }
  }, [selectedTemplate, lead, plan]);

  const fillTemplate = (templateContent: string) => {
    if (!templateContent) return '';
    
    const today = new Date();
    const replacements = {
      '[MEMBER_NAME]': `${lead.first_name || ''} ${lead.last_name || ''}`.trim() || lead.email,
      '[MEMBER_EMAIL]': lead.email,
      '[MEMBER_PHONE]': lead.phone || 'Not provided',
      '[PLAN_NAME]': plan.name,
      '[PLAN_PRICE]': `$${parseFloat(plan.price).toFixed(2)}`,
      '[BILLING_INTERVAL]': plan.billing_interval,
      '[DATE]': today.toLocaleDateString(),
      '[SIGNUP_FEE]': plan.signup_fee > 0 ? `$${parseFloat(plan.signup_fee).toFixed(2)}` : 'None',
      '[ACCESS_LEVEL]': plan.access_level?.replace('_', ' ') || 'Single Location',
      '[MAX_CLASSES]': plan.max_classes_per_month ? `${plan.max_classes_per_month} per month` : 'Unlimited',
      '[COMMITMENT]': plan.requires_commitment ? `${plan.commitment_months} months` : 'No commitment required',
      '[ANNUAL_FEE]': plan.annual_maintenance_fee > 0 ? `$${parseFloat(plan.annual_maintenance_fee).toFixed(2)} annually` : 'None'
    };

    let filledContent = templateContent;
    Object.entries(replacements).forEach(([placeholder, value]) => {
      filledContent = filledContent.replace(new RegExp(placeholder, 'g'), value);
    });

    return filledContent;
  };

  const handleSignAgreement = async () => {
    if (!signature.trim()) {
      toast.error('Please provide your signature');
      return;
    }

    setLoading(true);
    try {
      // Create signed agreement record
      const { data: agreementData, error } = await supabase
        .from('membership_agreements')
        .insert({
          member_id: lead.id, // This will need to be the converted member ID
          template_id: selectedTemplate?.id,
          agreement_content: customizedContent,
          signature_data: signature,
          witness_id: profile?.id
        })
        .select()
        .single();

      if (error) throw error;

      toast.success('Agreement signed successfully');
      onAgreementSigned(agreementData);
      
    } catch (error: any) {
      console.error('Error signing agreement:', error);
      toast.error('Failed to sign agreement');
    } finally {
      setLoading(false);
    }
  };

  const downloadAgreement = () => {
    const element = document.createElement('a');
    const file = new Blob([customizedContent], { type: 'text/plain' });
    element.href = URL.createObjectURL(file);
    element.download = `membership_agreement_${lead.first_name || 'member'}_${new Date().toISOString().split('T')[0]}.txt`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-2">Membership Agreement</h3>
        <p className="text-muted-foreground text-sm">
          Review and customize the membership agreement, then collect the member's signature.
        </p>
      </div>

      {/* Template Selection */}
      {templates.length > 1 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Agreement Template
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Select
              value={selectedTemplate?.id}
              onValueChange={(value) => {
                const template = templates.find(t => t.id === value);
                setSelectedTemplate(template);
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select agreement template" />
              </SelectTrigger>
              <SelectContent>
                {templates.map((template) => (
                  <SelectItem key={template.id} value={template.id}>
                    <div className="flex items-center gap-2">
                      <span>{template.name}</span>
                      {template.is_default && (
                        <Badge variant="secondary" className="text-xs">Default</Badge>
                      )}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </CardContent>
        </Card>
      )}

      {/* Agreement Content */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-base flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Agreement Content
            </CardTitle>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsEditing(!isEditing)}
              >
                {isEditing ? <Eye className="h-4 w-4" /> : <Edit className="h-4 w-4" />}
                {isEditing ? 'Preview' : 'Edit'}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={downloadAgreement}
              >
                <Download className="h-4 w-4" />
                Download
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isEditing ? (
            <Textarea
              value={customizedContent}
              onChange={(e) => setCustomizedContent(e.target.value)}
              className="min-h-[400px] font-mono text-sm"
              placeholder="Agreement content..."
            />
          ) : (
            <div className="max-h-[400px] overflow-y-auto border rounded-md p-4 bg-muted/30">
              <div className="whitespace-pre-wrap text-sm leading-relaxed">
                {customizedContent || 'No agreement content available'}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Member Information Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <User className="h-4 w-4" />
            Member Information
          </CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Name:</span>
              <span className="font-medium">
                {`${lead.first_name || ''} ${lead.last_name || ''}`.trim() || lead.email}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Email:</span>
              <span className="font-medium">{lead.email}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Phone:</span>
              <span className="font-medium">{lead.phone || 'Not provided'}</span>
            </div>
          </div>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Plan:</span>
              <span className="font-medium">{plan.name}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Price:</span>
              <span className="font-medium">${parseFloat(plan.price).toFixed(2)}/{plan.billing_interval}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Agreement Date:</span>
              <span className="font-medium">{new Date().toLocaleDateString()}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Signature Section */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Signature className="h-4 w-4" />
            Digital Signature
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="text-sm font-medium">Member Signature</label>
            <Textarea
              value={signature}
              onChange={(e) => setSignature(e.target.value)}
              placeholder="Type full name to sign digitally (e.g., John Doe)"
              className="mt-1"
              rows={2}
            />
            <p className="text-xs text-muted-foreground mt-1">
              By typing their name, the member agrees to the terms and conditions outlined in this agreement.
            </p>
          </div>
          
          <div className="text-xs text-muted-foreground space-y-1">
            <p>• This digital signature has the same legal effect as a handwritten signature</p>
            <p>• Agreement signed on: {new Date().toLocaleString()}</p>
            <p>• Witness: {profile?.first_name} {profile?.last_name} ({profile?.email})</p>
          </div>
        </CardContent>
      </Card>

      {/* Continue Button */}
      <div className="flex justify-end">
        <Button 
          onClick={handleSignAgreement}
          disabled={!signature.trim() || loading}
          className="bg-gradient-secondary hover:opacity-90"
        >
          {loading ? 'Processing...' : 'Sign Agreement & Continue'}
        </Button>
      </div>
    </div>
  );
};