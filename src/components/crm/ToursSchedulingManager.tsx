import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, Calendar, Clock, MapPin, User } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";

export default function ToursSchedulingManager() {
  const { toast } = useToast();

  // Placeholder data for demonstration
  const tours = [
    {
      id: "1",
      lead_name: "Alice Johnson",
      scheduled_at: "2024-02-15 10:00",
      tour_type: "Standard",
      guide_name: "Mike Smith",
      status: "scheduled",
      location: "Main Facility"
    },
    {
      id: "2", 
      lead_name: "Bob Wilson",
      scheduled_at: "2024-02-15 14:30",
      tour_type: "Premium",
      guide_name: "Sarah Davis",
      status: "completed",
      location: "Downtown Branch"
    },
    {
      id: "3",
      lead_name: "Carol Brown",
      scheduled_at: "2024-02-16 09:00",
      tour_type: "Group",
      guide_name: "Mike Smith",
      status: "confirmed",
      location: "Main Facility"
    }
  ];

  const handleScheduleTour = () => {
    toast({
      title: "Schedule Tour",
      description: "Tour scheduling form will be implemented here.",
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'default';
      case 'confirmed': return 'secondary';
      case 'scheduled': return 'outline';
      default: return 'secondary';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Tours Scheduling</h2>
          <p className="text-muted-foreground">
            Manage facility tours for prospective members
          </p>
        </div>
        <Button onClick={handleScheduleTour}>
          <Plus className="mr-2 h-4 w-4" />
          Schedule Tour
        </Button>
      </div>

      {/* Tour Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Tours</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{tours.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Scheduled</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {tours.filter(t => t.status === 'scheduled' || t.status === 'confirmed').length}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completed</CardTitle>
            <User className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {tours.filter(t => t.status === 'completed').length}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completion Rate</CardTitle>
            <User className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {tours.length > 0 ? ((tours.filter(t => t.status === 'completed').length / tours.length) * 100).toFixed(1) : 0}%
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tours List */}
      <Card>
        <CardHeader>
          <CardTitle>Upcoming Tours</CardTitle>
          <CardDescription>
            Manage scheduled facility tours and appointments
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {tours.map((tour) => (
              <div key={tour.id} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center gap-4">
                  <Calendar className="h-5 w-5 text-primary" />
                  <div>
                    <h4 className="font-medium">{tour.lead_name}</h4>
                    <p className="text-sm text-muted-foreground flex items-center gap-2">
                      <Clock className="h-3 w-3" />
                      {tour.scheduled_at}
                    </p>
                    <p className="text-sm text-muted-foreground flex items-center gap-2">
                      <MapPin className="h-3 w-3" />
                      {tour.location}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <p className="text-sm font-medium">{tour.tour_type} Tour</p>
                    <p className="text-sm text-muted-foreground">Guide: {tour.guide_name}</p>
                  </div>
                  <Badge variant={getStatusColor(tour.status)}>
                    {tour.status}
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