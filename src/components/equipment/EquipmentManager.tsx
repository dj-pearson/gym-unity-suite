import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { 
  Plus, 
  Search, 
  Edit, 
  Trash2, 
  Wrench, 
  Calendar, 
  DollarSign,
  Activity,
  AlertCircle,
  CheckCircle,
  Clock
} from 'lucide-react';
import { format } from 'date-fns';

interface Equipment {
  id: string;
  name: string;
  equipment_type: string;
  brand?: string;
  model?: string;
  serial_number?: string;
  purchase_date?: string;
  purchase_price?: number;
  warranty_expiry?: string;
  status: string;
  last_maintenance_date?: string;
  next_maintenance_date?: string;
  usage_hours: number;
  notes?: string;
  created_at: string;
}

export default function EquipmentManager() {
  const { profile } = useAuth();
  const { toast } = useToast();
  const [equipment, setEquipment] = useState<Equipment[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterType, setFilterType] = useState('all');
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [editingEquipment, setEditingEquipment] = useState<Equipment | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    equipment_type: 'cardio',
    brand: '',
    model: '',
    serial_number: '',
    purchase_date: '',
    purchase_price: '',
    warranty_expiry: '',
    status: 'active',
    maintenance_interval_days: '90',
    usage_hours: '0',
    notes: ''
  });

  useEffect(() => {
    console.log('EquipmentManager: useEffect triggered', { profile: profile?.organization_id });
    if (profile?.organization_id) {
      console.log('EquipmentManager: Fetching equipment...');
      fetchEquipment();
    }
  }, [profile]);

  const fetchEquipment = async () => {
    console.log('EquipmentManager: fetchEquipment called');
    try {
      const { data, error } = await supabase
        .from('equipment')
        .select('*')
        .eq('organization_id', profile?.organization_id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      console.log('EquipmentManager: Equipment fetched successfully', { count: data?.length });
      setEquipment(data || []);
    } catch (error) {
      console.error('Error fetching equipment:', error);
      toast({
        title: "Error",
        description: "Failed to fetch equipment data",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile?.organization_id) return;

    try {
      const equipmentData = {
        ...formData,
        organization_id: profile.organization_id,
        purchase_price: formData.purchase_price ? parseFloat(formData.purchase_price) : null,
        usage_hours: parseInt(formData.usage_hours) || 0,
        maintenance_interval_days: parseInt(formData.maintenance_interval_days) || 90,
        purchase_date: formData.purchase_date || null,
        warranty_expiry: formData.warranty_expiry || null
      };

      let error;
      if (editingEquipment) {
        const { error: updateError } = await supabase
          .from('equipment')
          .update(equipmentData)
          .eq('id', editingEquipment.id);
        error = updateError;
      } else {
        const { error: insertError } = await supabase
          .from('equipment')
          .insert([equipmentData]);
        error = insertError;
      }

      if (error) throw error;

      toast({
        title: editingEquipment ? "Equipment Updated" : "Equipment Added",
        description: `${formData.name} has been ${editingEquipment ? 'updated' : 'added'} successfully.`
      });

      setShowAddDialog(false);
      setEditingEquipment(null);
      resetForm();
      fetchEquipment();
    } catch (error) {
      console.error('Error saving equipment:', error);
      toast({
        title: "Error",
        description: "Failed to save equipment",
        variant: "destructive"
      });
    }
  };

  const handleEdit = (equipment: Equipment) => {
    setEditingEquipment(equipment);
    setFormData({
      name: equipment.name,
      equipment_type: equipment.equipment_type,
      brand: equipment.brand || '',
      model: equipment.model || '',
      serial_number: equipment.serial_number || '',
      purchase_date: equipment.purchase_date || '',
      purchase_price: equipment.purchase_price?.toString() || '',
      warranty_expiry: equipment.warranty_expiry || '',
      status: equipment.status,
      maintenance_interval_days: '90',
      usage_hours: equipment.usage_hours.toString(),
      notes: equipment.notes || ''
    });
    setShowAddDialog(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this equipment?')) return;

    try {
      const { error } = await supabase
        .from('equipment')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast({
        title: "Equipment Deleted",
        description: "Equipment has been removed successfully."
      });

      fetchEquipment();
    } catch (error) {
      console.error('Error deleting equipment:', error);
      toast({
        title: "Error",
        description: "Failed to delete equipment",
        variant: "destructive"
      });
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      equipment_type: 'cardio',
      brand: '',
      model: '',
      serial_number: '',
      purchase_date: '',
      purchase_price: '',
      warranty_expiry: '',
      status: 'active',
      maintenance_interval_days: '90',
      usage_hours: '0',
      notes: ''
    });
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      active: { label: 'Active', variant: 'default' as const, icon: CheckCircle },
      maintenance: { label: 'Maintenance', variant: 'secondary' as const, icon: Clock },
      out_of_service: { label: 'Out of Service', variant: 'destructive' as const, icon: AlertCircle },
      retired: { label: 'Retired', variant: 'outline' as const, icon: Clock }
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.active;
    const Icon = config.icon;

    return (
      <Badge variant={config.variant} className="flex items-center gap-1">
        <Icon className="w-3 h-3" />
        {config.label}
      </Badge>
    );
  };

  const getTypeBadge = (type: string) => {
    const colors = {
      cardio: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
      strength: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
      functional: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
      other: 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200'
    };

    return (
      <Badge variant="outline" className={colors[type as keyof typeof colors] || colors.other}>
        {type.charAt(0).toUpperCase() + type.slice(1)}
      </Badge>
    );
  };

  const filteredEquipment = equipment.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         item.brand?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         item.model?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'all' || item.status === filterStatus;
    const matchesType = filterType === 'all' || item.equipment_type === filterType;
    
    return matchesSearch && matchesStatus && matchesType;
  });

  if (loading) {
    return <div className="flex justify-center p-4">Loading equipment...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Header Actions */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search equipment..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8 w-full sm:w-64"
            />
          </div>
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="w-full sm:w-40">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="maintenance">Maintenance</SelectItem>
              <SelectItem value="out_of_service">Out of Service</SelectItem>
              <SelectItem value="retired">Retired</SelectItem>
            </SelectContent>
          </Select>
          <Select value={filterType} onValueChange={setFilterType}>
            <SelectTrigger className="w-full sm:w-40">
              <SelectValue placeholder="Filter by type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="cardio">Cardio</SelectItem>
              <SelectItem value="strength">Strength</SelectItem>
              <SelectItem value="functional">Functional</SelectItem>
              <SelectItem value="other">Other</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
          <DialogTrigger asChild>
            <Button onClick={() => { resetForm(); setEditingEquipment(null); }}>
              <Plus className="w-4 h-4 mr-2" />
              Add Equipment
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingEquipment ? 'Edit Equipment' : 'Add New Equipment'}
              </DialogTitle>
              <DialogDescription>
                {editingEquipment ? 'Update equipment information' : 'Add equipment to your inventory'}
              </DialogDescription>
            </DialogHeader>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Equipment Name *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="e.g., Treadmill #1"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="equipment_type">Type *</Label>
                  <Select
                    value={formData.equipment_type}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, equipment_type: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="cardio">Cardio</SelectItem>
                      <SelectItem value="strength">Strength</SelectItem>
                      <SelectItem value="functional">Functional</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="brand">Brand</Label>
                  <Input
                    id="brand"
                    value={formData.brand}
                    onChange={(e) => setFormData(prev => ({ ...prev, brand: e.target.value }))}
                    placeholder="e.g., Life Fitness"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="model">Model</Label>
                  <Input
                    id="model"
                    value={formData.model}
                    onChange={(e) => setFormData(prev => ({ ...prev, model: e.target.value }))}
                    placeholder="e.g., T3 Track+"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="serial_number">Serial Number</Label>
                  <Input
                    id="serial_number"
                    value={formData.serial_number}
                    onChange={(e) => setFormData(prev => ({ ...prev, serial_number: e.target.value }))}
                    placeholder="e.g., LF123456"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="status">Status</Label>
                  <Select
                    value={formData.status}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, status: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="maintenance">Maintenance</SelectItem>
                      <SelectItem value="out_of_service">Out of Service</SelectItem>
                      <SelectItem value="retired">Retired</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="purchase_date">Purchase Date</Label>
                  <Input
                    id="purchase_date"
                    type="date"
                    value={formData.purchase_date}
                    onChange={(e) => setFormData(prev => ({ ...prev, purchase_date: e.target.value }))}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="purchase_price">Purchase Price</Label>
                  <Input
                    id="purchase_price"
                    type="number"
                    step="0.01"
                    value={formData.purchase_price}
                    onChange={(e) => setFormData(prev => ({ ...prev, purchase_price: e.target.value }))}
                    placeholder="0.00"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="warranty_expiry">Warranty Expiry</Label>
                  <Input
                    id="warranty_expiry"
                    type="date"
                    value={formData.warranty_expiry}
                    onChange={(e) => setFormData(prev => ({ ...prev, warranty_expiry: e.target.value }))}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="usage_hours">Usage Hours</Label>
                  <Input
                    id="usage_hours"
                    type="number"
                    value={formData.usage_hours}
                    onChange={(e) => setFormData(prev => ({ ...prev, usage_hours: e.target.value }))}
                    placeholder="0"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes">Notes</Label>
                <Textarea
                  id="notes"
                  value={formData.notes}
                  onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                  placeholder="Additional notes about this equipment..."
                  rows={3}
                />
              </div>

              <div className="flex justify-end gap-2">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setShowAddDialog(false)}
                >
                  Cancel
                </Button>
                <Button type="submit">
                  {editingEquipment ? 'Update Equipment' : 'Add Equipment'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Equipment List */}
      <Card>
        <CardHeader>
          <CardTitle>Equipment Inventory ({filteredEquipment.length} items)</CardTitle>
          <CardDescription>
            Manage your gym's equipment inventory and track maintenance schedules
          </CardDescription>
        </CardHeader>
        <CardContent>
          {filteredEquipment.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              {searchTerm || filterStatus !== 'all' || filterType !== 'all' 
                ? 'No equipment found matching your filters.' 
                : 'No equipment added yet. Click "Add Equipment" to get started.'}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Brand/Model</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Next Maintenance</TableHead>
                  <TableHead>Usage Hours</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredEquipment.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell className="font-medium">{item.name}</TableCell>
                    <TableCell>{getTypeBadge(item.equipment_type)}</TableCell>
                    <TableCell>
                      {item.brand && item.model 
                        ? `${item.brand} ${item.model}`
                        : item.brand || item.model || '—'}
                    </TableCell>
                    <TableCell>{getStatusBadge(item.status)}</TableCell>
                    <TableCell>
                      {item.next_maintenance_date ? (
                        <div className="flex items-center gap-1">
                          <Calendar className="w-4 h-4 text-muted-foreground" />
                          {format(new Date(item.next_maintenance_date), 'MMM dd, yyyy')}
                        </div>
                      ) : (
                        <span className="text-muted-foreground">Not scheduled</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Activity className="w-4 h-4 text-muted-foreground" />
                        {item.usage_hours.toLocaleString()} hrs
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEdit(item)}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(item.id)}
                          className="text-destructive hover:text-destructive"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}