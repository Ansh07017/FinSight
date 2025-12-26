// src/pages/auth.tsx

import React, { useState, useEffect } from 'react';
import { useLocation } from 'wouter'; 
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { auth } from "@/lib/api";
import authBg from "@assets/generated_images/dark_minimalist_abstract_geometric_financial_background.png";
import logoImg from "@assets/generated_images/minimalist_mint_green_rupee_logo_symbol.png";
import { Eye, EyeOff, Loader2 } from "lucide-react";

// NOTE: We need the context from the new location, but only for the handleLogin function (future change)
// import { useAuth } from '@/context/AuthContext'; 


export default function AuthPage() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [activeTab, setActiveTab] = useState("login");
  
  // Login form
  const [loginUsername, setLoginUsername] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  
  // Register form
  const [registerUsername, setRegisterUsername] = useState("");
  const [registerPassword, setRegisterPassword] = useState("");

  useEffect(() => {
    // Redirect if already logged in (logs show /api/profile is working)
    const checkAuth = async () => {
      try {
        await auth.me();
        setLocation("/dashboard");
      } catch {
        // Not logged in, stay on auth page
      }
    };
    checkAuth();
  }, [setLocation]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      // 🛑 OLD, INEFFICIENT LOGIN LOGIC 🛑
      await auth.login(loginUsername, loginPassword);
      
      // Check if user has completed onboarding (2nd API call - INEFFICIENCY)
      try {
        const profileData = await auth.me(); // THIS IS THE REDUNDANT CALL
        // In a real app, we'd check if they have a profile
        setLocation("/onboarding");
      } catch {
        setLocation("/onboarding");
      }
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Login Failed",
        description: error.message || "Invalid credentials",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsGoogleLoading(true);
    window.location.href = "/api/auth/google";
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      // The register API also returns the needsOnboarding flag
      await auth.register(registerUsername, registerPassword);
      toast({
        title: "Account Created",
        description: "Welcome to FinSaver! Let's set up your profile.",
      });
      setLocation("/onboarding");
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Registration Failed",
        description: error.message || "Could not create account",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex bg-background">
      {/* Left Side - Visual */}
      <div className="hidden lg:flex w-1/2 relative bg-black items-center justify-center overflow-hidden">
        {/* ... */}
        <div className="relative z-20 max-w-md text-center p-8">
          <div className="mb-6 flex justify-center">
            <div className="w-20 h-20 rounded-2xl bg-primary/10 backdrop-blur-xl border border-primary/20 flex items-center justify-center shadow-[0_0_40px_-10px_rgba(0,212,170,0.3)]">
              <img src={logoImg} alt="Logo" className="w-12 h-12" />
            </div>
          </div>
          <h1 className="text-4xl font-bold text-white mb-4">Welcome to FinSaver</h1>
          <p className="text-muted-foreground text-lg leading-relaxed">
            Your intelligent financial companion designed for the Indian market. Track expenses, save smartly, and get rewarded for every rupee saved.
          </p>
        </div>
      </div>

      {/* Right Side - Form */}
      <div className="flex-1 flex items-center justify-center p-6 md:p-12 bg-background">
        <Card className="w-full max-w-md border-border/50 bg-card/50 backdrop-blur-sm shadow-2xl">
          <CardHeader className="space-y-1 text-center">
            <div className="lg:hidden mx-auto w-12 h-12 mb-4 rounded-xl bg-primary/10 flex items-center justify-center">
              <img src={logoImg} alt="Logo" className="w-8 h-8" />
            </div>
            <CardTitle className="text-2xl font-bold text-white">Sign in to your account</CardTitle>
            <CardDescription>
              Enter your details to access your financial dashboard
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-2 mb-6 bg-muted/50">
                <TabsTrigger value="login">Login</TabsTrigger>
                <TabsTrigger value="register">Register</TabsTrigger>
              </TabsList>
              
              <TabsContent value="login">
                <form onSubmit={handleLogin} className="space-y-4">
                  {/* ... Login form fields ... */}
                  <Button type="submit" className="w-full bg-primary hover:bg-primary/90 text-black font-semibold" disabled={isLoading}>
                    {isLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Signing in...
                      </>
                    ) : (
                      "Sign In"
                    )}
                  </Button>
                </form>
                <div className="relative my-4">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t border-border" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-background px-2 text-muted-foreground">Or continue with</span>
                  </div>
                </div>
                <Button variant="outline" type="button" className="w-full border-border hover:bg-secondary/50" onClick={handleGoogleLogin} disabled={isLoading || isGoogleLoading}>
                  {isGoogleLoading ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <GoogleIcon className="mr-2 h-4 w-4" />
                  )}
                  Google
                </Button>
              </TabsContent>
              
              <TabsContent value="register">
                <form onSubmit={handleRegister} className="space-y-4">
                  {/* Register Username */}
                  <div className="space-y-2">
                    <Label htmlFor="register-username">Username</Label>
                    <Input
                      id="register-username"
                      type="text"
                      placeholder="Choose a unique username" 
                      value={registerUsername}
                      onChange={(e) => setRegisterUsername(e.target.value)}
                      className="bg-secondary/50 border-border"
                      required
                    />
                  </div>

                  {/* Register Password */}
                  <div className="space-y-2 relative">
                    <Label htmlFor="register-password">Password</Label>
                    <Input
                      id="register-password"
                      type={showPassword ? "text" : "password"}
                      placeholder="Create a strong password" 
                      value={registerPassword}
                      onChange={(e) => setRegisterPassword(e.target.value)}
                      className="bg-secondary/50 border-border pr-10"
                      required
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-[29px] h-9 w-9 p-0 text-muted-foreground hover:bg-transparent"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                  </div>
                  
                  <Button 
                    type="submit" 
                    className="w-full bg-primary hover:bg-primary/90 text-black font-semibold"
                    disabled={isLoading || isGoogleLoading}
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Creating Account...
                      </>
                    ) : (
                      "Create Account"
                    )}
                  </Button>
                </form>
                <div className="relative my-4">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t border-border" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-background px-2 text-muted-foreground">Or continue with</span>
                  </div>
                </div>

                
                <Button variant="outline" type="button" className="w-full border-border hover:bg-secondary/50" onClick={handleGoogleLogin} disabled={isLoading || isGoogleLoading}>
                  {isGoogleLoading ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <GoogleIcon className="mr-2 h-4 w-4" />
                  )}
                  Google
                </Button>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
        
      </div>
    </div>
  );
}