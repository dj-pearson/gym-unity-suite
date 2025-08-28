import { useAuth } from '@/contexts/AuthContext';
import { Navigate } from 'react-router-dom';
import MobileCheckIn from '@/components/mobile/MobileCheckIn';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Smartphone, QrCode } from 'lucide-react';

export default function MobileCheckInPage() {
  const { profile, loading } = useAuth();

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!profile) {
    return <Navigate to="/auth" replace />;
  }

  // Only allow members to access this page
  if (['owner', 'manager', 'staff'].includes(profile.role)) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8">
          <Card className="max-w-md mx-auto">
            <CardHeader className="text-center">
              <CardTitle className="flex items-center justify-center gap-2">
                <QrCode className="w-6 h-6" />
                Staff Check-In
              </CardTitle>
              <CardDescription>
                This mobile check-in feature is designed for members. 
                Staff can manage check-ins from the main dashboard.
              </CardDescription>
            </CardHeader>
            <CardContent className="text-center">
              <a 
                href="/" 
                className="text-primary hover:underline"
              >
                Go to Staff Dashboard
              </a>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-primary text-primary-foreground p-4 text-center">
        <div className="flex items-center justify-center gap-2">
          <Smartphone className="w-6 h-6" />
          <h1 className="text-xl font-bold">Quick Check-In</h1>
        </div>
        <p className="text-sm opacity-90 mt-1">
          Welcome to {profile.first_name ? `${profile.first_name}!` : 'RepClub!'}
        </p>
      </div>

      {/* Main Content */}
      <div className="pb-20">
        <MobileCheckIn />
      </div>
    </div>
  );
}