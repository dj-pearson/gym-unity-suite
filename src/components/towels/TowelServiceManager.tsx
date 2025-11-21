import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Bath, Plus, Search, RefreshCw, AlertCircle } from "lucide-react";
import { getStatusBgColor, getPaymentStatusColor } from "@/lib/colorUtils";

interface TowelInventory {
  id: string;
  towel_type: string;
  size: string;
  color: string;
  total_quantity: number;
  available_quantity: number;
  rented_quantity: number;
  in_cleaning: number;
  damaged_quantity: number;
  rental_price: number;
  min_stock_level: number;
}

interface TowelRental {
  id: string;
  member_id: string;
  towel_inventory_id: string;
  rental_date: string;
  rental_time: string;
  return_date?: string;
  return_time?: string;
  rental_fee: number;
  payment_status: string;
  towel_condition_out: string;
  towel_condition_in?: string;
  status: string;
  created_at: string;
  updated_at: string;
}

export function TowelServiceManager() {
  const { profile } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedMember, setSelectedMember] = useState("");
  const [selectedTowelType, setSelectedTowelType] = useState("");

  // Fetch towel inventory
  const { data: inventory = [], isLoading: inventoryLoading } = useQuery({
    queryKey: ["towel-inventory", profile?.organization_id],
    queryFn: async () => {
      if (!profile?.organization_id) return [];
      
      const { data, error } = await supabase
        .from("towel_inventory")
        .select("*")
        .eq("organization_id", profile.organization_id)
        .order("towel_type", { ascending: true });

      if (error) throw error;
      return data as TowelInventory[];
    },
    enabled: !!profile?.organization_id,
  });

  // Fetch active rentals
  const { data: activeRentals = [], isLoading: rentalsLoading } = useQuery({
    queryKey: ["towel-rentals", profile?.organization_id],
    queryFn: async () => {
      if (!profile?.organization_id) return [];
      
      const { data, error } = await supabase
        .from("towel_rentals")
        .select("*")
        .eq("organization_id", profile.organization_id)
        .eq("status", "active")
        .order("rental_date", { ascending: false });

      if (error) throw error;
      return data || [];
    },
    enabled: !!profile?.organization_id,
  });

  // Create new towel rental
  const createRentalMutation = useMutation({
    mutationFn: async (rentalData: {
      member_id: string;
      towel_inventory_id: string;
      rental_fee: number;
    }) => {
      const { data, error } = await supabase
        .from("towel_rentals")
        .insert([{
          organization_id: profile?.organization_id,
          staff_out: profile?.id,
          ...rentalData
        }])
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["towel-rentals"] });
      queryClient.invalidateQueries({ queryKey: ["towel-inventory"] });
      toast({ title: "Success", description: "Towel rental created successfully" });
    },
    onError: (error) => {
      toast({ 
        title: "Error", 
        description: error instanceof Error ? error.message : "Failed to create rental",
        variant: "destructive"
      });
    },
  });

  // Return towel
  const returnTowelMutation = useMutation({
    mutationFn: async (data: {
      rentalId: string;
      condition: string;
      lateFee?: number;
      damageFee?: number;
    }) => {
      const { error } = await supabase
        .from("towel_rentals")
        .update({
          status: "returned",
          return_date: new Date().toISOString().split('T')[0],
          return_time: new Date().toTimeString().split(' ')[0],
          towel_condition_in: data.condition,
          staff_in: profile?.id,
          late_fee: data.lateFee || 0,
          damage_fee: data.damageFee || 0
        })
        .eq("id", data.rentalId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["towel-rentals"] });
      queryClient.invalidateQueries({ queryKey: ["towel-inventory"] });
      toast({ title: "Success", description: "Towel returned successfully" });
    },
    onError: (error) => {
      toast({ 
        title: "Error", 
        description: error instanceof Error ? error.message : "Failed to return towel",
        variant: "destructive"
      });
    },
  });

  if (inventoryLoading || rentalsLoading) {
    return <div className="flex items-center justify-center p-8">Loading towel service data...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Towel Service Management</h1>
          <p className="text-muted-foreground">Manage towel inventory, rentals, and cleaning schedules</p>
        </div>
        <div className="flex gap-2">
          <Dialog>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Rent Towel
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Rent Towel</DialogTitle>
                <DialogDescription>Issue a towel to a member</DialogDescription>
              </DialogHeader>
              <RentalForm 
                inventory={inventory} 
                onSubmit={(data) => createRentalMutation.mutate(data)}
                isLoading={createRentalMutation.isPending}
              />
            </DialogContent>
          </Dialog>
          
          <Button variant="outline" onClick={() => queryClient.invalidateQueries()}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      <Tabs defaultValue="inventory" className="space-y-6">
        <TabsList>
          <TabsTrigger value="inventory">Inventory</TabsTrigger>
          <TabsTrigger value="rentals">Active Rentals</TabsTrigger>
          <TabsTrigger value="cleaning">Cleaning Schedule</TabsTrigger>
        </TabsList>

        <TabsContent value="inventory" className="space-y-4">
          <div className="grid gap-6">
            {inventory.map((item) => (
              <Card key={item.id}>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Bath className="h-5 w-5 text-primary" />
                      <div>
                        <CardTitle className="text-lg">
                          {item.towel_type.charAt(0).toUpperCase() + item.towel_type.slice(1)} Towels
                        </CardTitle>
                        <CardDescription>
                          {item.size} • {item.color} • ${item.rental_price} rental
                        </CardDescription>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold">{item.available_quantity}</div>
                      <div className="text-sm text-muted-foreground">Available</div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                    <div className="text-center">
                      <div className="text-lg font-semibold">{item.total_quantity}</div>
                      <div className="text-sm text-muted-foreground">Total</div>
                    </div>
                    <div className="text-center">
                      <div className="text-lg font-semibold text-yellow-600">{item.rented_quantity}</div>
                      <div className="text-sm text-muted-foreground">Rented</div>
                    </div>
                    <div className="text-center">
                      <div className="text-lg font-semibold text-blue-600">{item.in_cleaning}</div>
                      <div className="text-sm text-muted-foreground">Cleaning</div>
                    </div>
                    <div className="text-center">
                      <div className="text-lg font-semibold text-red-600">{item.damaged_quantity}</div>
                      <div className="text-sm text-muted-foreground">Damaged</div>
                    </div>
                    <div className="text-center">
                      {item.available_quantity <= item.min_stock_level && (
                        <Badge variant="destructive" className="flex items-center gap-1">
                          <AlertCircle className="h-3 w-3" />
                          Low Stock
                        </Badge>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="rentals" className="space-y-4">
          <div className="flex gap-4 mb-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Search rentals..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          <div className="grid gap-4">
            {activeRentals.map((rental) => (
              <Card key={rental.id}>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <Bath className="h-8 w-8 text-primary" />
                      <div>
                        <div className="font-semibold">
                          Member ID: {rental.member_id}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          Towel ID: {rental.towel_inventory_id}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          Rented: {rental.rental_date} at {rental.rental_time}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <div className="font-semibold">${rental.rental_fee}</div>
                        <Badge className={`${getPaymentStatusColor(rental.payment_status)} text-white`}>
                          {rental.payment_status}
                        </Badge>
                      </div>
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button variant="outline" size="sm">Return</Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Return Towel</DialogTitle>
                            <DialogDescription>Process towel return and check condition</DialogDescription>
                          </DialogHeader>
                          <ReturnForm 
                            rental={rental}
                            onSubmit={(data) => returnTowelMutation.mutate({
                              rentalId: rental.id,
                              ...data
                            })}
                            isLoading={returnTowelMutation.isPending}
                          />
                        </DialogContent>
                      </Dialog>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="cleaning">
          <Card>
            <CardHeader>
              <CardTitle>Cleaning Schedule</CardTitle>
              <CardDescription>Manage towel cleaning cycles and schedules</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">Cleaning schedule management coming soon...</p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function RentalForm({ 
  inventory, 
  onSubmit, 
  isLoading 
}: { 
  inventory: TowelInventory[]; 
  onSubmit: (data: any) => void; 
  isLoading: boolean;
}) {
  const [formData, setFormData] = useState({
    member_id: "",
    towel_inventory_id: "",
    rental_fee: 0
  });

  const selectedInventory = inventory.find(item => item.id === formData.towel_inventory_id);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="member_id">Member ID</Label>
        <Input
          id="member_id"
          value={formData.member_id}
          onChange={(e) => setFormData({ ...formData, member_id: e.target.value })}
          placeholder="Enter member ID"
          required
        />
      </div>
      
      <div>
        <Label htmlFor="towel_type">Towel Type</Label>
        <Select
          value={formData.towel_inventory_id}
          onValueChange={(value) => {
            const item = inventory.find(i => i.id === value);
            setFormData({ 
              ...formData, 
              towel_inventory_id: value,
              rental_fee: item?.rental_price || 0
            });
          }}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select towel type" />
          </SelectTrigger>
          <SelectContent>
            {inventory
              .filter(item => item.available_quantity > 0)
              .map((item) => (
              <SelectItem key={item.id} value={item.id}>
                {item.towel_type} - {item.size} - {item.color} (${item.rental_price})
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {selectedInventory && (
        <div className="p-3 bg-muted rounded-lg">
          <div className="text-sm">
            <div>Available: {selectedInventory.available_quantity}</div>
            <div>Rental Fee: ${selectedInventory.rental_price}</div>
          </div>
        </div>
      )}

      <Button type="submit" disabled={isLoading || !formData.member_id || !formData.towel_inventory_id}>
        {isLoading ? "Processing..." : "Rent Towel"}
      </Button>
    </form>
  );
}

function ReturnForm({ 
  rental, 
  onSubmit, 
  isLoading 
}: { 
  rental: TowelRental; 
  onSubmit: (data: any) => void; 
  isLoading: boolean;
}) {
  const [formData, setFormData] = useState({
    condition: "good",
    lateFee: 0,
    damageFee: 0,
    notes: ""
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="condition">Towel Condition</Label>
        <Select
          value={formData.condition}
          onValueChange={(value) => setFormData({ ...formData, condition: value })}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="excellent">Excellent</SelectItem>
            <SelectItem value="good">Good</SelectItem>
            <SelectItem value="fair">Fair (Needs Cleaning)</SelectItem>
            <SelectItem value="damaged">Damaged</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="lateFee">Late Fee ($)</Label>
          <Input
            id="lateFee"
            type="number"
            step="0.01"
            min="0"
            value={formData.lateFee}
            onChange={(e) => setFormData({ ...formData, lateFee: parseFloat(e.target.value) || 0 })}
          />
        </div>
        <div>
          <Label htmlFor="damageFee">Damage Fee ($)</Label>
          <Input
            id="damageFee"
            type="number"
            step="0.01"
            min="0"
            value={formData.damageFee}
            onChange={(e) => setFormData({ ...formData, damageFee: parseFloat(e.target.value) || 0 })}
          />
        </div>
      </div>

      <div>
        <Label htmlFor="notes">Notes</Label>
        <Textarea
          id="notes"
          value={formData.notes}
          onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
          placeholder="Additional notes about the return..."
        />
      </div>

      <Button type="submit" disabled={isLoading}>
        {isLoading ? "Processing..." : "Return Towel"}
      </Button>
    </form>
  );
}