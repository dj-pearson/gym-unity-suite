import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { usePermissions, PERMISSIONS } from '@/hooks/usePermissions';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from '@/components/ui/sidebar';
import { 
  LayoutDashboard, 
  Users, 
  Calendar, 
  CreditCard, 
  Settings, 
  LogOut,
  Dumbbell,
  UserCheck,
  BarChart3,
  Store,
  Phone,
  TrendingUp,
  ChevronRight,
  DollarSign,
  Share2,
  UserX,
  MessageSquare,
  Mail,
  Zap,
  Shield,
  Rocket,
  Wrench,
  Weight,
  FileText
} from 'lucide-react';

// Navigation structure organized by functional areas with permissions
const navigationGroups = [
  {
    title: 'Overview',
    items: [
      { name: 'Dashboard', href: '/', icon: LayoutDashboard, permission: PERMISSIONS.VIEW_DASHBOARD }
    ]
  },
  {
    title: 'Sales & Marketing',
    items: [
      { name: 'CRM', href: '/crm', icon: Phone, permission: PERMISSIONS.VIEW_CRM },
      { name: 'Leads Pipeline', href: '/leads', icon: TrendingUp, permission: PERMISSIONS.VIEW_CRM },
      { name: 'Marketing', href: '/marketing', icon: Mail, permission: PERMISSIONS.VIEW_REPORTS },
      { name: 'Commissions', href: '/commissions', icon: DollarSign, permission: PERMISSIONS.VIEW_CRM },
      { name: 'Referrals', href: '/referrals', icon: Share2, permission: PERMISSIONS.VIEW_CRM },
      { name: 'Lead Attribution', href: '/attribution', icon: UserX, permission: PERMISSIONS.VIEW_CRM }
    ]
  },
  {
    title: 'Operations',
    items: [
      { name: 'Membership Plans', href: '/membership-plans', icon: CreditCard },
      { name: 'Members', href: '/members', icon: Users, permission: PERMISSIONS.VIEW_MEMBERS },
      { name: 'Staff', href: '/staff', icon: Users, permission: PERMISSIONS.MANAGE_STAFF },
      { name: 'Onboarding', href: '/onboarding', icon: UserCheck, permission: PERMISSIONS.VIEW_MEMBERS },
      { name: 'Communication', href: '/communication', icon: MessageSquare, permission: PERMISSIONS.VIEW_MEMBERS },
      { name: 'Equipment', href: '/equipment', icon: Wrench, permission: PERMISSIONS.VIEW_SETTINGS },
      { name: 'Classes', href: '/classes', icon: Calendar, permission: PERMISSIONS.VIEW_CLASSES },
      { name: 'Personal Training', href: '/personal-training', icon: Weight, permission: PERMISSIONS.VIEW_CLASSES },
      { name: 'Check-ins', href: '/checkins', icon: UserCheck, permission: PERMISSIONS.VIEW_CHECKINS }
    ]
  },
  {
    title: 'Business',
    items: [
      { name: 'Billing', href: '/billing', icon: CreditCard, permission: PERMISSIONS.VIEW_BILLING },
      { name: 'Reports', href: '/reports', icon: BarChart3, permission: PERMISSIONS.VIEW_REPORTS },
      { name: 'Blog Manager', href: '/blog/admin', icon: FileText, permission: PERMISSIONS.VIEW_SETTINGS },
      { name: 'Retail', href: '/retail', icon: Store, permission: PERMISSIONS.VIEW_RETAIL }
    ]
  },
  {
    title: 'Configuration',
    items: [
      { name: 'Integrations', href: '/integrations', icon: Zap, permission: PERMISSIONS.VIEW_SETTINGS },
      { name: 'Security', href: '/security', icon: Shield, permission: PERMISSIONS.VIEW_SETTINGS },
      { name: 'Advanced', href: '/advanced', icon: Rocket, permission: PERMISSIONS.VIEW_SETTINGS },
      { name: 'Settings', href: '/settings', icon: Settings, permission: PERMISSIONS.VIEW_SETTINGS }
    ]
  }
];

