// src/pages/auth.tsx

import React, { useState } from 'react';
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

export default function AuthPage() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [activeTab, setActiveTab] = useState("login");
  
  // Login form
  const [loginUsername, setLoginUsername] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  
  // Register form
  const [registerUsername, setRegisterUsername] = useState("");
  const [registerPassword, setRegisterPassword] = useState("");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      // Client expects { user: { id, username, needsOnboarding: boolean } } from the server
      const response = await auth.login(loginUsername, loginPassword);
      
      // Check response to see where to redirect (FIXED REDIRECTION LOGIC)
      if (response && response.user && response.user.needsOnboarding) {
        setLocation("/onboarding");
      } else {
        setLocation("/"); // Go to Dashboard
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
                  {/* Login Username */}
                  <div className="space-y-2">
                    <Label htmlFor="login-username">Username</Label>
                    <Input
                      id="login-username"
                      type="text"
                      placeholder="e.g., fin_user_99" 
                      value={loginUsername}
                      onChange={(e) => setLoginUsername(e.target.value)}
                      className="bg-secondary/50 border-border"
                      required
                    />
                  </div>

                  {/* Login Password */}
                  <div className="space-y-2 relative">
                    <Label htmlFor="login-password">Password</Label>
                    <Input
                      id="login-password"
                      type={showPassword ? "text" : "password"}
                      placeholder="Enter your password" 
                      value={loginPassword}
                      onChange={(e) => setLoginPassword(e.target.value)}
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
                    disabled={isLoading}
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
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
        
      </div>
    </div>
  );
}