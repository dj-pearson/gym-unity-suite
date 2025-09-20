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
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Clock, UserCheck, UserX, Baby, CheckCircle, XCircle } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { format } from "date-fns";

interface ChildcareCheckIn {
  id: string;
  child_id: string;
  check_in_time: string;
  check_out_time: string | null;
  status: string;
  child_condition_checkin: string;
  child_condition_checkout: string | null;
  drop_off_notes: string | null;
  pick_up_notes: string | null;
  mood_rating: number | null;
  child_profiles: {
    child_first_name: string;
    child_last_name: string;
    date_of_birth: string;
  };
}

const CONDITION_OPTIONS = [
  { value: "excellent", label: "Excellent", color: "bg-green-500" },
  { value: "good", label: "Good", color: "bg-blue-500" },
  { value: "fair", label: "Fair", color: "bg-yellow-500" },
  { value: "sick", label: "Sick", color: "bg-red-500" },
  { value: "upset", label: "Upset", color: "bg-purple-500" }
];

export function ChildcareCheckInManager() {
  const { profile } = useAuth();
  const queryClient = useQueryClient();
  const [selectedDate, setSelectedDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [checkOutDialogOpen, setCheckOutDialogOpen] = useState(false);
  const [selectedCheckIn, setSelectedCheckIn] = useState<ChildcareCheckIn | null>(null);

  const { data: checkIns = [], isLoading } = useQuery({
    queryKey: ["childcare-checkins", profile?.organization_id, selectedDate],
    queryFn: async () => {
      if (!profile?.organization_id) return [];
      
      const startDate = new Date(selectedDate);
      startDate.setHours(0, 0, 0, 0);
      
      const endDate = new Date(selectedDate);
      endDate.setHours(23, 59, 59, 999);

      const { data, error } = await supabase
        .from("childcare_checkins")
        .select(`
          *,
          child_profiles (child_first_name, child_last_name, date_of_birth)
        `)
        .eq("organization_id", profile.organization_id)
        .gte("check_in_time", startDate.toISOString())
        .lte("check_in_time", endDate.toISOString())
        .order("check_in_time", { ascending: false });

      if (error) throw error;
      return data as unknown as ChildcareCheckIn[];
    },
    enabled: !!profile?.organization_id,
  });

  const { data: availableChildren = [] } = useQuery({
    queryKey: ["available-children", profile?.organization_id],
    queryFn: async () => {
      if (!profile?.organization_id) return [];
      
      const { data, error } = await supabase
        .from("child_profiles")
        .select("id, child_first_name, child_last_name, date_of_birth")
        .eq("organization_id", profile.organization_id)
        .eq("is_active", true)
        .order("child_first_name");

      if (error) throw error;
      return data;
    },
    enabled: !!profile?.organization_id,
  });

  const checkInChildMutation = useMutation({
    mutationFn: async (checkInData: any) => {
      if (!profile?.organization_id || !profile?.id) throw new Error("Missing organization or user");

      const { data, error } = await supabase
        .from("childcare_checkins")
        .insert({
          ...checkInData,
          organization_id: profile.organization_id,
          parent_member_id: profile.id,
          checked_in_by: profile.id,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["childcare-checkins"] });
      toast.success("Child checked in successfully");
    },
    onError: (error) => {
      toast.error(`Failed to check in child: ${error.message}`);
    },
  });

  const checkOutChildMutation = useMutation({
    mutationFn: async ({ checkInId, checkOutData }: { checkInId: string; checkOutData: any }) => {
      if (!profile?.id) throw new Error("Missing user");

      const { data, error } = await supabase
        .from("childcare_checkins")
        .update({
          ...checkOutData,
          check_out_time: new Date().toISOString(),
          checked_out_by: profile.id,
          status: "checked_out"
        })
        .eq("id", checkInId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["childcare-checkins"] });
      toast.success("Child checked out successfully");
      setCheckOutDialogOpen(false);
      setSelectedCheckIn(null);
    },
    onError: (error) => {
      toast.error(`Failed to check out child: ${error.message}`);
    },
  });

  const handleQuickCheckIn = (childId: string) => {
    checkInChildMutation.mutate({
      child_id: childId,
      child_condition_checkin: "good",
      drop_off_notes: "",
    });
  };

  const handleCheckOut = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!selectedCheckIn) return;

    const formData = new FormData(e.currentTarget);
    const checkOutData = {
      child_condition_checkout: formData.get("child_condition_checkout") as string,
      pick_up_notes: formData.get("pick_up_notes") as string,
      mood_rating: parseInt(formData.get("mood_rating") as string) || null,
    };

    checkOutChildMutation.mutate({ 
      checkInId: selectedCheckIn.id, 
      checkOutData 
    });
  };

  const getConditionBadge = (condition: string) => {
    const conditionConfig = CONDITION_OPTIONS.find(opt => opt.value === condition);
    return (
      <Badge className={`text-white ${conditionConfig?.color || 'bg-gray-500'}`}>
        {conditionConfig?.label || condition}
      </Badge>
    );
  };

  const calculateAge = (birthDate: string) => {
    const today = new Date();
    const birth = new Date(birthDate);
    const ageInMonths = (today.getFullYear() - birth.getFullYear()) * 12 + 
                       (today.getMonth() - birth.getMonth());
    
    if (ageInMonths < 12) {
      return `${ageInMonths}mo`;
    } else {
      const years = Math.floor(ageInMonths / 12);
      return `${years}y`;
    }
  };

  if (isLoading) {
    return <div>Loading check-ins...</div>;
  }

  const checkedInChildren = checkIns.filter(checkIn => checkIn.status === "checked_in");
  const checkedOutChildren = checkIns.filter(checkIn => checkIn.status === "checked_out");

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Childcare Check-ins</h2>
          <p className="text-muted-foreground">Manage daily child check-ins and check-outs</p>
        </div>
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <Label htmlFor="check-in-date">Date:</Label>
            <Input
              id="check-in-date"
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="w-40"
            />
          </div>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center">
              <UserCheck className="h-5 w-5 mr-2 text-green-600" />
              Currently Checked In
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {checkedInChildren.length}
            </div>
            <p className="text-sm text-muted-foreground">Children present</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center">
              <UserX className="h-5 w-5 mr-2 text-blue-600" />
              Checked Out Today
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {checkedOutChildren.length}
            </div>
            <p className="text-sm text-muted-foreground">Completed visits</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center">
              <Clock className="h-5 w-5 mr-2 text-orange-600" />
              Quick Check-in
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Select onValueChange={handleQuickCheckIn}>
              <SelectTrigger>
                <SelectValue placeholder="Select child to check in" />
              </SelectTrigger>
              <SelectContent>
                {availableChildren
                  .filter(child => !checkedInChildren.some(ci => ci.child_id === child.id))
                  .map((child) => (
                    <SelectItem key={child.id} value={child.id}>
                      {child.child_first_name} {child.child_last_name} ({calculateAge(child.date_of_birth)})
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Currently Checked In */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <UserCheck className="h-5 w-5 mr-2" />
              Currently Checked In
            </CardTitle>
            <CardDescription>
              Children present in childcare today
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Child</TableHead>
                  <TableHead>Check-in Time</TableHead>
                  <TableHead>Condition</TableHead>
                  <TableHead>Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {checkedInChildren.map((checkIn) => (
                  <TableRow key={checkIn.id}>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <Baby className="h-4 w-4 text-blue-500" />
                        <div>
                          <p className="font-medium">
                            {checkIn.child_profiles.child_first_name} {checkIn.child_profiles.child_last_name}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {calculateAge(checkIn.child_profiles.date_of_birth)} old
                          </p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center">
                        <Clock className="h-3 w-3 mr-1" />
                        {format(new Date(checkIn.check_in_time), "HH:mm")}
                      </div>
                    </TableCell>
                    <TableCell>
                      {getConditionBadge(checkIn.child_condition_checkin)}
                    </TableCell>
                    <TableCell>
                      <Button
                        size="sm"
                        onClick={() => {
                          setSelectedCheckIn(checkIn);
                          setCheckOutDialogOpen(true);
                        }}
                      >
                        <UserX className="h-4 w-4 mr-1" />
                        Check Out
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            {checkedInChildren.length === 0 && (
              <div className="text-center py-4 text-muted-foreground">
                No children currently checked in
              </div>
            )}
          </CardContent>
        </Card>

        {/* Checked Out Today */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <CheckCircle className="h-5 w-5 mr-2" />
              Checked Out Today
            </CardTitle>
            <CardDescription>
              Completed visits for {format(new Date(selectedDate), "MMM d, yyyy")}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Child</TableHead>
                  <TableHead>Time Range</TableHead>
                  <TableHead>Conditions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {checkedOutChildren.map((checkIn) => (
                  <TableRow key={checkIn.id}>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <Baby className="h-4 w-4 text-green-500" />
                        <div>
                          <p className="font-medium">
                            {checkIn.child_profiles.child_first_name} {checkIn.child_profiles.child_last_name}
                          </p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        <p>{format(new Date(checkIn.check_in_time), "HH:mm")} - {checkIn.check_out_time ? format(new Date(checkIn.check_out_time), "HH:mm") : "—"}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <div className="text-xs">In: {getConditionBadge(checkIn.child_condition_checkin)}</div>
                        {checkIn.child_condition_checkout && (
                          <div className="text-xs">Out: {getConditionBadge(checkIn.child_condition_checkout)}</div>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            {checkedOutChildren.length === 0 && (
              <div className="text-center py-4 text-muted-foreground">
                No completed visits today
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Check Out Dialog */}
      <Dialog open={checkOutDialogOpen} onOpenChange={setCheckOutDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Check Out Child</DialogTitle>
          </DialogHeader>
          {selectedCheckIn && (
            <form onSubmit={handleCheckOut} className="space-y-4">
              <div>
                <p className="font-medium">
                  {selectedCheckIn.child_profiles.child_first_name} {selectedCheckIn.child_profiles.child_last_name}
                </p>
                <p className="text-sm text-muted-foreground">
                  Checked in at {format(new Date(selectedCheckIn.check_in_time), "HH:mm")}
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="child_condition_checkout">Condition at Checkout</Label>
                <Select name="child_condition_checkout" required>
                  <SelectTrigger>
                    <SelectValue placeholder="How is the child doing?" />
                  </SelectTrigger>
                  <SelectContent>
                    {CONDITION_OPTIONS.map((condition) => (
                      <SelectItem key={condition.value} value={condition.value}>
                        {condition.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="mood_rating">Mood Rating (1-5)</Label>
                <Select name="mood_rating">
                  <SelectTrigger>
                    <SelectValue placeholder="Optional mood rating" />
                  </SelectTrigger>
                  <SelectContent>
                    {[1, 2, 3, 4, 5].map((rating) => (
                      <SelectItem key={rating} value={rating.toString()}>
                        {rating} - {rating === 1 ? "Very Unhappy" : rating === 2 ? "Unhappy" : rating === 3 ? "Okay" : rating === 4 ? "Happy" : "Very Happy"}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="pick_up_notes">Pick-up Notes</Label>
                <Textarea
                  id="pick_up_notes"
                  name="pick_up_notes"
                  placeholder="Any notes about the child's day or pick-up..."
                  rows={3}
                />
              </div>

              <div className="flex justify-end space-x-2">
                <Button type="button" variant="outline" onClick={() => setCheckOutDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={checkOutChildMutation.isPending}>
                  {checkOutChildMutation.isPending ? "Checking Out..." : "Check Out Child"}
                </Button>
              </div>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}