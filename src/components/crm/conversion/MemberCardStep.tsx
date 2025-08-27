import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  IdCard, 
  QrCode, 
  Nfc, 
  User, 
  Calendar,
  Hash,
  Download,
  Printer,
  CheckCircle,
  CreditCard
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

interface MemberCardStepProps {
  lead: any;
  plan: any;
  onCardGenerated: () => void;
  loading: boolean;
}

interface MemberCard {
  id: string;
  card_number: string;
  nfc_enabled: boolean;
  nfc_uid: string | null;
  barcode: string;
  qr_code: string;
  status: string;
  issued_at: string;
  expires_at: string | null;
}

export const MemberCardStep: React.FC<MemberCardStepProps> = ({
  lead,
  plan,
  onCardGenerated,
  loading
}) => {
  const { profile } = useAuth();
  const [memberCard, setMemberCard] = useState<MemberCard | null>(null);
  const [cardOptions, setCardOptions] = useState({
    nfc_enabled: true,
    generate_barcode: true,
    generate_qr: true,
    card_expires: true
  });

  const generateMemberCard = async () => {
    if (!profile?.organization_id) return;

    try {
      // Get card number from function
      const { data: cardNumberData, error: cardNumberError } = await supabase
        .rpc('generate_member_card_number');

      if (cardNumberError) throw cardNumberError;

      // Generate barcode (same as existing member barcode)
      const { data: barcodeData, error: barcodeError } = await supabase
        .rpc('generate_member_barcode');

      if (barcodeError) throw barcodeError;

      // Calculate expiry date (1 year from now if enabled)
      const expiresAt = cardOptions.card_expires 
        ? new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString()
        : null;

      // Generate NFC UID if enabled
      const nfcUid = cardOptions.nfc_enabled 
        ? Array.from({length: 8}, () => Math.floor(Math.random() * 16).toString(16)).join('').toUpperCase()
        : null;

      // Create QR code data (member ID + card number)
      const qrCode = cardOptions.generate_qr 
        ? `MEMBER:${lead.id}:${cardNumberData}`
        : null;

      const memberCardData = {
        member_id: lead.id, // This should be the converted member ID
        card_number: cardNumberData,
        nfc_enabled: cardOptions.nfc_enabled,
        nfc_uid: nfcUid,
        barcode: cardOptions.generate_barcode ? barcodeData : null,
        qr_code: qrCode,
        status: 'active',
        expires_at: expiresAt
      };

      const { data, error } = await supabase
        .from('member_cards')
        .insert(memberCardData)
        .select()
        .single();

      if (error) throw error;

      setMemberCard(data);
      toast.success('Member card generated successfully');

    } catch (error: any) {
      console.error('Error generating member card:', error);
      toast.error('Failed to generate member card');
    }
  };

  const downloadCardData = () => {
    if (!memberCard) return;

    const cardData = {
      memberName: `${lead.first_name || ''} ${lead.last_name || ''}`.trim() || lead.email,
      memberEmail: lead.email,
      cardNumber: memberCard.card_number,
      barcode: memberCard.barcode,
      qrCode: memberCard.qr_code,
      nfcUid: memberCard.nfc_uid,
      plan: plan.name,
      issuedDate: new Date(memberCard.issued_at).toLocaleDateString(),
      expiresDate: memberCard.expires_at ? new Date(memberCard.expires_at).toLocaleDateString() : 'No expiry'
    };

    const element = document.createElement('a');
    const file = new Blob([JSON.stringify(cardData, null, 2)], { type: 'application/json' });
    element.href = URL.createObjectURL(file);
    element.download = `member_card_${memberCard.card_number}.json`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-2">Member Card & Access</h3>
        <p className="text-muted-foreground text-sm">
          Generate the member's access card with barcode, QR code, and NFC capabilities.
        </p>
      </div>

      {/* Card Configuration */}
      {!memberCard && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <IdCard className="h-4 w-4" />
              Card Configuration
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="nfc_enabled">NFC Enabled</Label>
                  <p className="text-xs text-muted-foreground">Enable contactless access</p>
                </div>
                <Switch
                  id="nfc_enabled"
                  checked={cardOptions.nfc_enabled}
                  onCheckedChange={(checked) => 
                    setCardOptions(prev => ({ ...prev, nfc_enabled: checked }))
                  }
                />
              </div>
              
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="generate_barcode">Generate Barcode</Label>
                  <p className="text-xs text-muted-foreground">Create scannable barcode</p>
                </div>
                <Switch
                  id="generate_barcode"
                  checked={cardOptions.generate_barcode}
                  onCheckedChange={(checked) => 
                    setCardOptions(prev => ({ ...prev, generate_barcode: checked }))
                  }
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="generate_qr">Generate QR Code</Label>
                  <p className="text-xs text-muted-foreground">Create QR code for mobile access</p>
                </div>
                <Switch
                  id="generate_qr"
                  checked={cardOptions.generate_qr}
                  onCheckedChange={(checked) => 
                    setCardOptions(prev => ({ ...prev, generate_qr: checked }))
                  }
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="card_expires">Card Expiry</Label>
                  <p className="text-xs text-muted-foreground">Set 1-year expiration date</p>
                </div>
                <Switch
                  id="card_expires"
                  checked={cardOptions.card_expires}
                  onCheckedChange={(checked) => 
                    setCardOptions(prev => ({ ...prev, card_expires: checked }))
                  }
                />
              </div>
            </div>

            <Button 
              onClick={generateMemberCard}
              className="w-full bg-gradient-secondary hover:opacity-90"
            >
              <IdCard className="h-4 w-4 mr-2" />
              Generate Member Card
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Generated Card Display */}
      {memberCard && (
        <Card className="border-primary/20">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2 text-primary">
              <CheckCircle className="h-4 w-4" />
              Member Card Generated
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Card Preview */}
            <div className="bg-gradient-to-r from-primary to-primary/80 text-primary-foreground rounded-lg p-6">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-xl font-bold">
                    {`${lead.first_name || ''} ${lead.last_name || ''}`.trim() || lead.email}
                  </h3>
                  <p className="text-primary-foreground/80">{plan.name} Member</p>
                </div>
                <div className="text-right">
                  <div className="text-sm opacity-80">Card #</div>
                  <div className="font-mono font-bold">{memberCard.card_number}</div>
                </div>
              </div>
              
              <div className="flex justify-between items-end">
                <div className="space-y-1">
                  <div className="text-xs opacity-80">Valid From</div>
                  <div className="text-sm">
                    {new Date(memberCard.issued_at).toLocaleDateString()}
                  </div>
                </div>
                {memberCard.expires_at && (
                  <div className="space-y-1 text-right">
                    <div className="text-xs opacity-80">Valid Until</div>
                    <div className="text-sm">
                      {new Date(memberCard.expires_at).toLocaleDateString()}
                    </div>
                  </div>
                )}
                <div className="flex items-center gap-2">
                  {memberCard.nfc_enabled && (
                    <div className="flex items-center gap-1">
                      <Nfc className="h-4 w-4" />
                      <span className="text-xs">NFC</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Card Details */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Card Number:</span>
                  <span className="font-mono">{memberCard.card_number}</span>
                </div>
                
                {memberCard.barcode && (
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Barcode:</span>
                    <span className="font-mono">{memberCard.barcode}</span>
                  </div>
                )}
                
                {memberCard.nfc_uid && (
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">NFC UID:</span>
                    <span className="font-mono">{memberCard.nfc_uid}</span>
                  </div>
                )}
              </div>
              
              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Status:</span>
                  <Badge variant="default">{memberCard.status}</Badge>
                </div>
                
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Issued:</span>
                  <span>{new Date(memberCard.issued_at).toLocaleDateString()}</span>
                </div>
                
                {memberCard.expires_at && (
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Expires:</span>
                    <span>{new Date(memberCard.expires_at).toLocaleDateString()}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Access Codes Display */}
            {(memberCard.barcode || memberCard.qr_code) && (
              <>
                <Separator />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {memberCard.barcode && (
                    <Card>
                      <CardContent className="p-4 text-center">
                        <QrCode className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                        <div className="text-xs text-muted-foreground mb-1">Barcode</div>
                        <div className="font-mono text-sm">{memberCard.barcode}</div>
                      </CardContent>
                    </Card>
                  )}
                  
                  {memberCard.qr_code && (
                    <Card>
                      <CardContent className="p-4 text-center">
                        <QrCode className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                        <div className="text-xs text-muted-foreground mb-1">QR Code</div>
                        <div className="font-mono text-xs break-all">{memberCard.qr_code}</div>
                      </CardContent>
                    </Card>
                  )}
                </div>
              </>
            )}

            {/* Card Actions */}
            <div className="flex gap-2 justify-center">
              <Button variant="outline" onClick={downloadCardData}>
                <Download className="h-4 w-4 mr-2" />
                Download Card Data
              </Button>
              <Button variant="outline">
                <Printer className="h-4 w-4 mr-2" />
                Print Card
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Complete Conversion */}
      {memberCard && (
        <div className="flex justify-center">
          <Button 
            onClick={onCardGenerated}
            disabled={loading}
            size="lg"
            className="bg-gradient-secondary hover:opacity-90"
          >
            {loading ? 'Completing Conversion...' : 'Complete Member Conversion'}
          </Button>
        </div>
      )}
    </div>
  );
};