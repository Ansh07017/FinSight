// src/context/AuthContext.tsx

import React, { createContext, useContext, useState, useEffect } from "react";
import { useLocation } from "wouter";
// NOTE: Make sure the imports below are correct based on your setup (e.g., from '@/lib/api')
// import { auth } from "@/lib/api";

// 1. Define the structure of the data you want to store
interface UserProfileData {
  firstName: string;
  lastName: string;
  tier: string;
}

// 2. Define the Context Type
interface AuthContextType {
  userProfile: UserProfileData | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  // Add any helper functions here (e.g., login, logout)
}

// 3. Define the Props for the Provider Component
interface AuthContextProps {
  children: React.ReactNode;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// 4. The Provider Component - CORRECT SYNTAX
// We now use the AuthContextProps interface to type the component arguments.
export const AuthProvider = ({ children }: AuthContextProps) => {
  // Core state management
  const [userProfile, setUserProfile] = useState<UserProfileData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [, setLocation] = useLocation(); // Caching Logic (Copied from your original auth.tsx)

  useEffect(() => {
    const fetchProfile = async () => {
      setIsLoading(true);
      try {
        const response = await fetch("/api/profile");
        if (response.ok) {
          const data = await response.json();
          setUserProfile({
            firstName: data.user.firstName || data.user.username,
            lastName: data.user.lastName || "",
            tier: data.profile.tier || "Bronze Tier Member",
          });
          setIsAuthenticated(true);
        } else if (response.status === 401) {
          setIsAuthenticated(false);
          setUserProfile(null);
          setLocation("/login");
        }
      } catch (error) {
        console.error("Initial authentication check failed:", error);
        setIsAuthenticated(false);
        setUserProfile(null);
        setLocation("/login");
      } finally {
        setIsLoading(false);
      }
    };

    fetchProfile();
  }, []);

  return (
    <AuthContext.Provider value={{ userProfile, isLoading, isAuthenticated }}>
       {children}{" "}
    </AuthContext.Provider>
  );
};

// 5. Custom hook to consume the context
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
