import { createContext, useContext, useEffect, useState, useRef, useCallback, type ReactNode } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase, edgeFunctions } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface Profile {
  id: string;
  organization_id: string;
  location_id?: string;
  email: string;
  first_name?: string;
  last_name?: string;
  phone?: string;
  role: 'owner' | 'manager' | 'staff' | 'trainer' | 'member';
  avatar_url?: string;
  barcode?: string;
  barcode_generated_at?: string;
  created_at?: string;
  updated_at?: string;
}

interface Organization {
  id: string;
  name: string;
  slug: string;
  logo_url?: string;
  primary_color: string;
  secondary_color: string;
}

interface AuthContextType {
  user: User | null;
  profile: Profile | null;
  organization: Organization | null;
  session: Session | null;
  loading: boolean;
  profileError: string | null;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signUp: (email: string, password: string, organizationId?: string) => Promise<{ error: any; needsEmailVerification?: boolean }>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  resetPassword: (email: string) => Promise<{ error: any }>;
  verifyOtp: (email: string, token: string, type: 'signup' | 'email' | 'sms') => Promise<{ error: any }>;
  resendOtp: (email: string, type: 'signup' | 'email' | 'sms') => Promise<{ error: any }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [organization, setOrganization] = useState<Organization | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [profileError, setProfileError] = useState<string | null>(null);
  const { toast } = useToast();

  // Refs to prevent race conditions
  const fetchInProgressRef = useRef(false);
  const currentUserIdRef = useRef<string | null>(null);
  const initializedRef = useRef(false);
  const retryCountRef = useRef(0);
  const MAX_RETRIES = 3;
  const RETRY_DELAY = 1000;

  const fetchProfile = useCallback(async (userId: string, isRetry = false): Promise<boolean> => {
    // Prevent duplicate fetches for the same user
    if (fetchInProgressRef.current && currentUserIdRef.current === userId && !isRetry) {
      return false;
    }

    // Reset retry count for new user
    if (currentUserIdRef.current !== userId) {
      retryCountRef.current = 0;
    }

    fetchInProgressRef.current = true;
    currentUserIdRef.current = userId;
    setProfileError(null);

    try {
      const { data: profileData, error: profileFetchError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      // Check if user changed during fetch (race condition prevention)
      if (currentUserIdRef.current !== userId) {
        return false;
      }

      if (profileFetchError) {
        console.error('Profile fetch error:', profileFetchError);

        // Retry logic for transient errors
        if (retryCountRef.current < MAX_RETRIES &&
            (profileFetchError.code === 'PGRST301' || profileFetchError.message?.includes('network'))) {
          retryCountRef.current++;
          await new Promise(resolve => setTimeout(resolve, RETRY_DELAY * retryCountRef.current));
          return fetchProfile(userId, true);
        }

        setProfileError('Failed to load profile. Please try refreshing the page.');
        setLoading(false);
        return false;
      }

      setProfile(profileData);

      // Fetch organization data
      if (profileData.organization_id) {
        const { data: orgData, error: orgError } = await supabase
          .from('organizations')
          .select('*')
          .eq('id', profileData.organization_id)
          .single();

        if (!orgError && orgData) {
          setOrganization(orgData);
        }
      }

      retryCountRef.current = 0;
      return true;
    } catch (error) {
      console.error('Error fetching profile:', error);

      // Retry on network errors
      if (retryCountRef.current < MAX_RETRIES) {
        retryCountRef.current++;
        await new Promise(resolve => setTimeout(resolve, RETRY_DELAY * retryCountRef.current));
        return fetchProfile(userId, true);
      }

      setProfileError('Failed to load profile. Please check your connection.');
      return false;
    } finally {
      fetchInProgressRef.current = false;
      setLoading(false);
    }
  }, []);

  const refreshProfile = useCallback(async () => {
    if (user) {
      setLoading(true);
      await fetchProfile(user.id);
    }
  }, [user, fetchProfile]);

  useEffect(() => {
    // Prevent double initialization in React StrictMode
    if (initializedRef.current) return;
    initializedRef.current = true;

    let isSubscribed = true;

    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, newSession) => {
        if (!isSubscribed) return;

        setSession(newSession);
        setUser(newSession?.user ?? null);

        if (newSession?.user) {
          // Only fetch profile if user changed or on initial sign in
          if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
            // Defer to prevent Supabase internal deadlock
            setTimeout(() => {
              if (isSubscribed) {
                fetchProfile(newSession.user.id);
              }
            }, 0);
          }
        } else {
          // User signed out
          setProfile(null);
          setOrganization(null);
          setProfileError(null);
          currentUserIdRef.current = null;
          setLoading(false);
        }
      }
    );

    // Get initial session AFTER setting up listener
    const initializeSession = async () => {
      try {
        const { data: { session: existingSession } } = await supabase.auth.getSession();

        if (!isSubscribed) return;

        if (existingSession?.user) {
          setSession(existingSession);
          setUser(existingSession.user);
          await fetchProfile(existingSession.user.id);
        } else {
          setLoading(false);
        }
      } catch (error) {
        console.error('Error getting initial session:', error);
        if (isSubscribed) {
          setLoading(false);
        }
      }
    };

