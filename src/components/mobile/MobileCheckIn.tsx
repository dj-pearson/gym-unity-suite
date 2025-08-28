import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  QrCode, 
  Smartphone, 
  MapPin, 
  Clock, 
  CheckCircle,
  User,
  Camera,
  Scan
} from 'lucide-react';
import { format } from 'date-fns';
import { QRCodeDisplay } from '@/components/auth/QRCodeDisplay';
import { BarcodeLogin } from '@/components/auth/BarcodeLogin';

interface CheckIn {
  id: string;
  checked_in_at: string;
  checked_out_at?: string;
  location: {
    name: string;
  };
}

interface Location {
  id: string;
  name: string;
  address?: string;
}

export default function MobileCheckIn() {
  const { profile } = useAuth();
  const { toast } = useToast();
  const [currentCheckIn, setCurrentCheckIn] = useState<CheckIn | null>(null);
  const [recentCheckIns, setRecentCheckIns] = useState<CheckIn[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [loading, setLoading] = useState(true);
  const [showQRCode, setShowQRCode] = useState(false);
  const [showBarcodeScanner, setShowBarcodeScanner] = useState(false);
  const [selectedLocationId, setSelectedLocationId] = useState<string>('');

  useEffect(() => {
    if (profile?.organization_id) {
      fetchData();
    }
  }, [profile]);

  const fetchData = async () => {
    try {
      // Get current check-in
      const { data: currentData } = await supabase
        .from('check_ins')
        .select(`
          id,
          checked_in_at,
          checked_out_at,
          locations:location_id (name)
        `)
        .eq('member_id', profile?.id)
        .is('checked_out_at', null)
        .single();

      // Get recent check-ins
      const { data: recentData } = await supabase
        .from('check_ins')
        .select(`
          id,
          checked_in_at,
          checked_out_at,
          locations:location_id (name)
        `)
        .eq('member_id', profile?.id)
        .order('checked_in_at', { ascending: false })
        .limit(5);

      // Get available locations
      const { data: locationsData } = await supabase
        .from('locations')
        .select('id, name, address')
        .eq('organization_id', profile?.organization_id)
        .order('name');

      setCurrentCheckIn(currentData ? {
        ...currentData,
        location: currentData.locations || { name: 'Unknown Location' }
      } : null);
      
      setRecentCheckIns((recentData || []).map(checkIn => ({
        ...checkIn,
        location: checkIn.locations || { name: 'Unknown Location' }
      })));
      setLocations(locationsData || []);
      
      if (locationsData?.length === 1) {
        setSelectedLocationId(locationsData[0].id);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCheckIn = async (locationId?: string) => {
    if (!profile?.id || (!locationId && !selectedLocationId)) {
      toast({
        title: "Error",
        description: "Please select a location to check in",
        variant: "destructive"
      });
      return;
    }

    try {
      const { error } = await supabase
        .from('check_ins')
        .insert([{
          member_id: profile.id,
          location_id: locationId || selectedLocationId,
          checked_in_at: new Date().toISOString()
        }]);

      if (error) throw error;

      toast({
        title: "Checked In Successfully",
        description: "Welcome to the gym! Have a great workout!"
      });

      fetchData();
    } catch (error) {
      console.error('Error checking in:', error);
      toast({
        title: "Check-in Failed",
        description: "Unable to check you in. Please try again.",
        variant: "destructive"
      });
    }
  };

  const handleCheckOut = async () => {
    if (!currentCheckIn) return;

    try {
      const { error } = await supabase
        .from('check_ins')
        .update({ checked_out_at: new Date().toISOString() })
        .eq('id', currentCheckIn.id);

      if (error) throw error;

      toast({
        title: "Checked Out Successfully",
        description: "Thanks for visiting! See you next time!"
      });

      setCurrentCheckIn(null);
      fetchData();
    } catch (error) {
      console.error('Error checking out:', error);
      toast({
        title: "Check-out Failed",
        description: "Unable to check you out. Please try again.",
        variant: "destructive"
      });
    }
  };

  const getCheckInDuration = (checkedInAt: string) => {
    const duration = new Date().getTime() - new Date(checkedInAt).getTime();
    const minutes = Math.floor(duration / (1000 * 60));
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;

    if (hours > 0) {
      return `${hours}h ${remainingMinutes}m`;
    }
    return `${minutes}m`;
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center p-8">
        <div className="text-center">
          <Clock className="w-8 h-8 animate-spin mx-auto mb-2" />
          <p>Loading check-in status...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 p-4 max-w-md mx-auto">
      {/* Current Status */}
      {currentCheckIn ? (
        <Card className="border-green-200 bg-green-50 dark:bg-green-950 dark:border-green-800">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2 text-green-700 dark:text-green-300">
                <CheckCircle className="w-5 h-5" />
                Checked In
              </CardTitle>
              <Badge variant="outline" className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                Active
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center gap-2 text-sm">
              <MapPin className="w-4 h-4 text-muted-foreground" />
              <span>{(currentCheckIn.location as any)?.name || 'Unknown Location'}</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <Clock className="w-4 h-4 text-muted-foreground" />
              <span>
                {format(new Date(currentCheckIn.checked_in_at), 'MMM d, h:mm a')} 
                • {getCheckInDuration(currentCheckIn.checked_in_at)}
              </span>
            </div>
            <Button 
              onClick={handleCheckOut}
              className="w-full"
              variant="outline"
            >
              Check Out
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Smartphone className="w-5 h-5" />
              Quick Check-In
            </CardTitle>
            <CardDescription>
              Select your location and check in to start your workout
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {locations.length > 1 && (
              <div className="space-y-2">
                <label className="text-sm font-medium">Select Location</label>
                <div className="grid gap-2">
                  {locations.map((location) => (
                    <Card 
                      key={location.id}
                      className={`cursor-pointer transition-colors ${
                        selectedLocationId === location.id 
                          ? 'border-primary bg-primary/5' 
                          : 'hover:bg-muted/50'
                      }`}
                      onClick={() => setSelectedLocationId(location.id)}
                    >
                      <CardContent className="p-3">
                        <div className="flex items-center justify-between">
                          <div>
                            <h4 className="font-medium">{location.name}</h4>
                            {location.address && (
                              <p className="text-sm text-muted-foreground">{location.address}</p>
                            )}
                          </div>
                          {selectedLocationId === location.id && (
                            <CheckCircle className="w-5 h-5 text-primary" />
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 gap-3">
              <Button 
                onClick={() => handleCheckIn()}
                disabled={!selectedLocationId}
                size="lg"
                className="w-full"
              >
                <User className="w-4 h-4 mr-2" />
                Check In Now
              </Button>

              <div className="grid grid-cols-2 gap-2">
                <Button 
                  variant="outline" 
                  onClick={() => setShowQRCode(true)}
                  size="sm"
                >
                  <QrCode className="w-4 h-4 mr-1" />
                  QR Code
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => setShowBarcodeScanner(true)}
                  size="sm"
                >
                  <Scan className="w-4 h-4 mr-1" />
                  Scan
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Recent Check-ins */}
      {recentCheckIns.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Recent Visits</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {recentCheckIns.slice(0, 3).map((checkIn, index) => (
              <div key={checkIn.id}>
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <MapPin className="w-3 h-3 text-muted-foreground" />
                    <span>{(checkIn.location as any)?.name}</span>
                  </div>
                  <span className="text-muted-foreground">
                    {format(new Date(checkIn.checked_in_at), 'MMM d')}
                  </span>
                </div>
                {index < recentCheckIns.slice(0, 3).length - 1 && (
                  <Separator className="mt-3" />
                )}
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* QR Code Modal */}
      {showQRCode && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <Card className="w-full max-w-sm">
            <CardHeader>
              <CardTitle className="text-center">Your Member QR Code</CardTitle>
              <CardDescription className="text-center">
                Show this code at the front desk to check in
              </CardDescription>
            </CardHeader>
            <CardContent className="text-center space-y-4">
              <QRCodeDisplay />
              <Button 
                variant="outline" 
                onClick={() => setShowQRCode(false)}
                className="w-full"
              >
                Close
              </Button>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Barcode Scanner Modal */}
      {showBarcodeScanner && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <Card className="w-full max-w-sm">
            <CardHeader>
              <CardTitle className="text-center">Scan Barcode</CardTitle>
              <CardDescription className="text-center">
                Scan a barcode or QR code to check in
              </CardDescription>
            </CardHeader>
            <CardContent>
              <BarcodeLogin 
                onSuccess={() => {
                  // Handle successful scan - could trigger check-in
                  setShowBarcodeScanner(false);
                  toast({
                    title: "Scan Successful",
                    description: "Processing check-in..."
                  });
                }}
              />
              <Button 
                variant="outline" 
                onClick={() => setShowBarcodeScanner(false)}
                className="w-full mt-4"
              >
                Cancel
              </Button>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}