import { useAuth } from '@/contexts/AuthContext';
import { Navigate } from 'react-router-dom';
import TabletCheckInInterface from '@/components/mobile/TabletCheckInInterface';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { UserCheck, AlertTriangle } from 'lucide-react';

export default function TabletCheckInPage() {
  const { profile, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-pulse text-lg text-muted-foreground">Loading...</div>
      </div>
    );
  }

  if (!profile) {
    return <Navigate to="/auth" replace />;
  }

  // Only allow staff members to access this page
  if (!['owner', 'manager', 'staff'].includes(profile.role)) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8">
          <Card className="max-w-md mx-auto">
            <CardHeader className="text-center">
              <CardTitle className="flex items-center justify-center gap-2">
                <AlertTriangle className="w-6 h-6 text-destructive" />
                Access Denied
              </CardTitle>
              <CardDescription>
                This tablet check-in interface is only available to staff members. 
                Members can use the mobile check-in feature from their member dashboard.
              </CardDescription>
            </CardHeader>
            <CardContent className="text-center">
              <a 
                href="/" 
                className="text-primary hover:underline"
              >
                Return to Dashboard
              </a>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return <TabletCheckInInterface />;
}