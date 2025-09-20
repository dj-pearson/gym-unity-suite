import { useState, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { ShoppingCart, Scan, DollarSign, Plus, Minus, Trash2, CreditCard, Banknote } from 'lucide-react';
import { toast } from 'sonner';

interface Product {
  id: string;
  sku: string;
  name: string;
  sale_price: number;
  tax_rate: number;
  current_stock: number;
}

interface CartItem extends Product {
  quantity: number;
  discount: number;
}

interface Transaction {
  subtotal: number;
  tax_amount: number;
  discount_amount: number;
  total_amount: number;
  payment_method: string;
  amount_tendered?: number;
  change_given?: number;
}

export function POSTerminal() {
  const [searchTerm, setSearchTerm] = useState('');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [memberSearch, setMemberSearch] = useState('');
  const [selectedMember, setSelectedMember] = useState<any>(null);
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'card'>('cash');
  const [amountTendered, setAmountTendered] = useState('');

  const queryClient = useQueryClient();

  // Fetch products for POS
  const { data: products, isLoading: productsLoading } = useQuery({
    queryKey: ['pos-products', searchTerm],
    queryFn: async () => {
      let query = supabase
        .from('retail_products')
        .select(`
          *,
          inventory_items(current_stock)
        `)
        .eq('is_active', true);

      if (searchTerm) {
        query = query.or(`name.ilike.%${searchTerm}%,sku.ilike.%${searchTerm}%,barcode.ilike.%${searchTerm}%`);
      }

      const { data, error } = await query;
      if (error) throw error;

      return data?.map(product => ({
        ...product,
        current_stock: product.inventory_items?.[0]?.current_stock || 0
      })) || [];
    }
  });

  // Search members
  const { data: members } = useQuery({
    queryKey: ['pos-members', memberSearch],
    queryFn: async () => {
      if (!memberSearch) return [];
      
      const { data, error } = await supabase
        .from('profiles')
        .select('id, first_name, last_name, email, barcode')
        .eq('role', 'member')
        .or(`first_name.ilike.%${memberSearch}%,last_name.ilike.%${memberSearch}%,email.ilike.%${memberSearch}%,barcode.ilike.%${memberSearch}%`)
        .limit(10);

      if (error) throw error;
      return data;
    },
    enabled: memberSearch.length > 0
  });

  // Process transaction mutation
  const processTransaction = useMutation({
    mutationFn: async (transactionData: Transaction) => {
      const user = (await supabase.auth.getUser()).data.user;
      if (!user) throw new Error('Not authenticated');

      // Get user organization
      const { data: profile } = await supabase
        .from('profiles')
        .select('organization_id')
        .eq('id', user.id)
        .single();

      if (!profile?.organization_id) throw new Error('Organization not found');

      // Create transaction
      const { data: transaction, error: transactionError } = await supabase
        .from('retail_transactions')
        .insert({
          organization_id: profile.organization_id,
          member_id: selectedMember?.id || null,
          cashier_id: user.id,
          subtotal: transactionData.subtotal,
          tax_amount: transactionData.tax_amount,
          discount_amount: transactionData.discount_amount,
          total_amount: transactionData.total_amount,
          amount_tendered: transactionData.amount_tendered || null,
          change_given: transactionData.change_given || 0,
          payment_method: transactionData.payment_method
        })
        .select()
        .single();

      if (transactionError) throw transactionError;

      // Create transaction items
      const transactionItems = cart.map(item => ({
        transaction_id: transaction.id,
        product_id: item.id,
        quantity: item.quantity,
        unit_price: item.sale_price,
        discount_amount: item.discount,
        tax_rate: item.tax_rate,
        line_total: (item.sale_price * item.quantity) - item.discount
      }));

      const { error: itemsError } = await supabase
        .from('retail_transaction_items')
        .insert(transactionItems);

      if (itemsError) throw itemsError;

      return transaction;
    },
    onSuccess: (transaction) => {
      queryClient.invalidateQueries({ queryKey: ['pos-products'] });
      queryClient.invalidateQueries({ queryKey: ['inventory-items'] });
      toast.success(`Transaction ${transaction.transaction_number} completed successfully`);
      clearCart();
    },
    onError: (error) => {
      toast.error('Failed to process transaction: ' + error.message);
    }
  });

  const addToCart = useCallback((product: Product) => {
    if (product.current_stock <= 0) {
      toast.error('Product is out of stock');
      return;
    }

    setCart(prevCart => {
      const existingItem = prevCart.find(item => item.id === product.id);
      
      if (existingItem) {
        if (existingItem.quantity >= product.current_stock) {
          toast.error('Cannot add more items than available in stock');
          return prevCart;
        }
        
        return prevCart.map(item =>
          item.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      } else {
        return [...prevCart, { ...product, quantity: 1, discount: 0 }];
      }
    });
  }, []);

  const updateQuantity = useCallback((productId: string, newQuantity: number) => {
    const product = products?.find(p => p.id === productId);
    
    if (!product) return;
    
    if (newQuantity > product.current_stock) {
      toast.error('Cannot exceed available stock');
      return;
    }

    if (newQuantity <= 0) {
      removeFromCart(productId);
      return;
    }

    setCart(prevCart =>
      prevCart.map(item =>
        item.id === productId
          ? { ...item, quantity: newQuantity }
          : item
      )
    );
  }, [products]);

  const removeFromCart = useCallback((productId: string) => {
    setCart(prevCart => prevCart.filter(item => item.id !== productId));
  }, []);

  const clearCart = useCallback(() => {
    setCart([]);
    setSelectedMember(null);
    setMemberSearch('');
    setAmountTendered('');
  }, []);

  // Calculate totals
  const subtotal = cart.reduce((sum, item) => sum + (item.sale_price * item.quantity), 0);
  const totalDiscount = cart.reduce((sum, item) => sum + item.discount, 0);
  const taxAmount = cart.reduce((sum, item) => {
    const itemTotal = (item.sale_price * item.quantity) - item.discount;
    return sum + (itemTotal * (item.tax_rate / 100));
  }, 0);
  const total = subtotal - totalDiscount + taxAmount;

  const handleProcessTransaction = () => {
    if (cart.length === 0) {
      toast.error('Cart is empty');
      return;
    }

    const transactionData: Transaction = {
      subtotal,
      tax_amount: taxAmount,
      discount_amount: totalDiscount,
      total_amount: total,
      payment_method: paymentMethod
    };

    if (paymentMethod === 'cash') {
      const tendered = parseFloat(amountTendered);
      if (!tendered || tendered < total) {
        toast.error('Amount tendered must be greater than or equal to total');
        return;
      }
      
      transactionData.amount_tendered = tendered;
      transactionData.change_given = tendered - total;
    }

    processTransaction.mutate(transactionData);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-full">
      {/* Product Search & Selection */}
      <div className="lg:col-span-2 space-y-4">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Scan className="h-5 w-5 mr-2" />
              Product Lookup
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Input
              placeholder="Search by name, SKU, or scan barcode..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Products</CardTitle>
          </CardHeader>
          <CardContent className="max-h-96 overflow-y-auto">
            {productsLoading ? (
              <div className="text-center py-8">Loading products...</div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {products?.map((product) => (
                  <Button
                    key={product.id}
                    variant="outline"
                    className="h-auto p-4 text-left justify-start"
                    onClick={() => addToCart(product)}
                    disabled={product.current_stock <= 0}
                  >
                    <div className="flex-1">
                      <div className="font-medium">{product.name}</div>
                      <div className="text-sm text-muted-foreground">{product.sku}</div>
                      <div className="flex items-center justify-between mt-1">
                        <span className="font-medium">${product.sale_price.toFixed(2)}</span>
                        <Badge variant={product.current_stock > 0 ? 'secondary' : 'destructive'}>
                          Stock: {product.current_stock}
                        </Badge>
                      </div>
                    </div>
                  </Button>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Shopping Cart & Checkout */}
      <div className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <ShoppingCart className="h-5 w-5 mr-2" />
              Shopping Cart ({cart.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Member Search */}
            <div className="space-y-2">
              <Label>Member (Optional)</Label>
              <Input
                placeholder="Search member..."
                value={memberSearch}
                onChange={(e) => setMemberSearch(e.target.value)}
              />
              {members && members.length > 0 && (
                <div className="border rounded p-2 max-h-32 overflow-y-auto">
                  {members.map((member) => (
                    <Button
                      key={member.id}
                      variant="ghost"
                      size="sm"
                      className="w-full justify-start"
                      onClick={() => {
                        setSelectedMember(member);
                        setMemberSearch(`${member.first_name} ${member.last_name}`);
                      }}
                    >
                      {member.first_name} {member.last_name} - {member.email}
                    </Button>
                  ))}
                </div>
              )}
              {selectedMember && (
                <Badge variant="secondary">
                  Selected: {selectedMember.first_name} {selectedMember.last_name}
                </Badge>
              )}
            </div>

            <Separator />

            {/* Cart Items */}
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {cart.map((item) => (
                <div key={item.id} className="flex items-center justify-between p-2 border rounded">
                  <div className="flex-1">
                    <div className="font-medium text-sm">{item.name}</div>
                    <div className="text-xs text-muted-foreground">${item.sale_price.toFixed(2)} each</div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => updateQuantity(item.id, item.quantity - 1)}
                    >
                      <Minus className="h-3 w-3" />
                    </Button>
                    <span className="w-8 text-center">{item.quantity}</span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => updateQuantity(item.id, item.quantity + 1)}
                    >
                      <Plus className="h-3 w-3" />
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => removeFromCart(item.id)}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>

            <Separator />

            {/* Totals */}
            <div className="space-y-2">
              <div className="flex justify-between">
                <span>Subtotal:</span>
                <span>${subtotal.toFixed(2)}</span>
              </div>
              {totalDiscount > 0 && (
                <div className="flex justify-between text-green-600">
                  <span>Discount:</span>
                  <span>-${totalDiscount.toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span>Tax:</span>
                <span>${taxAmount.toFixed(2)}</span>
              </div>
              <Separator />
              <div className="flex justify-between text-lg font-bold">
                <span>Total:</span>
                <span>${total.toFixed(2)}</span>
              </div>
            </div>

            {/* Payment Method */}
            <div className="space-y-2">
              <Label>Payment Method</Label>
              <Select value={paymentMethod} onValueChange={(value: 'cash' | 'card') => setPaymentMethod(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="cash">
                    <div className="flex items-center">
                      <Banknote className="h-4 w-4 mr-2" />
                      Cash
                    </div>
                  </SelectItem>
                  <SelectItem value="card">
                    <div className="flex items-center">
                      <CreditCard className="h-4 w-4 mr-2" />
                      Card
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Cash Payment */}
            {paymentMethod === 'cash' && (
              <div className="space-y-2">
                <Label>Amount Tendered</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={amountTendered}
                  onChange={(e) => setAmountTendered(e.target.value)}
                  placeholder="0.00"
                />
                {amountTendered && parseFloat(amountTendered) >= total && (
                  <div className="text-sm text-muted-foreground">
                    Change: ${(parseFloat(amountTendered) - total).toFixed(2)}
                  </div>
                )}
              </div>
            )}

            {/* Action Buttons */}
            <div className="space-y-2">
              <Button
                className="w-full"
                size="lg"
                onClick={handleProcessTransaction}
                disabled={cart.length === 0 || processTransaction.isPending}
              >
                <DollarSign className="h-4 w-4 mr-2" />
                Process Transaction
              </Button>
              <Button
                variant="outline"
                className="w-full"
                onClick={clearCart}
                disabled={cart.length === 0}
              >
                Clear Cart
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}