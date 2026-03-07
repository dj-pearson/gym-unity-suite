import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ErrorBoundary } from '@/components/ui/error-boundary';
import { ShoppingCart, Package, BarChart3, CreditCard } from 'lucide-react';
import { POSTerminal } from '@/components/retail/POSTerminal';
import { ProductManager } from '@/components/retail/ProductManager';
import { InventoryManager } from '@/components/retail/InventoryManager';
import { SalesReporting } from '@/components/retail/SalesReporting';

export default function RetailPage() {
  const [activeTab, setActiveTab] = useState('pos');

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-4">
        <div className="p-2 bg-gradient-secondary rounded-lg">
          <ShoppingCart className="h-6 w-6 text-white" />
        </div>
        <div>
          <h1 className="text-3xl font-bold text-foreground">Retail & POS</h1>
          <p className="text-muted-foreground">
            Manage your pro shop, inventory, and point of sale
          </p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="pos" className="flex items-center gap-2">
            <CreditCard className="w-4 h-4" />
            POS Terminal
          </TabsTrigger>
          <TabsTrigger value="products" className="flex items-center gap-2">
            <Package className="w-4 h-4" />
            Products
          </TabsTrigger>
          <TabsTrigger value="inventory" className="flex items-center gap-2">
            <Package className="w-4 h-4" />
            Inventory
          </TabsTrigger>
          <TabsTrigger value="reports" className="flex items-center gap-2">
            <BarChart3 className="w-4 h-4" />
            Sales Reports
          </TabsTrigger>
        </TabsList>

        <TabsContent value="pos">
          <ErrorBoundary componentName="POS Terminal">
            <POSTerminal />
          </ErrorBoundary>
        </TabsContent>

        <TabsContent value="products">
          <ErrorBoundary componentName="Product Manager">
            <ProductManager />
          </ErrorBoundary>
        </TabsContent>

        <TabsContent value="inventory">
          <ErrorBoundary componentName="Inventory Manager">
            <InventoryManager />
          </ErrorBoundary>
        </TabsContent>

        <TabsContent value="reports">
          <ErrorBoundary componentName="Sales Reporting">
            <SalesReporting />
          </ErrorBoundary>
        </TabsContent>
      </Tabs>
    </div>
  );
}
