import React, { useState, useEffect } from 'react';
import QRCode from 'qrcode';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Copy, Download, RefreshCw } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export const QRCodeDisplay: React.FC = () => {
  const [qrCodeUrl, setQrCodeUrl] = useState<string>('');
  const [isGenerating, setIsGenerating] = useState(false);
  const { profile, refreshProfile } = useAuth();
  const { toast } = useToast();

  const generateQRCode = async () => {
    if (!profile?.barcode) return;
    
    try {
      setIsGenerating(true);
      const qrDataUrl = await QRCode.toDataURL(profile.barcode, {
        width: 256,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#FFFFFF',
        },
      });
      setQrCodeUrl(qrDataUrl);
    } catch (error) {
      console.error('Error generating QR code:', error);
      toast({
        title: 'Error',
        description: 'Failed to generate QR code',
        variant: 'destructive',
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const regenerateBarcode = async () => {
    if (!profile) return;
    
    try {
      setIsGenerating(true);
      
      // Force regeneration by updating the profile
      const { error } = await supabase
        .from('profiles')
        .update({ 
          barcode: null,  // This will trigger the function to generate a new one
          barcode_generated_at: new Date().toISOString()
        })
        .eq('id', profile.id);
        
      if (error) throw error;
      
      await refreshProfile();
      
      toast({
        title: 'Success',
        description: 'New barcode generated successfully',
      });
    } catch (error) {
      console.error('Error regenerating barcode:', error);
      toast({
        title: 'Error', 
        description: 'Failed to regenerate barcode',
        variant: 'destructive',
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const copyBarcode = () => {
    if (profile?.barcode) {
      navigator.clipboard.writeText(profile.barcode);
      toast({
        title: 'Copied',
        description: 'Barcode copied to clipboard',
      });
    }
  };

  const downloadQR = () => {
    if (!qrCodeUrl) return;
    
    const link = document.createElement('a');
    link.download = `gym-qr-${profile?.barcode}.png`;
    link.href = qrCodeUrl;
    link.click();
  };

  useEffect(() => {
    if (profile?.barcode) {
      generateQRCode();
    }
  }, [profile?.barcode]);

  if (profile?.role !== 'member') {
    return null;
  }

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle className="text-center">Your Gym QR Code</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {profile?.barcode ? (
          <>
            {/* QR Code Display */}
            <div className="flex justify-center">
              {isGenerating ? (
                <div className="w-64 h-64 flex items-center justify-center bg-muted rounded-lg">
                  <RefreshCw className="w-8 h-8 animate-spin text-muted-foreground" />
                </div>
              ) : qrCodeUrl ? (
                <img 
                  src={qrCodeUrl} 
                  alt="Member QR Code" 
                  className="w-64 h-64 border rounded-lg"
                />
              ) : null}
            </div>
            
            {/* Barcode Number */}
            <div className="text-center">
              <p className="text-sm text-muted-foreground mb-2">Member ID:</p>
              <p className="text-lg font-mono font-bold tracking-wider">
                {profile.barcode}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Generated: {profile.barcode_generated_at ? 
                  new Date(profile.barcode_generated_at).toLocaleDateString() : 
                  'Unknown'
                }
              </p>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-2 justify-center">
              <Button variant="outline" size="sm" onClick={copyBarcode}>
                <Copy className="w-4 h-4 mr-2" />
                Copy ID
              </Button>
              
              {qrCodeUrl && (
                <Button variant="outline" size="sm" onClick={downloadQR}>
                  <Download className="w-4 h-4 mr-2" />
                  Download
                </Button>
              )}
              
              <Button 
                variant="outline" 
                size="sm" 
                onClick={regenerateBarcode}
                disabled={isGenerating}
              >
                <RefreshCw className={`w-4 h-4 mr-2 ${isGenerating ? 'animate-spin' : ''}`} />
                New ID
              </Button>
            </div>
            
            <div className="text-center text-xs text-muted-foreground px-4">
              <p>Show this QR code or provide your Member ID at check-in</p>
            </div>
          </>
        ) : (
          <div className="text-center py-8">
            <p className="text-muted-foreground mb-4">Generating your member ID...</p>
            <Button onClick={regenerateBarcode} disabled={isGenerating}>
              <RefreshCw className={`w-4 h-4 mr-2 ${isGenerating ? 'animate-spin' : ''}`} />
              Generate Member ID
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};