    initializeSession();

    return () => {
      isSubscribed = false;
      subscription.unsubscribe();
    };
  }, [fetchProfile]);

  const signIn = async (email: string, password: string) => {
    try {
      setLoading(true);
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      
      if (error) {
        toast({
          title: "Sign In Failed",
          description: error.message,
          variant: "destructive",
        });
      }
      
      return { error };
    } catch (error) {
      console.error('Sign in error:', error);
      return { error };
    } finally {
      setLoading(false);
    }
  };

  const signUp = async (email: string, password: string, organizationId?: string) => {
    try {
      setLoading(true);
      
      // Sign up with email confirmation required
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          // Redirect URL after email confirmation
          emailRedirectTo: `${window.location.origin}/auth?verified=true`,
          // Request email confirmation
          data: {
            organization_id: organizationId,
          }
        },
      });
      
      if (error) {
        toast({
          title: "Sign Up Failed",
          description: error.message,
          variant: "destructive",
        });
        return { error };
      }

      // Check if email confirmation is required
      const needsEmailVerification = !data.session && data.user;

      if (needsEmailVerification) {
        // Email confirmation required - OTP has been sent
        toast({
          title: "Verify Your Email",
          description: "We've sent a verification code to your email address.",
        });
        return { error: null, needsEmailVerification: true };
      }

      // If session exists, user is automatically signed in (email confirmation disabled)
      if (data.user && data.session) {
        try {
          // Set up user profile after successful signup
          await edgeFunctions.invoke('setup-new-user', {
            body: {
              userId: data.user.id,
              email: data.user.email,
              role: 'member',
              organizationId,
            }
          });
        } catch (setupError) {
          console.error('Profile setup error:', setupError);
          // Don't fail the signup if profile setup fails
        }

        toast({
          title: "Welcome!",
          description: "Your account has been created successfully.",
        });
      }
      
      return { error: null, needsEmailVerification: false };
    } catch (error) {
      console.error('Sign up error:', error);
      return { error };
    } finally {
      setLoading(false);
    }
  };

  const verifyOtp = async (email: string, token: string, type: 'signup' | 'email' | 'sms') => {
    try {
      setLoading(true);
      
      const { data, error } = await supabase.auth.verifyOtp({
        email,
        token,
        type,
      });

      if (error) {
        toast({
          title: "Verification Failed",
          description: error.message,
          variant: "destructive",
        });
        return { error };
      }

      // Set up user profile after successful email verification
      if (data.user && data.session) {
        try {
          await edgeFunctions.invoke('setup-new-user', {
            body: {
              userId: data.user.id,
              email: data.user.email,
              role: 'member',
            }
          });
        } catch (setupError) {
          console.error('Profile setup error:', setupError);
          // Don't fail the verification if profile setup fails
        }

        toast({
          title: "Email Verified!",
          description: "Welcome to Rep Club!",
        });
      }

      return { error: null };
    } catch (error) {
      console.error('OTP verification error:', error);
      return { error };
    } finally {
      setLoading(false);
    }
  };

  const resendOtp = async (email: string, type: 'signup' | 'email' | 'sms') => {
    try {
      const { error } = await supabase.auth.resend({
        type,
        email,
      });

      if (error) {
        toast({
          title: "Resend Failed",
          description: error.message,
          variant: "destructive",
        });
        return { error };
      }

      toast({
        title: "Code Sent",
        description: "A new verification code has been sent to your email.",
      });

      return { error: null };
    } catch (error) {
      console.error('Resend OTP error:', error);
      return { error };
    }
  };

  const signOut = async () => {
    try {
      await supabase.auth.signOut();
      setUser(null);
      setProfile(null);
      setOrganization(null);
      setSession(null);
      setProfileError(null);
      currentUserIdRef.current = null;
      toast({
        title: "Signed out successfully",
        description: "You have been signed out of your account.",
      });
    } catch (error) {
      console.error('Sign out error:', error);
      toast({
        title: "Error signing out",
        description: "There was a problem signing you out.",
        variant: "destructive",
      });
    }
  };

  const resetPassword = async (email: string) => {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth?mode=reset`,
      });

      if (error) {
        console.error('Password reset error:', error);
        toast({
          title: "Error",
          description: error.message || "Failed to send password reset email.",
          variant: "destructive",
        });
        return { error };
      }

      toast({
        title: "Check your email",
        description: "If an account exists with this email, you will receive a password reset link.",
      });

      return { error: null };
    } catch (error) {
      console.error('Password reset error:', error);
      return { error };
    }
  };

  const value = {
    user,
    profile,
    organization,
    session,
    loading,
    profileError,
    signIn,
    signUp,
    signOut,
    refreshProfile,
    resetPassword,
    verifyOtp,
    resendOtp,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};