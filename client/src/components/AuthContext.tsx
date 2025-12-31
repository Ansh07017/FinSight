// client/src/components/AuthContext.tsx

import React, { createContext, useContext, useState, useEffect } from "react";
import { useLocation } from "wouter";
// Use the optimized API wrapper
import { profile } from "@/lib/api";

// 1. Define the structure based on our new high-speed summary
interface UserProfileData {
  firstName: string;
  lastName: string;
  tier: string;
  username: string;
}

// 2. Define the Context Type
interface AuthContextType {
  userProfile: UserProfileData | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  logout: () => void;
  refreshProfile: () => Promise<void>; 
}

interface AuthContextProps {
  children: React.ReactNode;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: AuthContextProps) => {
  const [userProfile, setUserProfile] = useState<UserProfileData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [, setLocation] = useLocation();

  const fetchProfile = async () => {
    // We only show global loader if we don't have a profile yet
    if (!userProfile) setIsLoading(true);
    
    try {
      // OPTIMIZATION: Use the granular summary endpoint instead of the full profile
      const data = await profile.getSummary();
      
      setUserProfile({
        firstName: data.firstName || data.username,
        lastName: data.lastName || "",
        tier: data.tier || "Bronze Tier Member",
        username: data.username
      });
      setIsAuthenticated(true);
    } catch (error: any) {
      console.error("Auth check failed:", error);
      setIsAuthenticated(false);
      setUserProfile(null);
      
      // Redirect to auth only if not already there
      if (window.location.pathname !== "/auth") {
        setLocation("/auth");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    setIsAuthenticated(false);
    setUserProfile(null);
    setLocation("/auth");
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  return (
    <AuthContext.Provider value={{ 
      userProfile, 
      isLoading, 
      isAuthenticated, 
      logout,
      refreshProfile: fetchProfile 
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
