import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Calendar, Clock, DollarSign, Plus, Edit2, X, CheckCircle } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { format } from "date-fns";

interface SpaAppointment {
  id: string;
  service_id: string;
  member_id: string;
  therapist_id: string;
  appointment_date: string;
  start_time: string;
  end_time: string;
  duration_minutes: number;
  total_price: number;
  deposit_paid: number;
  payment_status: string;
  status: string;
  special_requests: string | null;
  spa_services: {
    service_name: string;
    service_category: string;
  };
  profiles: {
    first_name: string;
    last_name: string;
  };
}

const APPOINTMENT_STATUSES = [
  "scheduled",
  "confirmed", 
  "in_progress",
  "completed",
  "cancelled",
  "no_show"
];

const PAYMENT_STATUSES = [
  "pending",
  "partial",
  "paid", 
  "refunded"
];

export function SpaAppointmentManager() {
  const { profile } = useAuth();
  const queryClient = useQueryClient();
  const [selectedAppointment, setSelectedAppointment] = useState<SpaAppointment | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState(format(new Date(), "yyyy-MM-dd"));

  const { data: appointments = [], isLoading } = useQuery({
    queryKey: ["spa-appointments", profile?.organization_id, selectedDate],
    queryFn: async () => {
      if (!profile?.organization_id) return [];
      
      const { data, error } = await supabase
        .from("spa_appointments")
        .select(`
          *,
          spa_services (service_name, service_category),
          profiles!spa_appointments_member_id_fkey (first_name, last_name)
        `)
        .eq("organization_id", profile.organization_id)
        .eq("appointment_date", selectedDate)
        .order("start_time");

      if (error) throw error;
      return data as unknown as SpaAppointment[];
    },
    enabled: !!profile?.organization_id,
  });

  const { data: spaServices = [] } = useQuery({
    queryKey: ["spa-services", profile?.organization_id],
    queryFn: async () => {
      if (!profile?.organization_id) return [];
      
      const { data, error } = await supabase
        .from("spa_services")
        .select("id, service_name, duration_minutes, base_price")
        .eq("organization_id", profile.organization_id)
        .eq("is_active", true)
        .order("service_name");

      if (error) throw error;
      return data;
    },
    enabled: !!profile?.organization_id,
  });

  const { data: members = [] } = useQuery({
    queryKey: ["members", profile?.organization_id],
    queryFn: async () => {
      if (!profile?.organization_id) return [];
      
      const { data, error } = await supabase
        .from("profiles")
        .select("id, first_name, last_name, email")
        .eq("organization_id", profile.organization_id)
        .eq("role", "member")
        .order("first_name");

      if (error) throw error;
      return data;
    },
    enabled: !!profile?.organization_id,
  });

  const { data: therapists = [] } = useQuery({
    queryKey: ["therapists", profile?.organization_id],
    queryFn: async () => {
      if (!profile?.organization_id) return [];
      
      const { data, error } = await supabase
        .from("profiles")
        .select("id, first_name, last_name")
        .eq("organization_id", profile.organization_id)
        .in("role", ["staff", "trainer"])
        .order("first_name");

      if (error) throw error;
      return data;
    },
    enabled: !!profile?.organization_id,
  });

  const updateAppointmentMutation = useMutation({
    mutationFn: async ({ id, ...appointmentData }: Partial<SpaAppointment> & { id: string }) => {
      const { data, error } = await supabase
        .from("spa_appointments")
        .update(appointmentData)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["spa-appointments"] });
      toast.success("Appointment updated successfully");
      setIsDialogOpen(false);
      setSelectedAppointment(null);
    },
    onError: (error) => {
      toast.error(`Failed to update appointment: ${error.message}`);
    },
  });

  const updateAppointmentStatus = (appointmentId: string, status: string) => {
    updateAppointmentMutation.mutate({ id: appointmentId, status });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "confirmed": return "bg-blue-500";
      case "in_progress": return "bg-yellow-500";
      case "completed": return "bg-green-500";
      case "cancelled": return "bg-red-500";
      case "no_show": return "bg-gray-500";
      default: return "bg-gray-300";
    }
  };

  const getPaymentStatusColor = (status: string) => {
    switch (status) {
      case "paid": return "bg-green-500";
      case "partial": return "bg-yellow-500";
      case "refunded": return "bg-blue-500";
      default: return "bg-gray-300";
    }
  };

  if (isLoading) {
    return <div>Loading appointments...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Spa Appointments</h2>
          <p className="text-muted-foreground">Manage spa and wellness appointments</p>
        </div>
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <Label htmlFor="appointment-date">Date:</Label>
            <Input
              id="appointment-date"
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="w-40"
            />
          </div>
        </div>
      </div>

      {appointments.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-8">
            <Calendar className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium">No appointments scheduled</h3>
            <p className="text-muted-foreground text-center">
              No spa appointments found for {format(new Date(selectedDate), "MMMM d, yyyy")}
            </p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Appointments for {format(new Date(selectedDate), "MMMM d, yyyy")}</CardTitle>
            <CardDescription>
              {appointments.length} appointment{appointments.length !== 1 ? 's' : ''} scheduled
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Time</TableHead>
                  <TableHead>Service</TableHead>
                  <TableHead>Client</TableHead>
                  <TableHead>Therapist</TableHead>
                  <TableHead>Duration</TableHead>
                  <TableHead>Price</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Payment</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {appointments.map((appointment) => (
                  <TableRow key={appointment.id}>
                    <TableCell className="font-medium">
                      <div className="flex items-center">
                        <Clock className="h-4 w-4 mr-2" />
                        {appointment.start_time.slice(0, 5)} - {appointment.end_time.slice(0, 5)}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium">{appointment.spa_services.service_name}</p>
                        <p className="text-sm text-muted-foreground">
                          {appointment.spa_services.service_category}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>
                      {appointment.profiles.first_name} {appointment.profiles.last_name}
                    </TableCell>
                    <TableCell>
                      {/* TODO: Show therapist name - need to join therapist profile */}
                      Therapist
                    </TableCell>
                    <TableCell>{appointment.duration_minutes}m</TableCell>
                    <TableCell>${appointment.total_price}</TableCell>
                    <TableCell>
                      <Badge className={`text-white ${getStatusColor(appointment.status)}`}>
                        {appointment.status.replace("_", " ").toUpperCase()}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge className={`text-white ${getPaymentStatusColor(appointment.payment_status)}`}>
                        {appointment.payment_status.toUpperCase()}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-1">
                        {appointment.status === "scheduled" && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => updateAppointmentStatus(appointment.id, "confirmed")}
                          >
                            <CheckCircle className="h-4 w-4" />
                          </Button>
                        )}
                        {appointment.status === "confirmed" && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => updateAppointmentStatus(appointment.id, "in_progress")}
                          >
                            Start
                          </Button>
                        )}
                        {appointment.status === "in_progress" && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => updateAppointmentStatus(appointment.id, "completed")}
                          >
                            Complete
                          </Button>
                        )}
                        {!["completed", "cancelled", "no_show"].includes(appointment.status) && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => updateAppointmentStatus(appointment.id, "cancelled")}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center">
              <Calendar className="h-5 w-5 mr-2" />
              Today's Stats
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span>Total Appointments:</span>
                <span className="font-medium">{appointments.length}</span>
              </div>
              <div className="flex justify-between">
                <span>Completed:</span>
                <span className="font-medium text-green-600">
                  {appointments.filter(a => a.status === "completed").length}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Cancelled:</span>
                <span className="font-medium text-red-600">
                  {appointments.filter(a => a.status === "cancelled").length}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Revenue:</span>
                <span className="font-medium">
                  ${appointments
                    .filter(a => a.payment_status === "paid")
                    .reduce((sum, a) => sum + a.total_price, 0)
                    .toFixed(2)}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}