import React from 'react';
import { QRCodeDisplay } from '@/components/auth/QRCodeDisplay';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { User, Mail, Phone, MapPin, Calendar } from 'lucide-react';

export default function MemberProfilePage() {
  const { profile, organization } = useAuth();

  if (!profile || profile.role !== 'member') {
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

  return (
    <div className="container mx-auto py-8 px-4 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Member Profile</h1>
        <p className="text-muted-foreground">
          Manage your membership and access your digital gym card
        </p>
      </div>

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
                {profile.first_name || profile.last_name 
                  ? `${profile.first_name || ''} ${profile.last_name || ''}`.trim()
                  : 'Not provided'
                }
              </p>
            </div>

            <div>
              <div className="flex items-center gap-2 mb-2">
                <Mail className="w-4 h-4 text-muted-foreground" />
                <span className="font-medium">Email</span>
              </div>
              <p>{profile.email}</p>
            </div>

            {profile.phone && (
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Phone className="w-4 h-4 text-muted-foreground" />
                  <span className="font-medium">Phone</span>
                </div>
                <p>{profile.phone}</p>
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
                {new Date(profile.created_at || '').toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}
              </p>
            </div>

            <div>
              <Badge variant="secondary" className="capitalize">
                {profile.role} Member
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
    </div>
  );
}