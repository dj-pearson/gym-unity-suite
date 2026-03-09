import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { QrCode, CreditCard, Smartphone } from 'lucide-react';

/**
 * Portal check-in page - displays the member's QR code/barcode for gym check-in.
 * Wraps existing check-in components in a portal-friendly layout.
 */
export default function PortalCheckInPage() {
  const { profile } = useAuth();

  return (
    <div className="space-y-6 max-w-lg mx-auto">
      <div className="text-center space-y-2">
        <h1 className="text-2xl font-bold">Check In</h1>
        <p className="text-muted-foreground">
          Show this code at the front desk or scan at the kiosk
        </p>
      </div>

      <Card>
        <CardContent className="py-8 flex flex-col items-center space-y-6">
          {/* QR Code placeholder - will use MemberCheckInPass when available */}
          <div className="w-48 h-48 bg-muted rounded-lg flex items-center justify-center border-2 border-dashed border-muted-foreground/30">
            <QrCode className="h-24 w-24 text-muted-foreground/50" />
          </div>

          <div className="text-center space-y-1">
            <p className="font-semibold text-lg">
              {profile?.first_name} {profile?.last_name}
            </p>
            <p className="text-sm text-muted-foreground">
              Member
            </p>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-2 gap-3">
        <Card className="cursor-pointer hover:bg-muted/50 transition-colors">
          <CardContent className="py-4 flex flex-col items-center gap-2">
            <CreditCard className="h-6 w-6 text-primary" />
            <span className="text-sm font-medium">Member Card</span>
          </CardContent>
        </Card>
        <Card className="cursor-pointer hover:bg-muted/50 transition-colors">
          <CardContent className="py-4 flex flex-col items-center gap-2">
            <Smartphone className="h-6 w-6 text-primary" />
            <span className="text-sm font-medium">Add to Wallet</span>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
