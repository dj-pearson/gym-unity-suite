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
  Users, 
  Phone, 
  Mail,
  Globe,
  Star,
  Calendar,
  Shield,
  Heart,
  AlertTriangle
} from 'lucide-react';
import { format } from 'date-fns';

interface Vendor {
  id: string;
  name: string;
  vendor_type: string;
  contact_name?: string;
  email?: string;
  phone?: string;
  address?: string;
  website?: string;
  license_number?: string;
  insurance_expiry?: string;
  rating?: number;
  preferred_vendor: boolean;
  notes?: string;
  created_at: string;
}

export default function VendorManager() {
  const { profile } = useAuth();
  const { toast } = useToast();
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [editingVendor, setEditingVendor] = useState<Vendor | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    vendor_type: 'maintenance',
    contact_name: '',
    email: '',
    phone: '',
    address: '',
    website: '',
    license_number: '',
    insurance_expiry: '',
    rating: '',
    preferred_vendor: false,
    notes: ''
  });

  useEffect(() => {
    if (profile?.organization_id) {
      fetchVendors();
    }
  }, [profile]);

  const fetchVendors = async () => {
    try {
      const { data, error } = await supabase
        .from('vendors')
        .select('*')
        .eq('organization_id', profile?.organization_id)
        .order('name');

      if (error) throw error;
      setVendors(data || []);
    } catch (error) {
      console.error('Error fetching vendors:', error);
      toast({
        title: "Error",
        description: "Failed to fetch vendors",
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
      const vendorData = {
        ...formData,
        organization_id: profile.organization_id,
        rating: formData.rating ? parseInt(formData.rating) : null,
        insurance_expiry: formData.insurance_expiry || null,
        website: formData.website || null,
        license_number: formData.license_number || null,
        contact_name: formData.contact_name || null,
        email: formData.email || null,
        phone: formData.phone || null,
        address: formData.address || null,
        notes: formData.notes || null
      };

      let error;
      if (editingVendor) {
        const { error: updateError } = await supabase
          .from('vendors')
          .update(vendorData)
          .eq('id', editingVendor.id);
        error = updateError;
      } else {
        const { error: insertError } = await supabase
          .from('vendors')
          .insert([vendorData]);
        error = insertError;
      }

      if (error) throw error;

      toast({
        title: editingVendor ? "Vendor Updated" : "Vendor Added",
        description: `${formData.name} has been ${editingVendor ? 'updated' : 'added'} successfully.`
      });

      setShowAddDialog(false);
      setEditingVendor(null);
      resetForm();
      fetchVendors();
    } catch (error) {
      console.error('Error saving vendor:', error);
      toast({
        title: "Error",
        description: "Failed to save vendor",
        variant: "destructive"
      });
    }
  };

  const handleEdit = (vendor: Vendor) => {
    setEditingVendor(vendor);
    setFormData({
      name: vendor.name,
      vendor_type: vendor.vendor_type,
      contact_name: vendor.contact_name || '',
      email: vendor.email || '',
      phone: vendor.phone || '',
      address: vendor.address || '',
      website: vendor.website || '',
      license_number: vendor.license_number || '',
      insurance_expiry: vendor.insurance_expiry || '',
      rating: vendor.rating?.toString() || '',
      preferred_vendor: vendor.preferred_vendor,
      notes: vendor.notes || ''
    });
    setShowAddDialog(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this vendor?')) return;

    try {
      const { error } = await supabase
        .from('vendors')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast({
        title: "Vendor Deleted",
        description: "Vendor has been removed successfully."
      });

      fetchVendors();
    } catch (error) {
      console.error('Error deleting vendor:', error);
      toast({
        title: "Error",
        description: "Failed to delete vendor",
        variant: "destructive"
      });
    }
  };

  const togglePreferred = async (vendor: Vendor) => {
    try {
      const { error } = await supabase
        .from('vendors')
        .update({ preferred_vendor: !vendor.preferred_vendor })
        .eq('id', vendor.id);

      if (error) throw error;

      toast({
        title: vendor.preferred_vendor ? "Removed from Preferred" : "Added to Preferred",
        description: `${vendor.name} ${vendor.preferred_vendor ? 'removed from' : 'added to'} preferred vendors.`
      });

      fetchVendors();
    } catch (error) {
      console.error('Error updating vendor preference:', error);
      toast({
        title: "Error",
        description: "Failed to update vendor preference",
        variant: "destructive"
      });
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      vendor_type: 'maintenance',
      contact_name: '',
      email: '',
      phone: '',
      address: '',
      website: '',
      license_number: '',
      insurance_expiry: '',
      rating: '',
      preferred_vendor: false,
      notes: ''
    });
  };

  const getVendorTypeBadge = (type: string) => {
    const types = {
      maintenance: { label: 'Maintenance', color: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200' },
      cleaning: { label: 'Cleaning', color: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' },
      security: { label: 'Security', color: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200' },
      hvac: { label: 'HVAC', color: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200' },
      equipment_supplier: { label: 'Equipment', color: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200' },
      other: { label: 'Other', color: 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200' }
    };

    const config = types[type as keyof typeof types] || types.other;
    return (
      <Badge variant="outline" className={config.color}>
        {config.label}
      </Badge>
    );
  };

  const renderStarRating = (rating: number | undefined) => {
    if (!rating) return <span className="text-muted-foreground">Not rated</span>;
    
    return (
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`w-4 h-4 ${
              star <= rating 
                ? 'fill-yellow-400 text-yellow-400' 
                : 'text-muted-foreground'
            }`}
          />
        ))}
        <span className="text-sm text-muted-foreground ml-1">({rating})</span>
      </div>
    );
  };

  const isInsuranceExpiring = (expiryDate?: string) => {
    if (!expiryDate) return false;
    const expiry = new Date(expiryDate);
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
    return expiry <= thirtyDaysFromNow;
  };

  const filteredVendors = vendors.filter(vendor => {
    const matchesSearch = vendor.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         vendor.contact_name?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = filterType === 'all' || vendor.vendor_type === filterType;
    
    return matchesSearch && matchesType;
  });

  if (loading) {
    return <div className="flex justify-center p-4">Loading vendors...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Header Actions */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search vendors..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8 w-full sm:w-64"
            />
          </div>
          <Select value={filterType} onValueChange={setFilterType}>
            <SelectTrigger className="w-full sm:w-40">
              <SelectValue placeholder="Filter by type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="maintenance">Maintenance</SelectItem>
              <SelectItem value="cleaning">Cleaning</SelectItem>
              <SelectItem value="security">Security</SelectItem>
              <SelectItem value="hvac">HVAC</SelectItem>
              <SelectItem value="equipment_supplier">Equipment</SelectItem>
              <SelectItem value="other">Other</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
          <DialogTrigger asChild>
            <Button onClick={() => { resetForm(); setEditingVendor(null); }}>
              <Plus className="w-4 h-4 mr-2" />
              Add Vendor
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingVendor ? 'Edit Vendor' : 'Add New Vendor'}
              </DialogTitle>
              <DialogDescription>
                {editingVendor ? 'Update vendor information' : 'Add a new service provider to your vendor list'}
              </DialogDescription>
            </DialogHeader>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Vendor Name *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="e.g., ABC Maintenance Co."
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="vendor_type">Type *</Label>
                  <Select
                    value={formData.vendor_type}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, vendor_type: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="maintenance">Maintenance</SelectItem>
                      <SelectItem value="cleaning">Cleaning</SelectItem>
                      <SelectItem value="security">Security</SelectItem>
                      <SelectItem value="hvac">HVAC</SelectItem>
                      <SelectItem value="equipment_supplier">Equipment Supplier</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="contact_name">Contact Name</Label>
                  <Input
                    id="contact_name"
                    value={formData.contact_name}
                    onChange={(e) => setFormData(prev => ({ ...prev, contact_name: e.target.value }))}
                    placeholder="Primary contact person"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                    placeholder="contact@vendor.com"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone">Phone</Label>
                  <Input
                    id="phone"
                    value={formData.phone}
                    onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                    placeholder="(555) 123-4567"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="website">Website</Label>
                  <Input
                    id="website"
                    type="url"
                    value={formData.website}
                    onChange={(e) => setFormData(prev => ({ ...prev, website: e.target.value }))}
                    placeholder="https://vendor.com"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="license_number">License Number</Label>
                  <Input
                    id="license_number"
                    value={formData.license_number}
                    onChange={(e) => setFormData(prev => ({ ...prev, license_number: e.target.value }))}
                    placeholder="Professional license number"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="insurance_expiry">Insurance Expiry</Label>
                  <Input
                    id="insurance_expiry"
                    type="date"
                    value={formData.insurance_expiry}
                    onChange={(e) => setFormData(prev => ({ ...prev, insurance_expiry: e.target.value }))}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="rating">Rating (1-5)</Label>
                  <Select
                    value={formData.rating}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, rating: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Rate this vendor" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">No rating</SelectItem>
                      <SelectItem value="1">1 Star</SelectItem>
                      <SelectItem value="2">2 Stars</SelectItem>
                      <SelectItem value="3">3 Stars</SelectItem>
                      <SelectItem value="4">4 Stars</SelectItem>
                      <SelectItem value="5">5 Stars</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={formData.preferred_vendor}
                      onChange={(e) => setFormData(prev => ({ ...prev, preferred_vendor: e.target.checked }))}
                      className="rounded"
                    />
                    Preferred Vendor
                  </Label>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="address">Address</Label>
                <Input
                  id="address"
                  value={formData.address}
                  onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
                  placeholder="Full business address"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes">Notes</Label>
                <Textarea
                  id="notes"
                  value={formData.notes}
                  onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                  placeholder="Additional notes about this vendor..."
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
                  {editingVendor ? 'Update Vendor' : 'Add Vendor'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Vendors List */}
      <Card>
        <CardHeader>
          <CardTitle>Vendor Directory ({filteredVendors.length} vendors)</CardTitle>
          <CardDescription>
            Manage your service providers and vendor relationships
          </CardDescription>
        </CardHeader>
        <CardContent>
          {filteredVendors.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              {searchTerm || filterType !== 'all' 
                ? 'No vendors found matching your filters.' 
                : 'No vendors added yet. Click "Add Vendor" to get started.'}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Vendor</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Contact Info</TableHead>
                  <TableHead>Rating</TableHead>
                  <TableHead>Insurance</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredVendors.map((vendor) => (
                  <TableRow key={vendor.id}>
                    <TableCell>
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{vendor.name}</span>
                          {vendor.preferred_vendor && (
                            <Heart className="w-4 h-4 fill-red-500 text-red-500" />
                          )}
                        </div>
                        {vendor.contact_name && (
                          <div className="text-sm text-muted-foreground flex items-center gap-1">
                            <Users className="w-3 h-3" />
                            {vendor.contact_name}
                          </div>
                        )}
                        {vendor.license_number && (
                          <div className="text-xs text-muted-foreground">
                            License: {vendor.license_number}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      {getVendorTypeBadge(vendor.vendor_type)}
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        {vendor.email && (
                          <div className="flex items-center gap-1 text-sm">
                            <Mail className="w-3 h-3 text-muted-foreground" />
                            <a href={`mailto:${vendor.email}`} className="text-primary hover:underline">
                              {vendor.email}
                            </a>
                          </div>
                        )}
                        {vendor.phone && (
                          <div className="flex items-center gap-1 text-sm">
                            <Phone className="w-3 h-3 text-muted-foreground" />
                            <a href={`tel:${vendor.phone}`} className="text-primary hover:underline">
                              {vendor.phone}
                            </a>
                          </div>
                        )}
                        {vendor.website && (
                          <div className="flex items-center gap-1 text-sm">
                            <Globe className="w-3 h-3 text-muted-foreground" />
                            <a 
                              href={vendor.website} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="text-primary hover:underline"
                            >
                              Website
                            </a>
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      {renderStarRating(vendor.rating)}
                    </TableCell>
                    <TableCell>
                      {vendor.insurance_expiry ? (
                        <div className="space-y-1">
                          <div className="flex items-center gap-1">
                            <Shield className="w-4 h-4 text-muted-foreground" />
                            <span className="text-sm">
                              {format(new Date(vendor.insurance_expiry), 'MMM dd, yyyy')}
                            </span>
                            {isInsuranceExpiring(vendor.insurance_expiry) && (
                              <AlertTriangle className="w-4 h-4 text-orange-500" />
                            )}
                          </div>
                          {isInsuranceExpiring(vendor.insurance_expiry) && (
                            <Badge variant="outline" className="text-orange-600">
                              Expiring Soon
                            </Badge>
                          )}
                        </div>
                      ) : (
                        <span className="text-muted-foreground">Not specified</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => togglePreferred(vendor)}
                          className={vendor.preferred_vendor ? "text-red-600" : ""}
                        >
                          <Heart className={`w-4 h-4 ${vendor.preferred_vendor ? 'fill-current' : ''}`} />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEdit(vendor)}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(vendor.id)}
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