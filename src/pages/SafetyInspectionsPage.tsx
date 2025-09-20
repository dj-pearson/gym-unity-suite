import React from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { SafetyInspectionManager } from '@/components/equipment/SafetyInspectionManager';
import { SEOHead } from '@/components/seo/SEOHead';

export default function SafetyInspectionsPage() {
  return (
    <DashboardLayout>
      <SEOHead 
        title="Equipment Safety Inspections - Compliance & Risk Management"
        description="Manage equipment safety inspections, compliance checklists, and violation tracking for your fitness facility. Ensure safety standards and regulatory compliance."
        keywords="safety inspections, equipment compliance, safety violations, inspection checklists, fitness equipment safety, gym compliance"
      />
      
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Safety Inspections</h1>
          <p className="text-muted-foreground">
            Manage equipment safety inspections, compliance tracking, and violation resolution to ensure 
            your facility meets all safety standards and regulatory requirements.
          </p>
        </div>
        
        <SafetyInspectionManager />
      </div>
    </DashboardLayout>
  );
}