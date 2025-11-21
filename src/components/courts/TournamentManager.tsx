import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Trophy, Plus, Edit, Trash2, Users, Calendar, DollarSign, Medal, UserPlus } from 'lucide-react';
import { format } from 'date-fns';
import { getStatusColor } from '@/lib/colorUtils';

interface Tournament {
  id: string;
  tournament_name: string;
  sport: string;
  tournament_type: string;
  status: string;
  description?: string;
  rules?: string;
  tournament_start_date: string;
  tournament_end_date: string;
  registration_deadline?: string;
  max_participants?: number;
  entry_fee: number;
  prize_pool: number;
  winner_id?: string;
  runner_up_id?: string;
  contact_info?: string;
  created_at: string;
  participant_count?: number;
}

interface TournamentParticipant {
  id: string;
  tournament_id: string;
  member_id: string;
  registration_date: string;
  seed_number?: number;
  status: string;
  member_name?: string;
  member_email?: string;
}

interface TournamentMatch {
  id: string;
  tournament_id: string;
  round_number: number;
  match_number: number;
  player1_id?: string;
  player2_id?: string;
  winner_id?: string;
  court_id?: string;
  scheduled_at?: string;
  score?: string;
  status: string;
  player1_name?: string;
  player2_name?: string;
}

export default function TournamentManager() {
  const { profile } = useAuth();
  const { toast } = useToast();
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [participants, setParticipants] = useState<TournamentParticipant[]>([]);
  const [matches, setMatches] = useState<TournamentMatch[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [participantDialogOpen, setParticipantDialogOpen] = useState(false);
  const [editingTournament, setEditingTournament] = useState<Tournament | null>(null);
  const [selectedTournament, setSelectedTournament] = useState<Tournament | null>(null);
  const [members, setMembers] = useState<any[]>([]);

  const [formData, setFormData] = useState({
    tournament_name: '',
    sport: '',
    tournament_type: 'single_elimination',
    description: '',
    rules: '',
    tournament_start_date: '',
    tournament_end_date: '',
    registration_deadline: '',
    max_participants: '',
    entry_fee: '',
    prize_pool: '',
    contact_info: ''
  });

  const [participantForm, setParticipantForm] = useState({
    member_id: '',
    seed_number: ''
  });

  useEffect(() => {
    if (profile?.organization_id) {
      fetchTournaments();
      fetchMembers();
    }
  }, [profile?.organization_id]);

  const fetchTournaments = async () => {
    if (!profile?.organization_id) return;

    try {
      const { data, error } = await supabase
        .from('tournaments')
        .select(`
          *,
          tournament_participants(count)
        `)
        .eq('organization_id', profile.organization_id)
        .order('tournament_start_date', { ascending: true });

      if (error) throw error;

      const tournamentsWithCounts = data?.map(tournament => ({
        ...tournament,
        participant_count: tournament.tournament_participants?.length || 0
      })) || [];

      setTournaments(tournamentsWithCounts);
    } catch (error) {
      console.error('Error fetching tournaments:', error);
      toast({
        title: "Error",
        description: "Failed to fetch tournaments",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchMembers = async () => {
    if (!profile?.organization_id) return;

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, first_name, last_name, email')
        .eq('organization_id', profile.organization_id)
        .eq('role', 'member')
        .order('first_name');

      if (error) throw error;
      setMembers(data || []);
    } catch (error) {
      console.error('Error fetching members:', error);
    }
  };

  const fetchParticipants = async (tournamentId: string) => {
    try {
      const { data, error } = await supabase
        .from('tournament_participants')
        .select(`
          *,
          profiles!tournament_participants_member_id_fkey(first_name, last_name, email)
        `)
        .eq('tournament_id', tournamentId)
        .order('registration_date');

      if (error) throw error;

      const participantsWithNames = data?.map((participant: any) => ({
        ...participant,
        member_name: participant.profiles ? `${participant.profiles.first_name} ${participant.profiles.last_name}` : '',
        member_email: participant.profiles?.email || ''
      })) || [];

      setParticipants(participantsWithNames);
    } catch (error) {
      console.error('Error fetching participants:', error);
    }
  };

  const fetchMatches = async (tournamentId: string) => {
    try {
      const { data, error } = await supabase
        .from('tournament_matches')
        .select(`
          *,
          player1:profiles!tournament_matches_player1_id_fkey(first_name, last_name),
          player2:profiles!tournament_matches_player2_id_fkey(first_name, last_name)
        `)
        .eq('tournament_id', tournamentId)
        .order('round_number', { ascending: true });

      if (error) throw error;

      const matchesWithNames = data?.map((match: any) => ({
        ...match,
        player1_name: match.player1 ? `${match.player1.first_name} ${match.player1.last_name}` : 'TBD',
        player2_name: match.player2 ? `${match.player2.first_name} ${match.player2.last_name}` : 'TBD'
      })) || [];

      setMatches(matchesWithNames);
    } catch (error) {
      console.error('Error fetching matches:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile?.organization_id || !profile.id) return;

    try {
      const tournamentData = {
        ...formData,
        organization_id: profile.organization_id,
        created_by: profile.id,
        max_participants: formData.max_participants ? parseInt(formData.max_participants) : null,
        entry_fee: parseFloat(formData.entry_fee) || 0,
        prize_pool: parseFloat(formData.prize_pool) || 0,
        status: 'registration_open'
      };

      if (editingTournament) {
        const { error } = await supabase
          .from('tournaments')
          .update(tournamentData)
          .eq('id', editingTournament.id);

        if (error) throw error;

        toast({
          title: "Success",
          description: "Tournament updated successfully"
        });
      } else {
        const { error } = await supabase
          .from('tournaments')
          .insert([tournamentData]);

        if (error) throw error;

        toast({
          title: "Success",
          description: "Tournament created successfully"
        });
      }

      fetchTournaments();
      resetForm();
      setDialogOpen(false);
    } catch (error) {
      console.error('Error saving tournament:', error);
      toast({
        title: "Error",
        description: "Failed to save tournament",
        variant: "destructive",
      });
    }
  };

  const handleAddParticipant = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTournament || !participantForm.member_id) return;

    try {
      const { error } = await supabase
        .from('tournament_participants')
        .insert([{
          tournament_id: selectedTournament.id,
          member_id: participantForm.member_id,
          seed_number: participantForm.seed_number ? parseInt(participantForm.seed_number) : null,
          status: 'registered'
        }]);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Participant added successfully"
      });

      fetchParticipants(selectedTournament.id);
      setParticipantForm({ member_id: '', seed_number: '' });
      setParticipantDialogOpen(false);
    } catch (error) {
      console.error('Error adding participant:', error);
      toast({
        title: "Error",
        description: "Failed to add participant",
        variant: "destructive",
      });
    }
  };

  const handleDeleteTournament = async (id: string) => {
    if (!confirm('Are you sure you want to delete this tournament?')) return;

    try {
      const { error } = await supabase
        .from('tournaments')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Tournament deleted successfully"
      });

      fetchTournaments();
    } catch (error) {
      console.error('Error deleting tournament:', error);
      toast({
        title: "Error",
        description: "Failed to delete tournament",
        variant: "destructive",
      });
    }
  };

  const resetForm = () => {
    setFormData({
      tournament_name: '',
      sport: '',
      tournament_type: 'single_elimination',
      description: '',
      rules: '',
      tournament_start_date: '',
      tournament_end_date: '',
      registration_deadline: '',
      max_participants: '',
      entry_fee: '',
      prize_pool: '',
      contact_info: ''
    });
    setEditingTournament(null);
  };

  const openEditDialog = (tournament: Tournament) => {
    setEditingTournament(tournament);
    setFormData({
      tournament_name: tournament.tournament_name,
      sport: tournament.sport,
      tournament_type: tournament.tournament_type,
      description: tournament.description || '',
      rules: tournament.rules || '',
      tournament_start_date: tournament.tournament_start_date,
      tournament_end_date: tournament.tournament_end_date,
      registration_deadline: tournament.registration_deadline || '',
      max_participants: tournament.max_participants?.toString() || '',
      entry_fee: tournament.entry_fee.toString(),
      prize_pool: tournament.prize_pool.toString(),
      contact_info: tournament.contact_info || ''
    });
    setDialogOpen(true);
  };

  const selectTournament = (tournament: Tournament) => {
    setSelectedTournament(tournament);
    fetchParticipants(tournament.id);
    fetchMatches(tournament.id);
  };

  const sports = ['Tennis', 'Pickleball', 'Racquetball', 'Squash', 'Badminton', 'Table Tennis', 'Other'];
  const tournamentTypes = ['Single Elimination', 'Double Elimination', 'Round Robin', 'Swiss System'];

  if (loading) {
    return <div className="flex justify-center p-4">Loading tournaments...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold">Tournament Management</h2>
          <p className="text-muted-foreground">
            Organize and manage sports tournaments and competitions
          </p>
        </div>

        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={resetForm}>
              <Plus className="w-4 h-4 mr-2" />
              Create Tournament
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingTournament ? 'Edit Tournament' : 'Create Tournament'}</DialogTitle>
              <DialogDescription>
                {editingTournament ? 'Update tournament details' : 'Set up a new tournament or competition'}
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="tournament_name">Tournament Name *</Label>
                  <Input
                    id="tournament_name"
                    value={formData.tournament_name}
                    onChange={(e) => setFormData({...formData, tournament_name: e.target.value})}
                    placeholder="e.g., Spring Tennis Championship"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="sport">Sport *</Label>
                  <Select value={formData.sport} onValueChange={(value) => setFormData({...formData, sport: value})}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select sport" />
                    </SelectTrigger>
                    <SelectContent>
                      {sports.map(sport => (
                        <SelectItem key={sport} value={sport.toLowerCase()}>{sport}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="tournament_type">Tournament Type</Label>
                  <Select value={formData.tournament_type} onValueChange={(value) => setFormData({...formData, tournament_type: value})}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {tournamentTypes.map(type => (
                        <SelectItem key={type} value={type.toLowerCase().replace(' ', '_')}>{type}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="max_participants">Max Participants</Label>
                  <Input
                    id="max_participants"
                    type="number"
                    min="4"
                    max="256"
                    value={formData.max_participants}
                    onChange={(e) => setFormData({...formData, max_participants: e.target.value})}
                    placeholder="e.g., 32"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  placeholder="Tournament description and details..."
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="tournament_start_date">Start Date *</Label>
                  <Input
                    id="tournament_start_date"
                    type="date"
                    value={formData.tournament_start_date}
                    onChange={(e) => setFormData({...formData, tournament_start_date: e.target.value})}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="tournament_end_date">End Date *</Label>
                  <Input
                    id="tournament_end_date"
                    type="date"
                    value={formData.tournament_end_date}
                    onChange={(e) => setFormData({...formData, tournament_end_date: e.target.value})}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="registration_deadline">Registration Deadline</Label>
                  <Input
                    id="registration_deadline"
                    type="date"
                    value={formData.registration_deadline}
                    onChange={(e) => setFormData({...formData, registration_deadline: e.target.value})}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="entry_fee">Entry Fee ($)</Label>
                  <Input
                    id="entry_fee"
                    type="number"
                    min="0"
                    step="0.01"
                    value={formData.entry_fee}
                    onChange={(e) => setFormData({...formData, entry_fee: e.target.value})}
                    placeholder="0.00"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="prize_pool">Prize Pool ($)</Label>
                  <Input
                    id="prize_pool"
                    type="number"
                    min="0"
                    step="0.01"
                    value={formData.prize_pool}
                    onChange={(e) => setFormData({...formData, prize_pool: e.target.value})}
                    placeholder="0.00"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="rules">Rules & Regulations</Label>
                <Textarea
                  id="rules"
                  value={formData.rules}
                  onChange={(e) => setFormData({...formData, rules: e.target.value})}
                  placeholder="Tournament rules, regulations, and format details..."
                  rows={4}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="contact_info">Contact Information</Label>
                <Input
                  id="contact_info"
                  value={formData.contact_info}
                  onChange={(e) => setFormData({...formData, contact_info: e.target.value})}
                  placeholder="Tournament director contact information"
                />
              </div>

              <div className="flex justify-end space-x-2">
                <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit">
                  {editingTournament ? 'Update Tournament' : 'Create Tournament'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Tournament List */}
        <Card>
          <CardHeader>
            <CardTitle>Tournaments ({tournaments.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {tournaments.length > 0 ? (
                tournaments.map((tournament) => (
                  <div 
                    key={tournament.id} 
                    className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                      selectedTournament?.id === tournament.id ? 'border-primary bg-primary/5' : 'hover:bg-muted/50'
                    }`}
                    onClick={() => selectTournament(tournament)}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <h4 className="font-medium">{tournament.tournament_name}</h4>
                        <p className="text-sm text-muted-foreground">
                          {tournament.sport} • {tournament.tournament_type.replace('_', ' ')}
                        </p>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Badge className={getStatusColor(tournament.status)}>
                          {tournament.status.replace('_', ' ')}
                        </Badge>
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={(e) => {
                            e.stopPropagation();
                            openEditDialog(tournament);
                          }}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteTournament(tournament.id);
                          }}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                      <span className="flex items-center space-x-1">
                        <Calendar className="h-3 w-3" />
                        <span>{format(new Date(tournament.tournament_start_date), 'MMM d')}</span>
                      </span>
                      
                      <span className="flex items-center space-x-1">
                        <Users className="h-3 w-3" />
                        <span>{tournament.participant_count || 0} participants</span>
                      </span>
                      
                      {tournament.entry_fee > 0 && (
                        <span className="flex items-center space-x-1">
                          <DollarSign className="h-3 w-3" />
                          <span>${tournament.entry_fee}</span>
                        </span>
                      )}
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8">
                  <Trophy className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-medium mb-2">No Tournaments</h3>
                  <p className="text-muted-foreground mb-4">
                    Create your first tournament to get started.
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Tournament Details */}
        {selectedTournament && (
          <Card>
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle>{selectedTournament.tournament_name}</CardTitle>
                  <CardDescription>
                    {selectedTournament.sport} • {selectedTournament.tournament_type.replace('_', ' ')}
                  </CardDescription>
                </div>
                <Dialog open={participantDialogOpen} onOpenChange={setParticipantDialogOpen}>
                  <DialogTrigger asChild>
                    <Button size="sm">
                      <UserPlus className="w-4 h-4 mr-2" />
                      Add Participant
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Add Participant</DialogTitle>
                      <DialogDescription>
                        Add a member to {selectedTournament.tournament_name}
                      </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleAddParticipant} className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="member_id">Member *</Label>
                        <Select value={participantForm.member_id} onValueChange={(value) => setParticipantForm({...participantForm, member_id: value})}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select member" />
                          </SelectTrigger>
                          <SelectContent>
                            {members.filter(member => !participants.some(p => p.member_id === member.id)).map(member => (
                              <SelectItem key={member.id} value={member.id}>
                                {member.first_name} {member.last_name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="seed_number">Seed Number (Optional)</Label>
                        <Input
                          id="seed_number"
                          type="number"
                          min="1"
                          value={participantForm.seed_number}
                          onChange={(e) => setParticipantForm({...participantForm, seed_number: e.target.value})}
                          placeholder="Seeding position"
                        />
                      </div>

                      <div className="flex justify-end space-x-2">
                        <Button type="button" variant="outline" onClick={() => setParticipantDialogOpen(false)}>
                          Cancel
                        </Button>
                        <Button type="submit">Add Participant</Button>
                      </div>
                    </form>
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="participants">
                <TabsList>
                  <TabsTrigger value="participants">Participants ({participants.length})</TabsTrigger>
                  <TabsTrigger value="matches">Matches ({matches.length})</TabsTrigger>
                  <TabsTrigger value="details">Details</TabsTrigger>
                </TabsList>

                <TabsContent value="participants" className="space-y-4">
                  {participants.length > 0 ? (
                    <div className="space-y-2">
                      {participants.map((participant, index) => (
                        <div key={participant.id} className="flex items-center justify-between p-3 border rounded-lg">
                          <div className="flex items-center space-x-3">
                            {participant.seed_number && (
                              <Badge variant="outline">#{participant.seed_number}</Badge>
                            )}
                            <div>
                              <p className="font-medium">{participant.member_name}</p>
                              <p className="text-sm text-muted-foreground">{participant.member_email}</p>
                            </div>
                          </div>
                          <Badge className={getStatusColor(participant.status)}>
                            {participant.status}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <Users className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                      <p className="text-muted-foreground">No participants registered yet</p>
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="matches" className="space-y-4">
                  {matches.length > 0 ? (
                    <div className="space-y-4">
                      {Object.entries(
                        matches.reduce((acc, match) => {
                          const round = `Round ${match.round_number}`;
                          if (!acc[round]) acc[round] = [];
                          acc[round].push(match);
                          return acc;
                        }, {} as Record<string, TournamentMatch[]>)
                      ).map(([round, roundMatches]) => (
                        <div key={round}>
                          <h4 className="font-medium mb-2">{round}</h4>
                          <div className="space-y-2">
                            {roundMatches.map((match) => (
                              <div key={match.id} className="flex items-center justify-between p-3 border rounded-lg">
                                <div className="flex items-center space-x-3">
                                  <Badge variant="outline">Match {match.match_number}</Badge>
                                  <div>
                                    <p className="font-medium">
                                      {match.player1_name} vs {match.player2_name}
                                    </p>
                                    {match.score && (
                                      <p className="text-sm text-muted-foreground">Score: {match.score}</p>
                                    )}
                                    {match.scheduled_at && (
                                      <p className="text-sm text-muted-foreground">
                                        {format(new Date(match.scheduled_at), 'MMM d, h:mm a')}
                                      </p>
                                    )}
                                  </div>
                                </div>
                                <Badge className={getStatusColor(match.status)}>
                                  {match.status}
                                </Badge>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <Medal className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                      <p className="text-muted-foreground">No matches scheduled yet</p>
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="details" className="space-y-4">
                  <div className="space-y-4">
                    <div>
                      <h4 className="font-medium mb-2">Tournament Information</h4>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Dates:</span>
                          <span>{format(new Date(selectedTournament.tournament_start_date), 'MMM d')} - {format(new Date(selectedTournament.tournament_end_date), 'MMM d, yyyy')}</span>
                        </div>
                        {selectedTournament.registration_deadline && (
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Registration Deadline:</span>
                            <span>{format(new Date(selectedTournament.registration_deadline), 'MMM d, yyyy')}</span>
                          </div>
                        )}
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Entry Fee:</span>
                          <span>${selectedTournament.entry_fee}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Prize Pool:</span>
                          <span>${selectedTournament.prize_pool}</span>
                        </div>
                        {selectedTournament.max_participants && (
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Max Participants:</span>
                            <span>{selectedTournament.max_participants}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {selectedTournament.description && (
                      <div>
                        <h4 className="font-medium mb-2">Description</h4>
                        <p className="text-sm text-muted-foreground">{selectedTournament.description}</p>
                      </div>
                    )}

                    {selectedTournament.rules && (
                      <div>
                        <h4 className="font-medium mb-2">Rules & Regulations</h4>
                        <p className="text-sm text-muted-foreground">{selectedTournament.rules}</p>
                      </div>
                    )}

                    {selectedTournament.contact_info && (
                      <div>
                        <h4 className="font-medium mb-2">Contact Information</h4>
                        <p className="text-sm text-muted-foreground">{selectedTournament.contact_info}</p>
                      </div>
                    )}
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}