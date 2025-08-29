import React, { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Calendar, Clock, User, Plus, Edit, CheckCircle, AlertCircle, Phone, Mail, MessageSquare } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { format, parseISO, isAfter, isBefore, addDays } from "date-fns";

const taskFormSchema = z.object({
  lead_id: z.string().min(1, "Please select a lead"),
  activity_type: z.enum(["call", "email", "text", "appointment", "tour", "follow_up"]),
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
  scheduled_at: z.string().min(1, "Please select a date and time"),
  priority: z.enum(["low", "medium", "high", "urgent"]),
  outcome: z.string().optional(),
  next_action: z.string().optional(),
});

type TaskFormValues = z.infer<typeof taskFormSchema>;

interface FollowUpTask {
  id: string;
  lead_id: string;
  activity_type: string;
  title: string;
  description?: string;
  scheduled_at: string;
  completed_at?: string;
  outcome?: string;
  next_action?: string;
  created_at: string;
  created_by: string;
  priority?: string;
  leads: {
    first_name: string;
    last_name: string;
    email: string;
    phone?: string;
    interest_level: string;
  };
  creator?: {
    first_name: string;
    last_name: string;
  };
}

interface Lead {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  interest_level: string;
}

export function FollowUpTasksManager() {
  const [tasks, setTasks] = useState<FollowUpTask[]>([]);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<FollowUpTask | null>(null);
  const [activeTab, setActiveTab] = useState("pending");
  const { profile } = useAuth();
  const { toast } = useToast();

  const form = useForm<TaskFormValues>({
    resolver: zodResolver(taskFormSchema),
    defaultValues: {
      activity_type: "call",
      priority: "medium",
    },
  });

  useEffect(() => {
    if (profile?.organization_id) {
      fetchTasks();
      fetchLeads();
    }
  }, [profile?.organization_id]);

  const fetchTasks = async () => {
    try {
      const { data, error } = await supabase
        .from("lead_activities")
        .select(`
          *,
          leads (first_name, last_name, email, phone, interest_level),
          creator:profiles!lead_activities_created_by_fkey (first_name, last_name)
        `)
        .eq("leads.organization_id", profile?.organization_id)
        .not("scheduled_at", "is", null)
        .order("scheduled_at", { ascending: true });

      if (error) throw error;
      setTasks((data as any[] || []).map(task => ({
        ...task,
        priority: task.priority || 'medium',
        creator: task.creator?.first_name ? task.creator : { first_name: 'Unknown', last_name: 'User' }
      })));
    } catch (error) {
      console.error("Error fetching tasks:", error);
      toast({
        title: "Error",
        description: "Failed to fetch follow-up tasks",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchLeads = async () => {
    try {
      const { data, error } = await supabase
        .from("leads")
        .select("id, first_name, last_name, email, interest_level")
        .eq("organization_id", profile?.organization_id)
        .eq("status", "lead")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setLeads(data || []);
    } catch (error) {
      console.error("Error fetching leads:", error);
    }
  };

  const onSubmit = async (values: TaskFormValues) => {
    try {
      if (editingTask) {
        const { error } = await supabase
          .from("lead_activities")
          .update({
            lead_id: values.lead_id,
            activity_type: values.activity_type,
            title: values.title,
            description: values.description,
            scheduled_at: values.scheduled_at,
            outcome: values.outcome,
            next_action: values.next_action,
          })
          .eq("id", editingTask.id);

        if (error) throw error;

        toast({
          title: "Success",
          description: "Follow-up task updated successfully",
        });
      } else {
        const { error } = await supabase
          .from("lead_activities")
          .insert({
            lead_id: values.lead_id,
            activity_type: values.activity_type,
            title: values.title,
            description: values.description,
            scheduled_at: values.scheduled_at,
            outcome: values.outcome,
            next_action: values.next_action,
            created_by: profile?.id,
          });

        if (error) throw error;

        toast({
          title: "Success",
          description: "Follow-up task created successfully",
        });
      }

      setIsDialogOpen(false);
      setEditingTask(null);
      form.reset();
      fetchTasks();
    } catch (error) {
      console.error("Error saving task:", error);
      toast({
        title: "Error",
        description: "Failed to save follow-up task",
        variant: "destructive",
      });
    }
  };

  const completeTask = async (taskId: string, outcome: string, nextAction?: string) => {
    try {
      const { error } = await supabase
        .from("lead_activities")
        .update({ 
          completed_at: new Date().toISOString(),
          outcome,
          next_action: nextAction 
        })
        .eq("id", taskId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Task completed successfully",
      });

      fetchTasks();
    } catch (error) {
      console.error("Error completing task:", error);
      toast({
        title: "Error",
        description: "Failed to complete task",
        variant: "destructive",
      });
    }
  };

  const handleEdit = (task: FollowUpTask) => {
    setEditingTask(task);
    form.reset({
      lead_id: task.lead_id,
      activity_type: task.activity_type as any,
      title: task.title,
      description: task.description || "",
      scheduled_at: task.scheduled_at,
      priority: task.priority as any,
      outcome: task.outcome || "",
      next_action: task.next_action || "",
    });
    setIsDialogOpen(true);
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case "call": return <Phone className="h-4 w-4" />;
      case "email": return <Mail className="h-4 w-4" />;
      case "text": return <MessageSquare className="h-4 w-4" />;
      case "appointment": return <Calendar className="h-4 w-4" />;
      case "tour": return <User className="h-4 w-4" />;
      default: return <Clock className="h-4 w-4" />;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "urgent": return "bg-red-500 text-white";
      case "high": return "bg-orange-500 text-white";
      case "medium": return "bg-blue-500 text-white";
      default: return "bg-gray-500 text-white";
    }
  };

  const getInterestLevelColor = (level: string) => {
    switch (level) {
      case "hot": return "text-red-600";
      case "warm": return "text-orange-600";
      default: return "text-gray-600";
    }
  };

  const isOverdue = (scheduledAt: string) => {
    return isBefore(parseISO(scheduledAt), new Date());
  };

  const isToday = (scheduledAt: string) => {
    const today = new Date();
    const scheduled = parseISO(scheduledAt);
    return format(today, "yyyy-MM-dd") === format(scheduled, "yyyy-MM-dd");
  };

  const filterTasks = (status: string) => {
    switch (status) {
      case "pending":
        return tasks.filter(t => !t.completed_at);
      case "completed":
        return tasks.filter(t => !!t.completed_at);
      case "overdue":
        return tasks.filter(t => !t.completed_at && isOverdue(t.scheduled_at));
      case "today":
        return tasks.filter(t => !t.completed_at && isToday(t.scheduled_at));
      default:
        return tasks;
    }
  };

  const pendingTasks = filterTasks("pending");
  const overdueTasks = filterTasks("overdue");
  const todayTasks = filterTasks("today");
  const completedTasks = filterTasks("completed");

  if (loading) {
    return <div className="flex justify-center p-8">Loading follow-up tasks...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Follow-Up Tasks</h2>
          <p className="text-muted-foreground">
            Manage and track follow-up activities with leads
          </p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => {
              setEditingTask(null);
              form.reset();
            }}>
              <Plus className="h-4 w-4 mr-2" />
              Create Task
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>
                {editingTask ? "Edit Task" : "Create Follow-Up Task"}
              </DialogTitle>
              <DialogDescription>
                Schedule a follow-up activity with a lead
              </DialogDescription>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="lead_id"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Lead</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a lead" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {leads.map((lead) => (
                            <SelectItem key={lead.id} value={lead.id}>
                              {lead.first_name} {lead.last_name} - {lead.email}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="activity_type"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Activity Type</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select type" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="call">Phone Call</SelectItem>
                            <SelectItem value="email">Email</SelectItem>
                            <SelectItem value="text">Text Message</SelectItem>
                            <SelectItem value="appointment">Appointment</SelectItem>
                            <SelectItem value="tour">Facility Tour</SelectItem>
                            <SelectItem value="follow_up">General Follow-up</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="priority"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Priority</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select priority" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="low">Low</SelectItem>
                            <SelectItem value="medium">Medium</SelectItem>
                            <SelectItem value="high">High</SelectItem>
                            <SelectItem value="urgent">Urgent</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Title</FormLabel>
                      <FormControl>
                        <Input placeholder="Follow up on gym membership interest" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="scheduled_at"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Scheduled Date & Time</FormLabel>
                      <FormControl>
                        <Input type="datetime-local" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Additional details about this follow-up..."
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {editingTask && (
                  <>
                    <FormField
                      control={form.control}
                      name="outcome"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Outcome</FormLabel>
                          <FormControl>
                            <Textarea
                              placeholder="What was the result of this activity?"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="next_action"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Next Action</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="What should be done next?"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </>
                )}

                <div className="flex justify-end space-x-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsDialogOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button type="submit">
                    {editingTask ? "Update Task" : "Create Task"}
                  </Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Task Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold">{pendingTasks.length}</div>
                <div className="text-sm text-muted-foreground">Pending</div>
              </div>
              <Clock className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold text-red-600">{overdueTasks.length}</div>
                <div className="text-sm text-muted-foreground">Overdue</div>
              </div>
              <AlertCircle className="h-8 w-8 text-red-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold text-orange-600">{todayTasks.length}</div>
                <div className="text-sm text-muted-foreground">Due Today</div>
              </div>
              <Calendar className="h-8 w-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold text-green-600">{completedTasks.length}</div>
                <div className="text-sm text-muted-foreground">Completed</div>
              </div>
              <CheckCircle className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tasks List */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="pending">Pending ({pendingTasks.length})</TabsTrigger>
          <TabsTrigger value="overdue">Overdue ({overdueTasks.length})</TabsTrigger>
          <TabsTrigger value="today">Today ({todayTasks.length})</TabsTrigger>
          <TabsTrigger value="completed">Completed ({completedTasks.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="pending">
          <TasksList 
            tasks={pendingTasks} 
            onEdit={handleEdit} 
            onComplete={completeTask}
            getActivityIcon={getActivityIcon}
            getPriorityColor={getPriorityColor}
            getInterestLevelColor={getInterestLevelColor}
            isOverdue={isOverdue}
          />
        </TabsContent>

        <TabsContent value="overdue">
          <TasksList 
            tasks={overdueTasks} 
            onEdit={handleEdit} 
            onComplete={completeTask}
            getActivityIcon={getActivityIcon}
            getPriorityColor={getPriorityColor}
            getInterestLevelColor={getInterestLevelColor}
            isOverdue={isOverdue}
          />
        </TabsContent>

        <TabsContent value="today">
          <TasksList 
            tasks={todayTasks} 
            onEdit={handleEdit} 
            onComplete={completeTask}
            getActivityIcon={getActivityIcon}
            getPriorityColor={getPriorityColor}
            getInterestLevelColor={getInterestLevelColor}
            isOverdue={isOverdue}
          />
        </TabsContent>

        <TabsContent value="completed">
          <TasksList 
            tasks={completedTasks} 
            onEdit={handleEdit} 
            onComplete={completeTask}
            getActivityIcon={getActivityIcon}
            getPriorityColor={getPriorityColor}
            getInterestLevelColor={getInterestLevelColor}
            isOverdue={isOverdue}
            showCompleted
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}

interface TasksListProps {
  tasks: FollowUpTask[];
  onEdit: (task: FollowUpTask) => void;
  onComplete: (taskId: string, outcome: string, nextAction?: string) => void;
  getActivityIcon: (type: string) => React.ReactNode;
  getPriorityColor: (priority: string) => string;
  getInterestLevelColor: (level: string) => string;
  isOverdue: (scheduledAt: string) => boolean;
  showCompleted?: boolean;
}

function TasksList({ 
  tasks, 
  onEdit, 
  onComplete, 
  getActivityIcon, 
  getPriorityColor, 
  getInterestLevelColor, 
  isOverdue,
  showCompleted 
}: TasksListProps) {
  const [completing, setCompleting] = useState<string | null>(null);
  const [outcome, setOutcome] = useState("");
  const [nextAction, setNextAction] = useState("");

  if (tasks.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <Clock className="h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">No tasks found</h3>
          <p className="text-muted-foreground text-center">
            {showCompleted ? "No completed tasks yet" : "No pending tasks at the moment"}
          </p>
        </CardContent>
      </Card>
    );
  }

  const handleComplete = (taskId: string) => {
    onComplete(taskId, outcome, nextAction);
    setCompleting(null);
    setOutcome("");
    setNextAction("");
  };

  return (
    <div className="space-y-4">
      {tasks.map((task) => (
        <Card key={task.id} className={`${isOverdue(task.scheduled_at) && !task.completed_at ? 'border-red-200 bg-red-50' : ''}`}>
          <CardContent className="p-4">
            <div className="flex items-start justify-between">
              <div className="flex items-start space-x-3 flex-1">
                <div className="p-2 bg-muted rounded-full">
                  {getActivityIcon(task.activity_type)}
                </div>
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-1">
                    <h4 className="font-medium">{task.title}</h4>
                    <Badge className={`px-2 py-1 ${getPriorityColor(task.priority)}`}>
                      {task.priority}
                    </Badge>
                    <Badge variant="outline" className={getInterestLevelColor(task.leads.interest_level)}>
                      {task.leads.interest_level}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground mb-2">
                    <strong>{task.leads.first_name} {task.leads.last_name}</strong> - {task.leads.email}
                  </p>
                  {task.description && (
                    <p className="text-sm text-muted-foreground mb-2">{task.description}</p>
                  )}
                  <div className="flex items-center space-x-4 text-xs text-muted-foreground">
                    <span className={isOverdue(task.scheduled_at) && !task.completed_at ? 'text-red-600 font-medium' : ''}>
                      <Calendar className="h-3 w-3 inline mr-1" />
                      {format(parseISO(task.scheduled_at), "MMM d, yyyy 'at' h:mm a")}
                      {isOverdue(task.scheduled_at) && !task.completed_at && " (Overdue)"}
                    </span>
                    <span>
                      By {task.creator.first_name} {task.creator.last_name}
                    </span>
                  </div>
                  {task.outcome && (
                    <div className="mt-3 p-3 bg-muted rounded-lg">
                      <p className="text-sm">
                        <strong>Outcome:</strong> {task.outcome}
                      </p>
                      {task.next_action && (
                        <p className="text-sm mt-1">
                          <strong>Next Action:</strong> {task.next_action}
                        </p>
                      )}
                    </div>
                  )}
                </div>
              </div>
              
              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onEdit(task)}
                >
                  <Edit className="h-4 w-4" />
                </Button>
                
                {!task.completed_at && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCompleting(task.id)}
                    className="text-green-600 hover:text-green-700"
                  >
                    <CheckCircle className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>

            {completing === task.id && (
              <div className="mt-4 p-4 border rounded-lg bg-background">
                <h5 className="font-medium mb-3">Complete Task</h5>
                <div className="space-y-3">
                  <div>
                    <label className="text-sm font-medium">Outcome</label>
                    <Textarea
                      value={outcome}
                      onChange={(e) => setOutcome(e.target.value)}
                      placeholder="What was the result of this follow-up?"
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Next Action (Optional)</label>
                    <Input
                      value={nextAction}
                      onChange={(e) => setNextAction(e.target.value)}
                      placeholder="What should be done next?"
                      className="mt-1"
                    />
                  </div>
                  <div className="flex justify-end space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCompleting(null)}
                    >
                      Cancel
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => handleComplete(task.id)}
                      disabled={!outcome.trim()}
                    >
                      Complete Task
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}