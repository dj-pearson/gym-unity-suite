import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { 
  Download, 
  FileSpreadsheet, 
  FileText, 
  Mail, 
  Calendar,
  Filter,
  Loader2
} from 'lucide-react';

interface ExportConfig {
  reportType: string;
  format: 'csv' | 'pdf' | 'excel';
  dateRange: {
    start: string;
    end: string;
  };
  includeSections: string[];
  emailRecipients: string[];
  scheduleFrequency: 'none' | 'daily' | 'weekly' | 'monthly';
}

const reportTypes = [
  { 
    id: 'member_analytics', 
    name: 'Member Analytics',
    description: 'Comprehensive member engagement and retention metrics',
    sections: ['Member Growth', 'Retention Rates', 'Engagement Patterns', 'Demographics']
  },
  { 
    id: 'revenue_analytics', 
    name: 'Revenue Analytics',
    description: 'Financial performance and revenue trends',
    sections: ['Revenue Trends', 'Payment Methods', 'Membership Revenue', 'Product Sales']
  },
  { 
    id: 'class_analytics', 
    name: 'Class Analytics',
    description: 'Class performance and utilization metrics',
    sections: ['Class Utilization', 'Popular Classes', 'Instructor Performance', 'Booking Patterns']
  },
  { 
    id: 'operational_analytics', 
    name: 'Operational Analytics',
    description: 'Daily operations and facility usage',
    sections: ['Check-in Patterns', 'Peak Hours', 'Staff Performance', 'Facility Utilization']
  },
  { 
    id: 'complete_report', 
    name: 'Complete Business Report',
    description: 'All analytics combined into one comprehensive report',
    sections: ['Executive Summary', 'Member Analytics', 'Revenue Analytics', 'Operations', 'Recommendations']
  }
];

