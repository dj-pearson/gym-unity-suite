/**
 * AdminDashboardPage - Comprehensive admin interface for system management.
 *
 * Features:
 * - User/staff management with role assignment
 * - Audit log viewer with filtering
 * - Organization settings configuration
 * - System health overview
 *
 * Gated behind MANAGE_SYSTEM permission.
 */

import { useState, useEffect, useMemo } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Users,
  ScrollText,
  Settings2,
  Activity,
  Shield,
  Search,
  UserCog,
  Clock,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  RefreshCw,
} from "lucide-react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { useDebounce } from "@/hooks/useDebounce";
import { getRecentAuditLogs, getSecurityStats } from "@/lib/security/security-audit";
import type { SecurityAuditEntry } from "@/lib/security/security-layers";
import { ErrorBoundary } from "react-error-boundary";

function SectionErrorFallback({ resetErrorBoundary }: { error: Error; resetErrorBoundary: () => void }) {
  return (
    <div className="rounded-lg border bg-card p-6 text-center text-muted-foreground">
      <AlertTriangle className="h-6 w-6 mx-auto mb-2" />
      <p className="text-sm mb-2">Failed to load this section.</p>
      <Button variant="outline" size="sm" onClick={resetErrorBoundary}>Retry</Button>
    </div>
  );
}

// ============================================================================
// User Management Tab
// ============================================================================

