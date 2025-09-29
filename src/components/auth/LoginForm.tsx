import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/contexts/AuthContext';
import { Loader2, Dumbbell, Mail, QrCode, Home, ArrowLeft, Calendar, ArrowRight } from 'lucide-react';
import { BarcodeLogin } from './BarcodeLogin';
import { useNavigate } from 'react-router-dom';
import { RoleTestingPanel } from './RoleTestingPanel';

export const LoginForm: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showRoleTesting, setShowRoleTesting] = useState(false);
  const { signIn, signUp, user } = useAuth();
  const navigate = useNavigate();

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    await signIn(email, password);
    setIsLoading(false);
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (password !== confirmPassword) {
      return;
    }
    
    setIsLoading(true);
    await signUp(email, password);
    setIsLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-subtle p-4">
      <div className="w-full max-w-md">
        {/* Back to Homepage Button */}
        <div className="mb-6">
          <Button
            variant="ghost"
            onClick={() => navigate('/')}
            className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <Home className="w-4 h-4" />
            Back to Homepage
          </Button>
        </div>

        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-primary rounded-xl mb-4 shadow-glow">
            <Dumbbell className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gradient-hero mb-2">Gym Unity Suite</h1>
          <p className="text-muted-foreground">
            Complete gym management platform
          </p>
        </div>

        <Card className="gym-card">
          <CardHeader>
            <CardTitle>Welcome Back</CardTitle>
            <CardDescription>
              Sign in to your account or create a new one to get started
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="signin" className="w-full">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="signin" className="flex items-center gap-1">
                  <Mail className="w-4 h-4" />
                  <span className="hidden sm:inline">Sign In</span>
                </TabsTrigger>
                <TabsTrigger value="member" className="flex items-center gap-1">
                  <QrCode className="w-4 h-4" />
                  <span className="hidden sm:inline">Member</span>
                </TabsTrigger>
                <TabsTrigger value="signup" className="flex items-center gap-1">
                  <Mail className="w-4 h-4" />
                  <span className="hidden sm:inline">Sign Up</span>
                </TabsTrigger>
                {user && (
                  <TabsTrigger value="testing" className="flex items-center gap-1">
                    <QrCode className="w-4 h-4" />
                    <span className="hidden sm:inline">Testing</span>
                  </TabsTrigger>
                )}
              </TabsList>
              <TabsContent value="signin" className="space-y-4">
                <form onSubmit={handleSignIn} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="signin-email">Email</Label>
                    <Input
                      id="signin-email"
                      type="email"
                      placeholder="Enter your email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signin-password">Password</Label>
                    <Input
                      id="signin-password"
                      type="password"
                      placeholder="Enter your password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                    />
                  </div>
                  <Button 
                    type="submit" 
                    className="w-full bg-gradient-primary hover:opacity-90 transition-smooth"
                    disabled={isLoading}
                  >
                    {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Sign In
                  </Button>
                </form>
              </TabsContent>
              
              <TabsContent value="member" className="space-y-4">
                <BarcodeLogin />
              </TabsContent>
              
              <TabsContent value="signup" className="space-y-4">
                <div className="text-center space-y-4">
                  <div className="p-6 bg-muted/50 rounded-lg border border-border">
                    <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Calendar className="w-8 h-8 text-primary" />
                    </div>
                    <h3 className="text-lg font-semibold mb-2">Launching November 1st, 2025</h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      New registrations are currently closed as we prepare for our exciting launch. 
                      Request early access to be among the first to experience Rep Club.
                    </p>
                    <Button 
                      onClick={() => navigate('/#early-access')}
                      className="bg-gradient-primary hover:opacity-90 transition-smooth"
                    >
                      Request Early Access
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </TabsContent>
              
              {user && (
                <TabsContent value="testing" className="space-y-4">
                  <RoleTestingPanel />
                </TabsContent>
              )}
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};