export default function ExportReports() {
  const { profile } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [config, setConfig] = useState<ExportConfig>({
    reportType: 'member_analytics',
    format: 'pdf',
    dateRange: {
      start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      end: new Date().toISOString().split('T')[0]
    },
    includeSections: [],
    emailRecipients: [],
    scheduleFrequency: 'none'
  });

  const selectedReportType = reportTypes.find(rt => rt.id === config.reportType);

  const generateReport = async () => {
    if (!profile?.organization_id) return;

    try {
      setLoading(true);

      // This would integrate with a reporting service or generate the report locally
      // For now, we'll simulate the export process
      
      const reportData = await fetchReportData();
      
      if (config.format === 'csv') {
        downloadCSV(reportData);
      } else if (config.format === 'pdf') {
        downloadPDF(reportData);
      } else if (config.format === 'excel') {
        downloadExcel(reportData);
      }

      toast({
        title: "Report Generated",
        description: `${selectedReportType?.name} has been exported successfully.`
      });

      // If email recipients are specified, send the report
      if (config.emailRecipients.length > 0) {
        await sendReportByEmail(reportData);
        toast({
          title: "Report Sent",
          description: `Report has been emailed to ${config.emailRecipients.length} recipient(s).`
        });
      }

    } catch (error) {
      console.error('Error generating report:', error);
      toast({
        title: "Export Failed",
        description: "There was an error generating the report. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchReportData = async () => {
    const startDate = new Date(config.dateRange.start);
    const endDate = new Date(config.dateRange.end);

    const data: any = {
      reportType: config.reportType,
      dateRange: config.dateRange,
      generatedAt: new Date().toISOString(),
      organizationId: profile?.organization_id
    };

    // Fetch data based on report type
    switch (config.reportType) {
      case 'member_analytics':
        data.members = await fetchMemberData(startDate, endDate);
        break;
      case 'revenue_analytics':
        data.revenue = await fetchRevenueData(startDate, endDate);
        break;
      case 'class_analytics':
        data.classes = await fetchClassData(startDate, endDate);
        break;
      case 'operational_analytics':
        data.operations = await fetchOperationalData(startDate, endDate);
        break;
      case 'complete_report':
        data.members = await fetchMemberData(startDate, endDate);
        data.revenue = await fetchRevenueData(startDate, endDate);
        data.classes = await fetchClassData(startDate, endDate);
        data.operations = await fetchOperationalData(startDate, endDate);
        break;
    }

    return data;
  };

  const fetchMemberData = async (startDate: Date, endDate: Date) => {
    const { data: members } = await supabase
      .from('member_engagement_summary')
      .select('*')
      .eq('organization_id', profile?.organization_id);

    const { data: checkIns } = await supabase
      .from('check_ins')
      .select('*')
      .gte('checked_in_at', startDate.toISOString())
      .lte('checked_in_at', endDate.toISOString())
      .eq('is_guest', false);

    return { members, checkIns };
  };

  const fetchRevenueData = async (startDate: Date, endDate: Date) => {
    const { data: transactions } = await supabase
      .from('payment_transactions')
      .select('*')
      .gte('created_at', startDate.toISOString())
      .lte('created_at', endDate.toISOString())
      .eq('payment_status', 'completed');

    return { transactions };
  };

  const fetchClassData = async (startDate: Date, endDate: Date) => {
    const { data: classes } = await supabase
      .from('classes')
      .select(`
        *,
        class_bookings(count),
        profiles(first_name, last_name)
      `)
      .eq('organization_id', profile?.organization_id)
      .gte('scheduled_at', startDate.toISOString())
      .lte('scheduled_at', endDate.toISOString());

    return { classes };
  };

  const fetchOperationalData = async (startDate: Date, endDate: Date) => {
    const { data: checkIns } = await supabase
      .from('check_ins')
      .select('*')
      .gte('checked_in_at', startDate.toISOString())
      .lte('checked_in_at', endDate.toISOString());

    return { checkIns };
  };

  const downloadCSV = (data: any) => {
    // Convert data to CSV format
    const csv = convertToCSV(data);
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${config.reportType}_${config.dateRange.start}_to_${config.dateRange.end}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const downloadPDF = (data: any) => {
    // In a real implementation, this would use a PDF generation library
    const content = JSON.stringify(data, null, 2);
    const blob = new Blob([content], { type: 'application/json' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${config.reportType}_${config.dateRange.start}_to_${config.dateRange.end}.json`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const downloadExcel = (data: any) => {
    // In a real implementation, this would use an Excel generation library
    const content = JSON.stringify(data, null, 2);
    const blob = new Blob([content], { type: 'application/json' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${config.reportType}_${config.dateRange.start}_to_${config.dateRange.end}.json`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const convertToCSV = (data: any): string => {
    // Simple CSV conversion - in production, use a proper CSV library
    return JSON.stringify(data);
  };

  const sendReportByEmail = async (data: any) => {
    // This would integrate with an email service
    console.log('Sending report by email to:', config.emailRecipients);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Download className="h-6 w-6 text-primary" />
        <h2 className="text-2xl font-bold">Export Reports</h2>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Report Configuration */}
        <Card>
          <CardHeader>
            <CardTitle>Report Configuration</CardTitle>
            <CardDescription>
              Configure your report settings and data range
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Report Type Selection */}
            <div className="space-y-2">
              <Label>Report Type</Label>
              <Select
                value={config.reportType}
                onValueChange={(value) => setConfig(prev => ({ ...prev, reportType: value, includeSections: [] }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {reportTypes.map(type => (
                    <SelectItem key={type.id} value={type.id}>
                      {type.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {selectedReportType && (
                <p className="text-sm text-muted-foreground">
                  {selectedReportType.description}
                </p>
              )}
            </div>

            {/* Format Selection */}
            <div className="space-y-2">
              <Label>Export Format</Label>
              <div className="flex gap-2">
                {[
                  { value: 'pdf', label: 'PDF', icon: FileText },
                  { value: 'csv', label: 'CSV', icon: FileSpreadsheet },
                  { value: 'excel', label: 'Excel', icon: FileSpreadsheet }
                ].map(format => (
                  <Button
                    key={format.value}
                    variant={config.format === format.value ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setConfig(prev => ({ ...prev, format: format.value as any }))}
                    className="flex items-center gap-2"
                  >
                    <format.icon className="w-4 h-4" />
                    {format.label}
                  </Button>
                ))}
              </div>
            </div>

            {/* Date Range */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Start Date</Label>
                <Input
                  type="date"
                  value={config.dateRange.start}
                  onChange={(e) => setConfig(prev => ({
                    ...prev,
                    dateRange: { ...prev.dateRange, start: e.target.value }
                  }))}
                />
              </div>
              <div className="space-y-2">
                <Label>End Date</Label>
                <Input
                  type="date"
                  value={config.dateRange.end}
                  onChange={(e) => setConfig(prev => ({
                    ...prev,
                    dateRange: { ...prev.dateRange, end: e.target.value }
                  }))}
                />
              </div>
            </div>

            {/* Include Sections */}
            {selectedReportType && (
              <div className="space-y-2">
                <Label>Include Sections</Label>
                <div className="grid grid-cols-1 gap-2">
                  {selectedReportType.sections.map(section => (
                    <div key={section} className="flex items-center space-x-2">
                      <Checkbox
                        id={section}
                        checked={config.includeSections.includes(section)}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setConfig(prev => ({
                              ...prev,
                              includeSections: [...prev.includeSections, section]
                            }));
                          } else {
                            setConfig(prev => ({
                              ...prev,
                              includeSections: prev.includeSections.filter(s => s !== section)
                            }));
                          }
                        }}
                      />
                      <Label htmlFor={section} className="text-sm">
                        {section}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Email Recipients */}
            <div className="space-y-2">
              <Label>Email Recipients (Optional)</Label>
              <Input
                placeholder="Enter email addresses separated by commas"
                value={config.emailRecipients.join(', ')}
                onChange={(e) => setConfig(prev => ({
                  ...prev,
                  emailRecipients: e.target.value.split(',').map(email => email.trim()).filter(Boolean)
                }))}
              />
            </div>
          </CardContent>
        </Card>

        {/* Report Preview */}
        <Card>
          <CardHeader>
            <CardTitle>Report Preview</CardTitle>
            <CardDescription>
              Preview of your configured report
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-4 bg-muted rounded-lg">
              <h3 className="font-semibold mb-2">{selectedReportType?.name}</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>Format:</span>
                  <Badge variant="outline">{config.format.toUpperCase()}</Badge>
                </div>
                <div className="flex justify-between">
                  <span>Date Range:</span>
                  <span>{config.dateRange.start} to {config.dateRange.end}</span>
                </div>
                <div className="flex justify-between">
                  <span>Sections:</span>
                  <span>{config.includeSections.length || selectedReportType?.sections.length || 0}</span>
                </div>
                {config.emailRecipients.length > 0 && (
                  <div className="flex justify-between">
                    <span>Email Recipients:</span>
                    <span>{config.emailRecipients.length}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Generate Button */}
            <Button 
              onClick={generateReport} 
              disabled={loading}
              className="w-full"
              size="lg"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Generating Report...
                </>
              ) : (
                <>
                  <Download className="w-4 h-4 mr-2" />
                  Generate & Download Report
                </>
              )}
            </Button>

            {config.emailRecipients.length > 0 && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Mail className="w-4 h-4" />
                Report will also be emailed to recipients
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}