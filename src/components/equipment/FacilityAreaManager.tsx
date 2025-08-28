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
import { Progress } from '@/components/ui/progress';
import { 
  Plus, 
  Search, 
  Edit, 
  Trash2, 
  Building, 
  Users, 
  Square,
  Calendar,
  Thermometer,
  AlertTriangle,
  CheckCircle2
} from 'lucide-react';
import { format } from 'date-fns';

interface FacilityArea {
  id: string;
  location_id: string;
  name: string;
  area_type: string;
  square_footage?: number;
  max_capacity?: number;
  equipment_count: number;
  cleaning_frequency: string;
  last_cleaned?: string;
  temperature_range?: string;
  special_requirements?: string;
  safety_notes?: string;
  created_at: string;
  locations?: {
    name: string;
  };
}

interface Location {
  id: string;
  name: string;
}

export default function FacilityAreaManager() {
  const { profile } = useAuth();
  const { toast } = useToast();
  const [areas, setAreas] = useState<FacilityArea[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [editingArea, setEditingArea] = useState<FacilityArea | null>(null);

  const [formData, setFormData] = useState({
    location_id: '',
    name: '',
    area_type: 'general',
    square_footage: '',
    max_capacity: '',
    cleaning_frequency: 'daily',
    temperature_range: '',
    special_requirements: '',
    safety_notes: ''
  });

  useEffect(() => {
    if (profile?.organization_id) {
      fetchData();
    }
  }, [profile]);

  const fetchData = async () => {
    try {
      // Fetch facility areas with location info
      const { data: areasData, error: areasError } = await supabase
        .from('facility_areas')
        .select(`
          *,
          locations:location_id (
            name
          )
        `)
        .eq('organization_id', profile?.organization_id)
        .order('created_at', { ascending: false });

      if (areasError) throw areasError;

      // Fetch locations for dropdown
      const { data: locationsData, error: locationsError } = await supabase
        .from('locations')
        .select('id, name')
        .eq('organization_id', profile?.organization_id)
        .order('name');

      if (locationsError) throw locationsError;

      setAreas(areasData || []);
      setLocations(locationsData || []);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast({
        title: "Error",
        description: "Failed to fetch facility areas",
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
      const areaData = {
        ...formData,
        organization_id: profile.organization_id,
        square_footage: formData.square_footage ? parseInt(formData.square_footage) : null,
        max_capacity: formData.max_capacity ? parseInt(formData.max_capacity) : null
      };

      let error;
      if (editingArea) {
        const { error: updateError } = await supabase
          .from('facility_areas')
          .update(areaData)
          .eq('id', editingArea.id);
        error = updateError;
      } else {
        const { error: insertError } = await supabase
          .from('facility_areas')
          .insert([areaData]);
        error = insertError;
      }

      if (error) throw error;

      toast({
        title: editingArea ? "Area Updated" : "Area Added",
        description: `${formData.name} has been ${editingArea ? 'updated' : 'added'} successfully.`
      });

      setShowAddDialog(false);
      setEditingArea(null);
      resetForm();
      fetchData();
    } catch (error) {
      console.error('Error saving area:', error);
      toast({
        title: "Error",
        description: "Failed to save facility area",
        variant: "destructive"
      });
    }
  };

  const handleEdit = (area: FacilityArea) => {
    setEditingArea(area);
    setFormData({
      location_id: area.location_id,
      name: area.name,
      area_type: area.area_type,
      square_footage: area.square_footage?.toString() || '',
      max_capacity: area.max_capacity?.toString() || '',
      cleaning_frequency: area.cleaning_frequency,
      temperature_range: area.temperature_range || '',
      special_requirements: area.special_requirements || '',
      safety_notes: area.safety_notes || ''
    });
    setShowAddDialog(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this facility area?')) return;

    try {
      const { error } = await supabase
        .from('facility_areas')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast({
        title: "Area Deleted",
        description: "Facility area has been removed successfully."
      });

      fetchData();
    } catch (error) {
      console.error('Error deleting area:', error);
      toast({
        title: "Error",
        description: "Failed to delete facility area",
        variant: "destructive"
      });
    }
  };

  const resetForm = () => {
    setFormData({
      location_id: '',
      name: '',
      area_type: 'general',
      square_footage: '',
      max_capacity: '',
      cleaning_frequency: 'daily',
      temperature_range: '',
      special_requirements: '',
      safety_notes: ''
    });
  };

  const getAreaTypeBadge = (type: string) => {
    const types = {
      general: { label: 'General', color: 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200' },
      cardio: { label: 'Cardio', color: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200' },
      strength: { label: 'Strength', color: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200' },
      class_room: { label: 'Class Room', color: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' },
      locker_room: { label: 'Locker Room', color: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200' },
      pool: { label: 'Pool', color: 'bg-cyan-100 text-cyan-800 dark:bg-cyan-900 dark:text-cyan-200' },
      sauna: { label: 'Sauna', color: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200' }
    };

    const config = types[type as keyof typeof types] || types.general;
    return (
      <Badge variant="outline" className={config.color}>
        {config.label}
      </Badge>
    );
  };

  const getCleaningStatus = (frequency: string, lastCleaned?: string) => {
    if (!lastCleaned) {
      return { status: 'overdue', label: 'Not cleaned', color: 'bg-red-100 text-red-800' };
    }

    const last = new Date(lastCleaned);
    const now = new Date();
    const hoursSince = (now.getTime() - last.getTime()) / (1000 * 60 * 60);

    let threshold = 24; // daily default
    if (frequency === 'weekly') threshold = 24 * 7;
    else if (frequency === 'monthly') threshold = 24 * 30;

    if (hoursSince > threshold) {
      return { status: 'overdue', label: 'Overdue', color: 'bg-red-100 text-red-800' };
    } else if (hoursSince > threshold * 0.8) {
      return { status: 'due_soon', label: 'Due Soon', color: 'bg-yellow-100 text-yellow-800' };
    } else {
      return { status: 'current', label: 'Current', color: 'bg-green-100 text-green-800' };
    }
  };

  const getUtilizationLevel = (maxCapacity?: number) => {
    if (!maxCapacity) return null;
    
    // Simulate current usage (in real app, this would come from check-ins)
    const currentUsage = Math.floor(Math.random() * maxCapacity);
    const percentage = (currentUsage / maxCapacity) * 100;
    
    return {
      current: currentUsage,
      max: maxCapacity,
      percentage: Math.round(percentage)
    };
  };

  const filteredAreas = areas.filter(area => {
    const matchesSearch = area.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = filterType === 'all' || area.area_type === filterType;
    
    return matchesSearch && matchesType;
  });

  if (loading) {
    return <div className="flex justify-center p-4">Loading facility areas...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Header Actions */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search areas..."
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
              <SelectItem value="general">General</SelectItem>
              <SelectItem value="cardio">Cardio</SelectItem>
              <SelectItem value="strength">Strength</SelectItem>
              <SelectItem value="class_room">Class Room</SelectItem>
              <SelectItem value="locker_room">Locker Room</SelectItem>
              <SelectItem value="pool">Pool</SelectItem>
              <SelectItem value="sauna">Sauna</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
          <DialogTrigger asChild>
            <Button onClick={() => { resetForm(); setEditingArea(null); }}>
              <Plus className="w-4 h-4 mr-2" />
              Add Area
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingArea ? 'Edit Facility Area' : 'Add New Facility Area'}
              </DialogTitle>
              <DialogDescription>
                {editingArea ? 'Update facility area information' : 'Add a new area to your facility'}
              </DialogDescription>
            </DialogHeader>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="location_id">Location *</Label>
                  <Select
                    value={formData.location_id}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, location_id: value }))}
                    required
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select location" />
                    </SelectTrigger>
                    <SelectContent>
                      {locations.map((location) => (
                        <SelectItem key={location.id} value={location.id}>
                          {location.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="name">Area Name *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="e.g., Main Gym Floor"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="area_type">Type</Label>
                  <Select
                    value={formData.area_type}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, area_type: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="general">General</SelectItem>
                      <SelectItem value="cardio">Cardio</SelectItem>
                      <SelectItem value="strength">Strength</SelectItem>
                      <SelectItem value="class_room">Class Room</SelectItem>
                      <SelectItem value="locker_room">Locker Room</SelectItem>
                      <SelectItem value="pool">Pool</SelectItem>
                      <SelectItem value="sauna">Sauna</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="cleaning_frequency">Cleaning Frequency</Label>
                  <Select
                    value={formData.cleaning_frequency}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, cleaning_frequency: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="daily">Daily</SelectItem>
                      <SelectItem value="weekly">Weekly</SelectItem>
                      <SelectItem value="monthly">Monthly</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="square_footage">Square Footage</Label>
                  <Input
                    id="square_footage"
                    type="number"
                    value={formData.square_footage}
                    onChange={(e) => setFormData(prev => ({ ...prev, square_footage: e.target.value }))}
                    placeholder="e.g., 2000"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="max_capacity">Max Capacity</Label>
                  <Input
                    id="max_capacity"
                    type="number"
                    value={formData.max_capacity}
                    onChange={(e) => setFormData(prev => ({ ...prev, max_capacity: e.target.value }))}
                    placeholder="e.g., 50"
                  />
                </div>

                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="temperature_range">Temperature Range</Label>
                  <Input
                    id="temperature_range"
                    value={formData.temperature_range}
                    onChange={(e) => setFormData(prev => ({ ...prev, temperature_range: e.target.value }))}
                    placeholder="e.g., 68-72°F"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="special_requirements">Special Requirements</Label>
                <Textarea
                  id="special_requirements"
                  value={formData.special_requirements}
                  onChange={(e) => setFormData(prev => ({ ...prev, special_requirements: e.target.value }))}
                  placeholder="Any special requirements for this area..."
                  rows={2}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="safety_notes">Safety Notes</Label>
                <Textarea
                  id="safety_notes"
                  value={formData.safety_notes}
                  onChange={(e) => setFormData(prev => ({ ...prev, safety_notes: e.target.value }))}
                  placeholder="Important safety information for this area..."
                  rows={2}
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
                  {editingArea ? 'Update Area' : 'Add Area'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Areas Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {filteredAreas.map((area) => {
          const cleaningStatus = getCleaningStatus(area.cleaning_frequency, area.last_cleaned);
          const utilization = getUtilizationLevel(area.max_capacity);
          
          return (
            <Card key={area.id} className="relative">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-lg">{area.name}</CardTitle>
                    <CardDescription className="flex items-center gap-2">
                      <Building className="w-4 h-4" />
                      {area.locations?.name}
                    </CardDescription>
                  </div>
                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleEdit(area)}
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(area.id)}
                      className="text-destructive hover:text-destructive"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-2">
                  {getAreaTypeBadge(area.area_type)}
                  <Badge variant="outline" className={cleaningStatus.color}>
                    <CheckCircle2 className="w-3 h-3 mr-1" />
                    {cleaningStatus.label}
                  </Badge>
                </div>

                {/* Area Stats */}
                <div className="grid grid-cols-2 gap-4 text-sm">
                  {area.square_footage && (
                    <div className="flex items-center gap-1">
                      <Square className="w-4 h-4 text-muted-foreground" />
                      <span className="text-muted-foreground">Size:</span>
                      <span>{area.square_footage.toLocaleString()} sq ft</span>
                    </div>
                  )}
                  
                  {area.max_capacity && (
                    <div className="flex items-center gap-1">
                      <Users className="w-4 h-4 text-muted-foreground" />
                      <span className="text-muted-foreground">Capacity:</span>
                      <span>{area.max_capacity}</span>
                    </div>
                  )}

                  {area.equipment_count > 0 && (
                    <div className="flex items-center gap-1">
                      <span className="text-muted-foreground">Equipment:</span>
                      <span>{area.equipment_count}</span>
                    </div>
                  )}

                  {area.temperature_range && (
                    <div className="flex items-center gap-1">
                      <Thermometer className="w-4 h-4 text-muted-foreground" />
                      <span className="text-muted-foreground">Temp:</span>
                      <span>{area.temperature_range}</span>
                    </div>
                  )}
                </div>

                {/* Current Utilization */}
                {utilization && (
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Current Usage</span>
                      <span>{utilization.current} / {utilization.max}</span>
                    </div>
                    <Progress value={utilization.percentage} className="h-2" />
                  </div>
                )}

                {/* Cleaning Schedule */}
                <div className="text-sm">
                  <div className="flex items-center gap-1 text-muted-foreground mb-1">
                    <Calendar className="w-4 h-4" />
                    Cleaning: {area.cleaning_frequency}
                  </div>
                  {area.last_cleaned && (
                    <div className="text-xs text-muted-foreground">
                      Last cleaned: {format(new Date(area.last_cleaned), 'MMM dd, yyyy')}
                    </div>
                  )}
                </div>

                {/* Safety/Special Notes */}
                {(area.safety_notes || area.special_requirements) && (
                  <div className="text-xs space-y-1">
                    {area.safety_notes && (
                      <div className="flex items-start gap-1 text-orange-600">
                        <AlertTriangle className="w-3 h-3 mt-0.5 flex-shrink-0" />
                        <span>{area.safety_notes}</span>
                      </div>
                    )}
                    {area.special_requirements && (
                      <div className="text-muted-foreground">
                        Requirements: {area.special_requirements}
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {filteredAreas.length === 0 && (
        <Card>
          <CardContent className="py-8">
            <div className="text-center text-muted-foreground">
              {searchTerm || filterType !== 'all'
                ? 'No facility areas found matching your filters.' 
                : 'No facility areas added yet. Click "Add Area" to get started.'}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}