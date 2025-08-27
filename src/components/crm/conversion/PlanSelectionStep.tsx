import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { 
  Users, 
  MapPin, 
  Calendar, 
  DollarSign, 
  Tag, 
  Clock,
  Star,
  CheckCircle
} from 'lucide-react';

interface PlanSelectionStepProps {
  plans: any[];
  promotions: any[];
  onPlanSelect: (plan: any, promotion?: any) => void;
  selectedPlan: any;
  selectedPromotion: any;
}

export const PlanSelectionStep: React.FC<PlanSelectionStepProps> = ({
  plans,
  promotions,
  onPlanSelect,
  selectedPlan,
  selectedPromotion
}) => {
  const [tempSelectedPlan, setTempSelectedPlan] = useState(selectedPlan);
  const [tempSelectedPromotion, setTempSelectedPromotion] = useState(selectedPromotion);

  const getPlanTypeIcon = (type: string) => {
    switch (type) {
      case 'couple': return <Users className="h-4 w-4" />;
      case 'family': return <Users className="h-4 w-4" />;
      case 'corporate': return <Users className="h-4 w-4" />;
      default: return <Users className="h-4 w-4" />;
    }
  };

  const getPlanTypeBadgeVariant = (type: string) => {
    switch (type) {
      case 'couple': return 'secondary';
      case 'family': return 'outline';
      case 'corporate': return 'default';
      default: return 'secondary';
    }
  };

  const getBillingIntervalBadge = (interval: string) => {
    const colors = {
      monthly: 'bg-blue-500/10 text-blue-700 border-blue-200',
      quarterly: 'bg-green-500/10 text-green-700 border-green-200', 
      yearly: 'bg-purple-500/10 text-purple-700 border-purple-200'
    };
    
    return colors[interval as keyof typeof colors] || colors.monthly;
  };

  const calculateDiscountedPrice = (plan: any, promotion: any) => {
    if (!promotion) return parseFloat(plan.price);
    
    let basePrice = parseFloat(plan.price);
    
    switch (promotion.discount_type) {
      case 'percentage':
        return basePrice * (1 - parseFloat(promotion.discount_value) / 100);
      case 'fixed_amount':
        return Math.max(0, basePrice - parseFloat(promotion.discount_value));
      case 'free_months':
        // Show as promotional text, keep original price
        return basePrice;
      default:
        return basePrice;
    }
  };

  const getPromotionText = (promotion: any, plan: any) => {
    if (!promotion) return null;
    
    switch (promotion.discount_type) {
      case 'percentage':
        return `${promotion.discount_value}% OFF`;
      case 'fixed_amount':
        return `$${promotion.discount_value} OFF`;
      case 'free_months':
        return `${promotion.discount_value} MONTHS FREE`;
      default:
        return null;
    }
  };

  const isPromotionApplicable = (promotion: any, plan: any) => {
    if (!promotion.applicable_plans || promotion.applicable_plans.length === 0) return true;
    if (promotion.applicable_plans.includes('all')) return true;
    return promotion.applicable_plans.includes(plan.id);
  };

  const applicablePromotions = promotions.filter(promotion => 
    tempSelectedPlan ? isPromotionApplicable(promotion, tempSelectedPlan) : true
  );

  const handleConfirmSelection = () => {
    if (tempSelectedPlan) {
      onPlanSelect(tempSelectedPlan, tempSelectedPromotion);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-2">Select Membership Plan</h3>
        <p className="text-muted-foreground text-sm">
          Choose the membership plan that best fits the member's needs.
        </p>
      </div>

      {/* Plans Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {plans.map((plan) => {
          const isSelected = tempSelectedPlan?.id === plan.id;
          const discountedPrice = tempSelectedPromotion ? 
            calculateDiscountedPrice(plan, tempSelectedPromotion) : 
            parseFloat(plan.price);
          const hasDiscount = tempSelectedPromotion && discountedPrice < parseFloat(plan.price);
          
          return (
            <Card 
              key={plan.id} 
              className={`cursor-pointer transition-all hover:shadow-md ${
                isSelected ? 'ring-2 ring-primary border-primary' : ''
              }`}
              onClick={() => setTempSelectedPlan(plan)}
            >
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">{plan.name}</CardTitle>
                  {isSelected && <CheckCircle className="h-5 w-5 text-primary" />}
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  <Badge variant={getPlanTypeBadgeVariant(plan.plan_type)} className="text-xs">
                    {getPlanTypeIcon(plan.plan_type)}
                    <span className="ml-1 capitalize">{plan.plan_type}</span>
                  </Badge>
                  <Badge variant="outline" className={`text-xs ${getBillingIntervalBadge(plan.billing_interval)}`}>
                    <Calendar className="h-3 w-3 mr-1" />
                    {plan.billing_interval}
                  </Badge>
                </div>
              </CardHeader>
              
              <CardContent className="space-y-4">
                <div className="text-center">
                  <div className="flex items-center justify-center gap-2">
                    {hasDiscount && (
                      <span className="text-lg text-muted-foreground line-through">
                        ${parseFloat(plan.price).toFixed(2)}
                      </span>
                    )}
                    <span className={`text-2xl font-bold ${hasDiscount ? 'text-green-600' : 'text-foreground'}`}>
                      ${discountedPrice.toFixed(2)}
                    </span>
                    <span className="text-sm text-muted-foreground">
                      /{plan.billing_interval === 'monthly' ? 'mo' : 
                        plan.billing_interval === 'yearly' ? 'yr' : 'qtr'}
                    </span>
                  </div>
                  
                  {plan.signup_fee > 0 && (
                    <p className="text-xs text-muted-foreground mt-1">
                      + ${plan.signup_fee} signup fee
                    </p>
                  )}
                  
                  {tempSelectedPromotion && isPromotionApplicable(tempSelectedPromotion, plan) && (
                    <Badge variant="destructive" className="mt-2">
                      <Tag className="h-3 w-3 mr-1" />
                      {getPromotionText(tempSelectedPromotion, plan)}
                    </Badge>
                  )}
                </div>

                <Separator />

                <div className="space-y-2 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Classes:</span>
                    <span className="font-medium">
                      {plan.max_classes_per_month ? `${plan.max_classes_per_month}/month` : 'Unlimited'}
                    </span>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Access:</span>
                    <div className="flex items-center gap-1">
                      <MapPin className="h-3 w-3" />
                      <span className="font-medium capitalize">
                        {plan.access_level?.replace('_', ' ')}
                      </span>
                    </div>
                  </div>

                  {plan.requires_commitment && (
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Commitment:</span>
                      <div className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        <span className="font-medium">{plan.commitment_months} months</span>
                      </div>
                    </div>
                  )}

                  {plan.annual_maintenance_fee > 0 && (
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Annual Fee:</span>
                      <span className="font-medium">${plan.annual_maintenance_fee}</span>
                    </div>
                  )}
                </div>

                {plan.description && (
                  <>
                    <Separator />
                    <p className="text-xs text-muted-foreground">{plan.description}</p>
                  </>
                )}

                {plan.features && plan.features.length > 0 && (
                  <>
                    <Separator />
                    <div className="space-y-1">
                      {plan.features.slice(0, 3).map((feature: string, index: number) => (
                        <div key={index} className="flex items-center gap-1 text-xs">
                          <CheckCircle className="h-3 w-3 text-green-500" />
                          <span>{feature}</span>
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {plans.length === 0 && (
        <Card>
          <CardContent className="p-8 text-center">
            <p className="text-muted-foreground">No membership plans available</p>
          </CardContent>
        </Card>
      )}

      {/* Promotions Selection */}
      {tempSelectedPlan && applicablePromotions.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Tag className="h-4 w-4" />
              Available Promotions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Select
              value={tempSelectedPromotion?.id || 'none'}
              onValueChange={(value) => {
                if (value === 'none') {
                  setTempSelectedPromotion(null);
                } else {
                  const promotion = promotions.find(p => p.id === value);
                  setTempSelectedPromotion(promotion);
                }
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select a promotion (optional)" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">No promotion</SelectItem>
                {applicablePromotions.map((promotion) => (
                  <SelectItem key={promotion.id} value={promotion.id}>
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary" className="text-xs">
                        {getPromotionText(promotion, tempSelectedPlan)}
                      </Badge>
                      <span>{promotion.name}</span>
                    </div>
                  </SelectItem>
                ))}</SelectContent>
            </Select>
            
            {tempSelectedPromotion && (
              <div className="mt-3 p-3 bg-muted rounded-lg">
                <p className="text-sm text-muted-foreground">{tempSelectedPromotion.description}</p>
                {tempSelectedPromotion.valid_until && (
                  <p className="text-xs text-muted-foreground mt-1">
                    Valid until: {new Date(tempSelectedPromotion.valid_until).toLocaleDateString()}
                  </p>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Continue Button */}
      <div className="flex justify-end">
        <Button 
          onClick={handleConfirmSelection}
          disabled={!tempSelectedPlan}
          className="bg-gradient-secondary hover:opacity-90"
        >
          Continue to Agreement
        </Button>
      </div>
    </div>
  );
};
