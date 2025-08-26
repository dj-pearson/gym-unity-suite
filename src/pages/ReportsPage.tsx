import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  BarChart3, 
  TrendingUp, 
  Users,
  Calendar,
  Download,
  Filter
} from 'lucide-react';
import { StatCard } from '@/components/dashboard/StatCard';

export default function ReportsPage() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div className="p-2 bg-gradient-to-br from-primary to-primary-glow rounded-lg">
            <BarChart3 className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-foreground">Reports & Analytics</h1>
            <p className="text-muted-foreground">
              Comprehensive insights into your gym's performance
            </p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="outline" size="sm">
            <Filter className="mr-2 h-4 w-4" />
            Filter
          </Button>
          <Button className="bg-gradient-primary hover:opacity-90">
            <Download className="mr-2 h-4 w-4" />
            Export
          </Button>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <StatCard
          title="Member Retention"
          value="87%"
          change={{ value: "3%", type: "positive" }}
          icon={Users}
          gradient="success"
        />
        <StatCard
          title="Class Attendance"
          value="76%"
          change={{ value: "5%", type: "positive" }}
          icon={Calendar}
          gradient="primary"
        />
        <StatCard
          title="Revenue Growth"
          value="15%"
          change={{ value: "2%", type: "positive" }}
          icon={TrendingUp}
          gradient="secondary"
        />
        <StatCard
          title="Member Satisfaction"
          value="4.6/5"
          change={{ value: "0.2", type: "positive" }}
          icon={BarChart3}
          gradient="warning"
        />
      </div>

      {/* Report Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="gym-card">
          <CardHeader>
            <CardTitle className="flex items-center">
              <TrendingUp className="mr-2 h-5 w-5" />
              Member Growth Trends
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8">
              <TrendingUp className="mx-auto h-12 w-12 text-muted-foreground opacity-50 mb-4" />
              <h3 className="text-lg font-medium text-foreground mb-2">Coming Soon</h3>
              <p className="text-muted-foreground">
                Detailed member growth analytics and trends will appear here
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="gym-card">
          <CardHeader>
            <CardTitle className="flex items-center">
              <BarChart3 className="mr-2 h-5 w-5" />
              Class Performance
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8">
              <BarChart3 className="mx-auto h-12 w-12 text-muted-foreground opacity-50 mb-4" />
              <h3 className="text-lg font-medium text-foreground mb-2">Coming Soon</h3>
              <p className="text-muted-foreground">
                Class attendance rates and performance metrics will be shown here
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="gym-card">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Users className="mr-2 h-5 w-5" />
              Member Demographics
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8">
              <Users className="mx-auto h-12 w-12 text-muted-foreground opacity-50 mb-4" />
              <h3 className="text-lg font-medium text-foreground mb-2">Coming Soon</h3>
              <p className="text-muted-foreground">
                Member demographic breakdowns and insights will be displayed here
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="gym-card">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Calendar className="mr-2 h-5 w-5" />
              Peak Usage Hours
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8">
              <Calendar className="mx-auto h-12 w-12 text-muted-foreground opacity-50 mb-4" />
              <h3 className="text-lg font-medium text-foreground mb-2">Coming Soon</h3>
              <p className="text-muted-foreground">
                Facility usage patterns and peak hours analysis will appear here
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}