import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from '@/components/ui/command';
import {
  Users,
  Calendar,
  CreditCard,
  BarChart3,
  Settings,
  UserPlus,
  CalendarPlus,
  Search,
  DollarSign,
  MessageSquare,
  Package,
  Shield,
  Sparkles,
  FileText,
  Phone,
  Mail,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useMembers } from '@/hooks/useMembers';

interface CommandPaletteProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CommandPalette({ open, onOpenChange }: CommandPaletteProps) {
  const navigate = useNavigate();
  const { profile } = useAuth();
  const { data: members = [] } = useMembers(profile?.organization_id);
  const [search, setSearch] = useState('');

  // Filter members based on search with debouncing effect built into cmdk
  const filteredMembers = useMemo(() => {
    if (!search || search.length < 2) return [];

    const query = search.toLowerCase();
    return members
      .filter(member => {
        const name = `${member.first_name || ''} ${member.last_name || ''}`.toLowerCase();
        const email = member.email.toLowerCase();
        return name.includes(query) || email.includes(query);
      })
      .slice(0, 5); // Limit to 5 results for performance
  }, [members, search]);

  // Navigation items
  const navigationItems = [
    { icon: BarChart3, label: 'Dashboard', path: '/dashboard', shortcut: '⌘D' },
    { icon: Users, label: 'Members', path: '/members', shortcut: '⌘M' },
    { icon: Calendar, label: 'Classes', path: '/classes', shortcut: '⌘C' },
    { icon: CreditCard, label: 'Billing', path: '/billing', shortcut: '⌘B' },
    { icon: FileText, label: 'Reports', path: '/reports', shortcut: '⌘R' },
    { icon: MessageSquare, label: 'CRM', path: '/crm' },
    { icon: Phone, label: 'Communication', path: '/communication' },
    { icon: Package, label: 'Equipment', path: '/equipment' },
    { icon: Shield, label: 'Security', path: '/security' },
    { icon: Settings, label: 'Settings', path: '/settings' },
  ];

  // Quick actions
  const quickActions = [
    { icon: UserPlus, label: 'Add New Member', action: () => console.log('Add member') },
    { icon: CalendarPlus, label: 'Schedule Class', action: () => console.log('Schedule class') },
    { icon: DollarSign, label: 'Create Invoice', action: () => console.log('Create invoice') },
    { icon: Mail, label: 'Send Email', action: () => console.log('Send email') },
  ];

  // Handle navigation
  const handleSelect = (callback: () => void) => {
    onOpenChange(false);
    callback();
  };

  // Handle member selection
  const handleMemberSelect = (memberId: string) => {
    onOpenChange(false);
    navigate(`/members?selected=${memberId}`);
  };

  return (
    <CommandDialog open={open} onOpenChange={onOpenChange}>
      <CommandInput
        placeholder="Type a command or search members..."
        value={search}
        onValueChange={setSearch}
      />
      <CommandList>
        <CommandEmpty>No results found.</CommandEmpty>

        {/* Quick Actions */}
        <CommandGroup heading="Quick Actions">
          {quickActions.map((action) => (
            <CommandItem
              key={action.label}
              onSelect={() => handleSelect(action.action)}
            >
              <action.icon className="mr-2 h-4 w-4" />
              <span>{action.label}</span>
            </CommandItem>
          ))}
        </CommandGroup>

        <CommandSeparator />

        {/* Navigation */}
        <CommandGroup heading="Navigation">
          {navigationItems.map((item) => (
            <CommandItem
              key={item.path}
              onSelect={() => handleSelect(() => navigate(item.path))}
            >
              <item.icon className="mr-2 h-4 w-4" />
              <span>{item.label}</span>
              {item.shortcut && (
                <kbd className="ml-auto pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground opacity-100">
                  {item.shortcut}
                </kbd>
              )}
            </CommandItem>
          ))}
        </CommandGroup>

        {/* Member Search Results */}
        {filteredMembers.length > 0 && (
          <>
            <CommandSeparator />
            <CommandGroup heading="Members">
              {filteredMembers.map((member) => (
                <CommandItem
                  key={member.id}
                  onSelect={() => handleMemberSelect(member.id)}
                >
                  <Users className="mr-2 h-4 w-4" />
                  <div className="flex flex-col">
                    <span>
                      {member.first_name && member.last_name
                        ? `${member.first_name} ${member.last_name}`
                        : member.email}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {member.email}
                      {member.membership && ` • ${member.membership.status}`}
                    </span>
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
          </>
        )}
      </CommandList>
    </CommandDialog>
  );
}

/**
 * Hook to manage command palette state and keyboard shortcuts
 */
export function useCommandPalette() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      // ⌘K or Ctrl+K to open
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((open) => !open);
      }

      // Escape to close
      if (e.key === 'Escape') {
        setOpen(false);
      }
    };

    document.addEventListener('keydown', down);
    return () => document.removeEventListener('keydown', down);
  }, []);

  return { open, setOpen };
}
