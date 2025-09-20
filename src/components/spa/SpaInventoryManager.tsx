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
import { Plus, Edit2, Trash2, Package, AlertTriangle, TrendingDown } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";

interface SpaInventoryItem {
  id: string;
  product_name: string;
  product_category: string;
  brand: string | null;
  product_code: string | null;
  description: string | null;
  unit_of_measurement: string;
  current_stock: number;
  minimum_stock: number;
  maximum_stock: number;
  cost_per_unit: number;
  retail_price: number;
  supplier_name: string | null;
  supplier_contact: string | null;
  last_restock_date: string | null;
  expiry_date: string | null;
  storage_location: string | null;
  usage_per_service: number;
  is_active: boolean;
  requires_certification: boolean;
}

const PRODUCT_CATEGORIES = [
  "oil",
  "lotion", 
  "cream",
  "towel",
  "equipment",
  "supplement",
  "retail"
];

const UNITS_OF_MEASUREMENT = [
  "ml", "oz", "g", "kg", "pieces", "bottles", "tubes", "jars"
];

export function SpaInventoryManager() {
  const { profile } = useAuth();
  const queryClient = useQueryClient();
  const [selectedItem, setSelectedItem] = useState<SpaInventoryItem | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const { data: inventoryItems = [], isLoading } = useQuery({
    queryKey: ["spa-inventory", profile?.organization_id],
    queryFn: async () => {
      if (!profile?.organization_id) return [];
      
      const { data, error } = await supabase
        .from("spa_inventory")
        .select("*")
        .eq("organization_id", profile.organization_id)
        .order("product_name");

      if (error) throw error;
      return data as SpaInventoryItem[];
    },
    enabled: !!profile?.organization_id,
  });

  const createItemMutation = useMutation({
    mutationFn: async (itemData: Partial<SpaInventoryItem>) => {
      if (!profile?.organization_id) throw new Error("No organization");

      const { data, error } = await supabase
        .from("spa_inventory")
        .insert({ ...itemData, organization_id: profile.organization_id } as any)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["spa-inventory"] });
      toast.success("Inventory item created successfully");
      setIsDialogOpen(false);
      setSelectedItem(null);
    },
    onError: (error) => {
      toast.error(`Failed to create item: ${error.message}`);
    },
  });

  const updateItemMutation = useMutation({
    mutationFn: async ({ id, ...itemData }: Partial<SpaInventoryItem> & { id: string }) => {
      const { data, error } = await supabase
        .from("spa_inventory")
        .update(itemData)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["spa-inventory"] });
      toast.success("Inventory item updated successfully");
      setIsDialogOpen(false);
      setSelectedItem(null);
    },
    onError: (error) => {
      toast.error(`Failed to update item: ${error.message}`);
    },
  });

  const deleteItemMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("spa_inventory")
        .delete()
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["spa-inventory"] });
      toast.success("Inventory item deleted successfully");
    },
    onError: (error) => {
      toast.error(`Failed to delete item: ${error.message}`);
    },
  });

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    const itemData = {
      product_name: formData.get("product_name") as string,
      product_category: formData.get("product_category") as string,
      brand: formData.get("brand") as string || null,
      product_code: formData.get("product_code") as string || null,
      description: formData.get("description") as string || null,
      unit_of_measurement: formData.get("unit_of_measurement") as string,
      current_stock: parseInt(formData.get("current_stock") as string) || 0,
      minimum_stock: parseInt(formData.get("minimum_stock") as string) || 10,
      maximum_stock: parseInt(formData.get("maximum_stock") as string) || 100,
      cost_per_unit: parseFloat(formData.get("cost_per_unit") as string) || 0,
      retail_price: parseFloat(formData.get("retail_price") as string) || 0,
      supplier_name: formData.get("supplier_name") as string || null,
      supplier_contact: formData.get("supplier_contact") as string || null,
      last_restock_date: formData.get("last_restock_date") as string || null,
      expiry_date: formData.get("expiry_date") as string || null,
      storage_location: formData.get("storage_location") as string || null,
      usage_per_service: parseFloat(formData.get("usage_per_service") as string) || 0,
      is_active: formData.get("is_active") === "on",
      requires_certification: formData.get("requires_certification") === "on",
    };

    if (selectedItem) {
      updateItemMutation.mutate({ id: selectedItem.id, ...itemData });
    } else {
      createItemMutation.mutate(itemData);
    }
  };

  const openDialog = (item?: SpaInventoryItem) => {
    setSelectedItem(item || null);
    setIsDialogOpen(true);
  };

  const getStockStatusColor = (item: SpaInventoryItem) => {
    if (item.current_stock <= item.minimum_stock) return "text-red-600";
    if (item.current_stock <= item.minimum_stock * 1.5) return "text-yellow-600";
    return "text-green-600";
  };

  const getStockStatusIcon = (item: SpaInventoryItem) => {
    if (item.current_stock <= item.minimum_stock) return <AlertTriangle className="h-4 w-4" />;
    if (item.current_stock <= item.minimum_stock * 1.5) return <TrendingDown className="h-4 w-4" />;
    return null;
  };

  const lowStockItems = inventoryItems.filter(item => item.current_stock <= item.minimum_stock);

  if (isLoading) {
    return <div>Loading spa inventory...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Spa Inventory Management</h2>
          <p className="text-muted-foreground">Track oils, lotions, equipment, and retail products</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => openDialog()}>
              <Plus className="h-4 w-4 mr-2" />
              Add Product
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-3xl">
            <DialogHeader>
              <DialogTitle>
                {selectedItem ? "Edit Product" : "Add New Product"}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="product_name">Product Name</Label>
                  <Input
                    id="product_name"
                    name="product_name"
                    defaultValue={selectedItem?.product_name}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="product_category">Category</Label>
                  <Select name="product_category" defaultValue={selectedItem?.product_category || "oil"}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {PRODUCT_CATEGORIES.map((category) => (
                        <SelectItem key={category} value={category}>
                          {category.charAt(0).toUpperCase() + category.slice(1)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="brand">Brand</Label>
                  <Input
                    id="brand"
                    name="brand"
                    defaultValue={selectedItem?.brand || ""}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="product_code">Product Code</Label>
                  <Input
                    id="product_code"
                    name="product_code"
                    defaultValue={selectedItem?.product_code || ""}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  name="description"
                  defaultValue={selectedItem?.description || ""}
                />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="unit_of_measurement">Unit</Label>
                  <Select name="unit_of_measurement" defaultValue={selectedItem?.unit_of_measurement || "ml"}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {UNITS_OF_MEASUREMENT.map((unit) => (
                        <SelectItem key={unit} value={unit}>{unit}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="current_stock">Current Stock</Label>
                  <Input
                    id="current_stock"
                    name="current_stock"
                    type="number"
                    min="0"
                    defaultValue={selectedItem?.current_stock || 0}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="minimum_stock">Minimum Stock</Label>
                  <Input
                    id="minimum_stock"
                    name="minimum_stock"
                    type="number"
                    min="0"
                    defaultValue={selectedItem?.minimum_stock || 10}
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="maximum_stock">Maximum Stock</Label>
                  <Input
                    id="maximum_stock"
                    name="maximum_stock"
                    type="number"
                    min="0"
                    defaultValue={selectedItem?.maximum_stock || 100}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="cost_per_unit">Cost per Unit ($)</Label>
                  <Input
                    id="cost_per_unit"
                    name="cost_per_unit"
                    type="number"
                    step="0.01"
                    min="0"
                    defaultValue={selectedItem?.cost_per_unit || 0}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="retail_price">Retail Price ($)</Label>
                  <Input
                    id="retail_price"
                    name="retail_price"
                    type="number"
                    step="0.01"
                    min="0"
                    defaultValue={selectedItem?.retail_price || 0}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="supplier_name">Supplier Name</Label>
                  <Input
                    id="supplier_name"
                    name="supplier_name"
                    defaultValue={selectedItem?.supplier_name || ""}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="supplier_contact">Supplier Contact</Label>
                  <Input
                    id="supplier_contact"
                    name="supplier_contact"
                    defaultValue={selectedItem?.supplier_contact || ""}
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="last_restock_date">Last Restock Date</Label>
                  <Input
                    id="last_restock_date"
                    name="last_restock_date"
                    type="date"
                    defaultValue={selectedItem?.last_restock_date || ""}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="expiry_date">Expiry Date</Label>
                  <Input
                    id="expiry_date"
                    name="expiry_date"
                    type="date"
                    defaultValue={selectedItem?.expiry_date || ""}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="usage_per_service">Usage per Service</Label>
                  <Input
                    id="usage_per_service"
                    name="usage_per_service"
                    type="number"
                    step="0.01"
                    min="0"
                    defaultValue={selectedItem?.usage_per_service || 0}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="storage_location">Storage Location</Label>
                <Input
                  id="storage_location"
                  name="storage_location"
                  defaultValue={selectedItem?.storage_location || ""}
                  placeholder="e.g., Spa Room A, Storage Closet 2"
                />
              </div>

              <div className="flex items-center space-x-6">
                <div className="flex items-center space-x-2">
                  <Switch
                    id="is_active"
                    name="is_active"
                    defaultChecked={selectedItem?.is_active !== false}
                  />
                  <Label htmlFor="is_active">Active Product</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Switch
                    id="requires_certification"
                    name="requires_certification"
                    defaultChecked={selectedItem?.requires_certification || false}
                  />
                  <Label htmlFor="requires_certification">Requires Certification</Label>
                </div>
              </div>

              <div className="flex justify-end space-x-2">
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  disabled={createItemMutation.isPending || updateItemMutation.isPending}
                >
                  {createItemMutation.isPending || updateItemMutation.isPending 
                    ? "Saving..." 
                    : selectedItem 
                      ? "Update Product" 
                      : "Create Product"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {lowStockItems.length > 0 && (
        <Card className="border-red-200 bg-red-50">
          <CardHeader>
            <CardTitle className="text-red-800 flex items-center">
              <AlertTriangle className="h-5 w-5 mr-2" />
              Low Stock Alert
            </CardTitle>
            <CardDescription className="text-red-700">
              {lowStockItems.length} item{lowStockItems.length !== 1 ? 's' : ''} below minimum stock level
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {lowStockItems.slice(0, 3).map((item) => (
                <div key={item.id} className="flex justify-between items-center">
                  <span className="font-medium">{item.product_name}</span>
                  <Badge variant="destructive">
                    {item.current_stock} / {item.minimum_stock} {item.unit_of_measurement}
                  </Badge>
                </div>
              ))}
              {lowStockItems.length > 3 && (
                <p className="text-sm text-red-600">
                  ... and {lowStockItems.length - 3} more items
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Inventory Items</CardTitle>
          <CardDescription>
            {inventoryItems.length} products in inventory
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Product</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Current Stock</TableHead>
                <TableHead>Min/Max Stock</TableHead>
                <TableHead>Cost</TableHead>
                <TableHead>Retail</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {inventoryItems.map((item) => (
                <TableRow key={item.id}>
                  <TableCell>
                    <div>
                      <p className="font-medium">{item.product_name}</p>
                      {item.brand && (
                        <p className="text-sm text-muted-foreground">{item.brand}</p>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">
                      {item.product_category.charAt(0).toUpperCase() + item.product_category.slice(1)}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className={`flex items-center ${getStockStatusColor(item)}`}>
                      {getStockStatusIcon(item)}
                      <span className="ml-1">
                        {item.current_stock} {item.unit_of_measurement}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">
                      <div>Min: {item.minimum_stock}</div>
                      <div>Max: {item.maximum_stock}</div>
                    </div>
                  </TableCell>
                  <TableCell>${item.cost_per_unit}</TableCell>
                  <TableCell>${item.retail_price}</TableCell>
                  <TableCell>
                    <Badge variant={item.is_active ? "default" : "secondary"}>
                      {item.is_active ? "Active" : "Inactive"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-2">
                      <Button variant="outline" size="sm" onClick={() => openDialog(item)}>
                        <Edit2 className="h-4 w-4" />
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => deleteItemMutation.mutate(item.id)}
                        disabled={deleteItemMutation.isPending}
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

      {inventoryItems.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-8">
            <Package className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium">No inventory items yet</h3>
            <p className="text-muted-foreground text-center mb-4">
              Start by adding oils, lotions, equipment, and other spa products.
            </p>
            <Button onClick={() => openDialog()}>
              <Plus className="h-4 w-4 mr-2" />
              Add First Product
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}