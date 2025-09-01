import React, { useState } from 'react';
import { QRCodeDisplay } from '@/components/auth/QRCodeDisplay';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ProfileEditForm } from '@/components/members/ProfileEditForm';
import { MembershipInfo } from '@/components/members/MembershipInfo';
import { NotificationSettings } from '@/components/members/NotificationSettings';
import { MemberActivitySummary } from '@/components/members/MemberActivitySummary';
import MemberCardDisplay from '@/components/members/MemberCardDisplay';
import FitnessAssessmentDisplay from '@/components/members/FitnessAssessmentDisplay';
import { 
  User, 
  Mail, 
  Phone, 
  TrendingUp,
  MapPin, 
  Calendar, 
  Edit, 
  Shield,
  Bell,
  CreditCard,
  IdCard,
  Target
} from 'lucide-react';
import { Database } from '@/integrations/supabase/types';

type Profile = Database['public']['Tables']['profiles']['Row'];

export default function MemberProfilePage() {
  const { profile, organization } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [showFitnessAssessmentForm, setShowFitnessAssessmentForm] = useState(false);
  const [currentProfile, setCurrentProfile] = useState<Profile | null>(profile as Profile | null);

  if (!currentProfile || currentProfile.role !== 'member') {
    return (
      <div className="container mx-auto py-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-muted-foreground">
            Access Denied
          </h1>
          <p className="text-muted-foreground mt-2">
            This page is only accessible to members.
          </p>
        </div>
      </div>
    );
  }

  const handleProfileUpdate = (updatedProfile: Profile) => {
    setCurrentProfile(updatedProfile);
    setIsEditing(false);
  };

  if (isEditing) {
    return (
      <div className="container mx-auto py-8 px-4 max-w-4xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Edit Profile</h1>
          <p className="text-muted-foreground">
            Update your personal information and preferences
          </p>
        </div>

        <ProfileEditForm
          profile={currentProfile}
          onUpdate={handleProfileUpdate}
          onCancel={() => setIsEditing(false)}
        />
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4 max-w-6xl">
      <div className="mb-8 flex justify-between items-start">
        <div>
          <h2 className="text-2xl font-bold">Enhanced Member Profile</h2>
          <p className="text-muted-foreground">
            Your complete fitness journey at a glance
          </p>
        </div>
        <Button onClick={() => setIsEditing(true)}>
          <Edit className="w-4 h-4 mr-2" />
          Edit Profile
        </Button>
      </div>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid w-full grid-cols-7">
          <TabsTrigger value="overview" className="flex items-center gap-2">
            <User className="w-4 h-4" />
            <span className="hidden sm:inline">Overview</span>
          </TabsTrigger>
          <TabsTrigger value="member-card" className="flex items-center gap-2">
            <IdCard className="w-4 h-4" />
            <span className="hidden sm:inline">Card</span>
          </TabsTrigger>
          <TabsTrigger value="fitness" className="flex items-center gap-2">
            <Target className="w-4 h-4" />
            <span className="hidden sm:inline">Fitness</span>
          </TabsTrigger>
          <TabsTrigger value="activity" className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4" />
            <span className="hidden sm:inline">Activity</span>
          </TabsTrigger>
          <TabsTrigger value="membership" className="flex items-center gap-2">
            <Shield className="w-4 h-4" />
            <span className="hidden sm:inline">Membership</span>
          </TabsTrigger>
          <TabsTrigger value="billing" className="flex items-center gap-2">
            <CreditCard className="w-4 h-4" />
            <span className="hidden sm:inline">Billing</span>
          </TabsTrigger>
          <TabsTrigger value="notifications" className="flex items-center gap-2">
            <Bell className="w-4 h-4" />
            <span className="hidden sm:inline">Notifications</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            {/* Profile Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="w-5 h-5" />
                  Profile Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <User className="w-4 h-4 text-muted-foreground" />
                    <span className="font-medium">Name</span>
                  </div>
                  <p className="text-lg">
                    {currentProfile.first_name || currentProfile.last_name 
                      ? `${currentProfile.first_name || ''} ${currentProfile.last_name || ''}`.trim()
                      : 'Not provided'
                    }
                  </p>
                </div>

                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <Mail className="w-4 h-4 text-muted-foreground" />
                    <span className="font-medium">Email</span>
                  </div>
                  <p>{currentProfile.email}</p>
                </div>

                {currentProfile.phone && (
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <Phone className="w-4 h-4 text-muted-foreground" />
                      <span className="font-medium">Phone</span>
                    </div>
                    <p>{currentProfile.phone}</p>
                  </div>
                )}

                {currentProfile.emergency_contact_name && (
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <User className="w-4 h-4 text-muted-foreground" />
                      <span className="font-medium">Emergency Contact</span>
                    </div>
                    <p>{currentProfile.emergency_contact_name}</p>
                    {currentProfile.emergency_contact_phone && (
                      <p className="text-sm text-muted-foreground">
                        {currentProfile.emergency_contact_phone}
                      </p>
                    )}
                  </div>
                )}

                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <MapPin className="w-4 h-4 text-muted-foreground" />
                    <span className="font-medium">Gym</span>
                  </div>
                  <p>{organization?.name || 'Unknown'}</p>
                </div>

                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <Calendar className="w-4 h-4 text-muted-foreground" />
                    <span className="font-medium">Member Since</span>
                  </div>
                  <p>
                    {new Date(currentProfile.created_at || '').toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })}
                  </p>
                </div>

                <div>
                  <Badge variant="secondary" className="capitalize">
                    {currentProfile.role} Member
                  </Badge>
                </div>
              </CardContent>
            </Card>

            {/* QR Code Section */}
            <div>
              <QRCodeDisplay />
              
              <Card className="mt-6">
                <CardHeader>
                  <CardTitle>How to Use Your Member ID</CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    <li>• Show your QR code at the front desk for quick check-in</li>
                    <li>• Provide your Member ID number to staff when needed</li>
                    <li>• Use your Member ID to book classes and services</li>
                    <li>• Keep this information secure and don't share with others</li>
                    <li>• Contact staff if you need a new Member ID generated</li>
                  </ul>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="member-card" className="space-y-6">
          <MemberCardDisplay />
        </TabsContent>

        <TabsContent value="fitness" className="space-y-6">
          <FitnessAssessmentDisplay 
            onUpdateAssessment={() => setShowFitnessAssessmentForm(true)}
          />
        </TabsContent>

        <TabsContent value="activity" className="space-y-6">
          <MemberActivitySummary memberId={currentProfile.id} />
        </TabsContent>

        <TabsContent value="membership">
          <MembershipInfo memberId={currentProfile.id} />
        </TabsContent>

        <TabsContent value="billing">
          <MembershipInfo memberId={currentProfile.id} />
        </TabsContent>

        <TabsContent value="notifications">
          <NotificationSettings memberId={currentProfile.id} />
        </TabsContent>
      </Tabs>
    </div>
  );
}