import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, FileText, Send, DollarSign } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";

export default function SalesQuotesManager() {
  const { toast } = useToast();

  // Placeholder data for demonstration
  const quotes = [
    {
      id: "1",
      quote_number: "Q-2024-001",
      lead_name: "John Smith",
      title: "Premium Membership Package",
      total_amount: 299.99,
      status: "sent",
      valid_until: "2024-02-15"
    },
    {
      id: "2", 
      quote_number: "Q-2024-002",
      lead_name: "Sarah Johnson",
      title: "Family Membership Package",
      total_amount: 449.99,
      status: "accepted",
      valid_until: "2024-02-20"
    }
  ];

  const handleCreateQuote = () => {
    toast({
      title: "Create Quote",
      description: "Quote creation form will be implemented here.",
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Sales Quotes</h2>
          <p className="text-muted-foreground">
            Create and manage membership quotes for prospects
          </p>
        </div>
        <Button onClick={handleCreateQuote}>
          <Plus className="mr-2 h-4 w-4" />
          Create Quote
        </Button>
      </div>

      {/* Quote Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Quotes</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{quotes.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Value</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${quotes.reduce((sum, quote) => sum + quote.total_amount, 0).toFixed(2)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Accepted</CardTitle>
            <Send className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {quotes.filter(q => q.status === 'accepted').length}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Acceptance Rate</CardTitle>
            <Send className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {quotes.length > 0 ? ((quotes.filter(q => q.status === 'accepted').length / quotes.length) * 100).toFixed(1) : 0}%
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quotes List */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Quotes</CardTitle>
          <CardDescription>
            Track quote status and manage proposals
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {quotes.map((quote) => (
              <div key={quote.id} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center gap-4">
                  <FileText className="h-5 w-5 text-primary" />
                  <div>
                    <h4 className="font-medium">{quote.quote_number}</h4>
                    <p className="text-sm text-muted-foreground">{quote.lead_name}</p>
                    <p className="text-sm text-muted-foreground">{quote.title}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <p className="font-medium">${quote.total_amount}</p>
                    <p className="text-sm text-muted-foreground">Valid until {quote.valid_until}</p>
                  </div>
                  <Badge variant={quote.status === 'accepted' ? 'default' : 'secondary'}>
                    {quote.status}
                  </Badge>
                  <Button variant="ghost" size="sm">
                    View
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