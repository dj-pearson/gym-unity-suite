import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { usePermissions, Permission, UserRole } from '@/hooks/usePermissions';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertTriangle, Lock } from 'lucide-react';
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
  const { user, loading, profile } = useAuth();
  const { hasPermission, hasAnyRole } = usePermissions();
  const location = useLocation();

  // Show loading while authentication state is being determined
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Redirect to auth if not authenticated
  if (!user) {
    return <Navigate to={fallbackPath} state={{ from: location }} replace />;
  }

  // Check if profile is loaded
  if (!profile) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card className="w-full max-w-md mx-4">
          <CardHeader className="text-center">
            <AlertTriangle className="w-12 h-12 text-warning mx-auto mb-4" />
            <CardTitle>Profile Loading...</CardTitle>
          </CardHeader>
          <CardContent className="text-center text-muted-foreground">
            <p>Setting up your account...</p>
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