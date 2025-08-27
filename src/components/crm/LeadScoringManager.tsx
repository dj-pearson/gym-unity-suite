import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, Calculator, TrendingUp, Target } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";

export default function LeadScoringManager() {
  const { toast } = useToast();

  const handleRecalculate = () => {
    toast({
      title: "Lead Scores Recalculated",
      description: "All lead scores have been updated based on current rules.",
    });
  };

  // Placeholder data for demonstration
  const scoreDistribution = [
    { range: "0-20", count: 15, qualification: "Cold" },
    { range: "21-40", count: 8, qualification: "Warm" },
    { range: "41-60", count: 12, qualification: "Hot" },
    { range: "61-80", count: 5, qualification: "Qualified" },
    { range: "81-100", count: 3, qualification: "Highly Qualified" }
  ];

  const scoringRules = [
    {
      id: "1",
      rule_name: "Website Source",
      criteria_type: "source",
      criteria_field: "source",
      criteria_operator: "equals",
      criteria_value: "website",
      score_points: 10,
      is_active: true
    },
    {
      id: "2", 
      rule_name: "High Interest Level",
      criteria_type: "behavioral",
      criteria_field: "interest_level",
      criteria_operator: "equals",
      criteria_value: "hot",
      score_points: 25,
      is_active: true
    }
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Lead Scoring</h2>
          <p className="text-muted-foreground">
            Manage scoring rules and track lead qualification
          </p>
        </div>
        <div className="flex items-center gap-4">
          <Button onClick={handleRecalculate} variant="outline">
            <Calculator className="mr-2 h-4 w-4" />
            Recalculate All Scores
          </Button>
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Add Scoring Rule
          </Button>
        </div>
      </div>

      {/* Score Distribution */}
      <div>
        <h3 className="text-lg font-semibold mb-4">Score Distribution</h3>
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          {scoreDistribution.map((item) => (
            <Card key={item.range}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Score {item.range}
                </CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{item.count}</div>
                <Badge variant="secondary" className="mt-2">
                  {item.qualification}
                </Badge>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Scoring Rules */}
      <Card>
        <CardHeader>
          <CardTitle>Scoring Rules</CardTitle>
          <CardDescription>
            Define criteria and point values for lead scoring
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {scoringRules.map((rule) => (
              <div key={rule.id} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center gap-4">
                  <Target className="h-5 w-5 text-primary" />
                  <div>
                    <h4 className="font-medium">{rule.rule_name}</h4>
                    <p className="text-sm text-muted-foreground">
                      {rule.criteria_field} {rule.criteria_operator} "{rule.criteria_value}"
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <Badge variant="outline">
                    +{rule.score_points} points
                  </Badge>
                  <Badge variant={rule.is_active ? "default" : "secondary"}>
                    {rule.is_active ? "Active" : "Inactive"}
                  </Badge>
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