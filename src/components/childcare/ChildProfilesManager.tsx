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
import { Plus, Edit2, Trash2, Baby, Calendar, Heart, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";

interface ChildProfile {
  id: string;
  child_first_name: string;
  child_last_name: string;
  date_of_birth: string;
  gender: string | null;
  emergency_contact_name: string | null;
  emergency_contact_phone: string | null;
  medical_conditions: string | null;
  allergies: string | null;
  dietary_restrictions: string | null;
  special_instructions: string | null;
  authorized_pickup_contacts: any[];
  is_active: boolean;
}

const GENDERS = [
  { value: "male", label: "Male" },
  { value: "female", label: "Female" },
  { value: "other", label: "Other" },
  { value: "prefer_not_to_say", label: "Prefer not to say" }
];

export function ChildProfilesManager() {
  const { profile } = useAuth();
  const queryClient = useQueryClient();
  const [selectedChild, setSelectedChild] = useState<ChildProfile | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const { data: children = [], isLoading } = useQuery({
    queryKey: ["child-profiles", profile?.organization_id],
    queryFn: async () => {
      if (!profile?.organization_id) return [];
      
      const { data, error } = await supabase
        .from("child_profiles")
        .select("*")
        .eq("organization_id", profile.organization_id)
        .order("child_first_name");

      if (error) throw error;
      return data as ChildProfile[];
    },
    enabled: !!profile?.organization_id,
  });

  const createChildMutation = useMutation({
    mutationFn: async (childData: Partial<ChildProfile>) => {
      if (!profile?.organization_id) throw new Error("No organization");
      if (!profile?.id) throw new Error("No user");

      const { data, error } = await supabase
        .from("child_profiles")
        .insert({ 
          ...childData, 
          organization_id: profile.organization_id,
          parent_member_id: profile.id 
        } as any)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["child-profiles"] });
      toast.success("Child profile created successfully");
      setIsDialogOpen(false);
      setSelectedChild(null);
    },
    onError: (error) => {
      toast.error(`Failed to create child profile: ${error.message}`);
    },
  });

  const updateChildMutation = useMutation({
    mutationFn: async ({ id, ...childData }: Partial<ChildProfile> & { id: string }) => {
      const { data, error } = await supabase
        .from("child_profiles")
        .update(childData)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["child-profiles"] });
      toast.success("Child profile updated successfully");
      setIsDialogOpen(false);
      setSelectedChild(null);
    },
    onError: (error) => {
      toast.error(`Failed to update child profile: ${error.message}`);
    },
  });

  const deleteChildMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("child_profiles")
        .delete()
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["child-profiles"] });
      toast.success("Child profile deleted successfully");
    },
    onError: (error) => {
      toast.error(`Failed to delete child profile: ${error.message}`);
    },
  });

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    const childData = {
      child_first_name: formData.get("child_first_name") as string,
      child_last_name: formData.get("child_last_name") as string,
      date_of_birth: formData.get("date_of_birth") as string,
      gender: formData.get("gender") as string || null,
      emergency_contact_name: formData.get("emergency_contact_name") as string || null,
      emergency_contact_phone: formData.get("emergency_contact_phone") as string || null,
      medical_conditions: formData.get("medical_conditions") as string || null,
      allergies: formData.get("allergies") as string || null,
      dietary_restrictions: formData.get("dietary_restrictions") as string || null,
      special_instructions: formData.get("special_instructions") as string || null,
      is_active: formData.get("is_active") === "on",
    };

    if (selectedChild) {
      updateChildMutation.mutate({ id: selectedChild.id, ...childData });
    } else {
      createChildMutation.mutate(childData);
    }
  };

  const openDialog = (child?: ChildProfile) => {
    setSelectedChild(child || null);
    setIsDialogOpen(true);
  };

  const calculateAge = (birthDate: string) => {
    const today = new Date();
    const birth = new Date(birthDate);
    const ageInMonths = (today.getFullYear() - birth.getFullYear()) * 12 + 
                       (today.getMonth() - birth.getMonth());
    
    if (ageInMonths < 12) {
      return `${ageInMonths} months`;
    } else {
      const years = Math.floor(ageInMonths / 12);
      const months = ageInMonths % 12;
      return months > 0 ? `${years}y ${months}m` : `${years} years`;
    }
  };

  if (isLoading) {
    return <div>Loading child profiles...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Child Profiles</h2>
          <p className="text-muted-foreground">Manage children enrolled in childcare services</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => openDialog()}>
              <Plus className="h-4 w-4 mr-2" />
              Add Child
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>
                {selectedChild ? "Edit Child Profile" : "Add New Child"}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="child_first_name">First Name</Label>
                  <Input
                    id="child_first_name"
                    name="child_first_name"
                    defaultValue={selectedChild?.child_first_name}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="child_last_name">Last Name</Label>
                  <Input
                    id="child_last_name"
                    name="child_last_name"
                    defaultValue={selectedChild?.child_last_name}
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="date_of_birth">Date of Birth</Label>
                  <Input
                    id="date_of_birth"
                    name="date_of_birth"
                    type="date"
                    defaultValue={selectedChild?.date_of_birth}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="gender">Gender</Label>
                  <Select name="gender" defaultValue={selectedChild?.gender || ""}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select gender" />
                    </SelectTrigger>
                    <SelectContent>
                      {GENDERS.map((gender) => (
                        <SelectItem key={gender.value} value={gender.value}>
                          {gender.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="emergency_contact_name">Emergency Contact Name</Label>
                  <Input
                    id="emergency_contact_name"
                    name="emergency_contact_name"
                    defaultValue={selectedChild?.emergency_contact_name || ""}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="emergency_contact_phone">Emergency Contact Phone</Label>
                  <Input
                    id="emergency_contact_phone"
                    name="emergency_contact_phone"
                    type="tel"
                    defaultValue={selectedChild?.emergency_contact_phone || ""}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="medical_conditions">Medical Conditions</Label>
                <Textarea
                  id="medical_conditions"
                  name="medical_conditions"
                  defaultValue={selectedChild?.medical_conditions || ""}
                  placeholder="Any medical conditions to be aware of..."
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="allergies">Allergies</Label>
                <Textarea
                  id="allergies"
                  name="allergies"
                  defaultValue={selectedChild?.allergies || ""}
                  placeholder="Food allergies, environmental allergies, etc..."
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="dietary_restrictions">Dietary Restrictions</Label>
                <Textarea
                  id="dietary_restrictions"
                  name="dietary_restrictions"
                  defaultValue={selectedChild?.dietary_restrictions || ""}
                  placeholder="Vegetarian, gluten-free, etc..."
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="special_instructions">Special Instructions</Label>
                <Textarea
                  id="special_instructions"
                  name="special_instructions"
                  defaultValue={selectedChild?.special_instructions || ""}
                  placeholder="Any special care instructions..."
                />
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="is_active"
                  name="is_active"
                  defaultChecked={selectedChild?.is_active !== false}
                />
                <Label htmlFor="is_active">Active Profile</Label>
              </div>

              <div className="flex justify-end space-x-2">
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  disabled={createChildMutation.isPending || updateChildMutation.isPending}
                >
                  {createChildMutation.isPending || updateChildMutation.isPending 
                    ? "Saving..." 
                    : selectedChild 
                      ? "Update Profile" 
                      : "Create Profile"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Enrolled Children</CardTitle>
          <CardDescription>
            {children.length} child{children.length !== 1 ? 'ren' : ''} enrolled in childcare
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Child</TableHead>
                <TableHead>Age</TableHead>
                <TableHead>Emergency Contact</TableHead>
                <TableHead>Medical Info</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {children.map((child) => (
                <TableRow key={child.id}>
                  <TableCell>
                    <div className="flex items-center space-x-3">
                      <div className="flex items-center justify-center w-8 h-8 bg-blue-100 rounded-full">
                        <Baby className="h-4 w-4 text-blue-600" />
                      </div>
                      <div>
                        <p className="font-medium">{child.child_first_name} {child.child_last_name}</p>
                        <p className="text-sm text-muted-foreground flex items-center">
                          <Calendar className="h-3 w-3 mr-1" />
                          {new Date(child.date_of_birth).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>{calculateAge(child.date_of_birth)}</TableCell>
                  <TableCell>
                    {child.emergency_contact_name ? (
                      <div>
                        <p className="font-medium">{child.emergency_contact_name}</p>
                        <p className="text-sm text-muted-foreground">{child.emergency_contact_phone}</p>
                      </div>
                    ) : (
                      <span className="text-muted-foreground">Not provided</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="space-y-1">
                      {child.allergies && (
                        <Badge variant="destructive" className="text-xs">
                          <AlertTriangle className="h-3 w-3 mr-1" />
                          Allergies
                        </Badge>
                      )}
                      {child.medical_conditions && (
                        <Badge variant="secondary" className="text-xs">
                          <Heart className="h-3 w-3 mr-1" />
                          Medical
                        </Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={child.is_active ? "default" : "secondary"}>
                      {child.is_active ? "Active" : "Inactive"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-2">
                      <Button variant="outline" size="sm" onClick={() => openDialog(child)}>
                        <Edit2 className="h-4 w-4" />
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => deleteChildMutation.mutate(child.id)}
                        disabled={deleteChildMutation.isPending}
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

      {children.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-8">
            <Baby className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium">No children enrolled yet</h3>
            <p className="text-muted-foreground text-center mb-4">
              Start by adding the first child to your childcare program.
            </p>
            <Button onClick={() => openDialog()}>
              <Plus className="h-4 w-4 mr-2" />
              Add First Child
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}