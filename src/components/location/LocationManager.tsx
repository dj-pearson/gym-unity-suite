import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { Plus, MapPin, Users, Activity, Settings, Building2 } from 'lucide-react';
import { getStatusBgColor } from '@/lib/colorUtils';

interface Location {
  id: string;
  name: string;
  address: string;
  phone: string;
  email: string;
  location_code: string;
  region: string;
  district: string;
  status: string;
  is_headquarters: boolean;
  max_capacity: number;
  square_footage: number;
  parking_spaces: number;
  amenities: string[];
  operating_hours: Record<string, any>;
}

export function LocationManager() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState<Location | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    address: '',
    phone: '',
    email: '',
    location_code: '',
    region: '',
    district: '',
    status: 'active',
    is_headquarters: false,
    max_capacity: '',
    square_footage: '',
    parking_spaces: '',
    amenities: [] as string[],
    operating_hours: {}
  });

  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: locations, isLoading } = useQuery({
    queryKey: ['locations'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('locations')
        .select('*')
        .order('name');

      if (error) throw error;
      return data as Location[];
    },
  });

  const { data: locationAnalytics } = useQuery({
    queryKey: ['location-analytics'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('location_analytics')
        .select('*')
        .gte('analytics_date', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]);

      if (error) throw error;
      return data;
    },
  });

  const saveMutation = useMutation({
    mutationFn: async (data: any) => {
      if (selectedLocation) {
        const { error } = await supabase
          .from('locations')
          .update(data)
          .eq('id', selectedLocation.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('locations')
          .insert({
            ...data,
            organization_id: user?.user_metadata?.organization_id,
          });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['locations'] });
      toast.success(selectedLocation ? 'Location updated successfully' : 'Location created successfully');
      setIsDialogOpen(false);
      resetForm();
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to save location');
    },
  });

  const resetForm = () => {
    setFormData({
      name: '',
      address: '',
      phone: '',
      email: '',
      location_code: '',
      region: '',
      district: '',
      status: 'active',
      is_headquarters: false,
      max_capacity: '',
      square_footage: '',
      parking_spaces: '',
      amenities: [],
      operating_hours: {}
    });
    setSelectedLocation(null);
  };

  const handleEdit = (location: Location) => {
    setSelectedLocation(location);
    setFormData({
      name: location.name || '',
      address: location.address || '',
      phone: location.phone || '',
      email: location.email || '',
      location_code: location.location_code || '',
      region: location.region || '',
      district: location.district || '',
      status: location.status || 'active',
      is_headquarters: location.is_headquarters || false,
      max_capacity: location.max_capacity?.toString() || '',
      square_footage: location.square_footage?.toString() || '',
      parking_spaces: location.parking_spaces?.toString() || '',
      amenities: location.amenities || [],
      operating_hours: location.operating_hours || {}
    });
    setIsDialogOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const submissionData = {
      ...formData,
      max_capacity: formData.max_capacity ? parseInt(formData.max_capacity) : null,
      square_footage: formData.square_footage ? parseInt(formData.square_footage) : null,
      parking_spaces: formData.parking_spaces ? parseInt(formData.parking_spaces) : null,
    };

    saveMutation.mutate(submissionData);
  };

  const getLocationStats = (locationId: string) => {
    const stats = locationAnalytics?.filter(a => a.location_id === locationId) || [];
    const totalMembers = Math.max(...stats.map(s => s.total_members || 0), 0);
    const totalRevenue = stats.reduce((sum, s) => sum + (s.revenue_total || 0), 0);
    const totalCheckins = stats.reduce((sum, s) => sum + (s.daily_checkins || 0), 0);
    
    return { totalMembers, totalRevenue, totalCheckins };
  };

  if (isLoading) {
    return <div className="text-center py-8">Loading locations...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Location Management</h2>
          <p className="text-muted-foreground">Manage all gym locations and facilities</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={resetForm}>
              <Plus className="h-4 w-4 mr-2" />
              Add Location
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {selectedLocation ? 'Edit Location' : 'Add New Location'}
              </DialogTitle>
            </DialogHeader>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="name">Location Name</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="location_code">Location Code</Label>
                  <Input
                    id="location_code"
                    value={formData.location_code}
                    onChange={(e) => setFormData({ ...formData, location_code: e.target.value })}
                    placeholder="e.g., NYC01, LA02"
                  />
                </div>

                <div>
                  <Label htmlFor="region">Region</Label>
                  <Input
                    id="region"
                    value={formData.region}
                    onChange={(e) => setFormData({ ...formData, region: e.target.value })}
                    placeholder="e.g., Northeast, West Coast"
                  />
                </div>

                <div>
                  <Label htmlFor="district">District</Label>
                  <Input
                    id="district"
                    value={formData.district}
                    onChange={(e) => setFormData({ ...formData, district: e.target.value })}
                    placeholder="e.g., Manhattan, Beverly Hills"
                  />
                </div>

                <div>
                  <Label htmlFor="status">Status</Label>
                  <Select value={formData.status} onValueChange={(value) => setFormData({ ...formData, status: value })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="under_construction">Under Construction</SelectItem>
                      <SelectItem value="maintenance">Maintenance</SelectItem>
                      <SelectItem value="closed">Closed</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="max_capacity">Max Capacity</Label>
                  <Input
                    id="max_capacity"
                    type="number"
                    value={formData.max_capacity}
                    onChange={(e) => setFormData({ ...formData, max_capacity: e.target.value })}
                  />
                </div>

                <div>
                  <Label htmlFor="square_footage">Square Footage</Label>
                  <Input
                    id="square_footage"
                    type="number"
                    value={formData.square_footage}
                    onChange={(e) => setFormData({ ...formData, square_footage: e.target.value })}
                  />
                </div>

                <div>
                  <Label htmlFor="parking_spaces">Parking Spaces</Label>
                  <Input
                    id="parking_spaces"
                    type="number"
                    value={formData.parking_spaces}
                    onChange={(e) => setFormData({ ...formData, parking_spaces: e.target.value })}
                  />
                </div>

                <div className="md:col-span-2">
                  <Label htmlFor="address">Address</Label>
                  <Textarea
                    id="address"
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  />
                </div>

                <div>
                  <Label htmlFor="phone">Phone</Label>
                  <Input
                    id="phone"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  />
                </div>

                <div>
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={saveMutation.isPending}>
                  {saveMutation.isPending ? 'Saving...' : selectedLocation ? 'Update' : 'Create'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {locations?.map((location) => {
          const stats = getLocationStats(location.id);
          return (
            <Card key={location.id} className="cursor-pointer hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <Building2 className="h-5 w-5 text-primary" />
                    <CardTitle className="text-lg">{location.name}</CardTitle>
                    {location.is_headquarters && (
                      <Badge variant="secondary">HQ</Badge>
                    )}
                  </div>
                  <Badge className={`${getStatusBgColor(location.status)} text-white`} variant="outline">
                    {location.status}
                  </Badge>
                </div>
                <CardDescription>
                  {location.location_code && `${location.location_code} • `}
                  {location.region}
                </CardDescription>
              </CardHeader>
              
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <MapPin className="h-4 w-4" />
                    <span className="truncate">{location.address}</span>
                  </div>

                  <div className="grid grid-cols-3 gap-2 text-center">
                    <div className="space-y-1">
                      <div className="flex items-center justify-center gap-1">
                        <Users className="h-4 w-4 text-blue-500" />
                      </div>
                      <div className="text-lg font-semibold">{stats.totalMembers}</div>
                      <div className="text-xs text-muted-foreground">Members</div>
                    </div>
                    
                    <div className="space-y-1">
                      <div className="flex items-center justify-center gap-1">
                        <Activity className="h-4 w-4 text-green-500" />
                      </div>
                      <div className="text-lg font-semibold">{stats.totalCheckins}</div>
                      <div className="text-xs text-muted-foreground">Check-ins</div>
                    </div>
                    
                    <div className="space-y-1">
                      <div className="text-lg font-semibold">${stats.totalRevenue.toFixed(0)}</div>
                      <div className="text-xs text-muted-foreground">Revenue</div>
                    </div>
                  </div>

                  <div className="flex justify-end">
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => handleEdit(location)}
                    >
                      <Settings className="h-4 w-4 mr-2" />
                      Manage
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}