function UserManagementTab() {
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("all");
  const debouncedSearch = useDebounce(searchQuery, 300);

  const { data: profiles, isLoading, refetch } = useQuery({
    queryKey: ["admin-users", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("id, email, first_name, last_name, role, created_at, updated_at")
        .order("created_at", { ascending: false })
        .limit(100);
      if (error) throw error;
      return data || [];
    },
    enabled: !!user,
  });

  const filteredProfiles = useMemo(() => {
    if (!profiles) return [];
    let result = profiles;

    if (debouncedSearch) {
      const q = debouncedSearch.toLowerCase();
      result = result.filter(
        (p) =>
          p.email?.toLowerCase().includes(q) ||
          p.first_name?.toLowerCase().includes(q) ||
          p.last_name?.toLowerCase().includes(q)
      );
    }

    if (roleFilter !== "all") {
      result = result.filter((p) => p.role === roleFilter);
    }

    return result;
  }, [profiles, debouncedSearch, roleFilter]);

  const roleBadgeColor = (role: string) => {
    switch (role) {
      case "owner": return "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200";
      case "manager": return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200";
      case "staff": return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200";
      case "trainer": return "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200";
      case "member": return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200";
      default: return "";
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search users by name or email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={roleFilter} onValueChange={setRoleFilter}>
          <SelectTrigger className="w-[140px]">
            <SelectValue placeholder="All Roles" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Roles</SelectItem>
            <SelectItem value="owner">Owner</SelectItem>
            <SelectItem value="manager">Manager</SelectItem>
            <SelectItem value="staff">Staff</SelectItem>
            <SelectItem value="trainer">Trainer</SelectItem>
            <SelectItem value="member">Member</SelectItem>
          </SelectContent>
        </Select>
        <Button variant="outline" size="sm" onClick={() => refetch()}>
          <RefreshCw className="h-4 w-4" />
        </Button>
      </div>

      <Card>
        <CardContent className="pt-4">
          {isLoading ? (
            <div className="text-center py-8 text-muted-foreground">Loading users...</div>
          ) : filteredProfiles.length > 0 ? (
            <div className="space-y-1">
              <div className="grid grid-cols-5 text-xs font-medium text-muted-foreground border-b pb-2 px-2">
                <span>Name</span>
                <span>Email</span>
                <span>Role</span>
                <span>Joined</span>
                <span>Last Updated</span>
              </div>
              {filteredProfiles.map((profile) => (
                <div key={profile.id} className="grid grid-cols-5 text-sm py-2 px-2 hover:bg-muted/50 rounded items-center">
                  <span className="font-medium">
                    {profile.first_name || ""} {profile.last_name || ""}
                    {!profile.first_name && !profile.last_name && (
                      <span className="text-muted-foreground italic">No name</span>
                    )}
                  </span>
                  <span className="text-muted-foreground truncate">{profile.email || "—"}</span>
                  <span>
                    <Badge className={roleBadgeColor(profile.role || "member")} variant="outline">
                      {profile.role || "member"}
                    </Badge>
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {profile.created_at ? new Date(profile.created_at).toLocaleDateString() : "—"}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {profile.updated_at ? new Date(profile.updated_at).toLocaleDateString() : "—"}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <Users className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p>{debouncedSearch ? "No users match your search." : "No users found."}</p>
            </div>
          )}
        </CardContent>
      </Card>

      <p className="text-xs text-muted-foreground">
        Showing {filteredProfiles.length} of {profiles?.length || 0} users
      </p>
    </div>
  );
}

// ============================================================================
// Audit Log Tab
// ============================================================================

function AuditLogTab() {
  const [logs, setLogs] = useState<SecurityAuditEntry[]>([]);
  const [actionFilter, setActionFilter] = useState<string>("all");
  const [resultFilter, setResultFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const debouncedSearch = useDebounce(searchQuery, 300);

  const refreshLogs = () => {
    const filters: any = {};
    if (actionFilter !== "all") {
      filters.action = actionFilter;
    }
    if (resultFilter !== "all") {
      filters.result = resultFilter;
    }
    setLogs(getRecentAuditLogs(200, Object.keys(filters).length > 0 ? filters : undefined));
  };

  useEffect(() => {
    refreshLogs();
  }, [actionFilter, resultFilter]);

  const filteredLogs = useMemo(() => {
    if (!debouncedSearch) return logs;
    const q = debouncedSearch.toLowerCase();
    return logs.filter(
      (l) =>
        l.action.toLowerCase().includes(q) ||
        l.layer.toLowerCase().includes(q) ||
        l.userId?.toLowerCase().includes(q) ||
        JSON.stringify(l.metadata).toLowerCase().includes(q)
    );
  }, [logs, debouncedSearch]);

  const formatTimestamp = (ts: number) => {
    return new Date(ts).toLocaleString();
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search logs..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={actionFilter} onValueChange={setActionFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="All Actions" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Actions</SelectItem>
            <SelectItem value="login_attempt">Login Attempt</SelectItem>
            <SelectItem value="login_success">Login Success</SelectItem>
            <SelectItem value="login_failure">Login Failure</SelectItem>
            <SelectItem value="permission_denied">Permission Denied</SelectItem>
            <SelectItem value="resource_access">Resource Access</SelectItem>
            <SelectItem value="rate_limit_exceeded">Rate Limited</SelectItem>
            <SelectItem value="suspicious_activity">Suspicious Activity</SelectItem>
          </SelectContent>
        </Select>
        <Select value={resultFilter} onValueChange={setResultFilter}>
          <SelectTrigger className="w-[140px]">
            <SelectValue placeholder="All Results" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Results</SelectItem>
            <SelectItem value="allowed">Allowed</SelectItem>
            <SelectItem value="denied">Denied</SelectItem>
          </SelectContent>
        </Select>
        <Button variant="outline" size="sm" onClick={refreshLogs}>
          <RefreshCw className="h-4 w-4" />
        </Button>
      </div>

      <Card>
        <CardContent className="pt-4">
          {filteredLogs.length > 0 ? (
            <div className="space-y-1 max-h-[500px] overflow-y-auto">
              {filteredLogs.map((log, i) => (
                <div key={i} className="flex items-center gap-2 py-2 border-b last:border-0 text-xs">
                  <span className="w-36 text-muted-foreground flex items-center gap-1 shrink-0">
                    <Clock className="h-3 w-3" />
                    {formatTimestamp(log.timestamp)}
                  </span>
                  <Badge variant="outline" className="shrink-0">
                    {log.layer.replace(/_/g, " ")}
                  </Badge>
                  <span className="font-mono shrink-0">{log.action}</span>
                  {log.result === "allowed" ? (
                    <CheckCircle2 className="h-3 w-3 text-green-500 shrink-0" />
                  ) : (
                    <XCircle className="h-3 w-3 text-red-500 shrink-0" />
                  )}
                  {log.userId && (
                    <span className="text-muted-foreground truncate ml-auto">
                      User: {log.userId.slice(0, 8)}...
                    </span>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <ScrollText className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p>No audit logs recorded yet.</p>
              <p className="text-xs mt-1">Security events are captured as users interact with the system.</p>
            </div>
          )}
        </CardContent>
      </Card>

      <p className="text-xs text-muted-foreground">
        Showing {filteredLogs.length} log entries
      </p>
    </div>
  );
}

// ============================================================================
// System Overview Tab
// ============================================================================

function SystemOverviewTab() {
  const stats = getSecurityStats();
  const { user } = useAuth();

  const { data: orgStats } = useQuery({
    queryKey: ["admin-org-stats", user?.id],
    queryFn: async () => {
      const [membersResult, classesResult, profilesResult] = await Promise.all([
        supabase.from("members").select("id", { count: "exact", head: true }),
        supabase.from("classes").select("id", { count: "exact", head: true }),
        supabase.from("profiles").select("id", { count: "exact", head: true }),
      ]);

      return {
        totalMembers: membersResult.count || 0,
        totalClasses: classesResult.count || 0,
        totalUsers: profilesResult.count || 0,
      };
    },
    enabled: !!user,
  });

  return (
    <div className="space-y-6">
      {/* Platform Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-1">
              <Users className="h-3 w-3" /> Total Users
            </CardDescription>
          </CardHeader>
          <CardContent>
            <span className="text-2xl font-bold">{orgStats?.totalUsers || 0}</span>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-1">
              <UserCog className="h-3 w-3" /> Total Members
            </CardDescription>
          </CardHeader>
          <CardContent>
            <span className="text-2xl font-bold">{orgStats?.totalMembers || 0}</span>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-1">
              <Activity className="h-3 w-3" /> Total Classes
            </CardDescription>
          </CardHeader>
          <CardContent>
            <span className="text-2xl font-bold">{orgStats?.totalClasses || 0}</span>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-1">
              <Shield className="h-3 w-3" /> Security Events (24h)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <span className="text-2xl font-bold">{stats.totalEvents}</span>
            {stats.deniedEvents > 0 && (
              <span className="text-xs text-red-500 ml-2">
                ({stats.deniedEvents} denied)
              </span>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Security Summary */}
      {stats.totalEvents > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Security Summary (24h)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
              <div>
                <p className="text-lg font-bold text-blue-600">{stats.bySeverity.low}</p>
                <p className="text-xs text-muted-foreground">Low</p>
              </div>
              <div>
                <p className="text-lg font-bold text-yellow-600">{stats.bySeverity.medium}</p>
                <p className="text-xs text-muted-foreground">Medium</p>
              </div>
              <div>
                <p className="text-lg font-bold text-orange-600">{stats.bySeverity.high}</p>
                <p className="text-xs text-muted-foreground">High</p>
              </div>
              <div>
                <p className="text-lg font-bold text-red-600">{stats.bySeverity.critical}</p>
                <p className="text-xs text-muted-foreground">Critical</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Platform Info */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium">Platform Information</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-2 text-sm">
            <span className="text-muted-foreground">Application</span>
            <span>Gym Unity Suite v1.2</span>
            <span className="text-muted-foreground">Environment</span>
            <span>{import.meta.env.MODE}</span>
            <span className="text-muted-foreground">Build</span>
            <span>{import.meta.env.PROD ? "Production" : "Development"}</span>
            <span className="text-muted-foreground">Database</span>
            <span>Supabase (PostgreSQL)</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// ============================================================================
// Main Admin Dashboard Page
// ============================================================================

export default function AdminDashboardPage() {
  return (
    <DashboardLayout>
      <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Admin Dashboard</h1>
            <p className="text-muted-foreground">
              System administration, user management, and audit logging
            </p>
          </div>
        </div>

        <Tabs defaultValue="overview" className="space-y-4">
          <TabsList>
            <TabsTrigger value="overview" className="flex items-center gap-2">
              <Activity className="h-4 w-4" />
              Overview
            </TabsTrigger>
            <TabsTrigger value="users" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              Users
            </TabsTrigger>
            <TabsTrigger value="audit" className="flex items-center gap-2">
              <ScrollText className="h-4 w-4" />
              Audit Logs
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            <ErrorBoundary FallbackComponent={SectionErrorFallback}>
              <SystemOverviewTab />
            </ErrorBoundary>
          </TabsContent>

          <TabsContent value="users" className="space-y-4">
            <ErrorBoundary FallbackComponent={SectionErrorFallback}>
              <UserManagementTab />
            </ErrorBoundary>
          </TabsContent>

          <TabsContent value="audit" className="space-y-4">
            <ErrorBoundary FallbackComponent={SectionErrorFallback}>
              <AuditLogTab />
            </ErrorBoundary>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
