import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { format, addDays, isWeekend } from 'date-fns';
import { Calendar as CalendarIcon, Clock, MapPin, Users, CheckCircle } from 'lucide-react';

interface OrientationSchedulingStepProps {
  onComplete: () => void;
}

const ORIENTATION_TYPES = [
  {
    id: 'gym_tour',
    title: 'Gym Tour & Equipment Introduction',
    duration: '30 minutes',
    description: 'Learn about all our facilities, equipment, and safety procedures',
    icon: MapPin
  },
  {
    id: 'personal_training',
    title: 'Personal Training Session',
    duration: '60 minutes', 
    description: 'One-on-one session with a trainer to assess your fitness and create a plan',
    icon: Users
  },
  {
    id: 'group_orientation',
    title: 'Group Orientation Class',
    duration: '45 minutes',
    description: 'Join other new members for a comprehensive gym introduction',
    icon: Users
  }
];

const TIME_SLOTS = [
  '9:00 AM', '10:00 AM', '11:00 AM', '12:00 PM',
  '1:00 PM', '2:00 PM', '3:00 PM', '4:00 PM',
  '5:00 PM', '6:00 PM', '7:00 PM', '8:00 PM'
];

export function OrientationSchedulingStep({ onComplete }: OrientationSchedulingStepProps) {
  const { profile } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  
  // Form state
  const [orientationType, setOrientationType] = useState('');
  const [selectedDate, setSelectedDate] = useState<Date>();
  const [selectedTime, setSelectedTime] = useState('');
  const [specialRequests, setSpecialRequests] = useState('');
  const [skipOrientation, setSkipOrientation] = useState(false);

  // Available dates (next 14 days, excluding weekends for some orientation types)
  const getAvailableDates = () => {
    const dates = [];
    for (let i = 1; i <= 14; i++) {
      const date = addDays(new Date(), i);
      // For personal training, include weekends; for others, weekdays only
      if (orientationType === 'personal_training' || !isWeekend(date)) {
        dates.push(date);
      }
    }
    return dates;
  };

  const handleSubmit = async () => {
    if (!skipOrientation && (!orientationType || !selectedDate || !selectedTime)) {
      toast({
        title: "Please complete all fields",
        description: "Orientation type, date, and time are required.",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    try {
      if (!skipOrientation) {
        const orientationData = {
          member_id: profile?.id,
          orientation_type: orientationType,
          scheduled_date: format(selectedDate!, 'yyyy-MM-dd'),
          scheduled_time: selectedTime,
          special_requests: specialRequests,
          status: 'scheduled',
          created_by: profile?.id
        };

        const { error } = await supabase
          .from('member_orientations')
          .insert([orientationData]);

        if (error) throw error;

        toast({
          title: "Orientation scheduled!",
          description: `Your ${ORIENTATION_TYPES.find(t => t.id === orientationType)?.title} is scheduled for ${format(selectedDate!, 'MMMM d, yyyy')} at ${selectedTime}.`
        });
      } else {
        toast({
          title: "Orientation skipped",
          description: "You can schedule an orientation anytime from your member dashboard."
        });
      }

      onComplete();
    } catch (error: any) {
      toast({
        title: "Error scheduling orientation",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  if (skipOrientation) {
    return (
      <div className="text-center space-y-6">
        <div className="w-16 h-16 bg-green-100 rounded-full mx-auto flex items-center justify-center mb-4">
          <CheckCircle className="w-8 h-8 text-green-600" />
        </div>
        
        <div>
          <h3 className="text-lg font-semibold mb-2">No problem!</h3>
          <p className="text-muted-foreground mb-4">
            You can always schedule an orientation later from your member dashboard. 
            Our staff is also available during gym hours to help you get familiar with our facilities.
          </p>
        </div>

        <div className="flex gap-3 justify-center">
          <Button variant="outline" onClick={() => setSkipOrientation(false)}>
            Actually, Let's Schedule
          </Button>
          <Button onClick={onComplete}>
            Continue to Member Card
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Orientation Types */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="w-5 h-5 text-primary" />
            Choose Your Orientation Type
          </CardTitle>
        </CardHeader>
        <CardContent>
          <RadioGroup value={orientationType} onValueChange={setOrientationType}>
            {ORIENTATION_TYPES.map((type) => {
              const Icon = type.icon;
              return (
                <div key={type.id} className="flex items-start space-x-3 p-4 rounded-lg border hover:bg-accent">
                  <RadioGroupItem value={type.id} id={type.id} className="mt-1" />
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <Icon className="w-4 h-4 text-primary" />
                      <Label htmlFor={type.id} className="font-medium cursor-pointer">
                        {type.title}
                      </Label>
                      <Badge variant="outline" className="text-xs">
                        {type.duration}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">{type.description}</p>
                  </div>
                </div>
              );
            })}
          </RadioGroup>
        </CardContent>
      </Card>

      {/* Date & Time Selection */}
      {orientationType && (
        <div className="grid md:grid-cols-2 gap-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <CalendarIcon className="w-4 h-4" />
                Select Date
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={setSelectedDate}
                disabled={(date) => 
                  date < new Date() || 
                  !getAvailableDates().some(d => d.toDateString() === date.toDateString())
                }
                className="rounded-md border"
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Clock className="w-4 h-4" />
                Select Time
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-2">
                {TIME_SLOTS.map((time) => (
                  <Button
                    key={time}
                    variant={selectedTime === time ? "default" : "outline"}
                    size="sm"
                    className="justify-start"
                    onClick={() => setSelectedTime(time)}
                  >
                    {time}
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Special Requests */}
      {orientationType && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Special Requests (Optional)</CardTitle>
          </CardHeader>
          <CardContent>
            <Textarea
              placeholder="Any specific areas you'd like to focus on or questions you have?"
              value={specialRequests}
              onChange={(e) => setSpecialRequests(e.target.value)}
            />
          </CardContent>
        </Card>
      )}

      {/* Confirmation Summary */}
      {orientationType && selectedDate && selectedTime && (
        <Card className="bg-primary/5 border-primary/20">
          <CardContent className="p-4">
            <h3 className="font-medium text-foreground mb-2">Orientation Summary</h3>
            <div className="space-y-1 text-sm text-muted-foreground">
              <p><strong>Type:</strong> {ORIENTATION_TYPES.find(t => t.id === orientationType)?.title}</p>
              <p><strong>Date:</strong> {format(selectedDate, 'EEEE, MMMM d, yyyy')}</p>
              <p><strong>Time:</strong> {selectedTime}</p>
              <p><strong>Duration:</strong> {ORIENTATION_TYPES.find(t => t.id === orientationType)?.duration}</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row gap-3 justify-center">
        <Button 
          variant="outline"
          onClick={() => setSkipOrientation(true)}
        >
          Skip Orientation For Now
        </Button>
        
        <Button 
          onClick={handleSubmit}
          disabled={loading || (!orientationType || !selectedDate || !selectedTime)}
        >
          {loading ? 'Scheduling...' : 'Schedule Orientation'}
        </Button>
      </div>
    </div>
  );
}