import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import Dashboard from "./pages/Dashboard";
import AuthPage from "./pages/AuthPage";
import LandingPage from "./pages/LandingPage";
import MembersPage from "./pages/MembersPage";
import ClassesPage from "./pages/ClassesPage";
import CheckInsPage from "./pages/CheckInsPage";
import BillingPage from "./pages/BillingPage";
import ReportsPage from "./pages/ReportsPage";
import { CRMPage } from "./pages/CRMPage";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

// Protected Route Component
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, loading } = useAuth();
  
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-pulse text-lg text-muted-foreground">Loading...</div>
      </div>
    );
  }
  
  if (!user) {
    return <Navigate to="/auth" replace />;
  }
  
  return <DashboardLayout>{children}</DashboardLayout>;
};

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
  const { user, loading } = useAuth();
  
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-pulse text-lg text-muted-foreground">Loading...</div>
      </div>
    );
  }
  
  if (user) {
    return (
      <DashboardLayout>
        <Dashboard />
      </DashboardLayout>
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
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            } />
            
            {/* Placeholder routes for future pages */}
            <Route path="/members" element={
              <ProtectedRoute>
                <MembersPage />
              </ProtectedRoute>
            } />
            
            <Route path="/crm" element={
              <ProtectedRoute>
                <CRMPage />
              </ProtectedRoute>
            } />
            
            <Route path="/classes" element={
              <ProtectedRoute>
                <ClassesPage />
              </ProtectedRoute>
            } />
            
            <Route path="/checkins" element={
              <ProtectedRoute>
                <CheckInsPage />
              </ProtectedRoute>
            } />
            
            <Route path="/billing" element={
              <ProtectedRoute>
                <BillingPage />
              </ProtectedRoute>
            } />
            
            <Route path="/reports" element={
              <ProtectedRoute>
                <ReportsPage />
              </ProtectedRoute>
            } />
            
            <Route path="/retail" element={
              <ProtectedRoute>
                <div className="text-center py-8">
                  <h1 className="text-2xl font-bold mb-4">Retail & POS</h1>
                  <p className="text-muted-foreground">Point of sale system coming soon...</p>
                </div>
              </ProtectedRoute>
            } />
            
            <Route path="/settings" element={
              <ProtectedRoute>
                <div className="text-center py-8">
                  <h1 className="text-2xl font-bold mb-4">Settings</h1>
                  <p className="text-muted-foreground">Organization settings coming soon...</p>
                </div>
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
