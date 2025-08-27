import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Edit, Trash2, DollarSign, Calendar, Users, MapPin, Infinity } from 'lucide-react';
import SubscriptionButton from './SubscriptionButton';

interface MembershipPlan {
  id: string;
  name: string;
  description?: string;
  price: number;
  billing_interval: string;
  max_classes_per_month?: number | null;
  access_level: string;
  created_at: string;
}

interface MembershipPlanCardProps {
  plan: MembershipPlan;
  onEdit: (plan: MembershipPlan) => void;
  onDelete: (planId: string) => void;
  memberCount?: number;
  canManage?: boolean;
  isCurrentPlan?: boolean;
  showSubscribeButton?: boolean;
}

export default function MembershipPlanCard({ 
  plan, 
  onEdit, 
  onDelete, 
  memberCount = 0,
  canManage = false,
  isCurrentPlan = false,
  showSubscribeButton = false
}: MembershipPlanCardProps) {
  const formatPrice = (price: number, interval: string) => {
    const formatted = price.toFixed(2);
    switch (interval) {
      case 'monthly': return `$${formatted}/month`;
      case 'quarterly': return `$${formatted}/quarter`;
      case 'yearly': return `$${formatted}/year`;
      default: return `$${formatted}`;
    }
  };

  const formatAccessLevel = (level: string) => {
    switch (level) {
      case 'single_location': return 'Single Location';
      case 'all_locations': return 'All Locations';
      default: return level;
    }
  };

  const getBillingBadgeColor = (interval: string) => {
    switch (interval) {
      case 'monthly': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'quarterly': return 'bg-green-100 text-green-800 border-green-200';
      case 'yearly': return 'bg-purple-100 text-purple-800 border-purple-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  return (
    <Card className={`gym-card hover:shadow-elevation-2 transition-all ${isCurrentPlan ? 'ring-2 ring-primary' : ''}`}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center space-x-2 mb-2">
              <CardTitle className="text-xl font-bold text-foreground">
                {plan.name}
              </CardTitle>
              {isCurrentPlan && (
                <Badge className="bg-primary text-primary-foreground">
                  Current Plan
                </Badge>
              )}
            </div>
            <div className="flex items-center space-x-2 mb-2">
              <Badge className={`text-xs ${getBillingBadgeColor(plan.billing_interval)}`}>
                <Calendar className="mr-1 h-3 w-3" />
                {plan.billing_interval}
              </Badge>
              <Badge variant="outline" className="text-xs">
                <MapPin className="mr-1 h-3 w-3" />
                {formatAccessLevel(plan.access_level)}
              </Badge>
            </div>
          </div>
          
          {canManage && (
            <div className="flex items-center space-x-2">
              <Button variant="ghost" size="sm" onClick={() => onEdit(plan)}>
                <Edit className="h-4 w-4" />
              </Button>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => onDelete(plan.id)}
                className="text-destructive hover:text-destructive"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Price */}
        <div className="text-center py-4 bg-gradient-primary rounded-lg text-white">
          <div className="text-3xl font-bold flex items-center justify-center">
            <DollarSign className="h-6 w-6" />
            {plan.price.toFixed(2)}
          </div>
          <div className="text-sm opacity-90">
            per {plan.billing_interval.replace('ly', '')}
          </div>
        </div>

        {/* Description */}
        {plan.description && (
          <p className="text-sm text-muted-foreground">
            {plan.description}
          </p>
        )}

        {/* Features */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground flex items-center">
              <Users className="mr-2 h-4 w-4" />
              Classes per month
            </span>
            <span className="font-medium flex items-center">
              {plan.max_classes_per_month === null ? (
                <>
                  <Infinity className="mr-1 h-4 w-4" />
                  Unlimited
                </>
              ) : (
                plan.max_classes_per_month
              )}
            </span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground flex items-center">
              <MapPin className="mr-2 h-4 w-4" />
              Location access
            </span>
            <span className="font-medium">
              {formatAccessLevel(plan.access_level)}
            </span>
          </div>
        </div>

        {/* Stats */}
        <div className="pt-4 border-t">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Active members</span>
            <span className="font-medium text-primary">{memberCount}</span>
          </div>
        </div>

        {/* Monthly Revenue Preview */}
        {memberCount > 0 && (
          <div className="bg-muted/50 rounded-lg p-3">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Monthly revenue</span>
              <span className="font-bold text-success">
                ${(plan.price * memberCount / (plan.billing_interval === 'yearly' ? 12 : plan.billing_interval === 'quarterly' ? 3 : 1)).toFixed(2)}
              </span>
            </div>
          </div>
        )}

        {/* Subscription Button */}
        {showSubscribeButton && (
          <div className="pt-4 border-t">
            <SubscriptionButton
              membershipPlanId={plan.id}
              planName={plan.name}
              price={plan.price}
              billingInterval={plan.billing_interval}
              isCurrentPlan={isCurrentPlan}
            />
          </div>
        )}
      </CardContent>
    </Card>
  );
}