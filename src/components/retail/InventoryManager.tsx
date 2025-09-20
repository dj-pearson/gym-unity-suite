import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { AlertTriangle, Package, TrendingUp, TrendingDown, Plus } from 'lucide-react';
import { toast } from 'sonner';

interface InventoryItem {
  id: string;
  current_stock: number;
  min_stock_level: number;
  max_stock_level?: number;
  reorder_point: number;
  last_restocked_at?: string;
  cost_per_unit?: number;
  retail_products: {
    id: string;
    sku: string;
    name: string;
    category: string;
    sale_price: number;
  };
}

interface StockAdjustmentData {
  inventory_item_id: string;
  movement_type: 'restock' | 'adjustment' | 'waste';
  quantity_change: number;
  reason: string;
  notes: string;
}

export function InventoryManager() {
  const [isAdjustmentDialogOpen, setIsAdjustmentDialogOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [stockFilter, setStockFilter] = useState('all');

  const [adjustmentData, setAdjustmentData] = useState<StockAdjustmentData>({
    inventory_item_id: '',
    movement_type: 'restock',
    quantity_change: 0,
    reason: '',
    notes: ''
  });

  const queryClient = useQueryClient();

  // Fetch inventory items
  const { data: inventoryItems, isLoading } = useQuery({
    queryKey: ['inventory-items', searchTerm, stockFilter],
    queryFn: async () => {
      let query = supabase
        .from('inventory_items')
        .select(`
          *,
          retail_products!inner(id, sku, name, category, sale_price)
        `)
        .order('retail_products.name');

      if (searchTerm) {
        query = query.or(`retail_products.name.ilike.%${searchTerm}%,retail_products.sku.ilike.%${searchTerm}%`);
      }

      const { data, error } = await query;
      if (error) throw error;

      let filteredData = data || [];

      // Apply stock filters
      if (stockFilter === 'low') {
        filteredData = filteredData.filter(item => 
          item.current_stock <= item.min_stock_level
        );
      } else if (stockFilter === 'out') {
        filteredData = filteredData.filter(item => 
          item.current_stock === 0
        );
      } else if (stockFilter === 'reorder') {
        filteredData = filteredData.filter(item => 
          item.current_stock <= item.reorder_point
        );
      }

      return filteredData;
    }
  });

  // Fetch stock movements for history
  const { data: stockMovements } = useQuery({
    queryKey: ['stock-movements'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('stock_movements')
        .select(`
          *,
          inventory_items!inner(
            retail_products(sku, name)
          )
        `)
        .order('movement_date', { ascending: false })
        .limit(100);

      if (error) throw error;
      return data;
    }
  });

  // Create stock movement mutation
  const createStockMovement = useMutation({
    mutationFn: async (data: StockAdjustmentData) => {
      // Get user organization
      const { data: profile } = await supabase
        .from('profiles')
        .select('organization_id')
        .eq('id', (await supabase.auth.getUser()).data.user?.id)
        .single();

      if (!profile?.organization_id) throw new Error('Organization not found');

      const { error: movementError } = await supabase
        .from('stock_movements')
        .insert({
          organization_id: profile.organization_id,
          inventory_item_id: data.inventory_item_id,
          movement_type: data.movement_type,
          quantity_change: data.quantity_change,
          reason: data.reason,
          notes: data.notes || null,
          performed_by: (await supabase.auth.getUser()).data.user?.id
        });

      if (movementError) throw movementError;

      // Update inventory stock - use direct update since we don't have the function
      const { data: currentItem } = await supabase
        .from('inventory_items')
        .select('current_stock')
        .eq('id', data.inventory_item_id)
        .single();

      if (currentItem) {
        const { error: updateError } = await supabase
          .from('inventory_items')
          .update({
            current_stock: currentItem.current_stock + data.quantity_change,
            last_restocked_at: data.movement_type === 'restock' ? new Date().toISOString() : undefined
          })
          .eq('id', data.inventory_item_id);

        if (updateError) throw updateError;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inventory-items'] });
      queryClient.invalidateQueries({ queryKey: ['stock-movements'] });
      toast.success('Stock adjustment recorded successfully');
      setIsAdjustmentDialogOpen(false);
      resetAdjustmentForm();
    },
    onError: (error) => {
      toast.error('Failed to record stock adjustment: ' + error.message);
    }
  });

  const resetAdjustmentForm = () => {
    setAdjustmentData({
      inventory_item_id: '',
      movement_type: 'restock',
      quantity_change: 0,
      reason: '',
      notes: ''
    });
    setSelectedItem(null);
  };

  const handleStockAdjustment = (item: InventoryItem) => {
    setSelectedItem(item);
    setAdjustmentData({
      ...adjustmentData,
      inventory_item_id: item.id
    });
    setIsAdjustmentDialogOpen(true);
  };

  const handleSubmitAdjustment = () => {
    if (!adjustmentData.inventory_item_id || !adjustmentData.reason) {
      toast.error('Please fill in all required fields');
      return;
    }

    createStockMovement.mutate(adjustmentData);
  };

  const getStockStatus = (item: InventoryItem) => {
    if (item.current_stock === 0) return { status: 'Out of Stock', color: 'destructive' as const };
    if (item.current_stock <= item.min_stock_level) return { status: 'Low Stock', color: 'destructive' as const };
    if (item.current_stock <= item.reorder_point) return { status: 'Reorder Soon', color: 'secondary' as const };
    return { status: 'In Stock', color: 'default' as const };
  };

  const lowStockCount = inventoryItems?.filter(item => 
    item.current_stock <= item.min_stock_level
  ).length || 0;

  const outOfStockCount = inventoryItems?.filter(item => 
    item.current_stock === 0
  ).length || 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Inventory Manager</h2>
          <p className="text-muted-foreground">Track and manage product inventory levels</p>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Products</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{inventoryItems?.length || 0}</div>
            <p className="text-xs text-muted-foreground">
              Products in inventory
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Low Stock</CardTitle>
            <AlertTriangle className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">{lowStockCount}</div>
            <p className="text-xs text-muted-foreground">
              Products below minimum level
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Out of Stock</CardTitle>
            <TrendingDown className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">{outOfStockCount}</div>
            <p className="text-xs text-muted-foreground">
              Products with zero stock
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex gap-4 items-center">
        <Input
          placeholder="Search products..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="max-w-sm"
        />
        <Select value={stockFilter} onValueChange={setStockFilter}>
          <SelectTrigger className="w-48">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Products</SelectItem>
            <SelectItem value="low">Low Stock</SelectItem>
            <SelectItem value="out">Out of Stock</SelectItem>
            <SelectItem value="reorder">Needs Reorder</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Inventory Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Package className="h-5 w-5 mr-2" />
            Inventory Items
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8">Loading inventory...</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>SKU</TableHead>
                  <TableHead>Product</TableHead>
                  <TableHead>Current Stock</TableHead>
                  <TableHead>Min Level</TableHead>
                  <TableHead>Reorder Point</TableHead>
                  <TableHead>Value</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {inventoryItems?.map((item) => {
                  const stockStatus = getStockStatus(item);
                  const totalValue = item.current_stock * item.retail_products.sale_price;

                  return (
                    <TableRow key={item.id}>
                      <TableCell className="font-medium">
                        {item.retail_products.sku}
                      </TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">{item.retail_products.name}</div>
                          <div className="text-sm text-muted-foreground">
                            {item.retail_products.category}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={item.current_stock === 0 ? 'destructive' : 'secondary'}>
                          {item.current_stock}
                        </Badge>
                      </TableCell>
                      <TableCell>{item.min_stock_level}</TableCell>
                      <TableCell>{item.reorder_point}</TableCell>
                      <TableCell>${totalValue.toFixed(2)}</TableCell>
                      <TableCell>
                        <Badge variant={stockStatus.color}>
                          {stockStatus.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => handleStockAdjustment(item)}
                        >
                          <Plus className="h-4 w-4 mr-1" />
                          Adjust
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Stock Adjustment Dialog */}
      <Dialog open={isAdjustmentDialogOpen} onOpenChange={setIsAdjustmentDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Stock Adjustment</DialogTitle>
          </DialogHeader>
          
          {selectedItem && (
            <div className="space-y-4">
              <div className="p-4 bg-muted rounded-lg">
                <h3 className="font-medium">{selectedItem.retail_products.name}</h3>
                <p className="text-sm text-muted-foreground">
                  Current Stock: {selectedItem.current_stock} units
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="movement_type">Movement Type</Label>
                <Select
                  value={adjustmentData.movement_type}
                  onValueChange={(value: 'restock' | 'adjustment' | 'waste') => 
                    setAdjustmentData({ ...adjustmentData, movement_type: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="restock">Restock (Add Inventory)</SelectItem>
                    <SelectItem value="adjustment">Adjustment (Add/Remove)</SelectItem>
                    <SelectItem value="waste">Waste/Damage (Remove)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="quantity_change">Quantity Change</Label>
                <Input
                  id="quantity_change"
                  type="number"
                  value={adjustmentData.quantity_change}
                  onChange={(e) => setAdjustmentData({ 
                    ...adjustmentData, 
                    quantity_change: parseInt(e.target.value) || 0 
                  })}
                  placeholder="Enter positive or negative number"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="reason">Reason *</Label>
                <Input
                  id="reason"
                  value={adjustmentData.reason}
                  onChange={(e) => setAdjustmentData({ ...adjustmentData, reason: e.target.value })}
                  placeholder="Reason for adjustment"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes">Additional Notes</Label>
                <Textarea
                  id="notes"
                  value={adjustmentData.notes}
                  onChange={(e) => setAdjustmentData({ ...adjustmentData, notes: e.target.value })}
                  placeholder="Optional notes..."
                  rows={3}
                />
              </div>

              <div className="flex justify-end space-x-2 pt-4">
                <Button variant="outline" onClick={() => setIsAdjustmentDialogOpen(false)}>
                  Cancel
                </Button>
                <Button 
                  onClick={handleSubmitAdjustment}
                  disabled={!adjustmentData.reason || createStockMovement.isPending}
                >
                  Record Adjustment
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}