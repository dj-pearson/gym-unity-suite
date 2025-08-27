import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Clock, MapPin, Users, User, Calendar } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';

interface ClassData {
  id: string;
  name: string;
  description?: string;
  duration_minutes: number;
  max_capacity: number;
  scheduled_at: string;
  category: {
    name: string;
    color: string;
  } | null;
  instructor: {
    id: string;
    first_name?: string;
    last_name?: string;
    email: string;
    avatar_url?: string;
  } | null;
  location: {
    name: string;
  };
  bookings: Array<{
    id: string;
    status: string;
    member_id: string;
    member: {
      first_name?: string;
      last_name?: string;
      email: string;
    };
  }>;
}

interface MemberBookingDialogProps {
  isOpen: boolean;
  onClose: () => void;
  classData: ClassData;
  onBookingChange: () => void;
}

export default function MemberBookingDialog({ 
  isOpen, 
  onClose, 
  classData, 
  onBookingChange 
}: MemberBookingDialogProps) {
  const { profile } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  const isBooked = classData.bookings.some(
    booking => booking.member_id === profile?.id && booking.status === 'booked'
  );
  const availableSpots = classData.max_capacity - classData.bookings.filter(b => b.status === 'booked').length;
  const isPastClass = new Date(classData.scheduled_at) < new Date();

  const handleBooking = async () => {
    if (!profile?.id) return;

    try {
      setLoading(true);

      if (isBooked) {
        // Cancel booking
        const { error } = await supabase
          .from('class_bookings')
          .delete()
          .eq('class_id', classData.id)
          .eq('member_id', profile.id)
          .eq('status', 'booked');

        if (error) throw error;

        toast({
          title: "Booking Cancelled",
          description: "You have successfully cancelled your booking",
        });
      } else {
        // Create booking
        const { error } = await supabase
          .from('class_bookings')
          .insert({
            class_id: classData.id,
            member_id: profile.id,
            status: 'booked'
          });

        if (error) throw error;

        toast({
          title: "Booking Confirmed",
          description: "You have successfully booked this class",
        });
      }

      onBookingChange();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to process booking",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getInstructorName = () => {
    if (!classData.instructor) return 'No Instructor';
    if (classData.instructor.first_name && classData.instructor.last_name) {
      return `${classData.instructor.first_name} ${classData.instructor.last_name}`;
    }
    return classData.instructor.email;
  };

  const getInstructorInitials = () => {
    if (!classData.instructor) return 'NI';
    if (classData.instructor.first_name && classData.instructor.last_name) {
      return `${classData.instructor.first_name[0]}${classData.instructor.last_name[0]}`.toUpperCase();
    }
    return classData.instructor.email[0].toUpperCase();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">{classData.name}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Class Category */}
          {classData.category && (
            <Badge 
              variant="outline" 
              className="w-fit"
              style={{ 
                borderColor: classData.category.color,
                color: classData.category.color 
              }}
            >
              {classData.category.name}
            </Badge>
          )}

          {/* Description */}
          {classData.description && (
            <p className="text-muted-foreground">{classData.description}</p>
          )}

          {/* Class Details */}
          <div className="space-y-3">
            <div className="flex items-center text-sm">
              <Calendar className="mr-2 h-4 w-4 text-muted-foreground" />
              <span>{format(new Date(classData.scheduled_at), 'PPP')}</span>
            </div>

            <div className="flex items-center text-sm">
              <Clock className="mr-2 h-4 w-4 text-muted-foreground" />
              <span>
                {format(new Date(classData.scheduled_at), 'p')} 
                ({classData.duration_minutes} minutes)
              </span>
            </div>

            <div className="flex items-center text-sm">
              <MapPin className="mr-2 h-4 w-4 text-muted-foreground" />
              <span>{classData.location.name}</span>
            </div>

            <div className="flex items-center text-sm">
              <Users className="mr-2 h-4 w-4 text-muted-foreground" />
              <span>
                {availableSpots} spots available ({classData.bookings.filter(b => b.status === 'booked').length}/{classData.max_capacity})
              </span>
            </div>
          </div>

          {/* Instructor */}
          <div className="flex items-center space-x-3 p-3 bg-muted rounded-lg">
            <Avatar className="h-10 w-10">
              <AvatarImage src={classData.instructor?.avatar_url} />
              <AvatarFallback className="bg-gradient-primary text-white text-sm">
                {getInstructorInitials()}
              </AvatarFallback>
            </Avatar>
            <div>
              <div className="flex items-center text-sm font-medium">
                <User className="mr-1 h-3 w-3 text-muted-foreground" />
                {getInstructorName()}
              </div>
              <p className="text-xs text-muted-foreground">Instructor</p>
            </div>
          </div>

          {/* Booking Status */}
          <div className="p-3 bg-card border rounded-lg">
            {isBooked ? (
              <div className="text-center">
                <div className="text-success font-medium mb-1">✓ You're booked for this class</div>
                <p className="text-sm text-muted-foreground">
                  You can cancel your booking up until the class starts
                </p>
              </div>
            ) : availableSpots === 0 ? (
              <div className="text-center">
                <div className="text-destructive font-medium mb-1">Class is full</div>
                <p className="text-sm text-muted-foreground">
                  All spots for this class have been taken
                </p>
              </div>
            ) : isPastClass ? (
              <div className="text-center">
                <div className="text-muted-foreground font-medium mb-1">Class has ended</div>
                <p className="text-sm text-muted-foreground">
                  This class is no longer available for booking
                </p>
              </div>
            ) : (
              <div className="text-center">
                <div className="text-foreground font-medium mb-1">Ready to book?</div>
                <p className="text-sm text-muted-foreground">
                  Secure your spot in this class
                </p>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end space-x-2 pt-2">
            <Button variant="outline" onClick={onClose}>
              Close
            </Button>
            
            {!isPastClass && (
              <Button
                onClick={handleBooking}
                disabled={loading || (!isBooked && availableSpots === 0)}
                variant={isBooked ? "destructive" : "default"}
                className={!isBooked ? "bg-gradient-secondary hover:opacity-90" : ""}
              >
                {loading ? 'Processing...' : isBooked ? 'Cancel Booking' : 'Book Class'}
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}