export function AppSidebar() {
  const { profile, organization, signOut } = useAuth();
  const { hasPermission } = usePermissions();
  const { state } = useSidebar();
  const location = useLocation();
  const navigate = useNavigate();
  const [expandedGroups, setExpandedGroups] = useState<string[]>(['Overview', 'Sales & Marketing', 'Operations']);
  
  const collapsed = state === 'collapsed';

  const handleSignOut = async () => {
    await signOut();
    navigate('/auth');
  };

  const isActive = (path: string) => location.pathname === path;

  const toggleGroup = (title: string) => {
    setExpandedGroups(prev => 
      prev.includes(title) 
        ? prev.filter(t => t !== title)
        : [...prev, title]
    );
  };

  return (
    <Sidebar className="border-sidebar-border bg-sidebar" collapsible="icon">
      <SidebarHeader className="border-b border-sidebar-border p-4">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-10 h-10 bg-gradient-primary rounded-lg flex-shrink-0">
            <Dumbbell className="w-6 h-6 text-white" />
          </div>
          {!collapsed && (
            <div className="min-w-0 flex-1">
              <h1 className="text-lg font-bold text-sidebar-foreground truncate">
                {organization?.name || 'Rep Club'}
              </h1>
              <p className="text-xs text-sidebar-foreground/60 capitalize truncate">
                {profile?.role} Portal
              </p>
            </div>
          )}
        </div>
      </SidebarHeader>

      <SidebarContent className="px-2 py-4">
        {navigationGroups.map((group) => {
          // Filter items based on user permissions
          const visibleItems = group.items.filter(item => 
            item.permission ? hasPermission(item.permission) : true
          );
          
          // Skip empty groups
          if (visibleItems.length === 0) return null;
          
          const isExpanded = expandedGroups.includes(group.title);
          const hasActiveItem = visibleItems.some(item => isActive(item.href));

          return (
            <SidebarGroup key={group.title}>
              {!collapsed && (
                <SidebarGroupLabel 
                  className="px-2 py-1 cursor-pointer flex items-center justify-between hover:bg-sidebar-accent rounded-md transition-smooth"
                  onClick={() => toggleGroup(group.title)}
                >
                  <span className="text-sidebar-foreground/70 text-sm font-medium">
                    {group.title}
                  </span>
                  <ChevronRight 
                    className={cn(
                      "w-4 h-4 text-sidebar-foreground/50 transition-smooth",
                      isExpanded && "rotate-90"
                    )} 
                  />
                </SidebarGroupLabel>
              )}
              
              <SidebarGroupContent 
                className={cn(
                  "transition-all duration-200",
                  !collapsed && !isExpanded && "max-h-0 overflow-hidden",
                  (!collapsed && isExpanded) || collapsed ? "max-h-none" : ""
                )}
              >
                <SidebarMenu className="space-y-1">
                  {visibleItems.map((item) => {
                    const itemIsActive = isActive(item.href);
                    
                    return (
                      <SidebarMenuItem key={item.name}>
                        <SidebarMenuButton
                          className={cn(
                            "w-full transition-smooth",
                            itemIsActive 
                              ? "bg-gradient-primary text-white shadow-glow font-medium" 
                              : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                          )}
                          onClick={() => navigate(item.href)}
                        >
                          <item.icon className={cn(
                            "h-5 w-5 flex-shrink-0",
                            collapsed ? "mx-auto" : "mr-3"
                          )} />
                          {!collapsed && <span>{item.name}</span>}
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    );
                  })}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          );
        })}
      </SidebarContent>

      <SidebarFooter className="border-t border-sidebar-border p-4">
        <div className="flex items-center gap-3 mb-3">
          <div className="flex-shrink-0 w-8 h-8 bg-gradient-secondary rounded-full flex items-center justify-center">
            <span className="text-sm font-medium text-white">
              {profile?.first_name?.[0] || profile?.email?.[0]?.toUpperCase() || 'U'}
            </span>
          </div>
          {!collapsed && (
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-sidebar-foreground truncate">
                {profile?.first_name || profile?.email}
              </p>
              <p className="text-xs text-sidebar-foreground/60 truncate">
                {profile?.email}
              </p>
            </div>
          )}
        </div>
        
        <Button
          variant="outline"
          size={collapsed ? "icon" : "sm"}
          className="w-full border-sidebar-border bg-sidebar hover:bg-sidebar-accent text-sidebar-foreground"
          onClick={handleSignOut}
        >
          <LogOut className={cn("h-4 w-4", !collapsed && "mr-2")} />
          {!collapsed && "Sign Out"}
        </Button>
      </SidebarFooter>
    </Sidebar>
  );
}