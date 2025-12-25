import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { usePermissions, Permission, UserRole } from '@/hooks/usePermissions';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertTriangle, Lock, RefreshCw, LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ProtectedRouteProps {
  children: React.ReactNode;
  permission?: Permission;
  roles?: UserRole[];
  fallbackPath?: string;
  showFallback?: boolean;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  permission,
  roles,
  fallbackPath = '/auth',
  showFallback = true,
}) => {
  const { user, loading, profile, profileError, refreshProfile, signOut } = useAuth();
  const { hasPermission, hasAnyRole } = usePermissions();
  const location = useLocation();

  // Show loading while authentication state is being determined
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          <p className="text-sm text-muted-foreground">Loading your account...</p>
        </div>
      </div>
    );
  }

  // Redirect to auth if not authenticated
  if (!user) {
    return <Navigate to={fallbackPath} state={{ from: location }} replace />;
  }

  // Handle profile loading errors with retry option
  if (profileError) {
    return (
      <div className="flex items-center justify-center min-h-screen p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <AlertTriangle className="w-12 h-12 text-destructive mx-auto mb-4" />
            <CardTitle className="text-destructive">Profile Loading Failed</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-center">
            <p className="text-muted-foreground">{profileError}</p>
            <div className="flex flex-col gap-2">
              <Button onClick={refreshProfile} className="w-full">
                <RefreshCw className="w-4 h-4 mr-2" />
                Try Again
              </Button>
              <Button variant="outline" onClick={signOut} className="w-full">
                <LogOut className="w-4 h-4 mr-2" />
                Sign Out
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Check if profile is still loading (no error but no profile yet)
  if (!profile) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card className="w-full max-w-md mx-4">
          <CardHeader className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <CardTitle>Setting Up Your Account</CardTitle>
          </CardHeader>
          <CardContent className="text-center text-muted-foreground">
            <p>Please wait while we load your profile...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Check permissions
  const hasRequiredPermission = permission ? hasPermission(permission) : true;
  const hasRequiredRole = roles ? hasAnyRole(roles) : true;

  if (!hasRequiredPermission || !hasRequiredRole) {
    if (showFallback) {
      return (
        <div className="flex items-center justify-center min-h-screen p-4">
          <Card className="w-full max-w-md">
            <CardHeader className="text-center">
              <Lock className="w-12 h-12 text-destructive mx-auto mb-4" />
              <CardTitle>Access Denied</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-center">
              <p className="text-muted-foreground">
                You don't have permission to access this page.
              </p>
              <p className="text-sm text-muted-foreground">
                Current role: <span className="font-medium capitalize">{profile.role}</span>
              </p>
              {roles && (
                <p className="text-sm text-muted-foreground">
                  Required roles: <span className="font-medium">{roles.join(', ')}</span>
                </p>
              )}
              <Button 
                onClick={() => window.history.back()} 
                variant="outline" 
                className="w-full"
              >
                Go Back
              </Button>
            </CardContent>
          </Card>
        </div>
      );
    }
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
};