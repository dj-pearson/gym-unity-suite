import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { 
  User, 
  MapPin, 
  Calendar as CalendarIcon,
  Phone, 
  Heart,
  FileText,
  AlertTriangle
} from 'lucide-react';

interface MemberInformationStepProps {
  lead: any;
  onMemberInfoComplete: (memberInfo: any) => void;
  initialData?: any;
}

export const MemberInformationStep: React.FC<MemberInformationStepProps> = ({
  lead,
  onMemberInfoComplete,
  initialData
}) => {
  const [memberInfo, setMemberInfo] = useState({
    first_name: initialData?.first_name || lead?.first_name || '',
    last_name: initialData?.last_name || lead?.last_name || '',
    email: initialData?.email || lead?.email || '',
    phone: initialData?.phone || lead?.phone || '',
    date_of_birth: initialData?.date_of_birth ? new Date(initialData.date_of_birth) : undefined,
    gender: initialData?.gender || '',
    address_line1: initialData?.address_line1 || '',
    address_line2: initialData?.address_line2 || '',
    city: initialData?.city || '',
    state: initialData?.state || '',
    postal_code: initialData?.postal_code || '',
    country: initialData?.country || 'US',
    emergency_contact_name: initialData?.emergency_contact_name || '',
    emergency_contact_phone: initialData?.emergency_contact_phone || '',
    interests: initialData?.interests || [],
    member_notes: initialData?.member_notes || ''
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const interestOptions = [
    'classes',
    'cardio',
    'strength',
    'child_watch',
    'personal_training',
    'group_fitness',
    'swimming',
    'yoga',
    'pilates',
    'spinning',
    'crossfit',
    'other'
  ];

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!memberInfo.first_name.trim()) newErrors.first_name = 'First name is required';
    if (!memberInfo.last_name.trim()) newErrors.last_name = 'Last name is required';
    if (!memberInfo.email.trim()) newErrors.email = 'Email is required';
    if (!memberInfo.phone.trim()) newErrors.phone = 'Phone is required';
    if (!memberInfo.address_line1.trim()) newErrors.address_line1 = 'Address is required';
    if (!memberInfo.city.trim()) newErrors.city = 'City is required';
    if (!memberInfo.state.trim()) newErrors.state = 'State is required';
    if (!memberInfo.postal_code.trim()) newErrors.postal_code = 'Postal code is required';
    if (!memberInfo.emergency_contact_name.trim()) newErrors.emergency_contact_name = 'Emergency contact name is required';
    if (!memberInfo.emergency_contact_phone.trim()) newErrors.emergency_contact_phone = 'Emergency contact phone is required';

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (memberInfo.email && !emailRegex.test(memberInfo.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (field: string, value: any) => {
    setMemberInfo(prev => ({
      ...prev,
      [field]: value
    }));
    
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: ''
      }));
    }
  };

  const handleInterestToggle = (interest: string) => {
    setMemberInfo(prev => ({
      ...prev,
      interests: prev.interests.includes(interest)
        ? prev.interests.filter(i => i !== interest)
        : [...prev.interests, interest]
    }));
  };

  const handleContinue = () => {
    if (validateForm()) {
      onMemberInfoComplete(memberInfo);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-2">Member Information</h3>
        <p className="text-muted-foreground text-sm">
          Please complete all required information for the new member.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Personal Information */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <User className="h-4 w-4" />
              Personal Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="first_name">First Name *</Label>
                <Input
                  id="first_name"
                  value={memberInfo.first_name}
                  onChange={(e) => handleInputChange('first_name', e.target.value)}
                  className={errors.first_name ? 'border-destructive' : ''}
                />
                {errors.first_name && (
                  <p className="text-sm text-destructive">{errors.first_name}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="last_name">Last Name *</Label>
                <Input
                  id="last_name"
                  value={memberInfo.last_name}
                  onChange={(e) => handleInputChange('last_name', e.target.value)}
                  className={errors.last_name ? 'border-destructive' : ''}
                />
                {errors.last_name && (
                  <p className="text-sm text-destructive">{errors.last_name}</p>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email *</Label>
              <Input
                id="email"
                type="email"
                value={memberInfo.email}
                onChange={(e) => handleInputChange('email', e.target.value)}
                className={errors.email ? 'border-destructive' : ''}
              />
              {errors.email && (
                <p className="text-sm text-destructive">{errors.email}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">Phone *</Label>
              <Input
                id="phone"
                value={memberInfo.phone}
                onChange={(e) => handleInputChange('phone', e.target.value)}
                className={errors.phone ? 'border-destructive' : ''}
              />
              {errors.phone && (
                <p className="text-sm text-destructive">{errors.phone}</p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Date of Birth</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !memberInfo.date_of_birth && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {memberInfo.date_of_birth ? (
                        format(memberInfo.date_of_birth, "PPP")
                      ) : (
                        <span>Pick a date</span>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={memberInfo.date_of_birth}
                      onSelect={(date) => handleInputChange('date_of_birth', date)}
                      disabled={(date) =>
                        date > new Date() || date < new Date("1900-01-01")
                      }
                      initialFocus
                      className="p-3 pointer-events-auto"
                    />
                  </PopoverContent>
                </Popover>
              </div>

              <div className="space-y-2">
                <Label>Gender</Label>
                <Select
                  value={memberInfo.gender}
                  onValueChange={(value) => handleInputChange('gender', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select gender" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="male">Male</SelectItem>
                    <SelectItem value="female">Female</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                    <SelectItem value="prefer-not-to-say">Prefer not to say</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Address Information */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <MapPin className="h-4 w-4" />
              Address Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="address_line1">Address Line 1 *</Label>
              <Input
                id="address_line1"
                value={memberInfo.address_line1}
                onChange={(e) => handleInputChange('address_line1', e.target.value)}
                className={errors.address_line1 ? 'border-destructive' : ''}
                placeholder="Street address"
              />
              {errors.address_line1 && (
                <p className="text-sm text-destructive">{errors.address_line1}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="address_line2">Address Line 2</Label>
              <Input
                id="address_line2"
                value={memberInfo.address_line2}
                onChange={(e) => handleInputChange('address_line2', e.target.value)}
                placeholder="Apartment, suite, etc."
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="city">City *</Label>
                <Input
                  id="city"
                  value={memberInfo.city}
                  onChange={(e) => handleInputChange('city', e.target.value)}
                  className={errors.city ? 'border-destructive' : ''}
                />
                {errors.city && (
                  <p className="text-sm text-destructive">{errors.city}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="state">State *</Label>
                <Input
                  id="state"
                  value={memberInfo.state}
                  onChange={(e) => handleInputChange('state', e.target.value)}
                  className={errors.state ? 'border-destructive' : ''}
                />
                {errors.state && (
                  <p className="text-sm text-destructive">{errors.state}</p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="postal_code">Postal Code *</Label>
                <Input
                  id="postal_code"
                  value={memberInfo.postal_code}
                  onChange={(e) => handleInputChange('postal_code', e.target.value)}
                  className={errors.postal_code ? 'border-destructive' : ''}
                />
                {errors.postal_code && (
                  <p className="text-sm text-destructive">{errors.postal_code}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="country">Country</Label>
                <Select
                  value={memberInfo.country}
                  onValueChange={(value) => handleInputChange('country', value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="US">United States</SelectItem>
                    <SelectItem value="CA">Canada</SelectItem>
                    <SelectItem value="MX">Mexico</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Emergency Contact */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <AlertTriangle className="h-4 w-4" />
              Emergency Contact
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="emergency_contact_name">Contact Name *</Label>
              <Input
                id="emergency_contact_name"
                value={memberInfo.emergency_contact_name}
                onChange={(e) => handleInputChange('emergency_contact_name', e.target.value)}
                className={errors.emergency_contact_name ? 'border-destructive' : ''}
              />
              {errors.emergency_contact_name && (
                <p className="text-sm text-destructive">{errors.emergency_contact_name}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="emergency_contact_phone">Contact Phone *</Label>
              <Input
                id="emergency_contact_phone"
                value={memberInfo.emergency_contact_phone}
                onChange={(e) => handleInputChange('emergency_contact_phone', e.target.value)}
                className={errors.emergency_contact_phone ? 'border-destructive' : ''}
              />
              {errors.emergency_contact_phone && (
                <p className="text-sm text-destructive">{errors.emergency_contact_phone}</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Interests */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Heart className="h-4 w-4" />
              Interests & Preferences
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-2">
              {interestOptions.map((interest) => (
                <div key={interest} className="flex items-center space-x-2">
                  <Checkbox
                    id={interest}
                    checked={memberInfo.interests.includes(interest)}
                    onCheckedChange={() => handleInterestToggle(interest)}
                  />
                  <Label
                    htmlFor={interest}
                    className="text-sm font-normal capitalize cursor-pointer"
                  >
                    {interest.replace('_', ' ')}
                  </Label>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Notes */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Additional Notes
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <Label htmlFor="member_notes">Notes</Label>
            <Textarea
              id="member_notes"
              value={memberInfo.member_notes}
              onChange={(e) => handleInputChange('member_notes', e.target.value)}
              placeholder="Any additional information about the member..."
              rows={3}
            />
          </div>
        </CardContent>
      </Card>

      {/* Continue Button */}
      <div className="flex justify-end">
        <Button 
          onClick={handleContinue}
          className="bg-gradient-secondary hover:opacity-90"
        >
          Continue to Agreement
        </Button>
      </div>
    </div>
  );
};