import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { HashRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { PERMISSIONS } from "@/hooks/usePermissions";
import { HelmetProvider } from 'react-helmet-async';
import React, { useEffect } from 'react';

import Dashboard from "./pages/Dashboard";
import AuthPage from "./pages/AuthPage";
import LandingPage from "./pages/LandingPage";
import MembersPage from "./pages/MembersPage";
import MemberProfilePage from "./pages/MemberProfilePage";
import MembershipPlansPage from "./pages/MembershipPlansPage";
import MembershipSuccessPage from "./pages/MembershipSuccessPage";
import PaymentSuccessPage from './pages/PaymentSuccessPage';
import PaymentCancelledPage from './pages/PaymentCancelledPage';
import PaymentDemoPage from './pages/PaymentDemoPage';
import ClassesPage from "./pages/ClassesPage";
import CheckInsPage from "./pages/CheckInsPage";
import BillingPage from "./pages/BillingPage";
import ReportsPage from "./pages/ReportsPage";
import { CRMPage } from "./pages/CRMPage";
import { LeadsPage } from "./pages/LeadsPage";
import CommissionsPage from "./pages/CommissionsPage";
import ReferralsPage from "./pages/ReferralsPage";
import AttributionPage from "./pages/AttributionPage";
import StaffPage from "./pages/StaffPage";
import MarketingPage from "./pages/MarketingPage";
import OnboardingPage from "./pages/OnboardingPage";
import CommunicationPage from "./pages/CommunicationPage";
import IntegrationsPage from "./pages/IntegrationsPage";
import SecurityPage from "./pages/SecurityPage";
import AdvancedFeaturesPage from "./pages/AdvancedFeaturesPage";
import EquipmentPage from "./pages/EquipmentPage";
import PersonalTrainingPage from "./pages/PersonalTrainingPage";
import ProShopPage from "./pages/ProShopPage";
import SafetyInspectionsPage from "./pages/SafetyInspectionsPage";
import TabletCheckInPage from "./pages/TabletCheckInPage";
import MobileDashboardPage from "./pages/MobileDashboardPage";
import MobileCheckInPage from "./pages/MobileCheckInPage";
import MobileWorkoutPage from "./pages/MobileWorkoutPage";
import VisitorsPage from "./pages/VisitorsPage";
import LockersPage from "./pages/LockersPage";
import IncidentsPage from "./pages/IncidentsPage";
import CourtSportsPage from "./pages/CourtSportsPage";
import PoolManagementPage from "./pages/PoolManagementPage";
import SpaManagementPage from "./pages/SpaManagementPage";
import ChildcarePage from "./pages/ChildcarePage";
import NotFound from "./pages/NotFound";
import MemberDashboard from "./pages/MemberDashboard";
import MemberClasses from "./pages/MemberClasses";
import MemberWorkoutHistory from "./pages/MemberWorkoutHistory";
import MemberNotifications from "./pages/MemberNotifications";
import BlogPage from "./pages/BlogPage";
import BlogPostPage from "./pages/BlogPostPage";
import BlogAdminPage from "./pages/admin/BlogAdminPage";
import { MemberLayout } from "./components/layout/MemberLayout";
import { useIsMobile } from '@/hooks/use-mobile';

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
      const isMobile = useIsMobile();
      
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
            {isMobile ? <MobileDashboardPage /> : (
              <MemberLayout>
                <MemberDashboard />
              </MemberLayout>
            )}
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

const App = () => {
  return (
    <HelmetProvider>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <TooltipProvider>
            <Router>
              <Toaster />
              <Sonner />
              <AppRoutes />
            </Router>
          </TooltipProvider>
        </AuthProvider>
      </QueryClientProvider>
    </HelmetProvider>
  );
};

// Separate component for routes to ensure proper React context
const AppRoutes = () => {
  // Register service worker for PWA functionality
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js')
        .then((registration) => {
          console.log('SW registered: ', registration);
        })
        .catch((registrationError) => {
          console.log('SW registration failed: ', registrationError);
        });
    }
  }, []);

  return (
    <Routes>
              {/* Home Route - Landing page or Dashboard */}
              <Route path="/" element={<HomeRoute />} />
              
              {/* Public Routes */}
              <Route path="/auth" element={
                <PublicRoute>
                  <AuthPage />
                </PublicRoute>
              } />
              
              <Route path="/blog" element={<BlogPage />} />
              <Route path="/blog/:slug" element={<BlogPostPage />} />
              <Route path="/blog/admin" element={
                <ProtectedRoute permission={PERMISSIONS.VIEW_SETTINGS}>
                  <DashboardLayout>
                    <BlogAdminPage />
                  </DashboardLayout>
                </ProtectedRoute>
              } />
              
              {/* Mobile Routes */}
              <Route path="/mobile" element={
                <ProtectedRoute roles={['member']}>
                  <MobileDashboardPage />
                </ProtectedRoute>
              } />
              <Route path="/mobile/check-in" element={
                <ProtectedRoute roles={['member']}>
                  <MobileCheckInPage />
                </ProtectedRoute>
              } />
              <Route path="/mobile/workout" element={
                <ProtectedRoute roles={['member']}>
                  <MobileWorkoutPage />
                </ProtectedRoute>
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
              
              <Route path="/membership-plans" element={
                <DashboardLayout>
                  <MembershipPlansPage />
                </DashboardLayout>
              } />

            <Route path="/membership-success" element={<MembershipSuccessPage />} />
            <Route path="/payment-success" element={<PaymentSuccessPage />} />
            <Route path="/payment-cancelled" element={<PaymentCancelledPage />} />
            <Route path="/payment-demo" element={<PaymentDemoPage />} />
              
              <Route path="/member/notifications" element={
                <ProtectedRoute roles={['member']}>
                  <MemberLayout>
                    <MemberNotifications />
                  </MemberLayout>
                </ProtectedRoute>
              } />
              
              <Route path="/profile" element={
                <ProtectedRoute roles={['member']}>
                  <DashboardLayout>
                    <MemberProfilePage />
                  </DashboardLayout>
                </ProtectedRoute>
              } />
              
              <Route path="/personal-training" element={
                <ProtectedRoute permission={PERMISSIONS.VIEW_CLASSES}>
                  <DashboardLayout>
                    <PersonalTrainingPage />
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
              
              <Route path="/visitors" element={
                <ProtectedRoute permission={PERMISSIONS.VIEW_MEMBERS}>
                  <DashboardLayout>
                    <VisitorsPage />
                  </DashboardLayout>
                </ProtectedRoute>
              } />
              
              <Route path="/lockers" element={
                <ProtectedRoute permission={PERMISSIONS.VIEW_SETTINGS}>
                  <DashboardLayout>
                    <LockersPage />
                  </DashboardLayout>
                </ProtectedRoute>
              } />
              
              <Route path="/incidents" element={
                <ProtectedRoute permission={PERMISSIONS.VIEW_SETTINGS}>
                  <DashboardLayout>
                    <IncidentsPage />
                  </DashboardLayout>
                </ProtectedRoute>
              } />
              
              <Route path="/courts" element={
                <ProtectedRoute permission={PERMISSIONS.VIEW_SETTINGS}>
                  <DashboardLayout>
                    <CourtSportsPage />
                  </DashboardLayout>
                </ProtectedRoute>
              } />
              
               <Route path="/pool-management" element={
                 <ProtectedRoute permission={PERMISSIONS.VIEW_SETTINGS}>
                   <DashboardLayout>
                     <PoolManagementPage />
                   </DashboardLayout>
                 </ProtectedRoute>
               } />
               
               <Route path="/spa-management" element={
                 <ProtectedRoute permission={PERMISSIONS.VIEW_SETTINGS}>
                   <DashboardLayout>
                     <SpaManagementPage />
                   </DashboardLayout>
                 </ProtectedRoute>
               } />
               
              <Route path="/childcare" element={
                <ProtectedRoute permission={PERMISSIONS.VIEW_SETTINGS}>
                  <DashboardLayout>
                    <ChildcarePage />
                  </DashboardLayout>
                </ProtectedRoute>
              } />
              
              <Route path="/pro-shop" element={
                <ProtectedRoute permission={PERMISSIONS.VIEW_RETAIL}>
                  <DashboardLayout>
                    <ProShopPage />
                  </DashboardLayout>
                </ProtectedRoute>
              } />
              
              <Route path="/communication" element={
                <ProtectedRoute permission={PERMISSIONS.VIEW_MEMBERS}>
                  <DashboardLayout>
                    <CommunicationPage />
                  </DashboardLayout>
                </ProtectedRoute>
              } />
              
              <Route path="/equipment" element={
                <ProtectedRoute permission={PERMISSIONS.VIEW_SETTINGS}>
                  <DashboardLayout>
                    <EquipmentPage />
                  </DashboardLayout>
                </ProtectedRoute>
              } />
              
              <Route path="/tablet-checkin" element={
                <ProtectedRoute permission={PERMISSIONS.VIEW_CHECKINS}>
                  <TabletCheckInPage />
                </ProtectedRoute>
              } />
              
              <Route path="/billing" element={
                <ProtectedRoute permission={PERMISSIONS.VIEW_BILLING}>
                  <DashboardLayout>
                    <BillingPage />
                  </DashboardLayout>
                </ProtectedRoute>
              } />
              
              <Route path="/marketing" element={
                <ProtectedRoute permission={PERMISSIONS.VIEW_REPORTS}>
                  <DashboardLayout>
                    <MarketingPage />
                  </DashboardLayout>
                </ProtectedRoute>
              } />
              
              <Route path="/staff" element={
                <ProtectedRoute permission={PERMISSIONS.MANAGE_STAFF}>
                  <DashboardLayout>
                    <StaffPage />
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
              
              <Route path="/integrations" element={
                <ProtectedRoute permission={PERMISSIONS.VIEW_SETTINGS}>
                  <DashboardLayout>
                    <IntegrationsPage />
                  </DashboardLayout>
                </ProtectedRoute>
              } />
              
              <Route path="/security" element={
                <ProtectedRoute permission={PERMISSIONS.VIEW_SETTINGS}>
                  <DashboardLayout>
                    <SecurityPage />
                  </DashboardLayout>
                </ProtectedRoute>
              } />
              
              <Route path="/advanced" element={
                <ProtectedRoute permission={PERMISSIONS.VIEW_SETTINGS}>
                  <DashboardLayout>
                    <AdvancedFeaturesPage />
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
  );
};

export default App;
