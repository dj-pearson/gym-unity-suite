import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, ExternalLink, TrendingUp } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";

export default function LeadSourcesManager() {
  const { toast } = useToast();

  // Placeholder data for demonstration
  const leadSources = [
    {
      id: "1",
      name: "Website",
      category: "Digital",
      description: "Organic website traffic and contact forms",
      is_active: true,
      leads_count: 25,
      conversion_rate: 12.5,
      cost_per_lead: 45.20
    },
    {
      id: "2",
      name: "Google Ads",
      category: "Paid Advertising",
      description: "Google AdWords campaigns",
      is_active: true,
      leads_count: 18,
      conversion_rate: 22.2,
      cost_per_lead: 89.50
    },
    {
      id: "3",
      name: "Referrals",
      category: "Word of Mouth",
      description: "Member referral program",
      is_active: true,
      leads_count: 12,
      conversion_rate: 41.7,
      cost_per_lead: 25.00
    }
  ];

  const handleAddSource = () => {
    toast({
      title: "Add Lead Source",
      description: "Lead source creation form will be implemented here.",
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Lead Sources</h2>
          <p className="text-muted-foreground">
            Track and manage all lead generation channels
          </p>
        </div>
        <Button onClick={handleAddSource}>
          <Plus className="mr-2 h-4 w-4" />
          Add Source
        </Button>
      </div>

      {/* Lead Sources Performance */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Sources
            </CardTitle>
            <ExternalLink className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{leadSources.length}</div>
            <Badge variant="secondary" className="mt-2">
              All Active
            </Badge>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Leads
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {leadSources.reduce((sum, source) => sum + source.leads_count, 0)}
            </div>
            <Badge variant="default" className="mt-2">
              This Month
            </Badge>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Avg. Conversion
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {(leadSources.reduce((sum, source) => sum + source.conversion_rate, 0) / leadSources.length).toFixed(1)}%
            </div>
            <Badge variant="outline" className="mt-2">
              Conversion Rate
            </Badge>
          </CardContent>
        </Card>
      </div>

      {/* Lead Sources List */}
      <Card>
        <CardHeader>
          <CardTitle>Lead Sources</CardTitle>
          <CardDescription>
            Performance metrics for each lead generation channel
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {leadSources.map((source) => (
              <div key={source.id} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center gap-4">
                  <ExternalLink className="h-5 w-5 text-primary" />
                  <div>
                    <h4 className="font-medium">{source.name}</h4>
                    <p className="text-sm text-muted-foreground">{source.description}</p>
                    <Badge variant="outline" className="mt-1">
                      {source.category}
                    </Badge>
                  </div>
                </div>
                <div className="flex items-center gap-6 text-right">
                  <div>
                    <p className="text-sm font-medium">{source.leads_count} leads</p>
                    <p className="text-xs text-muted-foreground">This month</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium">{source.conversion_rate}%</p>
                    <p className="text-xs text-muted-foreground">Conversion rate</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium">${source.cost_per_lead}</p>
                    <p className="text-xs text-muted-foreground">Cost per lead</p>
                  </div>
                  <Button variant="ghost" size="sm">
                    Edit
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}