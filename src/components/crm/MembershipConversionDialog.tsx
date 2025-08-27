import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  CreditCard, 
  FileText, 
  User, 
  Calendar, 
  DollarSign, 
  Tag,
  IdCard,
  QrCode,
  NfcIcon,
  CheckCircle,
  ArrowRight
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { AgreementStep } from './conversion/AgreementStep';
import { PlanSelectionStep } from './conversion/PlanSelectionStep';
import { MemberInformationStep } from './conversion/MemberInformationStep';
import { PaymentStep } from './conversion/PaymentStep';
import { MemberCardStep } from './conversion/MemberCardStep';

interface MembershipConversionDialogProps {
  lead: any;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

interface ConversionState {
  step: number;
  selectedPlan: any;
  selectedPromotion: any;
  memberInfo: any;
  agreementSigned: boolean;
  paymentCompleted: boolean;
  memberCardGenerated: boolean;
  finalAmount: number;
  agreementData: any;
}

export const MembershipConversionDialog: React.FC<MembershipConversionDialogProps> = ({
  lead,
  isOpen,
  onClose,
  onSuccess
}) => {
  const { profile } = useAuth();
  const [loading, setLoading] = useState(false);
  const [membershipPlans, setMembershipPlans] = useState([]);
  const [promotions, setPromotions] = useState([]);
  const [agreementTemplates, setAgreementTemplates] = useState([]);
  const [conversionState, setConversionState] = useState<ConversionState>({
    step: 1,
    selectedPlan: null,
    selectedPromotion: null,
    memberInfo: null,
    agreementSigned: false,
    paymentCompleted: false,
    memberCardGenerated: false,
    finalAmount: 0,
    agreementData: null
  });

  const steps = [
    { id: 1, name: 'Plan Selection', icon: Tag, completed: !!conversionState.selectedPlan },
    { id: 2, name: 'Member Info', icon: User, completed: !!conversionState.memberInfo },
    { id: 3, name: 'Agreement', icon: FileText, completed: conversionState.agreementSigned },
    { id: 4, name: 'Payment', icon: CreditCard, completed: conversionState.paymentCompleted },
    { id: 5, name: 'Member Card', icon: IdCard, completed: conversionState.memberCardGenerated }
  ];

  useEffect(() => {
    if (isOpen && profile?.organization_id) {
      fetchData();
    }
  }, [isOpen, profile?.organization_id]);

  const fetchData = async () => {
    if (!profile?.organization_id) return;
    
    setLoading(true);
    try {
      // Fetch membership plans
      const { data: plansData, error: plansError } = await supabase
        .from('membership_plans')
        .select('*')
        .eq('organization_id', profile.organization_id)
        .order('price', { ascending: true });

      if (plansError) throw plansError;
      setMembershipPlans(plansData || []);

      // Fetch active promotions
      const { data: promotionsData, error: promotionsError } = await supabase
        .from('promotions')
        .select('*')
        .eq('organization_id', profile.organization_id)
        .eq('is_active', true)
        .gte('valid_until', new Date().toISOString())
        .order('created_at', { ascending: false });

      if (promotionsError) throw promotionsError;
      setPromotions(promotionsData || []);

      // Fetch agreement templates
      const { data: templatesData, error: templatesError } = await supabase
        .from('membership_agreement_templates')
        .select('*')
        .eq('organization_id', profile.organization_id)
        .order('is_default', { ascending: false });

      if (templatesError) throw templatesError;
      setAgreementTemplates(templatesData || []);

    } catch (error) {
      console.error('Error fetching conversion data:', error);
      toast.error('Failed to load conversion data');
    } finally {
      setLoading(false);
    }
  };

  const calculateFinalAmount = (plan: any, promotion: any) => {
    if (!plan) return 0;
    
    let amount = parseFloat(plan.price) + parseFloat(plan.signup_fee || 0);
    
    if (promotion) {
      switch (promotion.discount_type) {
        case 'percentage':
          amount = amount * (1 - parseFloat(promotion.discount_value) / 100);
          break;
        case 'fixed_amount':
          amount = Math.max(0, amount - parseFloat(promotion.discount_value));
          break;
        case 'free_months':
          // For free months, reduce the total by the monthly amount times free months
          if (plan.billing_interval === 'monthly') {
            amount = Math.max(0, amount - (parseFloat(plan.price) * parseFloat(promotion.discount_value)));
          }
          break;
      }
    }
    
    return amount;
  };

  const handlePlanSelection = (plan: any, promotion: any = null) => {
    const finalAmount = calculateFinalAmount(plan, promotion);
    setConversionState(prev => ({
      ...prev,
      selectedPlan: plan,
      selectedPromotion: promotion,
      finalAmount,
      step: 2
    }));
  };

  const handleMemberInfoComplete = (memberInfo: any) => {
    setConversionState(prev => ({
      ...prev,
      memberInfo,
      step: 3
    }));
  };

  const handleAgreementSigned = (agreementData: any) => {
    setConversionState(prev => ({
      ...prev,
      agreementSigned: true,
      agreementData,
      step: 4
    }));
  };

  const handlePaymentCompleted = async (paymentData: any) => {
    setConversionState(prev => ({
      ...prev,
      paymentCompleted: true,
      step: 5
    }));
  };

  const handleMemberCardGenerated = async () => {
    setLoading(true);
    try {
      const memberInfo = conversionState.memberInfo;
      
      // Convert lead to member profile with all collected information
      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          role: 'member',
          first_name: memberInfo.first_name,
          last_name: memberInfo.last_name,
          phone: memberInfo.phone,
          date_of_birth: memberInfo.date_of_birth,
          gender: memberInfo.gender,
          address_line1: memberInfo.address_line1,
          address_line2: memberInfo.address_line2,
          city: memberInfo.city,
          state: memberInfo.state,
          postal_code: memberInfo.postal_code,
          country: memberInfo.country,
          emergency_contact_name: memberInfo.emergency_contact_name,
          emergency_contact_phone: memberInfo.emergency_contact_phone,
          interests: memberInfo.interests,
          member_notes: memberInfo.member_notes,
          join_date: new Date().toISOString().split('T')[0] // Set join date to today
        })
        .eq('email', memberInfo.email);

      if (profileError) throw profileError;

      // Update lead status
      const { error: leadError } = await supabase
        .from('leads')
        .update({ status: 'member' })
        .eq('id', lead.id);

      if (leadError) throw leadError;

      setConversionState(prev => ({
        ...prev,
        memberCardGenerated: true
      }));

      toast.success('Lead successfully converted to member!');
      onSuccess();
      onClose();

    } catch (error: any) {
      console.error('Error completing conversion:', error);
      toast.error('Failed to complete conversion');
    } finally {
      setLoading(false);
    }
  };

  const getCurrentStepComponent = () => {
    switch (conversionState.step) {
      case 1:
        return (
          <PlanSelectionStep
            plans={membershipPlans}
            promotions={promotions}
            onPlanSelect={handlePlanSelection}
            selectedPlan={conversionState.selectedPlan}
            selectedPromotion={conversionState.selectedPromotion}
          />
        );
      case 2:
        return (
          <MemberInformationStep
            lead={lead}
            onMemberInfoComplete={handleMemberInfoComplete}
            initialData={conversionState.memberInfo}
          />
        );
      case 3:
        return (
          <AgreementStep
            templates={agreementTemplates}
            lead={lead}
            plan={conversionState.selectedPlan}
            onAgreementSigned={handleAgreementSigned}
          />
        );
      case 4:
        return (
          <PaymentStep
            lead={lead}
            plan={conversionState.selectedPlan}
            promotion={conversionState.selectedPromotion}
            finalAmount={conversionState.finalAmount}
            onPaymentCompleted={handlePaymentCompleted}
          />
        );
      case 5:
        return (
          <MemberCardStep
            lead={lead}
            plan={conversionState.selectedPlan}
            onCardGenerated={handleMemberCardGenerated}
            loading={loading}
          />
        );
      default:
        return null;
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Convert Lead to Member - {lead.first_name || lead.email}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Progress Steps */}
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                {steps.map((step, index) => {
                  const Icon = step.icon;
                  const isActive = conversionState.step === step.id;
                  const isCompleted = step.completed;
                  
                  return (
                    <div key={step.id} className="flex items-center">
                      <div className={`
                        flex items-center justify-center w-10 h-10 rounded-full border-2 
                        ${isCompleted ? 'bg-primary border-primary text-primary-foreground' : 
                          isActive ? 'border-primary text-primary' : 'border-muted-foreground text-muted-foreground'}
                      `}>
                        {isCompleted ? (
                          <CheckCircle className="h-5 w-5" />
                        ) : (
                          <Icon className="h-5 w-5" />
                        )}
                      </div>
                      <div className="ml-3">
                        <div className={`text-sm font-medium ${isActive ? 'text-primary' : 'text-foreground'}`}>
                          {step.name}
                        </div>
                      </div>
                      {index < steps.length - 1 && (
                        <ArrowRight className="h-4 w-4 text-muted-foreground mx-4" />
                      )}
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Current Step Content */}
          <div className="min-h-[400px]">
            {loading ? (
              <Card>
                <CardContent className="p-8 text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                  <p className="mt-4 text-muted-foreground">Loading...</p>
                </CardContent>
              </Card>
            ) : (
              getCurrentStepComponent()
            )}
          </div>

          {/* Summary Panel */}
          {conversionState.selectedPlan && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Conversion Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Selected Plan:</span>
                  <span className="font-medium">{conversionState.selectedPlan.name}</span>
                </div>
                {conversionState.selectedPromotion && (
                  <div className="flex justify-between text-sm">
                    <span>Promotion:</span>
                    <Badge variant="secondary">{conversionState.selectedPromotion.name}</Badge>
                  </div>
                )}
                <Separator />
                <div className="flex justify-between text-sm font-medium">
                  <span>Total Amount:</span>
                  <span>${conversionState.finalAmount.toFixed(2)}</span>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};