import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Edit2, Trash2, Calendar, Clock, Users, Palette, BookOpen, TreePine } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { format } from "date-fns";

interface ChildcareActivity {
  id: string;
  activity_name: string;
  description: string | null;
  activity_type: string;
  age_group_min_months: number;
  age_group_max_months: number;
  max_participants: number;
  staff_ratio_requirement: number;
  activity_date: string;
  start_time: string;
  end_time: string;
  duration_minutes: number;
  location_room: string | null;
  equipment_needed: string[];
  activity_fee: number;
  requires_registration: boolean;
  status: string;
}

const ACTIVITY_TYPES = [
  { value: "play", label: "Free Play", icon: Users },
  { value: "education", label: "Educational", icon: BookOpen },
  { value: "arts_crafts", label: "Arts & Crafts", icon: Palette },
  { value: "story_time", label: "Story Time", icon: BookOpen },
  { value: "outdoor", label: "Outdoor Activity", icon: TreePine },
  { value: "free_play", label: "Supervised Play", icon: Users }
];

const ACTIVITY_STATUSES = [
  "scheduled",
  "in_progress", 
  "completed",
  "cancelled"
];

export function ChildcareActivitiesManager() {
  const { profile } = useAuth();
  const queryClient = useQueryClient();
  const [selectedActivity, setSelectedActivity] = useState<ChildcareActivity | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState(format(new Date(), "yyyy-MM-dd"));

  const { data: activities = [], isLoading } = useQuery({
    queryKey: ["childcare-activities", profile?.organization_id, selectedDate],
    queryFn: async () => {
      if (!profile?.organization_id) return [];
      
      const { data, error } = await supabase
        .from("childcare_activities")
        .select("*")
        .eq("organization_id", profile.organization_id)
        .eq("activity_date", selectedDate)
        .order("start_time");

      if (error) throw error;
      return data as ChildcareActivity[];
    },
    enabled: !!profile?.organization_id,
  });

  const createActivityMutation = useMutation({
    mutationFn: async (activityData: Partial<ChildcareActivity>) => {
      if (!profile?.organization_id || !profile?.id) throw new Error("Missing organization or user");

      const { data, error } = await supabase
        .from("childcare_activities")
        .insert({ 
          ...activityData, 
          organization_id: profile.organization_id,
          created_by: profile.id 
        } as any)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["childcare-activities"] });
      toast.success("Activity created successfully");
      setIsDialogOpen(false);
      setSelectedActivity(null);
    },
    onError: (error) => {
      toast.error(`Failed to create activity: ${error.message}`);
    },
  });

  const updateActivityMutation = useMutation({
    mutationFn: async ({ id, ...activityData }: Partial<ChildcareActivity> & { id: string }) => {
      const { data, error } = await supabase
        .from("childcare_activities")
        .update(activityData)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["childcare-activities"] });
      toast.success("Activity updated successfully");
      setIsDialogOpen(false);
      setSelectedActivity(null);
    },
    onError: (error) => {
      toast.error(`Failed to update activity: ${error.message}`);
    },
  });

  const deleteActivityMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("childcare_activities")
        .delete()
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["childcare-activities"] });
      toast.success("Activity deleted successfully");
    },
    onError: (error) => {
      toast.error(`Failed to delete activity: ${error.message}`);
    },
  });

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    const startTime = formData.get("start_time") as string;
    const endTime = formData.get("end_time") as string;
    
    // Calculate duration
    const start = new Date(`2000-01-01T${startTime}`);
    const end = new Date(`2000-01-01T${endTime}`);
    const duration = (end.getTime() - start.getTime()) / (1000 * 60);

    const activityData = {
      activity_name: formData.get("activity_name") as string,
      description: formData.get("description") as string || null,
      activity_type: formData.get("activity_type") as string,
      age_group_min_months: parseInt(formData.get("age_group_min_months") as string) || 0,
      age_group_max_months: parseInt(formData.get("age_group_max_months") as string) || 144,
      max_participants: parseInt(formData.get("max_participants") as string) || 15,
      staff_ratio_requirement: parseInt(formData.get("staff_ratio_requirement") as string) || 8,
      activity_date: formData.get("activity_date") as string,
      start_time: startTime,
      end_time: endTime,
      duration_minutes: duration,
      location_room: formData.get("location_room") as string || null,
      equipment_needed: (formData.get("equipment_needed") as string)
        .split(",").map(s => s.trim()).filter(Boolean),
      activity_fee: parseFloat(formData.get("activity_fee") as string) || 0,
      requires_registration: formData.get("requires_registration") === "on",
    };

    if (selectedActivity) {
      updateActivityMutation.mutate({ id: selectedActivity.id, ...activityData });
    } else {
      createActivityMutation.mutate(activityData);
    }
  };

  const openDialog = (activity?: ChildcareActivity) => {
    setSelectedActivity(activity || null);
    setIsDialogOpen(true);
  };

  const getActivityTypeIcon = (type: string) => {
    const activityType = ACTIVITY_TYPES.find(at => at.value === type);
    const IconComponent = activityType?.icon || Users;
    return <IconComponent className="h-4 w-4" />;
  };

  const getAgeRange = (minMonths: number, maxMonths: number) => {
    const formatAge = (months: number) => {
      if (months < 12) return `${months}mo`;
      const years = Math.floor(months / 12);
      const remainingMonths = months % 12;
      return remainingMonths > 0 ? `${years}y ${remainingMonths}mo` : `${years}y`;
    };
    
    return `${formatAge(minMonths)} - ${formatAge(maxMonths)}`;
  };

  if (isLoading) {
    return <div>Loading activities...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Childcare Activities</h2>
          <p className="text-muted-foreground">Schedule and manage daily activities for children</p>
        </div>
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <Label htmlFor="activity-date">Date:</Label>
            <Input
              id="activity-date"
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="w-40"
            />
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => openDialog()}>
                <Plus className="h-4 w-4 mr-2" />
                Add Activity
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>
                  {selectedActivity ? "Edit Activity" : "Add New Activity"}
                </DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="activity_name">Activity Name</Label>
                    <Input
                      id="activity_name"
                      name="activity_name"
                      defaultValue={selectedActivity?.activity_name}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="activity_type">Activity Type</Label>
                    <Select name="activity_type" defaultValue={selectedActivity?.activity_type || "play"}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {ACTIVITY_TYPES.map((type) => (
                          <SelectItem key={type.value} value={type.value}>
                            {type.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    name="description"
                    defaultValue={selectedActivity?.description || ""}
                    placeholder="Activity description..."
                  />
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="activity_date">Date</Label>
                    <Input
                      id="activity_date"
                      name="activity_date"
                      type="date"
                      defaultValue={selectedActivity?.activity_date || selectedDate}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="start_time">Start Time</Label>
                    <Input
                      id="start_time"
                      name="start_time"
                      type="time"
                      defaultValue={selectedActivity?.start_time}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="end_time">End Time</Label>
                    <Input
                      id="end_time"
                      name="end_time"
                      type="time"
                      defaultValue={selectedActivity?.end_time}
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="age_group_min_months">Min Age (months)</Label>
                    <Input
                      id="age_group_min_months"
                      name="age_group_min_months"
                      type="number"
                      min="0"
                      max="144"
                      defaultValue={selectedActivity?.age_group_min_months || 0}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="age_group_max_months">Max Age (months)</Label>
                    <Input
                      id="age_group_max_months"
                      name="age_group_max_months"
                      type="number"
                      min="0"
                      max="144"
                      defaultValue={selectedActivity?.age_group_max_months || 144}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="max_participants">Max Participants</Label>
                    <Input
                      id="max_participants"
                      name="max_participants"
                      type="number"
                      min="1"
                      defaultValue={selectedActivity?.max_participants || 15}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="staff_ratio_requirement">Staff Ratio (1:X)</Label>
                    <Input
                      id="staff_ratio_requirement"
                      name="staff_ratio_requirement"
                      type="number"
                      min="1"
                      defaultValue={selectedActivity?.staff_ratio_requirement || 8}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="activity_fee">Fee ($)</Label>
                    <Input
                      id="activity_fee"
                      name="activity_fee"
                      type="number"
                      step="0.01"
                      min="0"
                      defaultValue={selectedActivity?.activity_fee || 0}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="location_room">Room/Location</Label>
                    <Input
                      id="location_room"
                      name="location_room"
                      defaultValue={selectedActivity?.location_room || ""}
                      placeholder="e.g., Playroom A, Outdoor Area"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="equipment_needed">Equipment Needed</Label>
                    <Input
                      id="equipment_needed"
                      name="equipment_needed"
                      defaultValue={selectedActivity?.equipment_needed?.join(", ")}
                      placeholder="Comma-separated list"
                    />
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <Switch
                    id="requires_registration"
                    name="requires_registration"
                    defaultChecked={selectedActivity?.requires_registration !== false}
                  />
                  <Label htmlFor="requires_registration">Requires Registration</Label>
                </div>

                <div className="flex justify-end space-x-2">
                  <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button 
                    type="submit" 
                    disabled={createActivityMutation.isPending || updateActivityMutation.isPending}
                  >
                    {createActivityMutation.isPending || updateActivityMutation.isPending 
                      ? "Saving..." 
                      : selectedActivity 
                        ? "Update Activity" 
                        : "Create Activity"}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Activities for {format(new Date(selectedDate), "MMMM d, yyyy")}</CardTitle>
          <CardDescription>
            {activities.length} activit{activities.length !== 1 ? 'ies' : 'y'} scheduled
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Activity</TableHead>
                <TableHead>Time</TableHead>
                <TableHead>Age Group</TableHead>
                <TableHead>Participants</TableHead>
                <TableHead>Location</TableHead>
                <TableHead>Fee</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {activities.map((activity) => (
                <TableRow key={activity.id}>
                  <TableCell>
                    <div className="flex items-center space-x-3">
                      <div className="flex items-center justify-center w-8 h-8 bg-blue-100 rounded-full">
                        {getActivityTypeIcon(activity.activity_type)}
                      </div>
                      <div>
                        <p className="font-medium">{activity.activity_name}</p>
                        <p className="text-sm text-muted-foreground">
                          {ACTIVITY_TYPES.find(at => at.value === activity.activity_type)?.label}
                        </p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center">
                      <Clock className="h-3 w-3 mr-1" />
                      {activity.start_time.slice(0, 5)} - {activity.end_time.slice(0, 5)}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {activity.duration_minutes} min
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">
                      {getAgeRange(activity.age_group_min_months, activity.age_group_max_months)}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center">
                      <Users className="h-3 w-3 mr-1" />
                      Max {activity.max_participants}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      1:{activity.staff_ratio_requirement} ratio
                    </div>
                  </TableCell>
                  <TableCell>
                    {activity.location_room || "Not specified"}
                  </TableCell>
                  <TableCell>
                    {activity.activity_fee > 0 ? `$${activity.activity_fee}` : "Free"}
                  </TableCell>
                  <TableCell>
                    <Badge variant={
                      activity.status === "completed" ? "default" :
                      activity.status === "in_progress" ? "secondary" :
                      activity.status === "cancelled" ? "destructive" : 
                      "outline"
                    }>
                      {activity.status.replace("_", " ").toUpperCase()}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-2">
                      <Button variant="outline" size="sm" onClick={() => openDialog(activity)}>
                        <Edit2 className="h-4 w-4" />
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => deleteActivityMutation.mutate(activity.id)}
                        disabled={deleteActivityMutation.isPending}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {activities.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-8">
            <Calendar className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium">No activities scheduled</h3>
            <p className="text-muted-foreground text-center mb-4">
              No activities planned for {format(new Date(selectedDate), "MMMM d, yyyy")}
            </p>
            <Button onClick={() => openDialog()}>
              <Plus className="h-4 w-4 mr-2" />
              Schedule First Activity
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}