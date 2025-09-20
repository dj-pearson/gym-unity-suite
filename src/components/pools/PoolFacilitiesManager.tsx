import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Plus, Edit, Trash2, Waves, Thermometer, Users, Clock } from 'lucide-react';

interface PoolFacility {
  id: string;
  pool_name: string;
  pool_type: string;
  length_meters: number | null;
  width_meters: number | null;
  depth_min: number | null;
  depth_max: number | null;
  lane_count: number;
  temperature_target: number;
  is_heated: boolean;
  has_diving_board: boolean;
  has_slides: boolean;
  capacity_max: number;
  is_available: boolean;
  is_closed_for_maintenance: boolean;
  operating_hours_start: string;
  operating_hours_end: string;
  description: string | null;
  safety_notes: string | null;
  amenities: string[];
}

export function PoolFacilitiesManager() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [pools, setPools] = useState<PoolFacility[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingPool, setEditingPool] = useState<PoolFacility | null>(null);
  const [formData, setFormData] = useState({
    pool_name: '',
    pool_type: 'indoor',
    length_meters: 25.0,
    width_meters: 12.5,
    depth_min: 1.2,
    depth_max: 2.0,
    lane_count: 6,
    temperature_target: 78.0,
    is_heated: true,
    has_diving_board: false,
    has_slides: false,
    capacity_max: 50,
    is_available: true,
    is_closed_for_maintenance: false,
    operating_hours_start: '06:00',
    operating_hours_end: '22:00',
    description: '',
    safety_notes: '',
    amenities: [] as string[]
  });

  useEffect(() => {
    fetchPools();
  }, [user]);

  const fetchPools = async () => {
    if (!user?.user_metadata?.organization_id) return;

    try {
      const { data, error } = await supabase
        .from('pool_facilities')
        .select('*')
        .eq('organization_id', user.user_metadata.organization_id)
        .order('pool_name');

      if (error) throw error;
      setPools(data || []);
    } catch (error) {
      console.error('Error fetching pools:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch pool facilities',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.user_metadata?.organization_id) return;

    try {
      const poolData = {
        ...formData,
        organization_id: user.user_metadata.organization_id
      };

      if (editingPool) {
        const { error } = await supabase
          .from('pool_facilities')
          .update(poolData)
          .eq('id', editingPool.id);
        
        if (error) throw error;
        
        toast({
          title: 'Success',
          description: 'Pool facility updated successfully'
        });
      } else {
        const { error } = await supabase
          .from('pool_facilities')
          .insert(poolData);
        
        if (error) throw error;
        
        toast({
          title: 'Success',
          description: 'Pool facility created successfully'
        });
      }

      setIsDialogOpen(false);
      resetForm();
      fetchPools();
    } catch (error) {
      console.error('Error saving pool:', error);
      toast({
        title: 'Error',
        description: 'Failed to save pool facility',
        variant: 'destructive'
      });
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this pool facility?')) return;

    try {
      const { error } = await supabase
        .from('pool_facilities')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Pool facility deleted successfully'
      });

      fetchPools();
    } catch (error) {
      console.error('Error deleting pool:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete pool facility',
        variant: 'destructive'
      });
    }
  };

  const resetForm = () => {
    setFormData({
      pool_name: '',
      pool_type: 'indoor',
      length_meters: 25.0,
      width_meters: 12.5,
      depth_min: 1.2,
      depth_max: 2.0,
      lane_count: 6,
      temperature_target: 78.0,
      is_heated: true,
      has_diving_board: false,
      has_slides: false,
      capacity_max: 50,
      is_available: true,
      is_closed_for_maintenance: false,
      operating_hours_start: '06:00',
      operating_hours_end: '22:00',
      description: '',
      safety_notes: '',
      amenities: []
    });
    setEditingPool(null);
  };

  const openEditDialog = (pool: PoolFacility) => {
    setEditingPool(pool);
    setFormData({
      pool_name: pool.pool_name,
      pool_type: pool.pool_type,
      length_meters: pool.length_meters || 25.0,
      width_meters: pool.width_meters || 12.5,
      depth_min: pool.depth_min || 1.2,
      depth_max: pool.depth_max || 2.0,
      lane_count: pool.lane_count,
      temperature_target: pool.temperature_target,
      is_heated: pool.is_heated,
      has_diving_board: pool.has_diving_board,
      has_slides: pool.has_slides,
      capacity_max: pool.capacity_max,
      is_available: pool.is_available,
      is_closed_for_maintenance: pool.is_closed_for_maintenance,
      operating_hours_start: pool.operating_hours_start,
      operating_hours_end: pool.operating_hours_end,
      description: pool.description || '',
      safety_notes: pool.safety_notes || '',
      amenities: pool.amenities || []
    });
    setIsDialogOpen(true);
  };

  const poolTypes = [
    'indoor', 'outdoor', 'heated', 'therapy', 'lap', 'recreational', 'competition', 'diving'
  ];

  if (isLoading) {
    return <div className="flex items-center justify-center p-8">Loading pool facilities...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Pool Facilities</h2>
          <p className="text-muted-foreground">Manage your aquatic center facilities and amenities</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={resetForm}>
              <Plus className="w-4 h-4 mr-2" />
              Add Pool
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingPool ? 'Edit Pool Facility' : 'Add New Pool Facility'}</DialogTitle>
              <DialogDescription>
                {editingPool ? 'Update pool facility information' : 'Add a new pool facility to your aquatic center'}
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="pool_name">Pool Name *</Label>
                  <Input
                    id="pool_name"
                    value={formData.pool_name}
                    onChange={(e) => setFormData({...formData, pool_name: e.target.value})}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="pool_type">Pool Type</Label>
                  <Select value={formData.pool_type} onValueChange={(value) => setFormData({...formData, pool_type: value})}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {poolTypes.map(type => (
                        <SelectItem key={type} value={type}>
                          {type.charAt(0).toUpperCase() + type.slice(1)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-4 gap-4">
                <div>
                  <Label htmlFor="length_meters">Length (m)</Label>
                  <Input
                    id="length_meters"
                    type="number"
                    step="0.1"
                    value={formData.length_meters}
                    onChange={(e) => setFormData({...formData, length_meters: parseFloat(e.target.value)})}
                  />
                </div>
                <div>
                  <Label htmlFor="width_meters">Width (m)</Label>
                  <Input
                    id="width_meters"
                    type="number"
                    step="0.1"
                    value={formData.width_meters}
                    onChange={(e) => setFormData({...formData, width_meters: parseFloat(e.target.value)})}
                  />
                </div>
                <div>
                  <Label htmlFor="depth_min">Min Depth (m)</Label>
                  <Input
                    id="depth_min"
                    type="number"
                    step="0.1"
                    value={formData.depth_min}
                    onChange={(e) => setFormData({...formData, depth_min: parseFloat(e.target.value)})}
                  />
                </div>
                <div>
                  <Label htmlFor="depth_max">Max Depth (m)</Label>
                  <Input
                    id="depth_max"
                    type="number"
                    step="0.1"
                    value={formData.depth_max}
                    onChange={(e) => setFormData({...formData, depth_max: parseFloat(e.target.value)})}
                  />
                </div>
              </div>

              <div className="grid grid-cols-4 gap-4">
                <div>
                  <Label htmlFor="lane_count">Lanes</Label>
                  <Input
                    id="lane_count"
                    type="number"
                    min="1"
                    value={formData.lane_count}
                    onChange={(e) => setFormData({...formData, lane_count: parseInt(e.target.value)})}
                  />
                </div>
                <div>
                  <Label htmlFor="temperature_target">Target Temp (°F)</Label>
                  <Input
                    id="temperature_target"
                    type="number"
                    step="0.1"
                    value={formData.temperature_target}
                    onChange={(e) => setFormData({...formData, temperature_target: parseFloat(e.target.value)})}
                  />
                </div>
                <div>
                  <Label htmlFor="capacity_max">Max Capacity</Label>
                  <Input
                    id="capacity_max"
                    type="number"
                    min="1"
                    value={formData.capacity_max}
                    onChange={(e) => setFormData({...formData, capacity_max: parseInt(e.target.value)})}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="operating_hours_start">Opens At</Label>
                  <Input
                    id="operating_hours_start"
                    type="time"
                    value={formData.operating_hours_start}
                    onChange={(e) => setFormData({...formData, operating_hours_start: e.target.value})}
                  />
                </div>
                <div>
                  <Label htmlFor="operating_hours_end">Closes At</Label>
                  <Input
                    id="operating_hours_end"
                    type="time"
                    value={formData.operating_hours_end}
                    onChange={(e) => setFormData({...formData, operating_hours_end: e.target.value})}
                  />
                </div>
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-3 gap-4">
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="is_heated"
                      checked={formData.is_heated}
                      onCheckedChange={(checked) => setFormData({...formData, is_heated: checked})}
                    />
                    <Label htmlFor="is_heated">Heated Pool</Label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Switch
                      id="has_diving_board"
                      checked={formData.has_diving_board}
                      onCheckedChange={(checked) => setFormData({...formData, has_diving_board: checked})}
                    />
                    <Label htmlFor="has_diving_board">Diving Board</Label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Switch
                      id="has_slides"
                      checked={formData.has_slides}
                      onCheckedChange={(checked) => setFormData({...formData, has_slides: checked})}
                    />
                    <Label htmlFor="has_slides">Water Slides</Label>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="is_available"
                      checked={formData.is_available}
                      onCheckedChange={(checked) => setFormData({...formData, is_available: checked})}
                    />
                    <Label htmlFor="is_available">Available for Use</Label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Switch
                      id="is_closed_for_maintenance"
                      checked={formData.is_closed_for_maintenance}
                      onCheckedChange={(checked) => setFormData({...formData, is_closed_for_maintenance: checked})}
                    />
                    <Label htmlFor="is_closed_for_maintenance">Closed for Maintenance</Label>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({...formData, description: e.target.value})}
                    rows={2}
                  />
                </div>

                <div>
                  <Label htmlFor="safety_notes">Safety Notes</Label>
                  <Textarea
                    id="safety_notes"
                    value={formData.safety_notes}
                    onChange={(e) => setFormData({...formData, safety_notes: e.target.value})}
                    rows={2}
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-2 pt-4">
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit">
                  {editingPool ? 'Update Pool' : 'Create Pool'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {pools.map((pool) => (
          <Card key={pool.id} className="relative">
            <CardHeader className="pb-3">
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="text-lg flex items-center">
                    <Waves className="w-5 h-5 mr-2 text-blue-500" />
                    {pool.pool_name}
                  </CardTitle>
                  <CardDescription>
                    {pool.pool_type.charAt(0).toUpperCase() + pool.pool_type.slice(1)} Pool
                  </CardDescription>
                </div>
                <div className="flex space-x-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => openEditDialog(pool)}
                  >
                    <Edit className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDelete(pool.id)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex flex-wrap gap-2">
                <Badge variant={pool.is_available ? 'default' : 'secondary'}>
                  {pool.is_available ? 'Available' : 'Unavailable'}
                </Badge>
                {pool.is_closed_for_maintenance && <Badge variant="destructive">Maintenance</Badge>}
                {pool.is_heated && <Badge variant="outline">Heated</Badge>}
                {pool.has_diving_board && <Badge variant="outline">Diving Board</Badge>}
                {pool.has_slides && <Badge variant="outline">Water Slides</Badge>}
              </div>

              <div className="space-y-2 text-sm">
                <div className="flex items-center text-muted-foreground">
                  <Users className="w-4 h-4 mr-2" />
                  {pool.lane_count} lanes • Max {pool.capacity_max} people
                </div>
                <div className="flex items-center text-muted-foreground">
                  <Thermometer className="w-4 h-4 mr-2" />
                  Target: {pool.temperature_target}°F
                </div>
                <div className="flex items-center text-muted-foreground">
                  <Clock className="w-4 h-4 mr-2" />
                  {pool.operating_hours_start} - {pool.operating_hours_end}
                </div>
              </div>

              {pool.length_meters && pool.width_meters && (
                <div className="text-sm text-muted-foreground">
                  <strong>Dimensions:</strong> {pool.length_meters}m × {pool.width_meters}m
                </div>
              )}

              {pool.description && (
                <div className="text-sm text-muted-foreground">
                  <strong>Description:</strong> {pool.description}
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {pools.length === 0 && (
        <Card className="p-8 text-center">
          <CardContent>
            <Waves className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Pool Facilities Found</h3>
            <p className="text-muted-foreground mb-4">
              Get started by adding your first pool facility to the system.
            </p>
            <Button onClick={() => setIsDialogOpen(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Add First Pool
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}