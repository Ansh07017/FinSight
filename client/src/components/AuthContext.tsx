// client/src/components/AuthContext.tsx

import { createContext, ReactNode, useContext } from "react";
import { useQuery, useMutation, useQueryClient, UseMutationResult } from "@tanstack/react-query";
import { User, UserProfile, InsertUser } from "@shared/schema";
import { auth, profile } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";

// Extend the DB User type to include UI-specific flags
type AuthUser = User & {
  hasPassword?: boolean;
};

type AuthContextType = {
  user: AuthUser | null;           
  userProfile: UserProfile | null; 
  isLoading: boolean;
  error: Error | null;
  loginMutation: UseMutationResult<any, Error, { username: string; password: string }>;
  logoutMutation: UseMutationResult<any, Error, void>;
  registerMutation: UseMutationResult<any, Error, InsertUser>;
  isAuthenticated: boolean;
  
  // --- NEW COMPUTED PROPERTY ---
  onboardingCompleted: boolean; 

  // Helpers
  logout: () => void;
  refreshProfile: () => void;
};

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // 1. Fetch User Identity
  const { data: authData, error: authError, isLoading: authLoading } = useQuery({
    queryKey: ["auth-me"],
    queryFn: auth.me,
    retry: false,
  });

  // 2. Fetch User Profile
  const { data: profileData, isLoading: profileLoading } = useQuery({
    queryKey: ["profile-context"],
    queryFn: profile.get,
    enabled: !!authData?.user,
  });

  const user = authData?.user ?? null;
  const userProfile = profileData?.profile ?? null;
  
  // LOGIC: If a profile exists and has a userType, onboarding is done.
  const onboardingCompleted = !!userProfile?.userType;

  const isLoading = authLoading || (!!user && profileLoading);

  const loginMutation = useMutation({
    mutationFn: (c: { username: string; password: string }) => auth.login(c.username, c.password),
    onSuccess: (data) => {
      queryClient.setQueryData(["auth-me"], { user: data.user });
      queryClient.invalidateQueries({ queryKey: ["profile-context"] });
      toast({ title: "Welcome back!" });
    },
    onError: (e) => toast({ variant: "destructive", title: "Login Failed", description: e.message }),
  });

  const registerMutation = useMutation({
    mutationFn: (c: InsertUser) => auth.register(c.email, c.password!),
    onSuccess: () => toast({ title: "Account Created", description: "Please verify your email." }),
    onError: (e) => toast({ variant: "destructive", title: "Registration Failed", description: e.message }),
  });

  const logoutMutation = useMutation({
    mutationFn: auth.logout,
    onSuccess: () => {
      queryClient.setQueryData(["auth-me"], null);
      queryClient.setQueryData(["profile-context"], null);
      queryClient.clear();
      toast({ title: "Logged out successfully" });
    },
    onError: (e) => toast({ variant: "destructive", title: "Logout Failed", description: e.message }),
  });

  return (
    <AuthContext.Provider
      value={{
        user,
        userProfile,
        isLoading,
        error: authError as Error,
        loginMutation,
        logoutMutation,
        registerMutation,
        isAuthenticated: !!user,
        
        // EXPOSED HERE
        onboardingCompleted, 

        logout: () => logoutMutation.mutate(),
        refreshProfile: () => queryClient.invalidateQueries({ queryKey: ["profile-context"] }),
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within an AuthProvider");
  return context;
}