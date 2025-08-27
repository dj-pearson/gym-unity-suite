import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from '@/components/ui/sidebar';
import {
  Home,
  Calendar,
  Activity,
  User,
  Trophy,
  Star,
  CreditCard,
  Bell,
  MessageSquare
} from 'lucide-react';

const memberMenuItems = [
  {
    title: 'Dashboard',
    url: '/member/dashboard',
    icon: Home,
    group: 'main'
  },
  {
    title: 'My Classes',
    url: '/member/classes',
    icon: Calendar,
    group: 'fitness'
  },
  {
    title: 'Workout History',
    url: '/member/history',
    icon: Activity,
    group: 'fitness'
  },
  {
    title: 'My Profile',
    url: '/member/profile',
    icon: User,
    group: 'account'
  },
  {
    title: 'Loyalty Points',
    url: '/member/loyalty',
    icon: Trophy,
    group: 'account'
  },
  {
    title: 'Membership',
    url: '/member/membership',
    icon: Star,
    group: 'account'
  },
  {
    title: 'Billing',
    url: '/member/billing',
    icon: CreditCard,
    group: 'account'
  },
  {
    title: 'Notifications',
    url: '/member/notifications',
    icon: Bell,
    group: 'communication'
  },
  {
    title: 'Messages',
    url: '/member/messages',
    icon: MessageSquare,
    group: 'communication'
  }
];

const menuGroups = {
  main: 'Dashboard',
  fitness: 'Fitness',
  account: 'My Account',
  communication: 'Communication'
};

export function MemberSidebar() {
  const location = useLocation();
  const currentPath = location.pathname;

  const isActive = (url: string) => currentPath === url;
  
  const getNavCls = ({ isActive }: { isActive: boolean }) =>
    isActive ? "bg-muted text-primary font-medium" : "hover:bg-muted/50";

  // Group items by category
  const groupedItems = memberMenuItems.reduce((acc, item) => {
    if (!acc[item.group]) {
      acc[item.group] = [];
    }
    acc[item.group].push(item);
    return acc;
  }, {} as Record<string, typeof memberMenuItems>);

  return (
    <Sidebar className="w-60">
      <SidebarContent>
        {Object.entries(groupedItems).map(([groupKey, items]) => {
          return (
            <SidebarGroup key={groupKey}>
              <SidebarGroupLabel className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                {menuGroups[groupKey as keyof typeof menuGroups]}
              </SidebarGroupLabel>
              
              <SidebarGroupContent>
                <SidebarMenu>
                  {items.map((item) => (
                    <SidebarMenuItem key={item.title}>
                      <SidebarMenuButton asChild>
                        <NavLink 
                          to={item.url} 
                          end 
                          className={getNavCls}
                        >
                          <item.icon className="h-4 w-4" />
                          <span className="ml-2">{item.title}</span>
                        </NavLink>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          );
        })}
      </SidebarContent>
    </Sidebar>
  );
}