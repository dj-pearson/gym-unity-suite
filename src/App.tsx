// Toasts/Tooltips temporarily disabled to resolve React runtime issue
// import { Toaster } from "@/components/ui/toaster";
// import { Toaster as Sonner } from "@/components/ui/sonner";
// import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { CustomDomainProvider } from "@/contexts/CustomDomainContext";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { PERMISSIONS } from "@/hooks/usePermissions";
import { HelmetProvider } from 'react-helmet-async';
import { queryClient } from '@/lib/queryClient';
import React, { useEffect, lazy, Suspense } from 'react';
import { MemberLayout } from "./components/layout/MemberLayout";
import { useIsMobile } from '@/hooks/use-mobile';

// Lazy load all page components for better code splitting
const Dashboard = lazy(() => import("./pages/Dashboard"));
const AuthPage = lazy(() => import("./pages/AuthPage"));
const LandingPage = lazy(() => import("./pages/LandingPage"));
const MembersPage = lazy(() => import("./pages/MembersPage"));
const MemberProfilePage = lazy(() => import("./pages/MemberProfilePage"));
const MembershipPlansPage = lazy(() => import("./pages/MembershipPlansPage"));
const MembershipSuccessPage = lazy(() => import("./pages/MembershipSuccessPage"));
const PaymentSuccessPage = lazy(() => import('./pages/PaymentSuccessPage'));
const PaymentCancelledPage = lazy(() => import('./pages/PaymentCancelledPage'));
const PaymentDemoPage = lazy(() => import('./pages/PaymentDemoPage'));
const ClassesPage = lazy(() => import("./pages/ClassesPage"));
const CheckInsPage = lazy(() => import("./pages/CheckInsPage"));
const BillingPage = lazy(() => import("./pages/BillingPage"));
const ReportsPage = lazy(() => import("./pages/ReportsPage"));
const CRMPage = lazy(() => import("./pages/CRMPage").then(m => ({ default: m.CRMPage })));
const LeadsPage = lazy(() => import("./pages/LeadsPage").then(m => ({ default: m.LeadsPage })));
const CommissionsPage = lazy(() => import("./pages/CommissionsPage"));
const CorporatePage = lazy(() => import("./pages/CorporatePage"));
const ReferralsPage = lazy(() => import("./pages/ReferralsPage"));
const AttributionPage = lazy(() => import("./pages/AttributionPage"));
const StaffPage = lazy(() => import("./pages/StaffPage"));
const MarketingPage = lazy(() => import("./pages/MarketingPage"));
const OnboardingPage = lazy(() => import("./pages/OnboardingPage"));
const CommunicationPage = lazy(() => import("./pages/CommunicationPage"));
const IntegrationsPage = lazy(() => import("./pages/IntegrationsPage"));
const SecurityPage = lazy(() => import("./pages/SecurityPage"));
const AdvancedFeaturesPage = lazy(() => import("./pages/AdvancedFeaturesPage"));
const EquipmentPage = lazy(() => import("./pages/EquipmentPage"));
const PersonalTrainingPage = lazy(() => import("./pages/PersonalTrainingPage"));
const ProShopPage = lazy(() => import("./pages/ProShopPage"));
const SafetyInspectionsPage = lazy(() => import("./pages/SafetyInspectionsPage"));
const ExpenseTrackingPage = lazy(() => import("./pages/ExpenseTrackingPage"));
const DepartmentPLPage = lazy(() => import("./pages/DepartmentPLPage"));
const StaffCertificationPage = lazy(() => import("./pages/StaffCertificationPage"));
const TowelServicePage = lazy(() => import("./pages/TowelServicePage"));
const MultiLocationPage = lazy(() => import("./pages/MultiLocationPage"));
const TabletCheckInPage = lazy(() => import("./pages/TabletCheckInPage"));
const MobileDashboardPage = lazy(() => import("./pages/MobileDashboardPage"));
const MobileCheckInPage = lazy(() => import("./pages/MobileCheckInPage"));
const MobileWorkoutPage = lazy(() => import("./pages/MobileWorkoutPage"));
const VisitorsPage = lazy(() => import("./pages/VisitorsPage"));
const LockersPage = lazy(() => import("./pages/LockersPage"));
const IncidentsPage = lazy(() => import("./pages/IncidentsPage"));
const CourtSportsPage = lazy(() => import("./pages/CourtSportsPage"));
const PoolManagementPage = lazy(() => import("./pages/PoolManagementPage"));
const SpaManagementPage = lazy(() => import("./pages/SpaManagementPage"));
const ChildcarePage = lazy(() => import("./pages/ChildcarePage"));
const NotFound = lazy(() => import("./pages/NotFound"));
const MemberDashboard = lazy(() => import("./pages/MemberDashboard"));
const MemberClasses = lazy(() => import("./pages/MemberClasses"));
const MemberWorkoutHistory = lazy(() => import("./pages/MemberWorkoutHistory"));
const MemberNotifications = lazy(() => import("./pages/MemberNotifications"));
const BlogPage = lazy(() => import("./pages/BlogPage"));
const BlogPostPage = lazy(() => import("./pages/BlogPostPage"));
const BlogAdminPage = lazy(() => import("./pages/admin/BlogAdminPage"));
const AIControlPage = lazy(() => import("./pages/AIControlPage"));
const FeaturesPage = lazy(() => import("./pages/FeaturesPage"));
const SchedulingPage = lazy(() => import("./pages/features/SchedulingPage"));
const MindbodyAlternativePage = lazy(() => import("./pages/compare/MindbodyAlternativePage"));
const NewYorkGymSoftwarePage = lazy(() => import("./pages/local/NewYorkGymSoftwarePage"));
const BestGymSoftwareBlogPost = lazy(() => import("./pages/blog/BestGymSoftware2025"));

