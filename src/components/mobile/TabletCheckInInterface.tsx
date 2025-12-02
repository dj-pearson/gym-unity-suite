import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Scan,
  UserCheck,
  User,
  MapPin,
  CheckCircle,
  Clock,
  Search,
  UserPlus,
  LogOut,
  Camera,
  Keyboard,
  Loader2,
  AlertTriangle,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { TabletSignupForm } from '@/components/members/TabletSignupForm';
import { CameraScanner } from '@/components/checkin/CameraScanner';
import { useBarcodeScanner } from '@/hooks/useBarcodeScanner';
import { cn } from '@/lib/utils';

interface Member {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  barcode: string;
  phone?: string;
  created_at: string;
}

interface CheckIn {
  id: string;
  member_id: string;
  checked_in_at: string;
  checked_out_at?: string;
  location: {
    name: string;
  };
  member: {
    first_name: string;
    last_name: string;
    email: string;
  };
}

interface Location {
  id: string;
  name: string;
}

export default function TabletCheckInInterface() {
  const { profile, organization } = useAuth();
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedMember, setSelectedMember] = useState<Member | null>(null);
  const [currentCheckIns, setCurrentCheckIns] = useState<CheckIn[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [selectedLocationId, setSelectedLocationId] = useState<string>('');
  const [showCameraScanner, setShowCameraScanner] = useState(false);
  const [showSignup, setShowSignup] = useState(false);
  const [loading, setLoading] = useState(true);
  const [searchResults, setSearchResults] = useState<Member[]>([]);
  const [isCheckingIn, setIsCheckingIn] = useState(false);
  const [scannerMember, setScannerMember] = useState<Member | null>(null);

  // USB Barcode Scanner Hook - listens for rapid keystrokes
  const {
    barcode: scannedBarcode,
    isScanning,
    buffer: scannerBuffer,
    clear: clearScanner
  } = useBarcodeScanner({
    enabled: !showCameraScanner && !showSignup, // Disable when modal is open
    onScan: async (barcode) => {
      await handleBarcodeScan(barcode);
    },
    onError: (error) => {
      console.error('Scanner error:', error);
    },
  });

  useEffect(() => {
    if (organization?.id) {
      fetchLocations();
      fetchCurrentCheckIns();
    }
  }, [organization]);

  useEffect(() => {
    if (searchTerm.length >= 2) {
      searchMembers();
    } else {
      setSearchResults([]);
      setSelectedMember(null);
    }
  }, [searchTerm]);

  const fetchLocations = async () => {
    try {
      const { data, error } = await supabase
        .from('locations')
        .select('id, name')
        .eq('organization_id', organization?.id)
        .order('name');

      if (error) throw error;

      setLocations(data || []);
      if (data && data.length === 1) {
        setSelectedLocationId(data[0].id);
      }
    } catch (error) {
      console.error('Error fetching locations:', error);
    }
  };

  const fetchCurrentCheckIns = async () => {
    try {
      const { data, error } = await supabase
        .from('check_ins')
        .select(`
          id,
          member_id,
          checked_in_at,
          checked_out_at,
          locations:location_id (name),
          profiles:member_id (first_name, last_name, email)
        `)
        .is('checked_out_at', null)
        .order('checked_in_at', { ascending: false })
        .limit(10);

      if (error) throw error;

      setCurrentCheckIns((data || []).map(checkIn => ({
        ...checkIn,
        location: checkIn.locations || { name: 'Unknown Location' },
        member: checkIn.profiles || { first_name: '', last_name: '', email: '' }
      })));
    } catch (error) {
      console.error('Error fetching current check-ins:', error);
    } finally {
      setLoading(false);
    }
  };

  const searchMembers = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, first_name, last_name, email, barcode, phone, created_at')
        .eq('role', 'member')
        .eq('organization_id', organization?.id)
        .or(`first_name.ilike.%${searchTerm}%,last_name.ilike.%${searchTerm}%,email.ilike.%${searchTerm}%,barcode.ilike.%${searchTerm}%`)
        .limit(10);

      if (error) throw error;
      setSearchResults(data || []);
    } catch (error) {
      console.error('Error searching members:', error);
    }
  };

  // Handle barcode scan (from USB scanner or camera)
  const handleBarcodeScan = useCallback(async (barcode: string) => {
    if (!organization?.id) return;

    // Look up member by barcode
    try {
      const { data: member, error } = await supabase
        .from('profiles')
        .select('id, first_name, last_name, email, barcode, phone, created_at')
        .eq('organization_id', organization.id)
        .eq('barcode', barcode.trim())
        .single();

      if (error || !member) {
        // Try member_cards table
        const { data: cardData, error: cardError } = await supabase
          .from('member_cards')
          .select(`
            member_id,
            profiles!member_cards_member_id_fkey (
              id, first_name, last_name, email, barcode, phone, created_at
            )
          `)
          .or(`barcode.eq.${barcode.trim()},card_number.eq.${barcode.trim()}`)
          .eq('status', 'active')
          .single();

        if (cardError || !cardData?.profiles) {
          toast({
            title: 'Member Not Found',
            description: `No member found with barcode: ${barcode}`,
            variant: 'destructive',
          });
          return;
        }

        const foundMember = cardData.profiles as unknown as Member;
        setScannerMember(foundMember);
        await performCheckIn(foundMember);
        return;
      }

      setScannerMember(member);
      await performCheckIn(member);
    } catch (err) {
      console.error('Barcode lookup error:', err);
      toast({
        title: 'Scan Error',
        description: 'Failed to process barcode. Please try again.',
        variant: 'destructive',
      });
    }
  }, [organization?.id, selectedLocationId]);

  // Perform the actual check-in
  const performCheckIn = async (member: Member) => {
    if (!selectedLocationId) {
      toast({
        title: "Location Required",
        description: "Please select a location before checking in",
        variant: "destructive"
      });
      return;
    }

    setIsCheckingIn(true);

    try {
      // Check if member is already checked in
      const { data: existingCheckIn } = await supabase
        .from('check_ins')
        .select('id')
        .eq('member_id', member.id)
        .is('checked_out_at', null)
        .single();

      if (existingCheckIn) {
        toast({
          title: "Already Checked In",
          description: `${member.first_name} ${member.last_name} is already checked in`,
          variant: "destructive"
        });
        return;
      }

      const { error } = await supabase
        .from('check_ins')
        .insert([{
          member_id: member.id,
          location_id: selectedLocationId,
          checked_in_at: new Date().toISOString()
        }]);

      if (error) throw error;

      toast({
        title: "Check-In Successful",
        description: `${member.first_name} ${member.last_name} has been checked in`,
      });

      // Reset state
      setSearchTerm('');
      setSelectedMember(null);
      setSearchResults([]);
      setScannerMember(null);
      clearScanner();
      fetchCurrentCheckIns();
    } catch (error) {
      console.error('Error checking in member:', error);
      toast({
        title: "Check-In Failed",
        description: "Unable to check in member. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsCheckingIn(false);
    }
  };

  const handleCheckIn = async (memberId: string) => {
    if (selectedMember) {
      await performCheckIn(selectedMember);
    }
  };

  const handleCheckOut = async (checkInId: string, memberName: string) => {
    try {
      const { error } = await supabase
        .from('check_ins')
        .update({ checked_out_at: new Date().toISOString() })
        .eq('id', checkInId);

      if (error) throw error;

      toast({
        title: "Check-Out Successful",
        description: `${memberName} has been checked out`,
      });

      fetchCurrentCheckIns();
    } catch (error) {
      console.error('Error checking out member:', error);
      toast({
        title: "Check-Out Failed",
        description: "Unable to check out member. Please try again.",
        variant: "destructive"
      });
    }
  };

  const handleCameraScan = async (barcode: string) => {
    setShowCameraScanner(false);
    await handleBarcodeScan(barcode);
  };

  const handleSignupComplete = async (memberId: string) => {
    toast({
      title: "Signup Complete",
      description: "New member has been registered and checked in",
    });
    setShowSignup(false);
    fetchCurrentCheckIns();
  };

  const formatDuration = (checkedInAt: string) => {
    const duration = new Date().getTime() - new Date(checkedInAt).getTime();
    const minutes = Math.floor(duration / (1000 * 60));
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;

    if (hours > 0) {
      return `${hours}h ${remainingMinutes}m`;
    }
    return `${minutes}m`;
  };

  if (showSignup) {
    return (
      <div className="min-h-screen bg-background p-4">
        <div className="max-w-4xl mx-auto">
          <div className="mb-6 flex items-center justify-between">
            <h1 className="text-2xl font-bold">New Member Registration</h1>
            <Button variant="outline" onClick={() => setShowSignup(false)}>
              Back to Check-In
            </Button>
          </div>
          <TabletSignupForm onSignupComplete={handleSignupComplete} />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Gym Check-In Station</h1>
            <p className="text-muted-foreground">
              {organization?.name} • Staff: {profile?.first_name} {profile?.last_name}
            </p>
          </div>
          <div className="flex items-center gap-2">
            {/* Scanner Status Indicator */}
            {isScanning && (
              <Badge variant="secondary" className="animate-pulse">
                <Keyboard className="w-3 h-3 mr-1" />
                Scanning: {scannerBuffer}
              </Badge>
            )}
            <Badge variant="outline">
              <Clock className="w-3 h-3 mr-1" />
              {format(new Date(), 'h:mm a')}
            </Badge>
            <Badge variant="outline">
              {currentCheckIns.length} Active
            </Badge>
          </div>
        </div>

        {/* Scanner Ready Indicator */}
        <Alert className="border-green-200 bg-green-50 dark:bg-green-950/20">
          <Scan className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-800 dark:text-green-200">
            <span className="font-medium">USB Scanner Ready</span> - Scan a member barcode to check in instantly.
            Or use the camera button to scan with your device camera.
          </AlertDescription>
        </Alert>

        {/* Location Selection */}
        {locations.length > 1 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="w-5 h-5" />
                Select Location
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                {locations.map((location) => (
                  <Button
                    key={location.id}
                    variant={selectedLocationId === location.id ? "default" : "outline"}
                    onClick={() => setSelectedLocationId(location.id)}
                    className="justify-start"
                  >
                    {location.name}
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {!selectedLocationId && locations.length > 1 && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              Please select a location before checking in members
            </AlertDescription>
          </Alert>
        )}

        <div className="grid gap-6 lg:grid-cols-2">
          {/* Check-In Section */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <UserCheck className="w-5 h-5" />
                Member Check-In
              </CardTitle>
              <CardDescription>
                Scan barcode, use camera, or search to check in members
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Search */}
              <div className="space-y-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    placeholder="Search by name, email, or member ID..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 text-lg h-12"
                  />
                </div>

                {/* Search Results */}
                {searchResults.length > 0 && (
                  <div className="space-y-2 max-h-60 overflow-y-auto">
                    {searchResults.map((member) => (
                      <Card
                        key={member.id}
                        className={cn(
                          "cursor-pointer transition-colors",
                          selectedMember?.id === member.id
                            ? 'border-primary bg-primary/5'
                            : 'hover:bg-muted/50'
                        )}
                        onClick={() => setSelectedMember(member)}
                      >
                        <CardContent className="p-3">
                          <div className="flex items-center justify-between">
                            <div>
                              <h4 className="font-medium">
                                {member.first_name} {member.last_name}
                              </h4>
                              <p className="text-sm text-muted-foreground">{member.email}</p>
                              {member.barcode && (
                                <p className="text-xs font-mono text-muted-foreground">
                                  ID: {member.barcode}
                                </p>
                              )}
                            </div>
                            {selectedMember?.id === member.id && (
                              <CheckCircle className="w-5 h-5 text-primary" />
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="grid grid-cols-1 gap-3">
                <Button
                  onClick={() => selectedMember && handleCheckIn(selectedMember.id)}
                  disabled={!selectedMember || !selectedLocationId || isCheckingIn}
                  size="lg"
                  className="w-full"
                >
                  {isCheckingIn ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <UserCheck className="w-4 h-4 mr-2" />
                  )}
                  Check In {selectedMember ? `${selectedMember.first_name} ${selectedMember.last_name}` : 'Member'}
                </Button>

                <div className="grid grid-cols-2 gap-2">
                  <Button
                    variant="outline"
                    onClick={() => setShowCameraScanner(true)}
                    size="lg"
                    disabled={!selectedLocationId}
                  >
                    <Camera className="w-4 h-4 mr-2" />
                    Camera Scan
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setShowSignup(true)}
                    size="lg"
                  >
                    <UserPlus className="w-4 h-4 mr-2" />
                    New Member
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Current Check-Ins */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="w-5 h-5" />
                Currently Checked In ({currentCheckIns.length})
              </CardTitle>
              <CardDescription>
                Members currently in the gym
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {currentCheckIns.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <User className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>No members currently checked in</p>
                  </div>
                ) : (
                  currentCheckIns.map((checkIn) => (
                    <div key={checkIn.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                          <User className="w-5 h-5 text-primary" />
                        </div>
                        <div>
                          <h4 className="font-medium">
                            {checkIn.member.first_name} {checkIn.member.last_name}
                          </h4>
                          <p className="text-sm text-muted-foreground">
                            {formatDuration(checkIn.checked_in_at)} • {checkIn.location.name}
                          </p>
                        </div>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleCheckOut(
                          checkIn.id,
                          `${checkIn.member.first_name} ${checkIn.member.last_name}`
                        )}
                      >
                        <LogOut className="w-4 h-4 mr-1" />
                        Check Out
                      </Button>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Camera Scanner Modal */}
        {showCameraScanner && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <Card className="w-full max-w-lg">
              <CardHeader>
                <CardTitle className="text-center flex items-center justify-center gap-2">
                  <Camera className="w-5 h-5" />
                  Scan Member Barcode
                </CardTitle>
                <CardDescription className="text-center">
                  Point the camera at a member's barcode or QR code
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <CameraScanner
                  onScan={handleCameraScan}
                  onClose={() => setShowCameraScanner(false)}
                  onError={(error) => {
                    toast({
                      title: 'Camera Error',
                      description: error,
                      variant: 'destructive',
                    });
                  }}
                  height={350}
                  preferredCamera="environment"
                />
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
