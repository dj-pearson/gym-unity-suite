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
import { Plus, Edit2, Trash2, Clock, DollarSign, Users } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";

interface SpaService {
  id: string;
  service_name: string;
  service_category: string;
  description: string | null;
  duration_minutes: number;
  base_price: number;
  commission_rate: number;
  is_active: boolean;
  requires_certification: string[];
  equipment_needed: string[];
  max_advance_booking_days: number;
  min_advance_booking_hours: number;
}

const SERVICE_CATEGORIES = [
  "massage",
  "facial",
  "body_treatment", 
  "manicure",
  "pedicure",
  "hair_removal",
  "aromatherapy",
  "couples_treatment"
];

export function SpaServicesManager() {
  const { profile } = useAuth();
  const queryClient = useQueryClient();
  const [selectedService, setSelectedService] = useState<SpaService | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const { data: spaServices = [], isLoading } = useQuery({
    queryKey: ["spa-services", profile?.organization_id],
    queryFn: async () => {
      if (!profile?.organization_id) return [];
      
      const { data, error } = await supabase
        .from("spa_services")
        .select("*")
        .eq("organization_id", profile.organization_id)
        .order("service_name");

      if (error) throw error;
      return data as SpaService[];
    },
    enabled: !!profile?.organization_id,
  });

  const createServiceMutation = useMutation({
    mutationFn: async (serviceData: Partial<SpaService>) => {
      if (!profile?.organization_id) throw new Error("No organization");

      const { data, error } = await supabase
        .from("spa_services")
        .insert({ ...serviceData, organization_id: profile.organization_id } as any)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["spa-services"] });
      toast.success("Service created successfully");
      setIsDialogOpen(false);
      setSelectedService(null);
    },
    onError: (error) => {
      toast.error(`Failed to create service: ${error.message}`);
    },
  });

  const updateServiceMutation = useMutation({
    mutationFn: async ({ id, ...serviceData }: Partial<SpaService> & { id: string }) => {
      if (!profile?.organization_id) throw new Error("No organization");

      const { data, error } = await supabase
        .from("spa_services")
        .update(serviceData)
        .eq("id", id)
        .eq("organization_id", profile.organization_id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["spa-services"] });
      toast.success("Service updated successfully");
      setIsDialogOpen(false);
      setSelectedService(null);
    },
    onError: (error) => {
      toast.error(`Failed to update service: ${error.message}`);
    },
  });

  const deleteServiceMutation = useMutation({
    mutationFn: async (id: string) => {
      if (!profile?.organization_id) throw new Error("No organization");

      const { error } = await supabase
        .from("spa_services")
        .delete()
        .eq("id", id)
        .eq("organization_id", profile.organization_id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["spa-services"] });
      toast.success("Service deleted successfully");
    },
    onError: (error) => {
      toast.error(`Failed to delete service: ${error.message}`);
    },
  });

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    const serviceData = {
      service_name: formData.get("service_name") as string,
      service_category: formData.get("service_category") as string,
      description: formData.get("description") as string,
      duration_minutes: parseInt(formData.get("duration_minutes") as string),
      base_price: parseFloat(formData.get("base_price") as string),
      commission_rate: parseFloat(formData.get("commission_rate") as string) || 0,
      is_active: formData.get("is_active") === "on",
      max_advance_booking_days: parseInt(formData.get("max_advance_booking_days") as string) || 30,
      min_advance_booking_hours: parseInt(formData.get("min_advance_booking_hours") as string) || 2,
      requires_certification: (formData.get("requires_certification") as string)
        .split(",").map(s => s.trim()).filter(Boolean),
      equipment_needed: (formData.get("equipment_needed") as string)
        .split(",").map(s => s.trim()).filter(Boolean),
    };

    if (selectedService) {
      updateServiceMutation.mutate({ id: selectedService.id, ...serviceData });
    } else {
      createServiceMutation.mutate(serviceData);
    }
  };

  const openDialog = (service?: SpaService) => {
    setSelectedService(service || null);
    setIsDialogOpen(true);
  };

  if (isLoading) {
    return <div>Loading spa services...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Spa Services Management</h2>
          <p className="text-muted-foreground">Manage your spa and wellness services</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => openDialog()}>
              <Plus className="h-4 w-4 mr-2" />
              Add Service
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>
                {selectedService ? "Edit Service" : "Add New Service"}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="service_name">Service Name</Label>
                  <Input
                    id="service_name"
                    name="service_name"
                    defaultValue={selectedService?.service_name}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="service_category">Category</Label>
                  <Select name="service_category" defaultValue={selectedService?.service_category || "massage"}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {SERVICE_CATEGORIES.map((category) => (
                        <SelectItem key={category} value={category}>
                          {category.charAt(0).toUpperCase() + category.slice(1).replace("_", " ")}
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
                  defaultValue={selectedService?.description || ""}
                  placeholder="Service description..."
                />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="duration_minutes">Duration (minutes)</Label>
                  <Input
                    id="duration_minutes"
                    name="duration_minutes"
                    type="number"
                    min="15"
                    step="15"
                    defaultValue={selectedService?.duration_minutes || 60}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="base_price">Price ($)</Label>
                  <Input
                    id="base_price"
                    name="base_price"
                    type="number"
                    step="0.01"
                    min="0"
                    defaultValue={selectedService?.base_price}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="commission_rate">Commission (%)</Label>
                  <Input
                    id="commission_rate"
                    name="commission_rate"
                    type="number"
                    step="0.01"
                    min="0"
                    max="100"
                    defaultValue={selectedService?.commission_rate || 0}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="max_advance_booking_days">Max Advance Booking (days)</Label>
                  <Input
                    id="max_advance_booking_days"
                    name="max_advance_booking_days"
                    type="number"
                    min="1"
                    defaultValue={selectedService?.max_advance_booking_days || 30}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="min_advance_booking_hours">Min Advance Booking (hours)</Label>
                  <Input
                    id="min_advance_booking_hours"
                    name="min_advance_booking_hours"
                    type="number"
                    min="0"
                    defaultValue={selectedService?.min_advance_booking_hours || 2}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="requires_certification">Required Certifications (comma separated)</Label>
                <Input
                  id="requires_certification"
                  name="requires_certification"
                  defaultValue={selectedService?.requires_certification?.join(", ")}
                  placeholder="e.g., Massage Therapy License, Esthetics License"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="equipment_needed">Equipment Needed (comma separated)</Label>
                <Input
                  id="equipment_needed"
                  name="equipment_needed"
                  defaultValue={selectedService?.equipment_needed?.join(", ")}
                  placeholder="e.g., Massage Table, Essential Oils, Hot Towels"
                />
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="is_active"
                  name="is_active"
                  defaultChecked={selectedService?.is_active !== false}
                />
                <Label htmlFor="is_active">Active Service</Label>
              </div>

              <div className="flex justify-end space-x-2">
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  disabled={createServiceMutation.isPending || updateServiceMutation.isPending}
                >
                  {createServiceMutation.isPending || updateServiceMutation.isPending 
                    ? "Saving..." 
                    : selectedService 
                      ? "Update Service" 
                      : "Create Service"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4">
        {spaServices.map((service) => (
          <Card key={service.id}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <div className="flex items-center space-x-2">
                <CardTitle className="text-lg">{service.service_name}</CardTitle>
                <Badge variant={service.is_active ? "default" : "secondary"}>
                  {service.is_active ? "Active" : "Inactive"}
                </Badge>
                <Badge variant="outline">
                  {service.service_category.charAt(0).toUpperCase() + service.service_category.slice(1).replace("_", " ")}
                </Badge>
              </div>
              <div className="flex items-center space-x-2">
                <Button variant="outline" size="sm" onClick={() => openDialog(service)}>
                  <Edit2 className="h-4 w-4" />
                </Button>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => deleteServiceMutation.mutate(service.id)}
                  disabled={deleteServiceMutation.isPending}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <CardDescription className="mb-4">{service.description}</CardDescription>
              <div className="flex items-center space-x-6 text-sm text-muted-foreground">
                <div className="flex items-center">
                  <Clock className="h-4 w-4 mr-1" />
                  {service.duration_minutes} min
                </div>
                <div className="flex items-center">
                  <DollarSign className="h-4 w-4 mr-1" />
                  ${service.base_price}
                </div>
                {service.commission_rate > 0 && (
                  <div className="flex items-center">
                    <Users className="h-4 w-4 mr-1" />
                    {service.commission_rate}% commission
                  </div>
                )}
              </div>
              {service.equipment_needed?.length > 0 && (
                <div className="mt-2">
                  <p className="text-sm font-medium">Equipment:</p>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {service.equipment_needed.map((equipment, index) => (
                      <Badge key={index} variant="outline" className="text-xs">
                        {equipment}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {spaServices.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-8">
            <Users className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium">No spa services yet</h3>
            <p className="text-muted-foreground text-center mb-4">
              Start by adding your first spa service to begin offering wellness treatments.
            </p>
            <Button onClick={() => openDialog()}>
              <Plus className="h-4 w-4 mr-2" />
              Add First Service
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}