// Loading component for suspense fallback
const PageLoader = () => (
  <div className="min-h-screen flex items-center justify-center bg-background">
    <div className="animate-pulse text-lg text-muted-foreground">Loading...</div>
  </div>
);

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
          <CustomDomainProvider>
            <Router>
              <AppRoutes />
            </Router>
          </CustomDomainProvider>
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
    <Suspense fallback={<PageLoader />}>
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
              <Route path="/blog/best-gym-management-software-2025" element={<BestGymSoftwareBlogPost />} />
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
              
              <Route path="/corporate" element={
                <ProtectedRoute permission={PERMISSIONS.VIEW_CORPORATE}>
                  <DashboardLayout>
                    <CorporatePage />
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
              
              <Route path="/expense-tracking" element={
                <ProtectedRoute permission={PERMISSIONS.VIEW_SETTINGS}>
                  <DashboardLayout>
                    <ExpenseTrackingPage />
                  </DashboardLayout>
                </ProtectedRoute>
              } />
              
              <Route path="/department-pl" element={
                <ProtectedRoute permission={PERMISSIONS.VIEW_REPORTS}>
                  <DashboardLayout>
                    <DepartmentPLPage />
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

              <Route path="/staff-certifications" element={
                <ProtectedRoute permission={PERMISSIONS.MANAGE_STAFF}>
                  <DashboardLayout>
                    <StaffCertificationPage />
                  </DashboardLayout>
                </ProtectedRoute>
              } />
              
              <Route path="/towel-service" element={
                <ProtectedRoute permission={PERMISSIONS.VIEW_RETAIL}>
                  <DashboardLayout>
                    <TowelServicePage />
                  </DashboardLayout>
                </ProtectedRoute>
              } />
              
              <Route path="/multi-location" element={
                <ProtectedRoute permission={PERMISSIONS.VIEW_SETTINGS}>
                  <DashboardLayout>
                    <MultiLocationPage />
                  </DashboardLayout>
                </ProtectedRoute>
              } />
              
              <Route path="/ai-control" element={
                <ProtectedRoute permission={PERMISSIONS.MANAGE_SYSTEM}>
                  <DashboardLayout>
                    <AIControlPage />
                  </DashboardLayout>
                </ProtectedRoute>
              } />
              
              {/* SEO & Marketing Pages */}
              <Route path="/pricing" element={<LandingPage />} />
              <Route path="/features" element={<FeaturesPage />} />
              <Route path="/features/scheduling" element={<SchedulingPage />} />
              <Route path="/compare/mindbody-alternative" element={<MindbodyAlternativePage />} />
              <Route path="/local/new-york-gym-software" element={<NewYorkGymSoftwarePage />} />
              
      {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
      <Route path="*" element={<NotFound />} />
      </Routes>
    </Suspense>
  );
};

export default App;
