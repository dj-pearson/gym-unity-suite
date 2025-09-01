import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import MobileWorkoutTracker from '@/components/mobile/MobileWorkoutTracker';
import EnhancedMobileNavigation from '@/components/mobile/EnhancedMobileNavigation';

export default function MobileWorkoutPage() {
  const { profile } = useAuth();

  if (!profile) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-xl font-semibold mb-2">Loading...</h1>
          <p className="text-muted-foreground">Setting up your workout tracker</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Mobile Workout Tracker */}
      <MobileWorkoutTracker />
      
      {/* Mobile Navigation */}
      <EnhancedMobileNavigation />
    </div>
  );
}