import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { 
  CreditCard, 
  Banknote, 
  Smartphone, 
  DollarSign,
  Receipt,
  CalendarDays,
  User,
  Lock
} from 'lucide-react';
import { supabase, invokeEdgeFunction } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

interface PaymentStepProps {
  lead: any;
  plan: any;
  promotion: any;
  finalAmount: number;
  onPaymentCompleted: (paymentData: any) => void;
}

export const PaymentStep: React.FC<PaymentStepProps> = ({
  lead,
  plan,
  promotion,
  finalAmount,
  onPaymentCompleted
}) => {
  const { profile } = useAuth();
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'card' | 'nfc' | 'stripe'>('card');
  const [loading, setLoading] = useState(false);
  const [paymentData, setPaymentData] = useState({
    cardNumber: '',
    expiryDate: '',
    cvv: '',
    cardholderName: '',
    cashAmount: finalAmount,
    notes: ''
  });

  const formatCardNumber = (value: string) => {
    const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
    const matches = v.match(/\d{4,16}/g);
    const match = matches && matches[0] || '';
    const parts = [];

    for (let i = 0, len = match.length; i < len; i += 4) {
      parts.push(match.substring(i, i + 4));
    }

    if (parts.length) {
      return parts.join(' ');
    } else {
      return v;
    }
  };

  const formatExpiryDate = (value: string) => {
    const v = value.replace(/\D/g, '');
    if (v.length >= 2) {
      return v.substring(0, 2) + '/' + v.substring(2, 4);
    }
    return v;
  };

  const handleInputChange = (field: string, value: string) => {
    let processedValue = value;
    
    if (field === 'cardNumber') {
      processedValue = formatCardNumber(value);
    } else if (field === 'expiryDate') {
      processedValue = formatExpiryDate(value);
    } else if (field === 'cvv') {
      processedValue = value.replace(/\D/g, '').substring(0, 4);
    }
    
    setPaymentData(prev => ({ ...prev, [field]: processedValue }));
  };

  const validateCardData = () => {
    const { cardNumber, expiryDate, cvv, cardholderName } = paymentData;
    
    if (!cardNumber || cardNumber.replace(/\s/g, '').length < 13) {
      toast.error('Please enter a valid card number');
      return false;
    }
    
    if (!expiryDate || expiryDate.length !== 5) {
      toast.error('Please enter a valid expiry date (MM/YY)');
      return false;
    }
    
    if (!cvv || cvv.length < 3) {
      toast.error('Please enter a valid CVV');
      return false;
    }
    
    if (!cardholderName.trim()) {
      toast.error('Please enter the cardholder name');
      return false;
    }
    
    return true;
  };

  const processPayment = async () => {
    if (paymentMethod === 'card' && !validateCardData()) {
      return;
    }

    if (paymentMethod === 'cash' && paymentData.cashAmount < finalAmount) {
      toast.error('Cash amount must be at least the total amount due');
      return;
    }

    setLoading(true);
    try {
      // Create payment transaction record
      const transactionData: any = {
        member_id: lead.id, // This will need to be updated after member creation
        amount: finalAmount,
        currency: 'USD',
        payment_method: paymentMethod,
        payment_status: 'completed',
        processed_by: profile?.id,
        notes: paymentData.notes || null
      };

      // For card payments, add additional reference data
      if (paymentMethod === 'card') {
        transactionData.transaction_reference = `CARD_****${paymentData.cardNumber.slice(-4)}`;
      } else if (paymentMethod === 'cash') {
        transactionData.transaction_reference = `CASH_${Date.now()}`;
        if (paymentData.cashAmount > finalAmount) {
          transactionData.notes = `${transactionData.notes || ''} Change due: $${(paymentData.cashAmount - finalAmount).toFixed(2)}`.trim();
        }
      }

      const { data, error } = await supabase
        .from('payment_transactions')
        .insert(transactionData)
        .select()
        .single();

      if (error) throw error;

      // If promotion was used, update usage count
      if (promotion) {
        await supabase
          .from('promotions')
          .update({ 
            current_uses: (promotion.current_uses || 0) + 1 
          })
          .eq('id', promotion.id);
      }

      toast.success('Payment processed successfully');
      onPaymentCompleted(data);
      
    } catch (error: any) {
      console.error('Error processing payment:', error);
      toast.error('Failed to process payment');
    } finally {
      setLoading(false);
    }
  };

  const processStripePayment = async () => {
    setLoading(true);
    try {
      // For now, simulate Stripe integration - in real implementation, 
      // this would integrate with your existing Stripe checkout
      const { data, error } = await invokeEdgeFunction<{ url: string }>('create-checkout', {
        body: {
          membership_plan_id: plan.id,
          promotion_id: promotion?.id,
          lead_id: lead.id
        }
      });

      if (error) throw error;

      if (data?.url) {
        window.open(data.url, '_blank');
        // For demo purposes, we'll simulate successful payment
        setTimeout(() => {
          onPaymentCompleted({
            id: 'stripe_demo_' + Date.now(),
            payment_method: 'stripe',
            amount: finalAmount,
            payment_status: 'completed'
          });
        }, 2000);
      }
      
    } catch (error: any) {
      console.error('Error processing Stripe payment:', error);
      toast.error('Failed to create Stripe checkout');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-2">Payment Processing</h3>
        <p className="text-muted-foreground text-sm">
          Process the membership payment to complete the conversion.
        </p>
      </div>

      {/* Payment Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Receipt className="h-4 w-4" />
            Payment Summary
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex justify-between text-sm">
            <span>Plan: {plan.name}</span>
            <span>${parseFloat(plan.price).toFixed(2)}</span>
          </div>
          
          {parseFloat(plan.signup_fee) > 0 && (
            <div className="flex justify-between text-sm">
              <span>Signup Fee</span>
              <span>${parseFloat(plan.signup_fee).toFixed(2)}</span>
            </div>
          )}
          
          {promotion && (
            <div className="flex justify-between text-sm text-green-600">
              <span>Promotion: {promotion.name}</span>
              <span>
                {promotion.discount_type === 'percentage' && `-${promotion.discount_value}%`}
                {promotion.discount_type === 'fixed_amount' && `-$${promotion.discount_value}`}
                {promotion.discount_type === 'free_months' && `${promotion.discount_value} months free`}
              </span>
            </div>
          )}
          
          <Separator />
          
          <div className="flex justify-between font-semibold">
            <span>Total Due</span>
            <span>${finalAmount.toFixed(2)}</span>
          </div>
        </CardContent>
      </Card>

      {/* Payment Methods */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Payment Method</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs value={paymentMethod} onValueChange={(value: any) => setPaymentMethod(value)}>
            <TabsList className="grid grid-cols-4 w-full">
              <TabsTrigger value="card">
                <CreditCard className="h-4 w-4 mr-1" />
                Card
              </TabsTrigger>
              <TabsTrigger value="cash">
                <Banknote className="h-4 w-4 mr-1" />
                Cash
              </TabsTrigger>
              <TabsTrigger value="nfc">
                <Smartphone className="h-4 w-4 mr-1" />
                NFC/Tap
              </TabsTrigger>
              <TabsTrigger value="stripe">
                <Lock className="h-4 w-4 mr-1" />
                Stripe
              </TabsTrigger>
            </TabsList>

            <TabsContent value="card" className="space-y-4 mt-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="cardNumber">Card Number</Label>
                  <Input
                    id="cardNumber"
                    placeholder="1234 5678 9012 3456"
                    value={paymentData.cardNumber}
                    onChange={(e) => handleInputChange('cardNumber', e.target.value)}
                    maxLength={19}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="cardholderName">Cardholder Name</Label>
                  <Input
                    id="cardholderName"
                    placeholder="John Doe"
                    value={paymentData.cardholderName}
                    onChange={(e) => handleInputChange('cardholderName', e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="expiryDate">Expiry Date</Label>
                  <Input
                    id="expiryDate"
                    placeholder="MM/YY"
                    value={paymentData.expiryDate}
                    onChange={(e) => handleInputChange('expiryDate', e.target.value)}
                    maxLength={5}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="cvv">CVV</Label>
                  <Input
                    id="cvv"
                    placeholder="123"
                    type="password"
                    value={paymentData.cvv}
                    onChange={(e) => handleInputChange('cvv', e.target.value)}
                    maxLength={4}
                  />
                </div>
              </div>
            </TabsContent>

            <TabsContent value="cash" className="space-y-4 mt-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="cashAmount">Cash Received</Label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="cashAmount"
                      type="number"
                      step="0.01"
                      min={finalAmount}
                      value={paymentData.cashAmount}
                      onChange={(e) => setPaymentData(prev => ({ ...prev, cashAmount: parseFloat(e.target.value) || 0 }))}
                      className="pl-10"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Change Due</Label>
                  <div className="p-2 bg-muted rounded-md text-center font-medium">
                    ${Math.max(0, paymentData.cashAmount - finalAmount).toFixed(2)}
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="nfc" className="space-y-4 mt-4">
              <Card className="border-dashed">
                <CardContent className="p-8 text-center">
                  <Smartphone className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <h4 className="font-medium mb-2">NFC/Contactless Payment</h4>
                  <p className="text-sm text-muted-foreground mb-4">
                    Please tap the card or device on the NFC reader
                  </p>
                  <Badge variant="outline">Waiting for tap...</Badge>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="stripe" className="space-y-4 mt-4">
              <Card>
                <CardContent className="p-6 text-center">
                  <Lock className="h-12 w-12 mx-auto text-primary mb-4" />
                  <h4 className="font-medium mb-2">Secure Online Payment</h4>
                  <p className="text-sm text-muted-foreground mb-4">
                    Process payment through Stripe's secure payment gateway
                  </p>
                  <Button 
                    onClick={processStripePayment}
                    disabled={loading}
                    className="bg-gradient-secondary hover:opacity-90"
                  >
                    {loading ? 'Creating Checkout...' : `Pay $${finalAmount.toFixed(2)} with Stripe`}
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          {/* Notes */}
          <div className="mt-4 space-y-2">
            <Label htmlFor="notes">Payment Notes (Optional)</Label>
            <Textarea
              id="notes"
              placeholder="Add any additional notes about the payment..."
              value={paymentData.notes}
              onChange={(e) => setPaymentData(prev => ({ ...prev, notes: e.target.value }))}
              rows={2}
            />
          </div>
        </CardContent>
      </Card>

      {/* Process Payment Button */}
      {paymentMethod !== 'stripe' && (
        <div className="flex justify-end">
          <Button 
            onClick={processPayment}
            disabled={loading}
            className="bg-gradient-secondary hover:opacity-90"
          >
            {loading ? 'Processing...' : `Process Payment - $${finalAmount.toFixed(2)}`}
          </Button>
        </div>
      )}
    </div>
  );
};