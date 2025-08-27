import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { PERMISSIONS } from "@/hooks/usePermissions";

// Pages
import Dashboard from "./pages/Dashboard";
import AuthPage from "./pages/AuthPage";
import LandingPage from "./pages/LandingPage";
import MembersPage from "./pages/MembersPage";
import MemberProfilePage from "./pages/MemberProfilePage";
import MembershipPlansPage from "./pages/MembershipPlansPage";
import MembershipSuccessPage from "./pages/MembershipSuccessPage";
import ClassesPage from "./pages/ClassesPage";
import CheckInsPage from "./pages/CheckInsPage";
import BillingPage from "./pages/BillingPage";
import ReportsPage from "./pages/ReportsPage";
import { CRMPage } from "./pages/CRMPage";
import { LeadsPage } from "./pages/LeadsPage";
import CommissionsPage from "./pages/CommissionsPage";
import ReferralsPage from "./pages/ReferralsPage";
import AttributionPage from "./pages/AttributionPage";
import OnboardingPage from "./pages/OnboardingPage";
import CommunicationPage from "./pages/CommunicationPage";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

// Public Route Component (shows landing page if not authenticated, redirects to dashboard if authenticated)
const PublicRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, loading } = useAuth();
  
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-pulse text-lg text-muted-foreground">Loading...</div>
      </div>
    );
  }
  
  if (user) {
    return <Navigate to="/" replace />;
  }
  
  return <>{children}</>;
};

// Home Route Component (shows landing if not authenticated, dashboard if authenticated)  
const HomeRoute = () => {
      const { user, profile, loading } = useAuth();
      
      if (loading) {
        return (
          <div className="min-h-screen flex items-center justify-center bg-background">
            <div className="animate-pulse text-lg text-muted-foreground">Loading...</div>
          </div>
        );
      }
      
      if (user && profile?.role === 'member') {
        return (
          <ProtectedRoute roles={['member']}>
            <DashboardLayout>
              <MemberProfilePage />
            </DashboardLayout>
          </ProtectedRoute>
        );
      }
      
      if (user) {
        return (
          <ProtectedRoute permission={PERMISSIONS.VIEW_DASHBOARD}>
            <DashboardLayout>
              <Dashboard />
            </DashboardLayout>
          </ProtectedRoute>
        );
      }
  
  return <LandingPage />;
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            {/* Home Route - Landing page or Dashboard */}
            <Route path="/" element={<HomeRoute />} />
            
            {/* Public Routes */}
            <Route path="/auth" element={
              <PublicRoute>
                <AuthPage />
              </PublicRoute>
            } />
            
            {/* Protected Routes */}
            <Route path="/dashboard" element={
              <ProtectedRoute permission={PERMISSIONS.VIEW_DASHBOARD}>
                <DashboardLayout>
                  <Dashboard />
                </DashboardLayout>
              </ProtectedRoute>
            } />
            
            <Route path="/members" element={
              <ProtectedRoute permission={PERMISSIONS.VIEW_MEMBERS}>
                <DashboardLayout>
                  <MembersPage />
                </DashboardLayout>
              </ProtectedRoute>
            } />
            
            <Route path="/onboarding" element={
              <ProtectedRoute permission={PERMISSIONS.VIEW_MEMBERS}>
                <OnboardingPage />
              </ProtectedRoute>
            } />
            
            <Route path="/communication" element={
              <ProtectedRoute permission={PERMISSIONS.VIEW_MEMBERS}>
                <DashboardLayout>
                  <CommunicationPage />
                </DashboardLayout>
              </ProtectedRoute>
            } />
            
            <Route path="/membership-plans" element={
              <DashboardLayout>
                <MembershipPlansPage />
              </DashboardLayout>
            } />

            <Route path="/membership-success" element={<MembershipSuccessPage />} />
            
            <Route path="/profile" element={
              <ProtectedRoute roles={['member']}>
                <DashboardLayout>
                  <MemberProfilePage />
                </DashboardLayout>
              </ProtectedRoute>
            } />
            
            <Route path="/crm" element={
              <ProtectedRoute permission={PERMISSIONS.VIEW_CRM}>
                <DashboardLayout>
                  <CRMPage />
                </DashboardLayout>
              </ProtectedRoute>
            } />
            
            <Route path="/leads" element={
              <ProtectedRoute permission={PERMISSIONS.VIEW_CRM}>
                <DashboardLayout>
                  <LeadsPage />
                </DashboardLayout>
              </ProtectedRoute>
            } />
            
            <Route path="/commissions" element={
              <ProtectedRoute permission={PERMISSIONS.VIEW_CRM}>
                <DashboardLayout>
                  <CommissionsPage />
                </DashboardLayout>
              </ProtectedRoute>
            } />
            
            <Route path="/referrals" element={
              <ProtectedRoute permission={PERMISSIONS.VIEW_CRM}>
                <DashboardLayout>
                  <ReferralsPage />
                </DashboardLayout>
              </ProtectedRoute>
            } />
            
            <Route path="/attribution" element={
              <ProtectedRoute permission={PERMISSIONS.VIEW_CRM}>
                <DashboardLayout>
                  <AttributionPage />
                </DashboardLayout>
              </ProtectedRoute>
            } />
            
            <Route path="/classes" element={
              <ProtectedRoute permission={PERMISSIONS.VIEW_CLASSES}>
                <DashboardLayout>
                  <ClassesPage />
                </DashboardLayout>
              </ProtectedRoute>
            } />
            
            <Route path="/checkins" element={
              <ProtectedRoute permission={PERMISSIONS.VIEW_CHECKINS}>
                <DashboardLayout>
                  <CheckInsPage />
                </DashboardLayout>
              </ProtectedRoute>
            } />
            
            <Route path="/billing" element={
              <ProtectedRoute permission={PERMISSIONS.VIEW_BILLING}>
                <DashboardLayout>
                  <BillingPage />
                </DashboardLayout>
              </ProtectedRoute>
            } />
            
            <Route path="/reports" element={
              <ProtectedRoute permission={PERMISSIONS.VIEW_REPORTS}>
                <DashboardLayout>
                  <ReportsPage />
                </DashboardLayout>
              </ProtectedRoute>
            } />
            
            <Route path="/retail" element={
              <ProtectedRoute permission={PERMISSIONS.VIEW_RETAIL}>
                <DashboardLayout>
                  <div className="text-center py-8">
                    <h1 className="text-2xl font-bold mb-4">Retail & POS</h1>
                    <p className="text-muted-foreground">Point of sale system coming soon...</p>
                  </div>
                </DashboardLayout>
              </ProtectedRoute>
            } />
            
            <Route path="/settings" element={
              <ProtectedRoute permission={PERMISSIONS.VIEW_SETTINGS}>
                <DashboardLayout>
                  <div className="text-center py-8">
                    <h1 className="text-2xl font-bold mb-4">Settings</h1>
                    <p className="text-muted-foreground">Organization settings coming soon...</p>
                  </div>
                </DashboardLayout>
              </ProtectedRoute>
            } />
            
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
