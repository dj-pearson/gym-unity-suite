import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { 
  Link as LinkIcon, 
  Users, 
  Copy, 
  ExternalLink,
  TrendingUp,
  MousePointer,
  UserPlus,
  RefreshCw,
  QrCode
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

interface SalespersonReferralManagerProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SalespersonReferralManager: React.FC<SalespersonReferralManagerProps> = ({
  isOpen,
  onClose
}) => {
  const { profile } = useAuth();
  const [loading, setLoading] = useState(false);
  const [salespeople, setSalespeople] = useState([]);
  const [referralLinks, setReferralLinks] = useState([]);
  const [stats, setStats] = useState({
    totalClicks: 0,
    totalConversions: 0,
    conversionRate: 0
  });

  useEffect(() => {
    if (isOpen && profile?.organization_id) {
      fetchData();
    }
  }, [isOpen, profile?.organization_id]);

  const fetchData = async () => {
    if (!profile?.organization_id) return;
    
    setLoading(true);
    try {
      // Fetch salespeople
      const { data: staffData, error: staffError } = await supabase
        .from('profiles')
        .select('id, first_name, last_name, email, role')
        .eq('organization_id', profile.organization_id)
        .in('role', ['staff', 'manager', 'owner']);

      if (staffError) throw staffError;
      setSalespeople(staffData || []);

      // Fetch referral links
      const { data: linksData, error: linksError } = await supabase
        .from('salesperson_referral_links')
        .select(`
          *,
          salesperson:salesperson_id(first_name, last_name, email)
        `)
        .eq('organization_id', profile.organization_id);

      if (linksError) throw linksError;
      setReferralLinks(linksData || []);

      // Calculate stats
      const totalClicks = linksData?.reduce((sum, link) => sum + link.click_count, 0) || 0;
      const totalConversions = linksData?.reduce((sum, link) => sum + link.conversion_count, 0) || 0;
      const conversionRate = totalClicks > 0 ? ((totalConversions / totalClicks) * 100) : 0;

      setStats({
        totalClicks,
        totalConversions,
        conversionRate
      });

    } catch (error) {
      console.error('Error fetching referral data:', error);
      toast.error('Failed to load referral data');
    } finally {
      setLoading(false);
    }
  };

  const generateReferralLink = async (salespersonId: string) => {
    if (!profile?.organization_id) return;

    setLoading(true);
    try {
      // Generate unique referral code
      const { data: codeData, error: codeError } = await supabase
        .rpc('generate_referral_code');

      if (codeError) throw codeError;

      const referralCode = codeData;
      const baseUrl = window.location.origin;
      const linkUrl = `${baseUrl}/signup?ref=${referralCode}`;

      const { error } = await supabase
        .from('salesperson_referral_links')
        .upsert({
          organization_id: profile.organization_id,
          salesperson_id: salespersonId,
          referral_code: referralCode,
          link_url: linkUrl,
          is_active: true
        });

      if (error) throw error;

      toast.success('Referral link generated successfully');
      fetchData();
    } catch (error) {
      console.error('Error generating referral link:', error);
      toast.error('Failed to generate referral link');
    } finally {
      setLoading(false);
    }
  };

  const toggleLinkStatus = async (linkId: string, isActive: boolean) => {
    try {
      const { error } = await supabase
        .from('salesperson_referral_links')
        .update({ is_active: !isActive })
        .eq('id', linkId);

      if (error) throw error;

      toast.success(`Referral link ${!isActive ? 'activated' : 'deactivated'}`);
      fetchData();
    } catch (error) {
      console.error('Error updating link status:', error);
      toast.error('Failed to update link status');
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Link copied to clipboard');
  };

  const regenerateCode = async (linkId: string) => {
    if (!confirm('Are you sure you want to regenerate this referral code? The old link will stop working.')) return;

    setLoading(true);
    try {
      // Generate new code
      const { data: codeData, error: codeError } = await supabase
        .rpc('generate_referral_code');

      if (codeError) throw codeError;

      const referralCode = codeData;
      const baseUrl = window.location.origin;
      const linkUrl = `${baseUrl}/signup?ref=${referralCode}`;

      const { error } = await supabase
        .from('salesperson_referral_links')
        .update({
          referral_code: referralCode,
          link_url: linkUrl,
          click_count: 0,
          conversion_count: 0
        })
        .eq('id', linkId);

      if (error) throw error;

      toast.success('Referral code regenerated successfully');
      fetchData();
    } catch (error) {
      console.error('Error regenerating code:', error);
      toast.error('Failed to regenerate code');
    } finally {
      setLoading(false);
    }
  };

  const getSalespersonLink = (salespersonId: string) => {
    return referralLinks.find(link => link.salesperson_id === salespersonId);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <LinkIcon className="h-5 w-5" />
            Referral Link Management
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <MousePointer className="h-4 w-4 text-blue-500" />
                  <div>
                    <p className="text-sm text-muted-foreground">Total Clicks</p>
                    <p className="text-2xl font-bold">{stats.totalClicks}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <UserPlus className="h-4 w-4 text-green-500" />
                  <div>
                    <p className="text-sm text-muted-foreground">Conversions</p>
                    <p className="text-2xl font-bold">{stats.totalConversions}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-purple-500" />
                  <div>
                    <p className="text-sm text-muted-foreground">Conversion Rate</p>
                    <p className="text-2xl font-bold">{stats.conversionRate.toFixed(1)}%</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Salesperson Referral Links */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-4 w-4" />
                Salesperson Referral Links
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Salesperson</TableHead>
                    <TableHead>Referral Code</TableHead>
                    <TableHead>Clicks</TableHead>
                    <TableHead>Conversions</TableHead>
                    <TableHead>Rate</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {salespeople.map((person) => {
                    const link = getSalespersonLink(person.id);
                    const conversionRate = link && link.click_count > 0 
                      ? ((link.conversion_count / link.click_count) * 100).toFixed(1)
                      : '0.0';

                    return (
                      <TableRow key={person.id}>
                        <TableCell>
                          <div>
                            <div className="font-medium">
                              {person.first_name} {person.last_name}
                            </div>
                            <div className="text-sm text-muted-foreground">
                              {person.email}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          {link ? (
                            <div className="flex items-center gap-2">
                              <code className="text-sm bg-muted px-2 py-1 rounded">
                                {link.referral_code}
                              </code>
                            </div>
                          ) : (
                            <span className="text-muted-foreground">No link</span>
                          )}
                        </TableCell>
                        <TableCell>
                          {link ? link.click_count : 0}
                        </TableCell>
                        <TableCell>
                          {link ? link.conversion_count : 0}
                        </TableCell>
                        <TableCell>
                          {conversionRate}%
                        </TableCell>
                        <TableCell>
                          {link ? (
                            <Badge variant={link.is_active ? 'default' : 'secondary'}>
                              {link.is_active ? 'Active' : 'Inactive'}
                            </Badge>
                          ) : (
                            <Badge variant="outline">Not Generated</Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            {link ? (
                              <>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => copyToClipboard(link.link_url)}
                                >
                                  <Copy className="h-3 w-3" />
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => window.open(link.link_url, '_blank')}
                                >
                                  <ExternalLink className="h-3 w-3" />
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => toggleLinkStatus(link.id, link.is_active)}
                                >
                                  <Switch 
                                    checked={link.is_active} 
                                    className="pointer-events-none"
                                  />
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => regenerateCode(link.id)}
                                >
                                  <RefreshCw className="h-3 w-3" />
                                </Button>
                              </>
                            ) : (
                              <Button
                                size="sm"
                                onClick={() => generateReferralLink(person.id)}
                                disabled={loading}
                              >
                                Generate Link
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {/* Usage Instructions */}
          <Card>
            <CardHeader>
              <CardTitle>How Referral Links Work</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <h4 className="font-medium">For Salespeople:</h4>
                <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
                  <li>Share your unique referral link with potential members</li>
                  <li>When someone clicks your link and signs up, you get credited for the referral</li>
                  <li>Track your clicks and conversion rates in this dashboard</li>
                  <li>Links can be shared via email, social media, or business cards</li>
                </ul>
              </div>

              <Separator />

              <div className="space-y-2">
                <h4 className="font-medium">For Managers:</h4>
                <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
                  <li>Generate referral links for your sales team</li>
                  <li>Monitor performance across all salespeople</li>
                  <li>Activate/deactivate links as needed</li>
                  <li>Regenerate codes if links are compromised</li>
                </ul>
              </div>

              <Separator />

              <div className="bg-muted p-4 rounded-lg">
                <h4 className="font-medium mb-2">Attribution Rules:</h4>
                <p className="text-sm text-muted-foreground">
                  When a potential member signs up through a referral link, they are automatically 
                  attributed to that salesperson. If they later sign up through the main website 
                  without a referral code, managers can manually assign attribution based on lead history.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  );
};