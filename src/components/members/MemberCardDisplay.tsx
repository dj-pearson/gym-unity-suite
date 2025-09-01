import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  IdCard, 
  QrCode, 
  Nfc, 
  BarChart3,
  Calendar,
  Download,
  Copy,
  CheckCircle,
  AlertTriangle
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';

interface MemberCard {
  id: string;
  card_number: string;
  nfc_enabled: boolean;
  nfc_uid: string | null;
  barcode: string | null;
  qr_code: string | null;
  status: string;
  issued_at: string;
  expires_at: string | null;
  created_at: string;
}

export default function MemberCardDisplay() {
  const { profile } = useAuth();
  const { toast } = useToast();
  const [memberCard, setMemberCard] = useState<MemberCard | null>(null);
  const [loading, setLoading] = useState(true);
  const [showFullQR, setShowFullQR] = useState(false);

  useEffect(() => {
    if (profile?.id) {
      fetchMemberCard();
    }
  }, [profile]);

  const fetchMemberCard = async () => {
    try {
      const { data, error } = await supabase
        .from('member_cards')
        .select('*')
        .eq('member_id', profile?.id)
        .eq('status', 'active')
        .order('created_at', { ascending: false })
        .limit(1);

      if (error) throw error;
      
      if (data && data.length > 0) {
        setMemberCard(data[0]);
      }
    } catch (error) {
      console.error('Error fetching member card:', error);
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = async (text: string, type: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast({
        title: "Copied!",
        description: `${type} copied to clipboard`,
      });
    } catch (error) {
      toast({
        title: "Copy failed",
        description: "Unable to copy to clipboard",
        variant: "destructive"
      });
    }
  };

  const downloadCardData = () => {
    if (!memberCard) return;

    const cardData = {
      memberName: `${profile?.first_name || ''} ${profile?.last_name || ''}`.trim() || profile?.email,
      memberEmail: profile?.email,
      cardNumber: memberCard.card_number,
      barcode: memberCard.barcode,
      qrCode: memberCard.qr_code,
      nfcUid: memberCard.nfc_uid,
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

  const isExpired = memberCard?.expires_at && new Date(memberCard.expires_at) < new Date();
  const expiresWithin30Days = memberCard?.expires_at && 
    new Date(memberCard.expires_at) < new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-muted rounded w-1/2"></div>
            <div className="h-20 bg-muted rounded"></div>
            <div className="space-y-2">
              <div className="h-3 bg-muted rounded"></div>
              <div className="h-3 bg-muted rounded w-3/4"></div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!memberCard) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <IdCard className="w-5 h-5" />
            Member Card
          </CardTitle>
          <CardDescription>
            Your digital membership card for gym access
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              No active member card found. Please contact the front desk to have a card issued.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Expiry Alerts */}
      {isExpired && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            Your member card has expired. Please renew your membership to continue accessing the gym.
          </AlertDescription>
        </Alert>
      )}

      {expiresWithin30Days && !isExpired && (
        <Alert>
          <Calendar className="h-4 w-4" />
          <AlertDescription>
            Your member card expires on {format(new Date(memberCard.expires_at!), 'MMMM d, yyyy')}. 
            Consider renewing your membership soon.
          </AlertDescription>
        </Alert>
      )}

      {/* Digital Member Card */}
      <Card className={`${isExpired ? 'opacity-75' : ''}`}>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <IdCard className="w-5 h-5" />
              Member Card
            </CardTitle>
            <Badge 
              variant={isExpired ? "destructive" : memberCard.status === 'active' ? "default" : "secondary"}
            >
              {isExpired ? 'Expired' : memberCard.status}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Card Visual */}
          <div className="bg-gradient-to-r from-primary to-primary/80 text-primary-foreground rounded-lg p-6 relative overflow-hidden">
            {/* Background Pattern */}
            <div className="absolute inset-0 opacity-10">
              <div className="absolute -top-4 -right-4 w-24 h-24 rounded-full border-2 border-white"></div>
              <div className="absolute -bottom-4 -left-4 w-16 h-16 rounded-full border border-white"></div>
            </div>
            
            <div className="relative z-10">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-xl font-bold">
                    {`${profile?.first_name || ''} ${profile?.last_name || ''}`.trim() || profile?.email}
                  </h3>
                  <p className="text-primary-foreground/80 capitalize">
                    {profile?.role} Member
                  </p>
                </div>
                <div className="text-right">
                  <div className="text-sm opacity-80">Card #</div>
                  <div className="font-mono font-bold text-lg">{memberCard.card_number}</div>
                </div>
              </div>
              
              <div className="flex justify-between items-end">
                <div className="space-y-1">
                  <div className="text-xs opacity-80">Valid From</div>
                  <div className="text-sm">
                    {format(new Date(memberCard.issued_at), 'MM/yy')}
                  </div>
                </div>
                {memberCard.expires_at && (
                  <div className="space-y-1 text-right">
                    <div className="text-xs opacity-80">Valid Until</div>
                    <div className="text-sm">
                      {format(new Date(memberCard.expires_at), 'MM/yy')}
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
          </div>

          {/* Card Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-3">
              <div className="flex justify-between items-center text-sm">
                <span className="text-muted-foreground">Card Number:</span>
                <div className="flex items-center gap-2">
                  <span className="font-mono">{memberCard.card_number}</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 w-6 p-0"
                    onClick={() => copyToClipboard(memberCard.card_number, 'Card number')}
                  >
                    <Copy className="h-3 w-3" />
                  </Button>
                </div>
              </div>
              
              {memberCard.barcode && (
                <div className="flex justify-between items-center text-sm">
                  <span className="text-muted-foreground">Barcode:</span>
                  <div className="flex items-center gap-2">
                    <span className="font-mono">{memberCard.barcode}</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 w-6 p-0"
                      onClick={() => copyToClipboard(memberCard.barcode!, 'Barcode')}
                    >
                      <Copy className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              )}
              
              {memberCard.nfc_uid && (
                <div className="flex justify-between items-center text-sm">
                  <span className="text-muted-foreground">NFC UID:</span>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs">{memberCard.nfc_uid}</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 w-6 p-0"
                      onClick={() => copyToClipboard(memberCard.nfc_uid!, 'NFC UID')}
                    >
                      <Copy className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              )}
            </div>
            
            <div className="space-y-3">
              <div className="flex justify-between items-center text-sm">
                <span className="text-muted-foreground">Status:</span>
                <Badge variant={memberCard.status === 'active' ? "default" : "secondary"}>
                  {memberCard.status}
                </Badge>
              </div>
              
              <div className="flex justify-between items-center text-sm">
                <span className="text-muted-foreground">Issued:</span>
                <span>{format(new Date(memberCard.issued_at), 'MMM d, yyyy')}</span>
              </div>
              
              {memberCard.expires_at && (
                <div className="flex justify-between items-center text-sm">
                  <span className="text-muted-foreground">Expires:</span>
                  <span className={isExpired ? 'text-destructive' : expiresWithin30Days ? 'text-orange-500' : ''}>
                    {format(new Date(memberCard.expires_at), 'MMM d, yyyy')}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* QR Code Display */}
          {memberCard.qr_code && (
            <Card>
              <CardContent className="p-4 text-center">
                <QrCode className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                <div className="text-xs text-muted-foreground mb-2">QR Code for Mobile Access</div>
                {showFullQR ? (
                  <div className="space-y-2">
                    <div className="font-mono text-xs break-all bg-muted p-2 rounded">
                      {memberCard.qr_code}
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setShowFullQR(false)}
                    >
                      Hide Details
                    </Button>
                  </div>
                ) : (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowFullQR(true)}
                  >
                    Show QR Data
                  </Button>
                )}
              </CardContent>
            </Card>
          )}

          {/* Card Actions */}
          <div className="flex gap-2 flex-wrap">
            <Button 
              variant="outline" 
              onClick={downloadCardData}
              className="flex-1"
            >
              <Download className="h-4 w-4 mr-2" />
              Download Card Data
            </Button>
            {memberCard.qr_code && (
              <Button
                variant="outline"
                onClick={() => copyToClipboard(memberCard.qr_code!, 'QR Code')}
                className="flex-1"
              >
                <QrCode className="h-4 w-4 mr-2" />
                Copy QR Code
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}