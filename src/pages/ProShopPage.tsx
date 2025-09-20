import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ProductManager } from '@/components/retail/ProductManager';
import { InventoryManager } from '@/components/retail/InventoryManager';
import { POSTerminal } from '@/components/retail/POSTerminal';
import { SalesReporting } from '@/components/retail/SalesReporting';
import { ShoppingCart, Package, BarChart3, Warehouse } from 'lucide-react';
import { SEOHead } from '@/components/seo/SEOHead';

export default function ProShopPage() {
  const [activeTab, setActiveTab] = useState('pos');

  return (
    <>
      <SEOHead 
        title="Pro Shop - Point of Sale System"
        description="Comprehensive retail management system with POS terminal, inventory tracking, product management, and sales reporting for fitness centers."
      />
      
      <div className="container mx-auto py-6">
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Pro Shop Management</h1>
            <p className="text-muted-foreground">
              Complete retail point-of-sale system for managing products, inventory, and sales
            </p>
          </div>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="pos" className="flex items-center gap-2">
                <ShoppingCart className="h-4 w-4" />
                <span className="hidden sm:inline">POS Terminal</span>
                <span className="sm:hidden">POS</span>
              </TabsTrigger>
              <TabsTrigger value="products" className="flex items-center gap-2">
                <Package className="h-4 w-4" />
                <span className="hidden sm:inline">Products</span>
                <span className="sm:hidden">Products</span>
              </TabsTrigger>
              <TabsTrigger value="inventory" className="flex items-center gap-2">
                <Warehouse className="h-4 w-4" />
                <span className="hidden sm:inline">Inventory</span>
                <span className="sm:hidden">Stock</span>
              </TabsTrigger>
              <TabsTrigger value="reports" className="flex items-center gap-2">
                <BarChart3 className="h-4 w-4" />
                <span className="hidden sm:inline">Reports</span>
                <span className="sm:hidden">Reports</span>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="pos" className="space-y-4">
              <POSTerminal />
            </TabsContent>

            <TabsContent value="products" className="space-y-4">
              <ProductManager />
            </TabsContent>

            <TabsContent value="inventory" className="space-y-4">
              <InventoryManager />
            </TabsContent>

            <TabsContent value="reports" className="space-y-4">
              <SalesReporting />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </>
  );
}