import { TowelServiceManager } from "@/components/towels/TowelServiceManager";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { SEOHead } from "@/components/seo/SEOHead";

export default function TowelServicePage() {
  return (
    <>
      <SEOHead 
        title="Towel Service Management - Gym Management Platform"
        description="Manage towel inventory, rentals, and cleaning schedules with comprehensive tracking and automation features."
        keywords="towel service, rental management, inventory tracking, gym operations, cleaning schedules"
      />
      <DashboardLayout>
        <TowelServiceManager />
      </DashboardLayout>
    </>
  );
}